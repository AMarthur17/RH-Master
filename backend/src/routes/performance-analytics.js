import { Router } from "express";
import PerformanceAnalyticsController from "../controllers/PerformanceAnalyticsController.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/performance-analytics/historico-completo
 * Retorna histórico detalhado de métricas com análise
 */
router.get("/historico-completo", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterHistoricoCompleto(req, res);
});

/**
 * GET /api/performance-analytics/relatorio-diario
 * Retorna relatório diário de performance
 */
router.get("/relatorio-diario", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterRelatorioDiario(req, res);
});

/**
 * GET /api/performance-analytics/comparativo
 * Compara métricas entre dois períodos
 */
router.get("/comparativo", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterComparativo(req, res);
});

/**
 * GET /api/performance-analytics/audit-acoes-criticas
 * Retorna logs de ações críticas auditadas (usuários, folha, férias)
 */
router.get("/audit-acoes-criticas", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterAcoesAuditadasCriticas(req, res);
});

/**
 * GET /api/performance-analytics/cobertura-auditoria
 * Retorna métricas de cobertura de auditoria das ações críticas
 */
router.get("/cobertura-auditoria", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterCoberturaAuditoria(req, res);
});

/**
 * GET /api/performance-analytics/tempo-medio-alerta
 * Calcula tempo médio entre detecção e alerta
 */
router.get("/tempo-medio-alerta", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterTempoMedioAlerta(req, res);
});

/**
 * GET /api/performance-analytics/dashboard
 * Dashboard consolidado com todas as métricas
 */
router.get("/dashboard", autenticar, async (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res
      .status(403)
      .json({ erro: "Acesso negado. Apenas administradores podem acessar." });
  }
  return PerformanceAnalyticsController.obterDashboard(req, res);
});

export default router;
