import AuditController from "../controllers/AuditController.js";
import SecurityMetricsController from "../controllers/SecurityMetricsController.js";

/**
 * Middleware para auditoria automática de ações sensíveis
 * Implementa a US-E6-02 - Auditoria e Logs de Segurança
 */

// Mapeamento de rotas e ações para auditoria
const ACOES_SENSIVEIS = {
  // Autenticação
  "POST:/login": {
    acao: "LOGIN",
    categoria: "AUTENTICACAO",
    criticidade: "MEDIO",
  },
  "POST:/logout": {
    acao: "LOGOUT",
    categoria: "AUTENTICACAO",
    criticidade: "BAIXO",
  },

  // Usuários
  "POST:/usuario": {
    acao: "CRIAR_USUARIO",
    categoria: "USUARIO",
    criticidade: "ALTO",
  },
  "PUT:/usuario/:id": {
    acao: "EDITAR_USUARIO",
    categoria: "USUARIO",
    criticidade: "ALTO",
  },
  "DELETE:/usuario/:id": {
    acao: "EXCLUIR_USUARIO",
    categoria: "USUARIO",
    criticidade: "CRITICO",
  },

  // Folha de Pagamento
  "POST:/folha": {
    acao: "CRIAR_FOLHA_PAGAMENTO",
    categoria: "FOLHA_PAGAMENTO",
    criticidade: "CRITICO",
  },
  "PUT:/folha/:id": {
    acao: "EDITAR_FOLHA_PAGAMENTO",
    categoria: "FOLHA_PAGAMENTO",
    criticidade: "CRITICO",
  },
  "DELETE:/folha/:id": {
    acao: "EXCLUIR_FOLHA_PAGAMENTO",
    categoria: "FOLHA_PAGAMENTO",
    criticidade: "CRITICO",
  },

  // Benefícios
  "POST:/beneficio": {
    acao: "CRIAR_BENEFICIO",
    categoria: "BENEFICIO",
    criticidade: "ALTO",
  },
  "PUT:/beneficio/:id": {
    acao: "EDITAR_BENEFICIO",
    categoria: "BENEFICIO",
    criticidade: "ALTO",
  },
  "DELETE:/beneficio/:id": {
    acao: "EXCLUIR_BENEFICIO",
    categoria: "BENEFICIO",
    criticidade: "ALTO",
  },

  // Documentos
  "POST:/documentos": {
    acao: "UPLOAD_DOCUMENTO",
    categoria: "DOCUMENTO",
    criticidade: "MEDIO",
  },
  "GET:/documentos/:id": {
    acao: "VISUALIZAR_DOCUMENTO",
    categoria: "DOCUMENTO",
    criticidade: "BAIXO",
  },
  "DELETE:/documentos/:id": {
    acao: "EXCLUIR_DOCUMENTO",
    categoria: "DOCUMENTO",
    criticidade: "ALTO",
  },

  // Relatórios
  "POST:/relatorios": {
    acao: "GERAR_RELATORIO",
    categoria: "RELATORIO",
    criticidade: "MEDIO",
  },
  "GET:/relatorios/folha": {
    acao: "CONSULTAR_RELATORIO_FOLHA",
    categoria: "RELATORIO",
    criticidade: "MEDIO",
  },

  // Solicitações
  "POST:/solicitacoes": {
    acao: "CRIAR_SOLICITACAO",
    categoria: "SOLICITACAO",
    criticidade: "MEDIO",
  },
  "PUT:/solicitacoes/:id/aprovar": {
    acao: "APROVAR_SOLICITACAO",
    categoria: "SOLICITACAO",
    criticidade: "ALTO",
  },
  "PUT:/solicitacoes/:id/rejeitar": {
    acao: "REJEITAR_SOLICITACAO",
    categoria: "SOLICITACAO",
    criticidade: "ALTO",
  },

  // Férias
  "POST:/ferias": {
    acao: "SOLICITAR_FERIAS",
    categoria: "FERIAS",
    criticidade: "MEDIO",
  },
  "PUT:/ferias/:id/aprovar": {
    acao: "APROVAR_FERIAS",
    categoria: "FERIAS",
    criticidade: "ALTO",
  },

  // Registro de Ponto
  "POST:/registro-ponto": {
    acao: "REGISTRAR_PONTO",
    categoria: "PONTO",
    criticidade: "BAIXO",
  },
  "PUT:/registro-ponto/:id": {
    acao: "EDITAR_PONTO",
    categoria: "PONTO",
    criticidade: "ALTO",
  },
  "DELETE:/registro-ponto/:id": {
    acao: "EXCLUIR_PONTO",
    categoria: "PONTO",
    criticidade: "CRITICO",
  },
};

