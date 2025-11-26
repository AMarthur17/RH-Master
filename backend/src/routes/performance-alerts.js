import { Router } from 'express';
import PerformanceAlertsController from '../controllers/PerformanceAlertsController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/performance-alerts/check
 * Verifica métricas e dispara alertas automaticamente
 */
router.post('/check', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.verificarMetricas(req, res);
});

/**
 * GET /api/performance-alerts
 * Lista alertas com filtros
 */
router.get('/', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.listarAlertas(req, res);
});

/**
 * GET /api/performance-alerts/:id
 * Obter detalhes de um alerta
 */
router.get('/:id', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.obterAlerta(req, res);
});

/**
 * PUT /api/performance-alerts/:id
 * Atualizar status de um alerta
 */
router.put('/:id', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.atualizarAlerta(req, res);
});

/**
 * GET /api/performance-alerts/estatisticas/resumo
 * Retorna estatísticas de alertas
 */
router.get('/estatisticas/resumo', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.obterEstatisticas(req, res);
});

/**
 * GET /api/performance-alerts/tipos/resumo
 * Retorna alertas por tipo
 */
router.get('/tipos/resumo', autenticar, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  return PerformanceAlertsController.obterAlerstasPorTipo(req, res);
});

export default router;
