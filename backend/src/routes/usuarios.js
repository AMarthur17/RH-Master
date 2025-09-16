// src/routes/usuarios.js
import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Cadastro de usuário
router.post("/", async (req, res) => {
  try {
    const { nome, cpf, empresa, idade, email, senha, cargo } = req.body;

    if (!nome || !cpf || !empresa || !idade || !email || !senha || !cargo) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (nome, cpf, empresa, idade, email, senha, cargo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nome, email, cargo, empresa
    `;
    const values = [nome, cpf, empresa, idade, email, hashedSenha, cargo];
    const result = await pool.query(query, values);

    res.status(201).json({ usuario: result.rows[0] });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      res.status(409).json({ error: "CPF ou e-mail já cadastrado." });
    } else {
      res.status(500).json({ error: "Erro no servidor." });
    }
  }
});

// Login de usuário
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const query = "SELECT * FROM usuario WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Gerar JWT
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: usuario.id, perfil: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        empresa: usuario.empresa,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// Buscar usuários por nome (para administrador)
router.get("/", async (req, res) => {
  try {
    const { nome, empresa } = req.query;
    let query = "SELECT id, nome, email, empresa, cargo FROM usuario WHERE 1=1";
    const values = [];

    if (empresa) {
      values.push(empresa);
      query += ` AND empresa = $${values.length}`;
    }

    if (nome) {
      values.push(`%${nome}%`);
      query += ` AND nome ILIKE $${values.length}`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

export default router;