/**
 * Middleware principal de auditoria
 * Captura automaticamente ações sensíveis
 */
export function auditMiddleware(req, res, next) {
  // Normalizar path removendo parâmetros
  const pathPattern = req.route?.path || req.path;
  const basePath = req.baseUrl || "";
  const fullPath = basePath + pathPattern;
  const metodo = req.method;
  const chave = `${metodo}:${fullPath}`;

  // Verificar se é uma ação sensível
  const acaoConfig = ACOES_SENSIVEIS[chave];

  if (acaoConfig) {
    // Capturar resposta original
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;

    let statusCode = 200;
    let responseBody = null;

    // Interceptar res.status
    res.status = function (code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Interceptar res.json
    res.json = function (body) {
      responseBody = body;
      registrarAuditoria();
      return originalJson.call(this, body);
    };

    // Interceptar res.send
    res.send = function (body) {
      if (!responseBody) {
        responseBody = body;
      }
      registrarAuditoria();
      return originalSend.call(this, body);
    };

    // Função para registrar auditoria
    const registrarAuditoria = async () => {
      try {
        // Determinar resultado baseado no status code
        let resultado = "SUCESSO";
        if (statusCode >= 400 && statusCode < 500) {
          resultado = "NEGADO";
        } else if (statusCode >= 500) {
          resultado = "FALHA";
        }

        // Extrair informações do usuário
        const usuario = req.user || {};
        const usuarioId = usuario.id || usuario.userId || null;
        const usuarioNome = usuario.nome || usuario.name || null;
        const usuarioEmail = usuario.email || null;

        // Capturar IP (considerando proxies)
        const ipAddress =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.headers["x-real-ip"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress;

        // Capturar User Agent
        const userAgent = req.headers["user-agent"] || null;

        // Preparar dados para auditoria
        const dadosAuditoria = {
          usuarioId,
          usuarioNome,
          usuarioEmail,
          acao: acaoConfig.acao,
          categoria: acaoConfig.categoria,
          descricao: `${metodo} ${fullPath} - Status: ${statusCode}`,
          endpoint: fullPath,
          metodo,
          ipAddress,
          userAgent,
          resultado,
          nivelCriticidade: acaoConfig.criticidade,
          metadata: {
            params: req.params,
            query: req.query,
            statusCode,
          },
        };

        // Capturar dados anteriores e novos para operações de edição
        if (metodo === "PUT" || metodo === "PATCH") {
          dadosAuditoria.dadosNovos = req.body;
          // Dados anteriores devem ser capturados no controller antes da alteração
        } else if (metodo === "POST") {
          dadosAuditoria.dadosNovos = req.body;
        } else if (metodo === "DELETE") {
          dadosAuditoria.dadosAnteriores = { id: req.params.id };
        }

        // Registrar no banco de dados
        const logAuditoria = await AuditController.registrarLog(dadosAuditoria);

        // Registrar transação de dados para métrica de segurança
        if (resultado === "SUCESSO" && logAuditoria) {
          // Determinar sensibilidade baseada na categoria
          let sensibilidade = "NORMAL";
          if (
            acaoConfig.categoria === "FOLHA_PAGAMENTO" ||
            acaoConfig.categoria === "BENEFICIO"
          ) {
            sensibilidade = "CRITICA";
          } else if (
            acaoConfig.categoria === "USUARIO" ||
            acaoConfig.categoria === "DOCUMENTO"
          ) {
            sensibilidade = "ALTA";
          }

          // Mapear ação para tipo de transação
          let tipoTransacao = "CONSULTA";
          if (metodo === "POST") tipoTransacao = "CRIACAO";
          else if (metodo === "PUT" || metodo === "PATCH")
            tipoTransacao = "ATUALIZACAO";
          else if (metodo === "DELETE") tipoTransacao = "EXCLUSAO";
          else if (acaoConfig.acao.includes("RELATORIO"))
            tipoTransacao = "EXPORTACAO";

          await SecurityMetricsController.registrarTransacao(
            tipoTransacao,
            acaoConfig.categoria,
            {
              usuarioId,
              endpoint: fullPath,
              sensibilidade,
              auditLogId: logAuditoria.id,
              metadata: {
                acao: acaoConfig.acao,
                metodo,
              },
            }
          );
        }

        // Detectar possíveis incidentes de segurança
        if (resultado === "NEGADO" || resultado === "FALHA") {
          // Verificar padrões suspeitos
          if (
            acaoConfig.categoria === "AUTENTICACAO" &&
            resultado === "FALHA"
          ) {
            // Contar tentativas falhas recentes do mesmo IP
            const query = `
              SELECT COUNT(*) as tentativas
              FROM audit_logs
              WHERE ip_address = $1
                AND categoria = 'AUTENTICACAO'
                AND resultado = 'FALHA'
                AND data_hora > NOW() - INTERVAL '15 minutes'
            `;
            
            const db = (await import("../db.js")).default;
            const result = await db.query(query, [ipAddress]);
            const tentativas = parseInt(result.rows[0].tentativas);

            // Se houver muitas tentativas falhas, registrar incidente
            if (tentativas >= 5) {
              await SecurityMetricsController.registrarTransacao(
                "CONSULTA",
                "AUTENTICACAO",
                {
                  usuarioId: null,
                  endpoint: fullPath,
                  sensibilidade: "ALTA",
                  auditLogId: logAuditoria?.id,
                }
              );

              // Registrar incidente automaticamente
              const incidenteQuery = `
                INSERT INTO security_incidents (
                  tipo, severidade, descricao, origem, ip_address,
                  audit_log_id, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
              `;

              await db.query(incidenteQuery, [
                "TENTATIVAS_FALHAS_AUTENTICACAO",
                "ALTA",
                `${tentativas} tentativas falhas de autenticação do IP ${ipAddress} nos últimos 15 minutos`,
                "AUDITORIA_AUTOMATICA",
                ipAddress,
                logAuditoria?.id,
                "ABERTO",
              ]);
            }
          }
        }
      } catch (error) {
        console.error("[AuditMiddleware] Erro ao registrar auditoria:", error);
        // Não propagar erro para não afetar a operação principal
      }
    };
  }

  next();
}

/**
 * Middleware para auditoria manual
 * Usado quando precisamos registrar ações específicas com mais controle
 */
export function auditarAcao(acao, categoria, criticidade = "MEDIO") {
  return async (req, res, next) => {
    try {
      const usuario = req.user || {};
      const usuarioId = usuario.id || usuario.userId || null;
      const usuarioNome = usuario.nome || usuario.name || null;
      const usuarioEmail = usuario.email || null;

      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress;

      const userAgent = req.headers["user-agent"] || null;

      await AuditController.registrarLog({
        usuarioId,
        usuarioNome,
        usuarioEmail,
        acao,
        categoria,
        descricao: `${req.method} ${req.path}`,
        endpoint: req.path,
        metodo: req.method,
        ipAddress,
        userAgent,
        resultado: "SUCESSO",
        nivelCriticidade: criticidade,
        metadata: {
          params: req.params,
          query: req.query,
        },
      });
    } catch (error) {
      console.error("[AuditMiddleware] Erro ao auditar ação:", error);
    }

    next();
  };
}

/**
 * Helper para registrar auditoria de forma síncrona em controllers
 */
export async function registrarAuditoriaManual(req, dados) {
  try {
    const usuario = req.user || {};
    const usuarioId = usuario.id || usuario.userId || null;
    const usuarioNome = usuario.nome || usuario.name || null;
    const usuarioEmail = usuario.email || null;

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress;

    const userAgent = req.headers["user-agent"] || null;

    await AuditController.registrarLog({
      usuarioId,
      usuarioNome,
      usuarioEmail,
      ipAddress,
      userAgent,
      endpoint: req.path,
      metodo: req.method,
      ...dados,
    });
  } catch (error) {
    console.error("[AuditMiddleware] Erro ao registrar auditoria manual:", error);
  }
}

export default auditMiddleware;
