import express from "express";
import SecurityMetricsController from "../controllers/SecurityMetricsController.js";
import { autenticar } from "../middleware/auth.js";
import { verificarPermissao } from "../middleware/verificarPermissao.js";

const router = express.Router();

/**
 * Rotas para métricas de segurança
 * Implementação da métrica: Taxa de Incidentes de Vazamento de Dados
 */

/**
 * @route GET /security-metrics/taxa-vazamento
 * @desc Calcular a taxa de incidentes de vazamento de dados
 * @access Administrador
 * @query {string} dataInicio - Data inicial do período (opcional)
 * @query {string} dataFim - Data final do período (opcional)
 * @query {string} tipoIncidente - Tipo específico de incidente (opcional)
 */
router.get(
  "/taxa-vazamento",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.calcularTaxaVazamento
);

/**
 * @route POST /security-metrics/incidentes
 * @desc Registrar um novo incidente de segurança
 * @access Administrador
 * @body {string} tipo - Tipo do incidente (VAZAMENTO_DADOS, ACESSO_NAO_AUTORIZADO, etc)
 * @body {string} severidade - Severidade (BAIXA, MEDIA, ALTA, CRITICA)
 * @body {string} descricao - Descrição detalhada do incidente
 * @body {string} dadosAfetados - Descrição dos dados afetados (opcional)
 * @body {number} quantidadeRegistros - Quantidade de registros afetados (opcional)
 * @body {string} origem - Origem da detecção (opcional)
 */
router.post(
  "/incidentes",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.registrarIncidente
);

/**
 * @route GET /security-metrics/incidentes
 * @desc Listar incidentes de segurança com filtros
 * @access Administrador
 * @query {string} tipo - Filtrar por tipo de incidente
 * @query {string} severidade - Filtrar por severidade
 * @query {string} status - Filtrar por status
 * @query {string} dataInicio - Data inicial
 * @query {string} dataFim - Data final
 * @query {number} page - Página (padrão: 1)
 * @query {number} limit - Itens por página (padrão: 50)
 */
router.get(
  "/incidentes",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.listarIncidentes
);

/**
 * @route PUT /security-metrics/incidentes/:id
 * @desc Atualizar status de um incidente
 * @access Administrador
 * @param {number} id - ID do incidente
 * @body {string} status - Novo status (ABERTO, EM_INVESTIGACAO, RESOLVIDO, FALSO_POSITIVO)
 * @body {string} acaoCorretiva - Descrição da ação corretiva tomada
 */
router.put(
  "/incidentes/:id",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.atualizarIncidente
);

/**
 * @route GET /security-metrics/estatisticas
 * @desc Obter estatísticas gerais de segurança
 * @access Administrador
 * @query {string} dataInicio - Data inicial (opcional)
 * @query {string} dataFim - Data final (opcional)
 */
router.get(
  "/estatisticas",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.obterEstatisticas
);

/**
 * @route GET /security-metrics/detectar-vazamentos
 * @desc Analisar logs de auditoria para detectar possíveis vazamentos
 * @access Administrador
 * @query {string} dataInicio - Data inicial (opcional)
 * @query {string} dataFim - Data final (opcional)
 */
router.get(
  "/detectar-vazamentos",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.detectarVazamentos
);

/**
 * @route GET /security-metrics/cobertura-acesso
 * @desc Calcular a cobertura de regras de acesso por perfil
 * @access Administrador
 * @query {string} perfil - Filtrar por perfil específico (opcional)
 * @query {string} nivelRisco - Filtrar por nível de risco (opcional)
 */
router.get(
  "/cobertura-acesso",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.calcularCoberturaAcesso
);

/**
 * @route POST /security-metrics/regras-acesso
 * @desc Registrar ou atualizar uma regra de acesso
 * @access Administrador
 * @body {string} perfil - Perfil do usuário (admin, colaborador, gerente, etc)
 * @body {string} funcionalidade - Nome da funcionalidade
 * @body {string} endpoint - Endpoint relacionado (opcional)
 * @body {string} metodo - Método HTTP (opcional)
 * @body {boolean} temRbac - Se tem controle RBAC implementado
 * @body {string} nivelRisco - Nível de risco (BAIXO, MEDIO, ALTO, CRITICO)
 * @body {string} descricao - Descrição da funcionalidade (opcional)
 */
router.post(
  "/regras-acesso",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.registrarRegraAcesso
);

/**
 * @route GET /security-metrics/regras-acesso
 * @desc Listar regras de acesso com filtros
 * @access Administrador
 * @query {string} perfil - Filtrar por perfil
 * @query {boolean} temRbac - Filtrar por presença de RBAC
 * @query {string} nivelRisco - Filtrar por nível de risco
 * @query {number} page - Página (padrão: 1)
 * @query {number} limit - Itens por página (padrão: 100)
 */
router.get(
  "/regras-acesso",
  autenticar,
  verificarPermissao(["Administrador"]),
  SecurityMetricsController.listarRegrasAcesso
);

export default router;
