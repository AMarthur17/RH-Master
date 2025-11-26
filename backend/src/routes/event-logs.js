import express from "express";
import EventLogsController from "../controllers/EventLogsController.js";
import { autenticar } from "../middleware/auth.js";

const router = express.Router();

/**
 * Rotas de Event Logs (RNF-03 - Observabilidade do Sistema)
 * Todos os endpoints requerem autenticação e permissão de administrador
 */

/**
 * GET /api/event-logs
 * Listar eventos com filtros
 * Query params:
 *   - tipoEvento: String (ex: USUARIO_CRIADO)
 *   - nivelCriticidade: String (NORMAL, IMPORTANTE, CRITICO)
 *   - usuarioId: Number
 *   - dataInicio: ISO String
 *   - dataFim: ISO String
 *   - status: String (REGISTRADO, ALERTADO, RESOLVIDO)
 *   - busca: String (busca textual)
 *   - page: Number (default 1)
 *   - limit: Number (default 50)
 *   - orderBy: String (timestamp, tipo_evento, etc)
 *   - orderDir: ASC | DESC
 */
router.get("/", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem acessar event logs.",
    });
  }
  return EventLogsController.listarEventos(req, res);
});

/**
 * GET /api/event-logs/:id
 * Obter detalhes de um evento específico
 */
router.get("/:id", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem acessar event logs.",
    });
  }
  return EventLogsController.obterEventoPorId(req, res);
});

/**
 * GET /api/event-logs/:id/integridade
 * Verificar integridade de um evento
 * Valida se o evento não foi modificado
 */
router.get("/:id/integridade", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem acessar event logs.",
    });
  }
  return EventLogsController.verificarIntegridade(req, res);
});

/**
 * GET /api/event-logs/estatisticas/resumo
 * Obter estatísticas de eventos
 * Query params:
 *   - dataInicio: ISO String
 *   - dataFim: ISO String
 */
router.get("/estatisticas/resumo", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem acessar event logs.",
    });
  }
  return EventLogsController.obterEstatisticas(req, res);
});

/**
 * GET /api/event-logs/criticos/recentes
 * Obter eventos críticos recentes
 * Query params:
 *   - horas: Number (últimas N horas, default 24)
 *   - limit: Number (quantos registros, default 20)
 */
router.get("/criticos/recentes", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem acessar event logs.",
    });
  }
  return EventLogsController.obterEventosCriticos(req, res);
});

/**
 * POST /api/event-logs/exportar
 * Exportar eventos para auditoria externa
 * Query params:
 *   - formato: 'json' ou 'csv' (default json)
 *   - tipoEvento: String
 *   - nivelCriticidade: String
 *   - dataInicio: ISO String
 *   - dataFim: ISO String
 */
router.post("/exportar", autenticar, (req, res) => {
  if (req.user.cargo !== "Administrador") {
    return res.status(403).json({
      error: "Acesso negado. Apenas administradores podem exportar event logs.",
    });
  }
  return EventLogsController.exportarEventos(req, res);
});

export default router;
