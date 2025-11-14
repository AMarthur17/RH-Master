import express from "express";
import AuditController from "../controllers/AuditController.js";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";

/**
 * Rotas para consulta e gerenciamento de logs de auditoria
 * US-E6-02 - Auditoria e Logs de Segurança
 */

const router = express.Router();

/**
 * @route GET /audit/logs
 * @desc Consultar logs de auditoria com filtros
 * @access Administrador, Auditor
 * @query {number} usuarioId - Filtrar por ID do usuário
 * @query {string} acao - Filtrar por tipo de ação
 * @query {string} categoria - Filtrar por categoria (AUTENTICACAO, USUARIO, FOLHA_PAGAMENTO, etc)
 * @query {string} resultado - Filtrar por resultado (SUCESSO, FALHA, NEGADO)
 * @query {string} nivelCriticidade - Filtrar por criticidade (BAIXO, MEDIO, ALTO, CRITICO)
 * @query {string} dataInicio - Data inicial (ISO 8601)
 * @query {string} dataFim - Data final (ISO 8601)
 * @query {string} busca - Busca textual em vários campos
 * @query {number} page - Página (padrão: 1)
 * @query {number} limit - Registros por página (padrão: 50, máx: 1000)
 * @query {string} orderBy - Campo para ordenação (data_hora, acao, categoria, etc)
 * @query {string} orderDir - Direção da ordenação (ASC, DESC)
 */
router.get(
  "/logs",
  autenticar,
  permitir(["administrador", "auditor", "Administrador", "Auditor"]),
  AuditController.consultarLogs
);

/**
 * @route GET /audit/logs/:id
 * @desc Obter detalhes de um log específico
 * @access Administrador, Auditor
 */
router.get(
  "/logs/:id",
  autenticar,
  permitir(["administrador", "auditor", "Administrador", "Auditor"]),
  AuditController.obterLogPorId
);

/**
 * @route GET /audit/statistics
 * @desc Obter estatísticas e métricas de auditoria
 * @access Administrador, Auditor
 * @query {string} dataInicio - Data inicial para estatísticas
 * @query {string} dataFim - Data final para estatísticas
 */
router.get(
  "/statistics",
  autenticar,
  permitir(["administrador", "auditor"]),
  AuditController.obterEstatisticas
);

/**
 * @route GET /audit/logs/:id/verify
 * @desc Verificar integridade de um log específico
 * @access Administrador, Auditor
 * @returns {object} Status de integridade e hashes
 */
router.get(
  "/logs/:id/verify",
  autenticar,
  permitir(["administrador", "auditor"]),
  AuditController.verificarIntegridade
);

/**
 * @route GET /audit/export
 * @desc Exportar logs para auditoria externa
 * @access Administrador, Auditor
 * @query {string} formato - Formato de exportação (json, csv)
 * @query Aceita os mesmos filtros de /audit/logs
 */
router.get(
  "/export",
  autenticar,
  permitir(["administrador", "auditor"]),
  AuditController.exportarLogs
);

/**
 * @route GET /audit/actions
 * @desc Listar todos os tipos de ações disponíveis
 * @access Administrador, Auditor
 */
router.get(
  "/actions",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT acao, categoria
        FROM audit_logs
        ORDER BY categoria, acao
      `;
      const result = await (await import("../db.js")).default.query(query);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter ações" });
    }
  }
);

/**
 * @route GET /audit/categories
 * @desc Listar todas as categorias disponíveis
 * @access Administrador, Auditor
 */
router.get(
  "/categories",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT categoria, COUNT(*) as total
        FROM audit_logs
        GROUP BY categoria
        ORDER BY categoria
      `;
      const result = await (await import("../db.js")).default.query(query);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter categorias" });
    }
  }
);

/**
 * @route GET /audit/users
 * @desc Listar usuários com atividades auditadas
 * @access Administrador, Auditor
 */
router.get(
  "/users",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const query = `
        SELECT 
          usuario_id,
          usuario_nome,
          usuario_email,
          COUNT(*) as total_acoes,
          MAX(data_hora) as ultima_acao
        FROM audit_logs
        WHERE usuario_id IS NOT NULL
        GROUP BY usuario_id, usuario_nome, usuario_email
        ORDER BY total_acoes DESC
        LIMIT 100
      `;
      const result = await (await import("../db.js")).default.query(query);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter usuários" });
    }
  }
);

/**
 * @route GET /audit/recent
 * @desc Obter ações recentes (últimas 100)
 * @access Administrador, Auditor
 */
router.get(
  "/recent",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const query = `
        SELECT 
          id, usuario_nome, acao, categoria, descricao,
          resultado, nivel_criticidade, data_hora
        FROM audit_logs
        ORDER BY data_hora DESC
        LIMIT 100
      `;
      const result = await (await import("../db.js")).default.query(query);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter ações recentes" });
    }
  }
);

/**
 * @route GET /audit/critical
 * @desc Obter ações críticas e de alto risco
 * @access Administrador, Auditor
 */
router.get(
  "/critical",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      const query = `
        SELECT 
          id, usuario_nome, usuario_email, acao, categoria, descricao,
          resultado, nivel_criticidade, data_hora, ip_address
        FROM audit_logs
        WHERE nivel_criticidade IN ('CRITICO', 'ALTO')
        ORDER BY data_hora DESC
        LIMIT $1
      `;
      const result = await (await import("../db.js")).default.query(query, [limit]);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter ações críticas" });
    }
  }
);

/**
 * @route GET /audit/failed
 * @desc Obter tentativas falhas e negadas
 * @access Administrador, Auditor
 */
router.get(
  "/failed",
  autenticar,
  permitir(["administrador", "auditor"]),
  async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      const query = `
        SELECT 
          id, usuario_nome, usuario_email, acao, categoria, descricao,
          resultado, nivel_criticidade, data_hora, ip_address
        FROM audit_logs
        WHERE resultado IN ('FALHA', 'NEGADO')
        ORDER BY data_hora DESC
        LIMIT $1
      `;
      const result = await (await import("../db.js")).default.query(query, [limit]);
      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao obter falhas" });
    }
  }
);

export default router;
