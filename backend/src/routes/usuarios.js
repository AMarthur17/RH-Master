import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import * as fs from "fs";
import path from "path";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";
import { validarCPF } from "../utils/cpf.js"; // <-- import da função de validação

const router = express.Router();

// Função para gerar nome da pasta do usuário
const generateUserFolderName = (userId, userName) => {
  const normalizedName = userName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  return `${userId}-${normalizedName}`;
};

// Função para criar pasta do usuário
const createUserFolder = (userId, userName) => {
  try {
    const uploadsDir = "uploads/";
    const userFolderName = generateUserFolderName(userId, userName);
    const userFolderPath = path.join(uploadsDir, userFolderName);
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(userFolderPath))
      fs.mkdirSync(userFolderPath, { recursive: true });
    console.log(`[CADASTRO] Pasta criada para usuário: ${userFolderPath}`);
    return userFolderPath;
  } catch (error) {
    console.error("[CADASTRO] Erro ao criar pasta do usuário:", error);
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

    // ✅ Validar CPF antes de prosseguir
    if (!validarCPF(cpf)) {
      return res.status(400).json({ error: "CPF inválido." });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (nome, cpf, empresa, idade, email, senha, cargo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nome, email, cargo, empresa
    `;
    const values = [nome, cpf, empresa, idade, email, hashedSenha, cargo];

    const result = await db.query(query, values);

    createUserFolder(result.rows[0].id, result.rows[0].nome);
    res.status(201).json({ usuario: result.rows[0] });
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
    if (!email || !senha)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const query = "SELECT * FROM usuario WHERE email = $1";
    const result = await db.query(query, [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Usuário não encontrado" });

    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta)
      return res.status(401).json({ error: "Senha incorreta" });

    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: usuario.id, perfil: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
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
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// Validar senha do administrador
router.post(
  "/validar-senha",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    const usuarioId = req.user.id;
    const { senha } = req.body;

    if (!senha) {
      return res
        .status(400)
        .json({ valido: false, erro: "Senha não informada" });
    }

    try {
      const result = await db.query("SELECT senha FROM usuario WHERE id = $1", [
        usuarioId,
      ]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ valido: false, erro: "Usuário não encontrado" });
      }

      const senhaValida = await bcrypt.compare(senha, result.rows[0].senha);

      return res.json({ valido: senhaValida });
    } catch (err) {
      console.error("Erro ao validar senha:", err);
      return res.status(500).json({ valido: false, erro: "Erro no servidor" });
    }
  }
);

// Buscar usuários por nome e empresa
router.get(
  "/",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    try {
      const { nome, empresa } = req.query;
      let query =
        "SELECT id, nome, email, empresa, cargo FROM usuario WHERE 1=1";
      const values = [];
      if (empresa) {
        values.push(empresa);
        query += ` AND empresa = $${values.length}`;
      }
      if (nome) {
        values.push(`%${nome}%`);
        query += ` AND nome ILIKE $${values.length}`;
      }
      const result = await db.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  }
);

// Retorna contagem de faltas no mês corrente para todos os usuários de uma empresa
// Definição: dias úteis (segunda a sexta) do mês corrente. Se o usuário não tiver nenhum registro
// naquele dia (qualquer tipo), conta como falta.
router.get(
  "/faltas-mes",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    try {
      const { empresa } = req.query;

      // Buscar usuários da empresa
      let usersQuery = "SELECT id, nome, email FROM usuario WHERE 1=1";
      const values = [];
      if (empresa) {
        values.push(empresa);
        usersQuery += ` AND empresa = $${values.length}`;
      }
      const usersResult = await db.query(usersQuery, values);
      const users = usersResult.rows;

      // Calcular dias úteis do mês corrente (segunda=1 .. sexta=5)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed

      const workingDates = [];
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);
      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        // In JS: Sunday=0, Monday=1, ..., Saturday=6. We want Mon-Fri
        if (day >= 1 && day <= 5) {
          // store as ISO date string YYYY-MM-DD for easy compare
          workingDates.push(d.toISOString().split('T')[0]);
        }
      }

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;

      // Para cada usuário, contar dias do mês com pelo menos um registro
      const results = await Promise.all(users.map(async (u) => {
        const rp = await db.query(
          `SELECT DISTINCT (data_hora::date) AS dia FROM registro_ponto WHERE usuario_id = $1 AND data_hora::date BETWEEN $2 AND $3`,
          [u.id, startDate, endDate]
        );

        const diasComRegistro = rp.rows.map(r => r.dia && r.dia.toISOString ? r.dia.toISOString().split('T')[0] : String(r.dia));
        // contar quantos dias úteis não possuem registro
        const presentes = workingDates.filter(d => diasComRegistro.includes(d)).length;
        const faltas = Math.max(0, workingDates.length - presentes);

        return { id: u.id, nome: u.nome, email: u.email, faltasMes: faltas };
      }));

      res.json(results);
    } catch (err) {
      console.error('Erro ao calcular faltas do mês:', err);
      res.status(500).json({ error: 'Erro ao calcular faltas do mês' });
    }
  }
);

// Atualizar usuário e registrar histórico
router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const { nome, cpf, empresa, idade, email, senha, cargo, alterado_por } =
      req.body;

    const oldUser = await db.query("SELECT * FROM usuario WHERE id = $1", [
      usuarioId,
    ]);
    if (oldUser.rows.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    const campos = { nome, cpf, empresa, idade, email, senha, cargo };
    const atualizacoes = [];
    const valores = [];
    let idx = 1;

    for (const campo in campos) {
      let valorNovo = campos[campo];
      if (valorNovo === undefined || valorNovo === null) continue;

      // Validar CPF ao atualizar
      if (campo === "cpf") {
        if (!validarCPF(valorNovo)) {
          return res.status(400).json({ error: "CPF inválido." });
        }
      }

      if (campo === "senha") {
        if (valorNovo.trim() === "") continue;
        valorNovo = await bcrypt.hash(valorNovo, 10);
      }

      if (String(oldUser.rows[0][campo]) !== String(valorNovo)) {
        await db.query(
          `INSERT INTO historico_usuario (usuario_id, campo_alterado, valor_antigo, valor_novo, alterado_por)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuarioId,
            campo,
            oldUser.rows[0][campo],
            valorNovo,
            alterado_por || 0,
          ]
        );
      } else {
        continue;
      }

      atualizacoes.push(`${campo} = $${idx}`);
      valores.push(valorNovo);
      idx++;
    }

    if (atualizacoes.length === 0)
      return res.status(400).json({ error: "Nenhuma alteração enviada." });

    const updateQuery = `UPDATE usuario SET ${atualizacoes.join(
      ", "
    )} WHERE id = $${idx} RETURNING *`;
    valores.push(usuarioId);
    const result = await db.query(updateQuery, valores);
    res.json({ usuario: result.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// Histórico de alterações
router.get("/:id/historico", async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const result = await db.query(
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
