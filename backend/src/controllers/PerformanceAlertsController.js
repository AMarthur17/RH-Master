import db from "../db.js";
import AuditController from "./AuditController.js";

/**
 * Controller para Alertas de Performance
 * Monitora métricas e dispara alertas quando ultrapassam thresholds
 */

// Thresholds padrão
const THRESHOLDS = {
  cpu: 80, // CPU > 80%
  memoria: 85, // Memória > 85%
  tempoResposta: 2000, // Tempo resposta > 2s (2000ms)
  taxaErros: 10, // Taxa de erros > 10%
  downtime: 0, // Downtime detectado
};

// Histórico para detectar padrões
let alertsHistory = [];
const MAX_HISTORY = 1000;

export default {
  /**
   * POST /api/performance-alerts/check
   * Verifica métricas atuais contra thresholds
   * Dispara alertas automaticamente
   */
  async verificarMetricas(req, res) {
    try {
      // Obter última métrica
      const queryMetrica = `
        SELECT * FROM performance_metrics 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const resultMetrica = await database.query(queryMetrica);
      if (resultMetrica.rows.length === 0) {
        return res.status(404).json({ erro: "Nenhuma métrica disponível" });
      }

      const metrica = resultMetrica.rows[0];
      const alertas = [];
      const alertasDisprados = [];

      // Verificar CPU
      if (metrica.cpu_percent > THRESHOLDS.cpu) {
        const alerta = {
          tipo: "CPU_ELEVADA",
          severidade: "ALTA",
          valor: metrica.cpu_percent,
          threshold: THRESHOLDS.cpu,
          mensagem: `CPU acima do limite: ${metrica.cpu_percent}% > ${THRESHOLDS.cpu}%`,
          recurso: "CPU",
        };
        alertas.push(alerta);
        alertasDisprados.push(alerta);
      }

      // Verificar Memória
      if (metrica.memoria_percent > THRESHOLDS.memoria) {
        const alerta = {
          tipo: "MEMORIA_ELEVADA",
          severidade: "ALTA",
          valor: metrica.memoria_percent,
          threshold: THRESHOLDS.memoria,
          mensagem: `Memória acima do limite: ${metrica.memoria_percent}% > ${THRESHOLDS.memoria}%`,
          recurso: "MEMORIA",
        };
        alertas.push(alerta);
        alertasDisprados.push(alerta);
      }

      // Verificar Tempo de Resposta
      if (metrica.tempo_resposta_ms > THRESHOLDS.tempoResposta) {
        const alerta = {
          tipo: "TEMPO_RESPOSTA_ELEVADO",
          severidade: "MEDIA",
          valor: metrica.tempo_resposta_ms,
          threshold: THRESHOLDS.tempoResposta,
          mensagem: `Tempo de resposta acima do limite: ${metrica.tempo_resposta_ms}ms > ${THRESHOLDS.tempoResposta}ms`,
          recurso: "TEMPO_RESPOSTA",
        };
        alertas.push(alerta);
        alertasDisprados.push(alerta);
      }

      // Verificar Disponibilidade
      if (metrica.disponibilidade_percent < 95) {
        const alerta = {
          tipo: "DISPONIBILIDADE_BAIXA",
          severidade: "CRITICA",
          valor: metrica.disponibilidade_percent,
          threshold: 95,
          mensagem: `Disponibilidade baixa: ${metrica.disponibilidade_percent}% < 95%`,
          recurso: "DISPONIBILIDADE",
        };
        alertas.push(alerta);
        alertasDisprados.push(alerta);
      }

      // Salvar alertas disparados no banco
      for (const alerta of alertasDisprados) {
        await PerformanceAlertsController.salvarAlerta(
          alerta.tipo,
          alerta.severidade,
          alerta.mensagem,
          alerta.recurso,
          alerta.valor,
          req.user?.id || null
        );
      }

      // Registrar na auditoria se houve alertas críticos
      if (alertasDisprados.length > 0) {
        const alertasCriticos = alertasDisprados.filter(
          (a) => a.severidade === "CRITICA"
        );
        if (alertasCriticos.length > 0) {
          // Registrar na auditoria
          try {
            await AuditController.registrarLog(
              req.user?.id || 0,
              "ALERT_PERFORMANCE_CRITICO",
              "SISTEMA",
              `Sistema dispara ${alertasCriticos.length} alerta(s) crítico(s)`,
              { alertas: alertasCriticos },
              "ESCRITA"
            );
          } catch (auditError) {
            console.error("Erro ao registrar na auditoria:", auditError);
          }
        }
      }

      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        metricas: {
          cpu_percent: metrica.cpu_percent,
          memoria_percent: metrica.memoria_percent,
          tempo_resposta_ms: metrica.tempo_resposta_ms,
          disponibilidade_percent: metrica.disponibilidade_percent,
        },
        alertas_disparados: alertasDisprados.length,
        alertas: alertasDisprados,
        thresholds: THRESHOLDS,
      });
    } catch (error) {
      console.error("Erro ao verificar métricas:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao verificar métricas", detalhes: error.message });
    }
  },

  /**
   * Salva um alerta no banco de dados
   */
  async salvarAlerta(
    tipo,
    severidade,
    mensagem,
    recurso,
    valor,
    usuarioId = null
  ) {
    try {
      const query = `
        INSERT INTO performance_alerts 
        (tipo, severidade, mensagem, recurso, valor, usuario_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ABERTO')
        RETURNING *
      `;

      const resultado = await database.query(query, [
        tipo,
        severidade,
        mensagem,
        recurso,
        valor,
        usuarioId,
      ]);

      alertsHistory.push({
        id: resultado.rows[0].id,
        timestamp: new Date(),
        tipo,
        severidade,
      });

      // Manter histórico limitado
      if (alertsHistory.length > MAX_HISTORY) {
        alertsHistory = alertsHistory.slice(-MAX_HISTORY);
      }

      return resultado.rows[0];
    } catch (error) {
      console.error("Erro ao salvar alerta:", error);
      throw error;
    }
  },

  /**
   * GET /api/performance-alerts
   * Lista alertas com filtros
   */
  async listarAlertas(req, res) {
    try {
      const {
        tipo,
        severidade,
        status = "ABERTO",
        dataInicio,
        dataFim,
        page = 1,
        limite = 50,
      } = req.query;

      let query = "SELECT * FROM performance_alerts WHERE 1=1";
      const params = [];
      let paramIndex = 1;

      // Filtros
      if (tipo) {
        query += ` AND tipo = $${paramIndex++}`;
        params.push(tipo);
      }
      if (severidade) {
        query += ` AND severidade = $${paramIndex++}`;
        params.push(severidade);
      }
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (dataInicio) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(dataInicio);
      }
      if (dataFim) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(dataFim);
      }

      // Paginação
      const offset = (page - 1) * limite;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limite, offset);

      const resultado = await database.query(query, params);

      // Contar total
      let countQuery = "SELECT COUNT(*) FROM performance_alerts WHERE 1=1";
      const countParams = [];
      let countIndex = 1;

      if (tipo) {
        countQuery += ` AND tipo = $${countIndex++}`;
        countParams.push(tipo);
      }
      if (severidade) {
        countQuery += ` AND severidade = $${countIndex++}`;
        countParams.push(severidade);
      }
      if (status) {
        countQuery += ` AND status = $${countIndex++}`;
        countParams.push(status);
      }
      if (dataInicio) {
        countQuery += ` AND created_at >= $${countIndex++}`;
        countParams.push(dataInicio);
      }
      if (dataFim) {
        countQuery += ` AND created_at <= $${countIndex++}`;
        countParams.push(dataFim);
      }

      const countResult = await database.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return res.json({
        status: "ok",
        paginacao: {
          page: parseInt(page),
          limite: parseInt(limite),
          total,
          paginas: Math.ceil(total / limite),
        },
        alertas: resultado.rows,
      });
    } catch (error) {
      console.error("Erro ao listar alertas:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao listar alertas", detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-alerts/:id
   * Obter detalhes de um alerta
   */
  async obterAlerta(req, res) {
    try {
      const { id } = req.params;

      const query = "SELECT * FROM performance_alerts WHERE id = $1";
      const resultado = await database.query(query, [id]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ erro: "Alerta não encontrado" });
      }

      return res.json({
        status: "ok",
        alerta: resultado.rows[0],
      });
    } catch (error) {
      console.error("Erro ao obter alerta:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao obter alerta", detalhes: error.message });
    }
  },

  /**
   * PUT /api/performance-alerts/:id
   * Atualizar status de um alerta
   */
  async atualizarAlerta(req, res) {
    try {
      const { id } = req.params;
      const { status, notas } = req.body;

      if (
        !status ||
        !["ABERTO", "EM_INVESTIGACAO", "RESOLVIDO", "FALSO_POSITIVO"].includes(
          status
        )
      ) {
        return res.status(400).json({ erro: "Status inválido" });
      }

      const query = `
        UPDATE performance_alerts 
        SET status = $1, notas = $2, atualizado_em = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const resultado = await database.query(query, [
        status,
        notas || null,
        id,
      ]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ erro: "Alerta não encontrado" });
      }

      // Registrar na auditoria
      try {
        await AuditController.registrarLog(
          req.user?.id || 0,
          "UPDATE_PERFORMANCE_ALERT",
          "ALERT",
          `Alerta #${id} atualizado para status: ${status}`,
          { alerta_id: id, novo_status: status },
          "ESCRITA"
        );
      } catch (auditError) {
        console.error("Erro ao registrar na auditoria:", auditError);
      }

      return res.json({
        status: "ok",
        mensagem: "Alerta atualizado com sucesso",
        alerta: resultado.rows[0],
      });
    } catch (error) {
      console.error("Erro ao atualizar alerta:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao atualizar alerta", detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-alerts/estatisticas/resumo
   * Retorna estatísticas de alertas
   */
  async obterEstatisticas(req, res) {
    try {
      const { horas = 24 } = req.query;

      const query = `
        SELECT 
          COUNT(*) as total_alertas,
          SUM(CASE WHEN severidade = 'CRITICA' THEN 1 ELSE 0 END) as alertas_criticos,
          SUM(CASE WHEN severidade = 'ALTA' THEN 1 ELSE 0 END) as alertas_altos,
          SUM(CASE WHEN severidade = 'MEDIA' THEN 1 ELSE 0 END) as alertas_medios,
          SUM(CASE WHEN severidade = 'BAIXA' THEN 1 ELSE 0 END) as alertas_baixos,
          SUM(CASE WHEN status = 'ABERTO' THEN 1 ELSE 0 END) as alertas_abertos,
          SUM(CASE WHEN status = 'RESOLVIDO' THEN 1 ELSE 0 END) as alertas_resolvidos,
          MAX(created_at) as ultimo_alerta,
          AVG(EXTRACT(EPOCH FROM (atualizado_em - created_at))) as tempo_medio_resolucao_segundos
        FROM performance_alerts
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
      `;

      const resultado = await database.query(query);
      const stats = resultado.rows[0];

      return res.json({
        status: "ok",
        periodo: `${horas} horas`,
        estatisticas: {
          total: parseInt(stats.total_alertas || 0),
          por_severidade: {
            criticos: parseInt(stats.alertas_criticos || 0),
            altos: parseInt(stats.alertas_altos || 0),
            medios: parseInt(stats.alertas_medios || 0),
            baixos: parseInt(stats.alertas_baixos || 0),
          },
          por_status: {
            abertos: parseInt(stats.alertas_abertos || 0),
            resolvidos: parseInt(stats.alertas_resolvidos || 0),
          },
          tempo_medio_resolucao_minutos: stats.tempo_medio_resolucao_segundos
            ? (stats.tempo_medio_resolucao_segundos / 60).toFixed(2)
            : "N/A",
          ultimo_alerta: stats.ultimo_alerta,
        },
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao obter estatísticas", detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-alerts/tipos/resumo
   * Retorna alertas por tipo
   */
  async obterAlerstasPorTipo(req, res) {
    try {
      const { horas = 24 } = req.query;

      const query = `
        SELECT 
          tipo,
          COUNT(*) as total,
          MAX(severidade) as severidade_maxima,
          MAX(created_at) as ultimo_alerta
        FROM performance_alerts
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        GROUP BY tipo
        ORDER BY total DESC
      `;

      const resultado = await database.query(query);

      return res.json({
        status: "ok",
        periodo: `${horas} horas`,
        alertas_por_tipo: resultado.rows,
      });
    } catch (error) {
      console.error("Erro ao obter alertas por tipo:", error);
      return res
        .status(500)
        .json({
          erro: "Erro ao obter alertas por tipo",
          detalhes: error.message,
        });
    }
  },

  /**
   * Obter thresholds atuais
   */
  obterThresholds() {
    return THRESHOLDS;
  },

  /**
   * Atualizar thresholds (para admin)
   */
  atualizarThresholds(novosTresholds) {
    Object.assign(THRESHOLDS, novosTresholds);
    return THRESHOLDS;
  },
};
