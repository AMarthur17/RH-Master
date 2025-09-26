import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import * as fs from "fs";
import path from "path";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

// Função para gerar nome da pasta do usuário (mesma do documentos.js)
const generateUserFolderName = (userId, userName) => {
  const normalizedName = userName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, "_") // Substitui caracteres especiais por underscore
    .toLowerCase();
  
  return `${userId}-${normalizedName}`;
};

// Função para criar pasta do usuário
const createUserFolder = (userId, userName) => {
  try {
    const uploadsDir = "uploads/";
    const userFolderName = generateUserFolderName(userId, userName);
    const userFolderPath = path.join(uploadsDir, userFolderName);
    
    // Garantir que a pasta uploads existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Criar pasta do usuário
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
      console.log(`[CADASTRO] Pasta criada para usuário: ${userFolderPath}`);
    }
    
    return userFolderPath;
  } catch (error) {
    console.error("[CADASTRO] Erro ao criar pasta do usuário:", error);
    // Não falha o cadastro por causa da pasta
    return null;
  }
};

// Cadastro de usuário
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
      RETURNING id, nome, email, cargo, empresa
    `;
    const values = [nome, cpf, empresa, idade, email, hashedSenha, cargo];

    const result = await pool.query(query, values);

    // Criar pasta do usuário para futuros uploads
    const usuario = result.rows[0];
    createUserFolder(usuario.id, usuario.nome);

    res.status(201).json({ usuario: usuario });
  } catch (error) {
    console.error("Erro no cadastro de usuário:", error);
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
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: usuario.id, perfil: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Aumentado para 8 horas
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        empresa: usuario.empresa,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// Buscar usuários por nome (para administrador)
router.get("/", autenticar, permitir(["admin", "administrador"]), async (req, res) => {
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
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Atualizar usuário e registrar histórico
router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const { nome, cpf, empresa, idade, email, senha, cargo, alterado_por } =
      req.body;

    const oldUser = await pool.query("SELECT * FROM usuario WHERE id = $1", [
      usuarioId,
    ]);
    if (oldUser.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const campos = { nome, cpf, empresa, idade, email, senha, cargo };
    const atualizacoes = [];
    const valores = [];
    let idx = 1;

    for (const campo in campos) {
      if (campos[campo] !== undefined) {
        if (campo === "senha") {
          campos[campo] = await bcrypt.hash(campos[campo], 10);
        }
        atualizacoes.push(`${campo} = $${idx}`);
        valores.push(campos[campo]);

        // Registrar histórico se valor diferente
        if (String(oldUser.rows[0][campo]) !== String(campos[campo])) {
          await pool.query(
            `INSERT INTO historico_usuario (usuario_id, campo_alterado, valor_antigo, valor_novo, alterado_por)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              usuarioId,
              campo,
              oldUser.rows[0][campo],
              campos[campo],
              alterado_por || 0,
            ]
          );
        }
        idx++;
      }
    }

    if (atualizacoes.length === 0) {
      return res.status(400).json({ error: "Nenhuma alteração enviada." });
    }

    const updateQuery = `UPDATE usuario SET ${atualizacoes.join(
      ", "
    )} WHERE id = $${idx} RETURNING *`;
    valores.push(usuarioId);

    const result = await pool.query(updateQuery, valores);
    res.json({ usuario: result.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// Histórico de alterações de um usuário
router.get("/:id/historico", async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const result = await pool.query(
      "SELECT * FROM historico_usuario WHERE usuario_id = $1 ORDER BY data_hora DESC",
      [usuarioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

export default router;
