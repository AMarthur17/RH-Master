// src/routes/documentos.js
import express from "express";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";
import multer from "multer";
import * as fs from "fs";
import path from "path";
import db from "../db.js";
import { verificarPermissao } from "../middleware/verificarPermissao.js";

const router = express.Router();

// ====== UPLOAD ======

// Garantir que a pasta uploads existe
const uploadsDir = "uploads/";
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Funções auxiliares para criar pasta de usuário
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

// Configuração do multer
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

// Upload de documento
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
         VALUES ($1, $2, $3) RETURNING *`,
        [usuario_id, req.file.originalname, caminhoArquivo]
      );

      res.status(201).json({ documento: result.rows[0] });
    } catch (err) {
      console.error("[UPLOAD] Erro:", err);
      res.status(500).json({ error: "Erro ao salvar documento." });
    }
  }
);

// Listar documentos de um usuário
router.get("/:usuario_id", autenticar, async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await db.query(
      `SELECT id, nome_arquivo, caminho_arquivo, data_upload
       FROM documentos WHERE usuario_id = $1`,
      [usuario_id]
    );

    const documentosComUrl = result.rows
      .filter((doc) =>
        fs.existsSync(path.join(uploadsDir, doc.caminho_arquivo))
      )
      .map((doc) => ({
        ...doc,
        url_arquivo: `http://localhost:3000/uploads/${doc.caminho_arquivo}`,
      }));

    res.json(documentosComUrl);
  } catch (err) {
    console.error("[LISTAGEM] Erro:", err);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

// ====== PERMISSÕES ======

// Visualizar documento
router.get(
  "/:documento_id/view",
  autenticar,
  verificarPermissao("pode_visualizar"),
  async (req, res) => {
    const documentoId = Number(req.params.documento_id);
    const result = await db.query("SELECT * FROM documentos WHERE id = $1", [
      documentoId,
    ]);
    res.json(result.rows[0]);
  }
);

// Editar documento
router.put(
  "/:documento_id",
  autenticar,
  verificarPermissao("pode_editar"),
  async (req, res) => {
    res.json({ msg: "Edição ainda não implementada" });
  }
);

// Deletar documento
router.delete(
  "/:documento_id",
  autenticar,
  verificarPermissao("pode_excluir"),
  async (req, res) => {
    const { documento_id } = req.params;
    const result = await db.query(
      "SELECT caminho_arquivo FROM documentos WHERE id = $1",
      [documento_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Documento não encontrado." });

    const caminhoArquivo = result.rows[0].caminho_arquivo;
    await db.query("DELETE FROM documentos WHERE id = $1", [documento_id]);

    const filePath = path.join(uploadsDir, caminhoArquivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true });
  }
);

// Atribuir permissões a usuário
router.post(
  "/:documento_id/permissao",
  autenticar,
  permitir(["admin", "administrador"]),
  async (req, res) => {
    const documento_id = Number(req.params.documento_id);
    const { usuario_id, pode_visualizar, pode_editar, pode_excluir } = req.body;

    const result = await db.query(
      `INSERT INTO documento_permissao
       (documento_id, usuario_id, pode_visualizar, pode_editar, pode_excluir)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (documento_id, usuario_id) DO UPDATE
       SET pode_visualizar = $3, pode_editar = $4, pode_excluir = $5
       RETURNING *`,
      [documento_id, usuario_id, pode_visualizar, pode_editar, pode_excluir]
    );

    res.json({ permissao: result.rows[0] });
  }
);

export default router;
