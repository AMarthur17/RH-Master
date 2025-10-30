// src/routes/documentos.js
import express from "express";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";
import multer from "multer";
import * as fs from "fs";
import path from "path";
import db from "../db.js";
import { verificarPermissao } from "../middleware/verificarPermissao.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ====== CONFIG ======
const uploadsDir = process.env.UPLOADS_DIR || path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// ====== FUNÇÕES AUXILIARES ======
const generateUserFolderName = (userId, userName) => {
  const normalizedName = userName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  return `${userId}-${normalizedName}`;
};

const ensureUserFolder = async (userId) => {
  const userResult = await db.query("SELECT nome FROM usuario WHERE id = $1", [
    userId,
  ]);
  if (userResult.rows.length === 0) throw new Error("Usuário não encontrado");
  const userName = userResult.rows[0].nome;
  const userFolderName = generateUserFolderName(userId, userName);
  const userFolderPath = path.join(uploadsDir, userFolderName);
  if (!fs.existsSync(userFolderPath))
    fs.mkdirSync(userFolderPath, { recursive: true });
  return { userFolderName, userFolderPath };
};

// ====== MULTER ======
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.params.usuario_id;
      const { userFolderPath } = await ensureUserFolder(userId);
      cb(null, userFolderPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ====== ROTAS ======

// Documentos compartilhados
router.get("/compartilhados/:colaborador_id", autenticar, async (req, res) => {
  const { colaborador_id } = req.params;
  try {
    const result = await db.query(
      `SELECT d.id, d.nome_arquivo, d.caminho_arquivo, d.data_upload, u.nome AS dono
       FROM documentos d
       INNER JOIN documento_permissao p ON d.id = p.documento_id
       INNER JOIN usuario u ON d.usuario_id = u.id
       WHERE p.usuario_id = $1 AND p.pode_visualizar = true
       ORDER BY d.data_upload DESC`,
      [colaborador_id]
    );

    const documentosComUrl = result.rows.map((doc) => ({
      ...doc,
      url_arquivo: fs.existsSync(path.resolve(uploadsDir, doc.caminho_arquivo))
        ? `${BACKEND_URL}/uploads/${doc.caminho_arquivo}`
        : null,
    }));

    res.json(documentosComUrl);
  } catch (err) {
    console.error("[COMPARTILHADOS] Erro:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar documentos compartilhados." });
  }
});

