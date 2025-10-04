import db from "../db.js"; // db é o Pool do PostgreSQL

// Gerar folha de pagamento (todos ou usuário específico)
export async function gerarFolha(req, res) {
  try {
    const { usuarioId, mes, ano } = req.body;

    if (!mes || !ano) {
      return res.status(400).json({ error: "Mês e ano são obrigatórios" });
    }

    // Buscar usuários (um específico ou todos)
    let usuarios = [];
    if (usuarioId) {
      usuarios = [{ id: usuarioId }];
    } else {
      const { rows } = await db.query("SELECT id FROM usuario");
      usuarios = rows;
    }

    const folhasCriadas = [];

    for (const u of usuarios) {
      // Total de pontos no mês/ano
      const { rows: pontosRows } = await db.query(
        `SELECT COUNT(*) AS total_pontos
         FROM registro_ponto
         WHERE usuario_id = $1
           AND EXTRACT(MONTH FROM data_hora) = $2
           AND EXTRACT(YEAR FROM data_hora) = $3`,
        [u.id, mes, ano]
      );

      const totalPontos = parseInt(pontosRows[0].total_pontos || 0);
      const valor = Math.floor(totalPontos / 2) * 100; // 100 reais a cada 2 pontos

      // Inserir folha
      const { rows: folhaRows } = await db.query(
        `INSERT INTO folha_pagamento
         (usuario_id, mes, ano, salario_base, total_pontos, valor, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [u.id, mes, ano, 0, totalPontos, valor, "pendente"]
      );

      folhasCriadas.push({
        usuario_id: u.id,
        folhaId: folhaRows[0].id,
        totalPontos,
        valor,
      });
    }

    res.json({ message: "Folhas geradas com sucesso", folhas: folhasCriadas });
  } catch (error) {
    console.error("Erro ao gerar folha:", error);
    res.status(500).json({ error: "Erro ao gerar folha" });
  }
}

// Consultar folha de pagamento de um usuário
export async function getFolhaUsuario(req, res) {
  try {
    const { usuarioId } = req.params;
    const { mes, ano } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId é obrigatório" });
    }

    let query = `
      SELECT id, usuario_id, mes, ano, salario_base, total_pontos, valor, status, criado_em, atualizado_em
      FROM folha_pagamento
      WHERE usuario_id = $1
    `;
    const values = [usuarioId];

    if (mes && ano) {
      query += " AND mes = $2 AND ano = $3";
      values.push(mes, ano);
    }

    query += " ORDER BY ano DESC, mes DESC";

    const result = await db.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar folha:", error);
    res.status(500).json({ error: "Erro ao buscar folha" });
  }
}

// Efetivar folha (mudar status para 'efetivada')
export async function efetivarFolha(req, res) {
  try {
    const { folhaId } = req.params;

    if (!folhaId) {
      return res.status(400).json({ error: "folhaId é obrigatório" });
    }

    await db.query(
      "UPDATE folha_pagamento SET status = $1, atualizado_em = NOW() WHERE id = $2",
      ["efetivada", folhaId]
    );

    res.json({ message: "Folha efetivada com sucesso" });
  } catch (error) {
    console.error("Erro ao efetivar folha:", error);
    res.status(500).json({ error: "Erro ao efetivar folha" });
  }
}
