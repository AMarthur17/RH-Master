const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, nome, email, cargo FROM usuarios ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

router.post("/", async (req, res) => {
  const { nome, email, cargo } = req.body;
  if (!nome || !email)
    return res.status(400).json({ error: "nome e email são obrigatórios" });

  try {
    const { rows } = await db.query(
      "INSERT INTO usuarios (nome, email, cargo) VALUES ($1, $2, $3) RETURNING *",
      [nome, email, cargo || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(409).json({ error: "email já cadastrado" });
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

module.exports = router;
