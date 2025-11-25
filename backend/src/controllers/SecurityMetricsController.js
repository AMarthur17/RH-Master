import db from "../db.js";

/**
 * Controller para gerenciar métricas de segurança
 * Implementa a métrica: Taxa de Incidentes de Vazamento de Dados
 * Fórmula: (Total de transações de dados / Nº de incidentes de vazamento detectados) × 100%
 */
class SecurityMetricsController {
  /**
   * Registrar um incidente de segurança
   */
  static async registrarIncidente(req, res) {
    try {
      const {
        tipo,
        severidade,
        descricao,
        dadosAfetados,
        quantidadeRegistros,
        origem,
        endpoint,
        ipAddress,
        metadata,
        auditLogId,
      } = req.body;

      const usuario = req.user || {};
      const usuarioId = usuario.id || usuario.userId;

      const query = `
        INSERT INTO security_incidents (
          tipo, severidade, descricao, dados_afetados, quantidade_registros,
          origem, usuario_id, usuario_responsavel, endpoint, ip_address,
          detectado_por, metadata, audit_log_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const valores = [
        tipo || "VAZAMENTO_DADOS",
        severidade || "MEDIA",
        descricao,
        dadosAfetados || null,
        quantidadeRegistros || 0,
        origem || "MONITORAMENTO_MANUAL",
        usuarioId || null,
        usuario.nome || null,
        endpoint || null,
        ipAddress || req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress,
        usuarioId || null,
        metadata ? JSON.stringify(metadata) : null,
        auditLogId || null,
        "ABERTO",
      ];

      const result = await db.query(query, valores);

      return res.status(201).json({
        message: "Incidente de segurança registrado com sucesso",
        incidente: result.rows[0],
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao registrar incidente:", error);
      return res.status(500).json({
        error: "Erro ao registrar incidente de segurança",
        details: error.message,
      });
    }
  }

  /**
   * Registrar uma transação de dados
   * Usado para calcular o denominador da métrica
   */
  static async registrarTransacao(tipoTransacao, categoriaDados, dados = {}) {
    try {
      const query = `
        INSERT INTO data_transactions (
          tipo_transacao, categoria_dados, quantidade_registros,
          usuario_id, endpoint, sensibilidade, audit_log_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const valores = [
        tipoTransacao,
        categoriaDados,
        dados.quantidadeRegistros || 1,
        dados.usuarioId || null,
        dados.endpoint || null,
        dados.sensibilidade || "NORMAL",
        dados.auditLogId || null,
        dados.metadata ? JSON.stringify(dados.metadata) : null,
      ];

      await db.query(query, valores);
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao registrar transação:", error);
      // Não propagar erro para não interromper operação principal
    }
  }

  /**
   * Calcular a métrica de Taxa de Incidentes de Vazamento de Dados
   * Fórmula: (Total de transações / Nº de incidentes) × 100%
   * Interpretação: Quanto maior o valor, melhor (menos incidentes proporcionalmente)
   */
  static async calcularTaxaVazamento(req, res) {
    try {
      const { dataInicio, dataFim, tipoIncidente } = req.query;

      let whereClause = "WHERE 1=1";
      let whereIncidente = "WHERE tipo = 'VAZAMENTO_DADOS'";
      const valores = [];
      let paramCount = 1;

      // Aplicar filtros de data
      if (dataInicio) {
        whereClause += ` AND data_transacao >= $${paramCount}`;
        whereIncidente += ` AND data_deteccao >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        whereClause += ` AND data_transacao <= $${paramCount}`;
        whereIncidente += ` AND data_deteccao <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Filtrar tipo de incidente específico se fornecido
      if (tipoIncidente) {
        whereIncidente = whereIncidente.replace(
          "tipo = 'VAZAMENTO_DADOS'",
          `tipo = '${tipoIncidente}'`
        );
      }

      // Contar total de transações
      const queryTransacoes = `
        SELECT COUNT(*) as total
        FROM data_transactions
        ${whereClause}
      `;

      const resultTransacoes = await db.query(queryTransacoes, valores);
      const totalTransacoes = parseInt(resultTransacoes.rows[0].total);

      // Contar incidentes de vazamento (apenas não resolvidos ou todos, dependendo do filtro)
      const queryIncidentes = `
        SELECT COUNT(*) as total
        FROM security_incidents
        ${whereIncidente}
      `;

      const resultIncidentes = await db.query(queryIncidentes, valores);
      const totalIncidentes = parseInt(resultIncidentes.rows[0].total);

      // Calcular a taxa
      let taxa = 0;
      let interpretacao = "";

      if (totalIncidentes === 0) {
        taxa = 100;
        interpretacao = "Excelente! Nenhum incidente de vazamento detectado no período.";
      } else if (totalTransacoes === 0) {
        taxa = 0;
        interpretacao = "Não há transações registradas no período para calcular a métrica.";
      } else {
        // Fórmula: (Total transações / Nº incidentes) × 100%
        // Ou inversamente: (1 - (incidentes/transações)) × 100%
        // Vamos usar a proporção de segurança: quanto menor o incidente por transação, melhor
        const proporcaoIncidentes = (totalIncidentes / totalTransacoes) * 100;
        taxa = Math.max(0, 100 - proporcaoIncidentes).toFixed(2);

        if (taxa >= 99) {
          interpretacao = "Excelente! Taxa de proteção muito alta.";
        } else if (taxa >= 95) {
          interpretacao = "Bom! Boa proteção de dados com poucos incidentes.";
        } else if (taxa >= 90) {
          interpretacao = "Aceitável. Atenção: alguns incidentes detectados.";
        } else if (taxa >= 80) {
          interpretacao = "Preocupante. Número significativo de incidentes.";
        } else {
          interpretacao = "Crítico! Alto número de incidentes de vazamento.";
        }
      }

      // Buscar detalhes dos incidentes recentes
      const queryDetalhesIncidentes = `
        SELECT 
          id, tipo, severidade, descricao, quantidade_registros,
          data_deteccao, status, origem
        FROM security_incidents
        ${whereIncidente}
        ORDER BY data_deteccao DESC
        LIMIT 10
      `;

      const resultDetalhes = await db.query(queryDetalhesIncidentes, valores);

      return res.json({
        metrica: "Taxa de Incidentes de Vazamento de Dados",
        formula: "(Total de transações / Nº de incidentes) × 100%",
        periodo: {
          dataInicio: dataInicio || "Início dos registros",
          dataFim: dataFim || "Até agora",
        },
        dados: {
          totalTransacoes,
          totalIncidentes,
          taxaProtecao: parseFloat(taxa),
          proporcaoIncidentes: totalTransacoes > 0 
            ? ((totalIncidentes / totalTransacoes) * 100).toFixed(4) + "%"
            : "0%",
        },
        interpretacao,
        tipo: totalIncidentes === 0 ? "Quantitativa - percentual" : "Quantitativa - percentual",
        incidentesRecentes: resultDetalhes.rows,
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao calcular taxa de vazamento:", error);
      return res.status(500).json({
        error: "Erro ao calcular métrica de vazamento",
        details: error.message,
      });
    }
  }

  /**
   * Listar todos os incidentes de segurança com filtros
   */
  static async listarIncidentes(req, res) {
    try {
      const {
        tipo,
        severidade,
        status,
        dataInicio,
        dataFim,
        page = 1,
        limit = 50,
      } = req.query;

      let query = `
        SELECT 
          id, tipo, severidade, descricao, dados_afetados, quantidade_registros,
          origem, usuario_responsavel, endpoint, ip_address, data_deteccao,
          data_resolucao, status, acao_corretiva, audit_log_id
        FROM security_incidents
        WHERE 1=1
      `;

      const valores = [];
      let paramCount = 1;

      if (tipo) {
        query += ` AND tipo = $${paramCount}`;
        valores.push(tipo);
        paramCount++;
      }

      if (severidade) {
        query += ` AND severidade = $${paramCount}`;
        valores.push(severidade);
        paramCount++;
      }

      if (status) {
        query += ` AND status = $${paramCount}`;
        valores.push(status);
        paramCount++;
      }

      if (dataInicio) {
        query += ` AND data_deteccao >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        query += ` AND data_deteccao <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Contar total
      const countQuery = query.replace(/SELECT[\s\S]+?FROM/i, "SELECT COUNT(*) FROM");
      const countResult = await db.query(countQuery, valores);
      const total = parseInt(countResult.rows[0].count);

      // Adicionar paginação
      query += ` ORDER BY data_deteccao DESC`;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      valores.push(parseInt(limit), offset);

      const result = await db.query(query, valores);

      return res.json({
        incidentes: result.rows,
        paginacao: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao listar incidentes:", error);
      return res.status(500).json({
        error: "Erro ao listar incidentes",
        details: error.message,
      });
    }
  }

  /**
   * Atualizar status de um incidente
   */
  static async atualizarIncidente(req, res) {
    try {
      const { id } = req.params;
      const { status, acaoCorretiva } = req.body;

      const usuario = req.user || {};
      const resolvidoPor = usuario.id || usuario.userId;

      const query = `
        UPDATE security_incidents
        SET 
          status = COALESCE($1, status),
          acao_corretiva = COALESCE($2, acao_corretiva),
          data_resolucao = CASE 
            WHEN $1 IN ('RESOLVIDO', 'FALSO_POSITIVO') THEN CURRENT_TIMESTAMP 
            ELSE data_resolucao 
          END,
          resolvido_por = CASE 
            WHEN $1 IN ('RESOLVIDO', 'FALSO_POSITIVO') THEN $3 
            ELSE resolvido_por 
          END
        WHERE id = $4
        RETURNING *
      `;

      const valores = [status || null, acaoCorretiva || null, resolvidoPor, id];
      const result = await db.query(query, valores);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Incidente não encontrado" });
      }

      return res.json({
        message: "Incidente atualizado com sucesso",
        incidente: result.rows[0],
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao atualizar incidente:", error);
      return res.status(500).json({
        error: "Erro ao atualizar incidente",
        details: error.message,
      });
    }
  }

  /**
   * Obter estatísticas gerais de segurança
   */
  static async obterEstatisticas(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;

      let whereClause = "WHERE 1=1";
      const valores = [];
      let paramCount = 1;

      if (dataInicio) {
        whereClause += ` AND data_deteccao >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        whereClause += ` AND data_deteccao <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Incidentes por tipo
      const queryTipo = `
        SELECT tipo, COUNT(*) as quantidade
        FROM security_incidents ${whereClause}
        GROUP BY tipo
        ORDER BY quantidade DESC
      `;
      const resultTipo = await db.query(queryTipo, valores);

      // Incidentes por severidade
      const querySeveridade = `
        SELECT severidade, COUNT(*) as quantidade
        FROM security_incidents ${whereClause}
        GROUP BY severidade
        ORDER BY 
          CASE severidade
            WHEN 'CRITICA' THEN 1
            WHEN 'ALTA' THEN 2
            WHEN 'MEDIA' THEN 3
            WHEN 'BAIXA' THEN 4
          END
      `;
      const resultSeveridade = await db.query(querySeveridade, valores);

      // Incidentes por status
      const queryStatus = `
        SELECT status, COUNT(*) as quantidade
        FROM security_incidents ${whereClause}
        GROUP BY status
      `;
      const resultStatus = await db.query(queryStatus, valores);

      // Total de registros afetados
      const queryAfetados = `
        SELECT SUM(quantidade_registros) as total_afetados
        FROM security_incidents ${whereClause}
      `;
      const resultAfetados = await db.query(queryAfetados, valores);

      // Tempo médio de resolução
      const queryTempoResolucao = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (data_resolucao - data_deteccao))/3600) as horas_media
        FROM security_incidents
        ${whereClause} AND data_resolucao IS NOT NULL
      `;
      const resultTempo = await db.query(queryTempoResolucao, valores);

      return res.json({
        porTipo: resultTipo.rows,
        porSeveridade: resultSeveridade.rows,
        porStatus: resultStatus.rows,
        totalRegistrosAfetados: parseInt(resultAfetados.rows[0].total_afetados || 0),
        tempoMedioResolucaoHoras: parseFloat(resultTempo.rows[0].horas_media || 0).toFixed(2),
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao obter estatísticas:", error);
      return res.status(500).json({
        error: "Erro ao obter estatísticas de segurança",
        details: error.message,
      });
    }
  }

  /**
   * Detectar possíveis vazamentos a partir dos logs de auditoria
   * Analisa padrões suspeitos nos logs
   */
  static async detectarVazamentos(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;

      let whereClause = "WHERE 1=1";
      const valores = [];
      let paramCount = 1;

      if (dataInicio) {
        whereClause += ` AND data_hora >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        whereClause += ` AND data_hora <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Detectar acessos suspeitos: múltiplas falhas de autenticação
      const queryFalhasAuth = `
        SELECT 
          usuario_email, 
          ip_address,
          COUNT(*) as tentativas_falhas,
          MAX(data_hora) as ultima_tentativa
        FROM audit_logs
        ${whereClause}
          AND categoria = 'AUTENTICACAO'
          AND resultado = 'FALHA'
        GROUP BY usuario_email, ip_address
        HAVING COUNT(*) >= 5
        ORDER BY tentativas_falhas DESC
      `;
      const resultFalhas = await db.query(queryFalhasAuth, valores);

      // Detectar exportações massivas de dados
      const queryExportacoes = `
        SELECT 
          usuario_nome,
          usuario_email,
          COUNT(*) as exportacoes,
          MAX(data_hora) as ultima_exportacao
        FROM audit_logs
        ${whereClause}
          AND acao ILIKE '%EXPORT%'
        GROUP BY usuario_nome, usuario_email
        HAVING COUNT(*) >= 10
        ORDER BY exportacoes DESC
      `;
      const resultExportacoes = await db.query(queryExportacoes, valores);

      // Detectar acessos fora do horário
      const queryForaHorario = `
        SELECT 
          usuario_nome,
          usuario_email,
          COUNT(*) as acessos_noturnos,
          MAX(data_hora) as ultimo_acesso
        FROM audit_logs
        ${whereClause}
          AND EXTRACT(HOUR FROM data_hora) NOT BETWEEN 6 AND 22
        GROUP BY usuario_nome, usuario_email
        HAVING COUNT(*) >= 5
        ORDER BY acessos_noturnos DESC
      `;
      const resultForaHorario = await db.query(queryForaHorario, valores);

      const alertas = [];

      if (resultFalhas.rows.length > 0) {
        alertas.push({
          tipo: "TENTATIVAS_FALHAS_AUTENTICACAO",
          severidade: "ALTA",
          descricao: `${resultFalhas.rows.length} padrões de múltiplas tentativas falhas de autenticação detectados`,
          detalhes: resultFalhas.rows,
        });
      }

      if (resultExportacoes.rows.length > 0) {
        alertas.push({
          tipo: "EXPORTACOES_MASSIVAS",
          severidade: "MEDIA",
          descricao: `${resultExportacoes.rows.length} usuários com exportações massivas de dados`,
          detalhes: resultExportacoes.rows,
        });
      }

      if (resultForaHorario.rows.length > 0) {
        alertas.push({
          tipo: "ACESSOS_FORA_HORARIO",
          severidade: "MEDIA",
          descricao: `${resultForaHorario.rows.length} usuários com acessos frequentes fora do horário comercial`,
          detalhes: resultForaHorario.rows,
        });
      }

      return res.json({
        totalAlertas: alertas.length,
        status: alertas.length > 0 ? "Alertas detectados" : "Nenhum padrão suspeito detectado",
        alertas,
      });
    } catch (error) {
      console.error("[SecurityMetricsController] Erro ao detectar vazamentos:", error);
      return res.status(500).json({
        error: "Erro ao detectar vazamentos",
        details: error.message,
      });
    }
  }
}

export default SecurityMetricsController;
