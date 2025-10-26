import express from "express";
import db from "../db.js";

const router = express.Router();

// Rota simples de listagem (manter compat)
router.get("/", (req, res) => {
  res.json({ ok: true, message: "Rota de relatórios (placeholder)" });
});

// Relatório de presença/faltas por funcionário no mês atual
// Query params: empresa
router.get("/presenca", async (req, res) => {
  try {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ error: "empresa é obrigatório" });

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Número de dias úteis (segunda - sexta) entre start e hoje
    const today = new Date();
    const endForCount = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // exclusive
    let workdays = 0;
    for (let d = new Date(start); d < endForCount; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) workdays++;
    }

    // Buscar usuários da empresa e contar dias com entrada distintos no mês
    const query = `
      SELECT u.id, u.nome, u.email, u.empresa, u.cargo, COALESCE(counts.dias_presentes,0) AS dias_presentes
      FROM usuario u
      LEFT JOIN (
        SELECT usuario_id, COUNT(DISTINCT date_trunc('day', data_hora))::int AS dias_presentes
        FROM registro_ponto
        WHERE data_hora >= $1 AND data_hora < $2 AND tipo = 'entrada'
        GROUP BY usuario_id
      ) counts ON counts.usuario_id = u.id
      WHERE u.empresa = $3
      ORDER BY dias_presentes ASC, u.nome ASC
    `;

    const values = [start.toISOString(), end.toISOString(), empresa];
    const { rows } = await db.query(query, values);

    // calcular faltas como workdays - dias_presentes (mínimo zero)
    const result = rows.map((r) => {
      const faltas = Math.max(0, workdays - (r.dias_presentes || 0));
      return {
        id: r.id,
        nome: r.nome,
        email: r.email,
        empresa: r.empresa,
        cargo: r.cargo,
        dias_presentes: r.dias_presentes,
        faltas,
      };
    });

    res.json({ workdays, data: result });
  } catch (err) {
    console.error('Erro ao gerar relatório de presença:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório de presença' });
  }
});

export default router;
