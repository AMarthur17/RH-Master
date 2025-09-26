import express from "express";
import { pool } from "../db.js";
import { autenticar } from "../middleware/auth.js";

const router = express.Router();

// Registrar ponto
router.post("/", autenticar, async (req, res) => {
  try {
    const { usuario_id, tipo } = req.body;

    if (!usuario_id || !tipo) {
      return res
        .status(400)
        .json({ error: "usuario_id e tipo são obrigatórios" });
    }

    // Opcional: verificar se já bateu ponto do mesmo tipo hoje
    const checkQuery = `
      SELECT * FROM registro_ponto 
      WHERE usuario_id = $1 AND tipo = $2 AND data_hora::date = CURRENT_DATE
    `;
    const checkResult = await pool.query(checkQuery, [usuario_id, tipo]);
    if (checkResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: `Ponto de ${tipo} já registrado hoje.` });
    }

    const query = `
      INSERT INTO registro_ponto (usuario_id, tipo)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [usuario_id, tipo]);

    res.status(201).json({ registro: result.rows[0] });
  } catch (err) {
    console.error("Erro ao registrar ponto:", err);
    res.status(500).json({ error: "Erro ao registrar ponto" });
  }
});

// Listar pontos de um usuário (com opção de filtrar somente hoje)
router.get("/:usuario_id", autenticar, async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { hoje } = req.query;

    let query = "SELECT * FROM registro_ponto WHERE usuario_id = $1";
    const values = [usuario_id];

    if (hoje === "true") {
      query += " AND data_hora::date = CURRENT_DATE";
    }

    query += " ORDER BY data_hora DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar registros:", err);
    res.status(500).json({ error: "Erro ao buscar registros" });
  }
});

export default router;
