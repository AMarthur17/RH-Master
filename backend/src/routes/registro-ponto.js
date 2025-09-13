// src/routes/registro-ponto.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Registrar ponto
router.post("/", async (req, res) => {
  try {
    const { usuario_id, tipo } = req.body;

    if (!usuario_id || !tipo) {
      return res.status(400).json({ error: "usuario_id e tipo são obrigatórios" });
    }

    const query = `
      INSERT INTO registro_ponto (usuario_id, tipo)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [usuario_id, tipo];

    const result = await pool.query(query, values);
    res.status(201).json({ registro: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar ponto" });
  }
});

// Listar pontos de um usuário (com opção de filtrar somente hoje)
router.get("/:usuario_id", async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar registros" });
  }
});

export default router;
