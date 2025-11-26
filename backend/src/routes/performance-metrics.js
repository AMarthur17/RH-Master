import { Router } from 'express';
import PerformanceMetricsController from '../controllers/PerformanceMetricsController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/performance-metrics
 * Retorna as métricas atuais de performance
 * Requer autenticação como Admin
 */
router.get('/', autenticar, async (req, res) => {
  // Verificar se é admin (assumindo que req.user.cargo = 'Administrador')
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceMetricsController.obterMetricasAtuals(req, res);
});

/**
 * GET /api/performance-metrics/historico
 * Retorna histórico das últimas N horas
 * Query params: horas (default: 24), limite (default: 100)
 */
router.get('/historico', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceMetricsController.obterHistorico(req, res);
});

/**
 * GET /api/performance-metrics/resumo
 * Retorna resumo estatístico das métricas
 * Query params: horas (default: 24)
 */
router.get('/resumo', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceMetricsController.obterResumo(req, res);
});

export default router;