// Listagem documentos do usuário
router.get("/:usuario_id", autenticar, async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await db.query(
      `SELECT d.id, d.nome_arquivo, d.caminho_arquivo, d.data_upload
       FROM documentos d
       LEFT JOIN documento_permissao p
       ON d.id = p.documento_id AND p.usuario_id = $1
       WHERE d.usuario_id = $1 OR p.pode_visualizar = true
       ORDER BY d.data_upload DESC`,
      [usuario_id]
    );

    const documentosComUrl = result.rows.map((doc) => ({
      ...doc,
      url_arquivo: fs.existsSync(path.resolve(uploadsDir, doc.caminho_arquivo))
        ? `${BACKEND_URL}/uploads/${doc.caminho_arquivo}`
        : null,
    }));

    res.json(documentosComUrl);
  } catch (err) {
    console.error("[LISTAGEM] Erro:", err);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

// Upload
router.post(
  "/:usuario_id",
  autenticar,
  permitir(["admin", "administrador"]),
  upload.single("arquivo"),
  async (req, res) => {
    const { usuario_id } = req.params;
    if (!req.file)
      return res.status(400).json({ error: "Nenhum arquivo enviado." });

    try {
      const userResult = await db.query(
        "SELECT nome FROM usuario WHERE id = $1",
        [usuario_id]
      );
      if (userResult.rows.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado." });

      const userName = userResult.rows[0].nome;
      const userFolderName = generateUserFolderName(usuario_id, userName);
      const caminhoArquivo = `${userFolderName}/${req.file.filename}`;

      const result = await db.query(
        `INSERT INTO documentos (usuario_id, nome_arquivo, caminho_arquivo)
         VALUES ($1,$2,$3) RETURNING *`,
        [usuario_id, req.file.originalname, caminhoArquivo]
      );

      res.status(201).json({ documento: result.rows[0] });
    } catch (err) {
      console.error("[UPLOAD] Erro:", err);
      res.status(500).json({ error: "Erro ao salvar documento." });
    }
  }
);

// Permissões
router.post(
  "/:documento_id/permissao",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    const documento_id = Number(req.params.documento_id);
    const { usuario_id, pode_visualizar, pode_editar, pode_excluir } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO documento_permissao (documento_id, usuario_id, pode_visualizar, pode_editar, pode_excluir)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (documento_id,usuario_id) DO UPDATE
         SET pode_visualizar=$3, pode_editar=$4, pode_excluir=$5
         RETURNING *`,
        [documento_id, usuario_id, pode_visualizar, pode_editar, pode_excluir]
      );

      res.json({ permissao: result.rows[0] });
    } catch (err) {
      console.error("[PERMISSAO] Erro:", err);
      res.status(500).json({ error: "Erro ao atualizar permissões." });
    }
  }
);

// Download seguro
router.post("/:documento_id/download", autenticar, async (req, res) => {
  const { documento_id } = req.params;
  const { senha } = req.body;
  const usuarioId = req.user.id;

  try {
    const docResult = await db.query("SELECT * FROM documentos WHERE id = $1", [
      documento_id,
    ]);
    if (docResult.rows.length === 0)
      return res.status(404).json({ error: "Documento não encontrado." });

    const documento = docResult.rows[0];

    const userResult = await db.query(
      "SELECT senha FROM usuario WHERE id = $1",
      [usuarioId]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    const senhaCorreta = await bcrypt.compare(senha, userResult.rows[0].senha);
    if (!senhaCorreta)
      return res.status(401).json({ error: "Senha incorreta." });

    const permissaoResult = await db.query(
      `SELECT 1 FROM documento_permissao 
       WHERE documento_id = $1 AND usuario_id = $2 AND pode_visualizar = true`,
      [documento_id, usuarioId]
    );

    const ehDono = documento.usuario_id === usuarioId;
    if (!ehDono && permissaoResult.rows.length === 0)
      return res.status(403).json({ error: "Acesso negado." });

    const filePath = path.resolve(uploadsDir, documento.caminho_arquivo);
    if (!fs.existsSync(filePath))
      return res
        .status(404)
        .json({ error: "Arquivo não encontrado no servidor." });

    // Registrar auditoria
    db.query(
      `INSERT INTO auditoria_download (usuario_id, documento_id, data_download)
       VALUES ($1, $2, NOW())`,
      [usuarioId, documento_id]
    ).catch((e) => console.warn("Erro ao registrar auditoria:", e.message));

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${documento.nome_arquivo}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      if (!res.headersSent)
        res.status(500).json({ error: "Erro ao ler o arquivo." });
    });
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ error: "Erro ao realizar download seguro." });
  }
});

// ==========================
// NOVA ROTA: REMOVER DOCUMENTO
// ==========================
router.delete(
  "/:documento_id",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    const { documento_id } = req.params;

    try {
      const result = await db.query("SELECT * FROM documentos WHERE id = $1", [
        documento_id,
      ]);

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Documento não encontrado." });

      const documento = result.rows[0];

      const filePath = path.resolve(uploadsDir, documento.caminho_arquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await db.query(
        "DELETE FROM documento_permissao WHERE documento_id = $1",
        [documento_id]
      );

      await db.query("DELETE FROM documentos WHERE id = $1", [documento_id]);

      res.json({ message: "Documento removido com sucesso." });
    } catch (err) {
      console.error("[DELETE] Erro:", err);
      res.status(500).json({ error: "Erro ao remover documento." });
    }
  }
);

// ==========================
// EXPORTAR ROUTER
// ==========================
export default router;
