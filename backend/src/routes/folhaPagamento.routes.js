// src/routes/folhaPagamento.routes.js
import express from "express";
import { gerarFolha, getFolhaUsuario, efetivarFolha } from "../controllers/folhaPagamento.controller.js";
import { autenticar } from "../middleware/auth.js"; // <- ajustado para named export

const router = express.Router();

// Gera folha de pagamento (todos ou usuário específico)
router.post("/gerar", autenticar, gerarFolha);

// Consulta folha de um usuário (filtra por mês via query)
router.get("/:usuarioId", autenticar, getFolhaUsuario);

// Efetivar folha (mudar status para efetivada)
router.put("/:folhaId/efetivar", autenticar, efetivarFolha);

export default router;
