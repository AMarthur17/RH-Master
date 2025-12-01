// src/routes/folhaPagamento.routes.js
import express from "express";
import { gerarFolha, getFolhaUsuario, efetivarFolha } from "../controllers/folhaPagamento.controller.js";
import horasExtraService from "../services/horasExtraService.js";
import { autenticar } from "../middleware/auth.js"; // <- ajustado para named export
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

// Gera folha de pagamento (todos ou usuário específico)
// RBAC: Apenas Admin e RH podem processar folha (CRÍTICO)
router.post("/gerar", autenticar, permitir(["admin", "administrador", "rh"]), gerarFolha);

// Consulta folha de um usuário (filtra por mês via query)
// RBAC: Colaborador vê apenas sua própria folha, Admin/RH veem todas (CRÍTICO)
router.get("/:usuarioId", autenticar, permitir(["admin", "administrador", "rh", "colaborador"]), getFolhaUsuario);

// Endpoint para obter detalhes de horas extras e noturnas
// GET /folha/horas-extras/:usuarioId?mes=11&ano=2025
router.get("/horas-extras/:usuarioId", autenticar, permitir(["admin", "administrador", "rh", "colaborador"]), async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { mes, ano } = req.query;

    // RBAC: Colaborador só pode ver suas próprias horas extras
    const perfil = (req.user?.perfil || "").toLowerCase();
    const currentUserId = req.user?.id;
    
    if (perfil === 'colaborador' && currentUserId !== parseInt(usuarioId)) {
      return res.status(403).json({ 
        error: "Acesso negado. Você só pode visualizar suas próprias horas extras." 
      });
    }

    if (!mes || !ano) {
      return res.status(400).json({ error: "Parâmetros mes e ano são obrigatórios" });
    }

    const calculos = await horasExtraService.calcularHorasExtras(parseInt(usuarioId), parseInt(mes), parseInt(ano));
    const historico = await horasExtraService.buscarHistorico(parseInt(usuarioId), parseInt(mes), parseInt(ano));

    res.json({
      periodo: `${mes}/${ano}`,
      calculos,
      folhaPagamento: historico,
    });
  } catch (error) {
    console.error("Erro ao buscar horas extras:", error);
    res.status(500).json({ error: "Erro ao buscar horas extras" });
  }
});

// Efetivar folha (mudar status para efetivada)
// RBAC: Apenas Admin e RH podem efetivar folha
router.put("/:folhaId/efetivar", autenticar, permitir(["admin", "administrador", "rh"]), efetivarFolha);

export default router;
