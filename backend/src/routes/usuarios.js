// src/routes/usuarios.js
import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { nome, cpf, empresa, idade, email, senha, cargo } = req.body;

    if (!nome || !cpf || !empresa || !idade || !email || !senha || !cargo) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (nome, cpf, empresa, idade, email, senha, cargo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nome, email, cargo
    `;
    const values = [nome, cpf, empresa, idade, email, hashedSenha, cargo];
    const result = await pool.query(query, values);

    res.status(201).json({ usuario: result.rows[0] });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      // CPF ou e-mail duplicado
      res.status(409).json({ error: "CPF ou e-mail já cadastrado." });
    } else {
      res.status(500).json({ error: "Erro no servidor." });
    }
  }
});

export default router;
