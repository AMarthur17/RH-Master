// src/routes/documentos.js
import express from "express";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";
import multer from "multer";
import * as fs from "fs";
import path from "path";
import { pool } from "../db.js";

const router = express.Router();

// Configuração do multer para armazenar arquivos localmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Rota de upload de documento
router.post("/:usuario_id", autenticar, permitir(["admin", "administrador"]), upload.single("arquivo"), async (req, res) => {
  const { usuario_id } = req.params;
  console.log("[UPLOAD] Usuário:", usuario_id, "Arquivo:", req.file?.originalname, "Perfil:", req.user?.perfil);
  if (!req.file) {
    console.log("[UPLOAD] Nenhum arquivo enviado");
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }
  const nomeArquivo = req.file.originalname;
  const caminhoArquivo = req.file.filename;
  try {
    const result = await pool.query(
      `INSERT INTO documentos (usuario_id, nome_arquivo, caminho_arquivo)
       VALUES ($1, $2, $3) RETURNING *`,
      [usuario_id, nomeArquivo, caminhoArquivo]
    );
    console.log("[UPLOAD] Documento salvo:", result.rows[0]);
    res.status(201).json({ documento: result.rows[0] });
  } catch (err) {
    console.error("[UPLOAD] Erro:", err);
    res.status(500).json({ error: "Erro ao salvar documento." });
  }
});
// Rota para listar documentos de um usuário
router.get("/:usuario_id", autenticar, async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nome_arquivo, caminho_arquivo, data_upload
       FROM documentos WHERE usuario_id = $1`,
      [usuario_id]
    );

    const documentosComUrl = result.rows.map((doc) => ({
      ...doc,
      url_arquivo: `http://localhost:3000/uploads/${doc.caminho_arquivo}`,
    }));

    res.json(documentosComUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});


// Rota para remover documento


router.delete("/:id", autenticar, permitir(["admin", "administrador"]), async (req, res) => {
  const { id } = req.params;
  try {
    console.log("[REMOVER] Documento id:", id, "Perfil:", req.user?.perfil);
    // Busca o caminho do arquivo
    const result = await pool.query(
      "SELECT caminho_arquivo FROM documentos WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      console.log("[REMOVER] Documento não encontrado");
      return res.status(404).json({ error: "Documento não encontrado." });
    }
    const caminhoArquivo = result.rows[0].caminho_arquivo;
    // Remove do banco
    await pool.query("DELETE FROM documentos WHERE id = $1", [id]);
    // Remove do disco
    const filePath = path.join("uploads", caminhoArquivo);
    fs.unlink(filePath, (err) => {
      // Se não existir, ignora
      if (err && err.code !== "ENOENT") {
        console.error("[REMOVER] Erro ao remover arquivo físico:", err);
      }
    });
    console.log("[REMOVER] Documento removido:", caminhoArquivo);
    res.json({ success: true });
  } catch (err) {
    console.error("[REMOVER] Erro:", err);
    res.status(500).json({ error: "Erro ao remover documento." });
  }
});

export default router;
