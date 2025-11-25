// src/routes/folhaPagamento.routes.js
import express from "express";
import { gerarFolha, getFolhaUsuario, efetivarFolha } from "../controllers/folhaPagamento.controller.js";
import { autenticar } from "../middleware/auth.js"; // <- ajustado para named export
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

// Gera folha de pagamento (todos ou usuário específico)
// RBAC: Apenas Admin e RH podem processar folha (CRÍTICO)
router.post("/gerar", autenticar, permitir(["admin", "administrador", "rh"]), gerarFolha);

// Consulta folha de um usuário (filtra por mês via query)
// RBAC: Colaborador vê apenas sua própria folha, Admin/RH veem todas (CRÍTICO)
router.get("/:usuarioId", autenticar, permitir(["admin", "administrador", "rh", "colaborador"]), getFolhaUsuario);

// Efetivar folha (mudar status para efetivada)
// RBAC: Apenas Admin e RH podem efetivar folha
router.put("/:folhaId/efetivar", autenticar, permitir(["admin", "administrador", "rh"]), efetivarFolha);

export default router;
