import db from '../db.js';

/**
 * Serviço de Cálculo de Horas Extras e Noturnas
 * 
 * Regras:
 * - Hora Extra: qualquer hora acima de 8h/dia (multiplicador 1.5x salário/hora)
 * - Hora Noturna: entre 22h e 05h (multiplicador 0.5x ou 20% acréscimo adicional)
 * - Se houver sobreposição (noturna + extra), aplica ambos
 */

class HorasExtraService {
  /**
   * Calcula horas extras para um usuário em um período
   * @param {number} usuarioId - ID do usuário
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Object>} { horasExtras, horasNoturnas, valorExtras, valorNoturnas }
   */
  async calcularHorasExtras(usuarioId, mes, ano) {
    try {
      // Buscar salário base do usuário
      const { rows: usuarioRows } = await db.query(
        'SELECT salario FROM usuario WHERE id = $1',
        [usuarioId]
      );

      if (usuarioRows.length === 0) {
        throw new Error(`Usuário ${usuarioId} não encontrado`);
      }

      const salarioBase = parseFloat(usuarioRows[0].salario) || 0;
      const valorHoraBase = salarioBase / 220; // 220 horas/mês padrão

      // Buscar registros de ponto do período
      const { rows: registros } = await db.query(
        `SELECT 
           DATE(data_hora) as data,
           hora_inicio,
           hora_fim,
           tipo_jornada
         FROM registro_ponto
         WHERE usuario_id = $1
           AND EXTRACT(MONTH FROM data_hora) = $2
           AND EXTRACT(YEAR FROM data_hora) = $3
         ORDER BY data_hora ASC`,
        [usuarioId, mes, ano]
      );

      // Agrupar por dia e calcular horas
      const diasTrabalhados = {};

      for (const reg of registros) {
        const data = reg.data.toISOString().split('T')[0];

        if (!diasTrabalhados[data]) {
          diasTrabalhados[data] = {
            horasNormais: 0,
            horasExtras: 0,
            horasNoturnas: 0,
          };
        }

        // Se temos hora_inicio e hora_fim, calcular horas
        if (reg.hora_inicio && reg.hora_fim) {
          const inicio = this._converterParaMinutos(reg.hora_inicio);
          const fim = this._converterParaMinutos(reg.hora_fim);
          const totalMinutos = fim > inicio ? (fim - inicio) : (1440 - inicio + fim);
          const totalHoras = totalMinutos / 60;

          // Separar horas extras e noturnas
          const { hNormal, hExtra, hNoturna } = this._separaHorasPorTipo(
            reg.hora_inicio,
            reg.hora_fim,
            totalHoras
          );

          diasTrabalhados[data].horasNormais += hNormal;
          diasTrabalhados[data].horasExtras += hExtra;
          diasTrabalhados[data].horasNoturnas += hNoturna;
        }
      }

      // Agregar e calcular valores
      let totalHorasExtras = 0;
      let totalHorasNoturnas = 0;

      for (const data in diasTrabalhados) {
        const dia = diasTrabalhados[data];

        // Horas extras: tudo acima de 8h/dia
        if (dia.horasNormais + dia.horasExtras > 8) {
          const extrasDodia = Math.max(0, dia.horasNormais + dia.horasExtras - 8);
          totalHorasExtras += extrasDodia;
        }

        // Horas noturnas (registradas entre 22h-05h)
        totalHorasNoturnas += dia.horasNoturnas;
      }

      // Calcular valores
      const valorExtras = totalHorasExtras * valorHoraBase * 1.5; // 150% do valor/hora
      const valorNoturnas = totalHorasNoturnas * valorHoraBase * 1.2; // 120% do valor/hora (20% acréscimo)

      return {
        horasExtras: parseFloat(totalHorasExtras.toFixed(2)),
        horasNoturnas: parseFloat(totalHorasNoturnas.toFixed(2)),
        valorExtras: parseFloat(valorExtras.toFixed(2)),
        valorNoturnas: parseFloat(valorNoturnas.toFixed(2)),
        valorHoraBase: parseFloat(valorHoraBase.toFixed(2)),
      };
    } catch (error) {
      console.error('Erro ao calcular horas extras:', error);
      throw error;
    }
  }

