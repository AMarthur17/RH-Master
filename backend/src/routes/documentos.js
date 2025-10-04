// src/routes/documentos.js
import express from "express";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";
import multer from "multer";
import * as fs from "fs";
import path from "path";
import db from "../db.js"; // <- alterado aqui

const router = express.Router();

// Garantir que a pasta uploads existe
const uploadsDir = "uploads/";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("[UPLOAD] Pasta uploads criada");
}

// Função para gerar nome da pasta do usuário
const generateUserFolderName = (userId, userName) => {
  const normalizedName = userName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  
  return `${userId}-${normalizedName}`;
};

// Função para criar a pasta do usuário se não existir
const ensureUserFolder = async (userId) => {
  try {
    const userResult = await db.query("SELECT nome FROM usuario WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) throw new Error("Usuário não encontrado");
    
    const userName = userResult.rows[0].nome;
    const userFolderName = generateUserFolderName(userId, userName);
    const userFolderPath = path.join(uploadsDir, userFolderName);
    
    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
      console.log(`[UPLOAD] Pasta do usuário criada: ${userFolderPath}`);
    }
    
    return { userFolderName, userFolderPath };
  } catch (error) {
    console.error("[UPLOAD] Erro ao criar pasta do usuário:", error);
    throw error;
  }
};

// Configuração do multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.params.usuario_id;
      const { userFolderPath } = await ensureUserFolder(userId);
      cb(null, userFolderPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Upload de documento
router.post("/:usuario_id", autenticar, permitir(["admin", "administrador"]), upload.single("arquivo"), async (req, res) => {
  const { usuario_id } = req.params;
  console.log("[UPLOAD] Usuário:", usuario_id, "Arquivo:", req.file?.originalname, "Perfil:", req.user?.perfil);
  
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
  
  try {
    const userResult = await db.query("SELECT nome FROM usuario WHERE id = $1", [usuario_id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const userName = userResult.rows[0].nome;
    const userFolderName = generateUserFolderName(usuario_id, userName);
    const caminhoArquivo = `${userFolderName}/${req.file.filename}`;
    
    const result = await db.query(
      `INSERT INTO documentos (usuario_id, nome_arquivo, caminho_arquivo)
       VALUES ($1, $2, $3) RETURNING *`,
      [usuario_id, req.file.originalname, caminhoArquivo]
    );
    
    console.log("[UPLOAD] Documento salvo:", result.rows[0]);
    res.status(201).json({ documento: result.rows[0] });
  } catch (err) {
    console.error("[UPLOAD] Erro:", err);
    res.status(500).json({ error: "Erro ao salvar documento." });
  }
});

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
      .filter((doc) => fs.existsSync(path.join(uploadsDir, doc.caminho_arquivo)))
      .map((doc) => ({
        ...doc,
        url_arquivo: `http://localhost:3000/uploads/${doc.caminho_arquivo}`,
      }));

    console.log(`[LISTAGEM] Encontrados ${documentosComUrl.length} documentos para usuário ${usuario_id}`);
    res.json(documentosComUrl);
  } catch (err) {
    console.error("[LISTAGEM] Erro:", err);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

// Remover documento
router.delete("/:id", autenticar, permitir(["admin", "administrador"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT caminho_arquivo FROM documentos WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Documento não encontrado." });

    const caminhoArquivo = result.rows[0].caminho_arquivo;

    await db.query("DELETE FROM documentos WHERE id = $1", [id]);

    const filePath = path.join(uploadsDir, caminhoArquivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    console.log("[REMOVER] Documento removido:", caminhoArquivo);
    res.json({ success: true });
  } catch (err) {
    console.error("[REMOVER] Erro:", err);
    res.status(500).json({ error: "Erro ao remover documento." });
  }
});

export default router;
