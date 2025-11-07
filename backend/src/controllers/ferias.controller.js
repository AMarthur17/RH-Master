import db from "../db.js";
import { calcularFerias as calcularFeriasService } from "../services/ferias.service.js";
import { autenticar } from "../middleware/auth.js";

// Calcula férias proporcionais para um funcionário
export async function calcular(req, res) {
  try {
    const { funcionarioId, mesesTrabalhados } = req.body;

    if (!funcionarioId) {
      return res.status(400).json({ error: "funcionarioId é obrigatório" });
    }

    // Priorizar salário cadastrado no usuário (se existir)
    let salarioBase = null;
    try {
      const { rows: urows } = await db.query(`SELECT salario FROM usuario WHERE id = $1 LIMIT 1`, [funcionarioId]);
      if (urows && urows.length) salarioBase = Number(urows[0].salario) || null;
    } catch (e) {
      // não falhar por conta da busca; seguir para fallback
      console.warn('Não foi possível ler salario do usuario:', e.message || e);
    }

    // Se não houver salario no usuário, tentar obter da última folha cadastrada
    if (!salarioBase || salarioBase === 0) {
      try {
        const { rows } = await db.query(
          `SELECT salario_base FROM folha_pagamento WHERE usuario_id = $1 ORDER BY ano DESC, mes DESC LIMIT 1`,
          [funcionarioId]
        );
        if (rows && rows.length) salarioBase = Number(rows[0].salario_base) || null;
      } catch (e) {
        console.warn('Erro ao buscar salario em folha_pagamento:', e.message || e);
      }
    }

    // Fallback final: se não houver fonte de salário, usar valor padrão (documentar e avisar)
    if (!salarioBase || salarioBase === 0) {
      salarioBase = 2000; // valor padrão — idealmente substituir por fonte oficial de salário/contracheque
    }

    const resultado = calcularFeriasService(salarioBase, mesesTrabalhados || 0);

    // Persistir o cálculo para auditoria
    try {
      await db.query(
        `INSERT INTO ferias_calculos (usuario_id, meses_trabalhados, dias_ferias, valor_ferias, um_terco, valor_total, salario_referencia)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [funcionarioId, mesesTrabalhados || 0, resultado.diasFerias, resultado.valorFerias, resultado.umTercoFerias, resultado.valorTotal, salarioBase]
      );
    } catch (e) {
      console.warn('Não foi possível persistir cálculo de férias:', e.message || e);
    }

    // incluir salário de referência na resposta para auditoria
    return res.json({ salarioBase, ...resultado });
  } catch (err) {
    console.error("Erro ao calcular férias:", err);
    return res.status(500).json({ error: "Erro ao calcular férias" });
  }
}

// rota sem autenticação direta (se desejar exigir autenticação, aplicar middleware ao registrar rota)
export default { calcular };