  /**
   * Converte uma hora (TIME ou string) para minutos
   * @param {string|Date} hora - Hora no formato HH:MM:SS ou TIME
   * @returns {number} Minutos desde meia-noite
   */
  _converterParaMinutos(hora) {
    if (!hora) return 0;

    let h, m;
    if (typeof hora === 'string') {
      const [hStr, mStr] = hora.split(':');
      h = parseInt(hStr) || 0;
      m = parseInt(mStr) || 0;
    } else if (hora instanceof Date) {
      h = hora.getHours();
      m = hora.getMinutes();
    } else {
      return 0;
    }

    return h * 60 + m;
  }

  /**
   * Separa horas em normal, extra e noturna
   * Regra: 
   * - 00h-22h: horas normais (até 8h/dia)
   * - 22h-05h: horas noturnas
   * - Acima de 8h: horas extras
   * 
   * @param {string} horaInicio - HH:MM
   * @param {string} horaFim - HH:MM
   * @param {number} totalHoras - Total de horas trabalhadas
   * @returns {Object} { hNormal, hExtra, hNoturna }
   */
  _separaHorasPorTipo(horaInicio, horaFim, totalHoras) {
    const inicio = this._converterParaMinutos(horaInicio);
    const fim = this._converterParaMinutos(horaFim);

    let hNormal = 0;
    let hNoturna = 0;
    let hExtra = 0;

    // Se virou a noite (ex: 22h do dia anterior até 05h do dia seguinte)
    if (fim < inicio) {
      // Noturno: de início até meia-noite + de meia-noite até fim
      const minutosAteNoite = 1440 - inicio;
      const minutosAposNoite = fim;
      hNoturna = (minutosAteNoite + minutosAposNoite) / 60;

      // Horas normais: diferença
      hNormal = totalHoras - hNoturna;
    } else {
      // Jornada no mesmo dia
      hNormal = totalHoras;

      // Verificar se há sobreposição com horário noturno (22h-05h)
      const HORA_NOTURNO_INICIO = 22 * 60; // 22h em minutos
      const HORA_NOTURNO_FIM = 5 * 60; // 05h em minutos

      if (inicio < HORA_NOTURNO_INICIO && fim > HORA_NOTURNO_INICIO) {
        // Trabalhou até dentro do horário noturno
        const minutosNoturno = fim - HORA_NOTURNO_INICIO;
        hNoturna = minutosNoturno / 60;
        hNormal -= hNoturna;
      } else if (inicio >= HORA_NOTURNO_INICIO || fim <= HORA_NOTURNO_FIM) {
        // Trabalhou integralmente no horário noturno
        hNoturna = totalHoras;
        hNormal = 0;
      }
    }

    // Se total > 8h, o excedente é extra
    if (hNormal + hNoturna > 8) {
      hExtra = hNormal + hNoturna - 8;
      hNormal = 8 - hNoturna;
      if (hNormal < 0) hNormal = 0;
    }

    return {
      hNormal: parseFloat(hNormal.toFixed(2)),
      hExtra: parseFloat(hExtra.toFixed(2)),
      hNoturna: parseFloat(hNoturna.toFixed(2)),
    };
  }

  /**
   * Buscar histórico de horas extras/noturnas por usuário e período
   */
  async buscarHistorico(usuarioId, mes, ano) {
    try {
      const { rows } = await db.query(
        `SELECT 
           horas_extras,
           valor_extras,
           horas_noturnas,
           valor_noturnas,
           valor,
           status,
           criado_em
         FROM folha_pagamento
         WHERE usuario_id = $1
           AND mes = $2
           AND ano = $3`,
        [usuarioId, mes, ano]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }
}

export default new HorasExtraService();
