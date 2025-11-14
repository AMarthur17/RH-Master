import db from "../db.js";

/**
 * Controller para gerenciar logs de auditoria e segurança
 * Implementa a US-E6-02 - Auditoria e Logs de Segurança
 */
class AuditController {
  /**
   * Registrar uma ação de auditoria
   * @param {Object} dados - Dados da ação a ser auditada
   */
  static async registrarLog(dados) {
    const {
      usuarioId,
      usuarioNome,
      usuarioEmail,
      acao,
      categoria,
      descricao,
      endpoint,
      metodo,
      ipAddress,
      userAgent,
      resultado = "SUCESSO",
      dadosAnteriores = null,
      dadosNovos = null,
      metadata = null,
      nivelCriticidade = "BAIXO",
    } = dados;

    try {
      const query = `
        INSERT INTO audit_logs (
          usuario_id, usuario_nome, usuario_email, acao, categoria, descricao,
          endpoint, metodo, ip_address, user_agent, resultado,
          dados_anteriores, dados_novos, metadata, nivel_criticidade
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const valores = [
        usuarioId || null,
        usuarioNome || null,
        usuarioEmail || null,
        acao,
        categoria,
        descricao || null,
        endpoint || null,
        metodo || null,
        ipAddress || null,
        userAgent || null,
        resultado,
        dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
        dadosNovos ? JSON.stringify(dadosNovos) : null,
        metadata ? JSON.stringify(metadata) : null,
        nivelCriticidade,
      ];

      const resultado_query = await db.query(query, valores);
      return resultado_query.rows[0];
    } catch (error) {
      console.error("[AuditController] Erro ao registrar log:", error);
      // Não propagar erro para não interromper a operação principal
      return null;
    }
  }

  /**
   * Consultar logs de auditoria com filtros avançados
   */
  static async consultarLogs(req, res) {
    try {
      const {
        usuarioId,
        acao,
        categoria,
        resultado,
        nivelCriticidade,
        dataInicio,
        dataFim,
        busca,
        page = 1,
        limit = 50,
        orderBy = "data_hora",
        orderDir = "DESC",
      } = req.query;

      // Construir query dinâmica com filtros
      let query = `
        SELECT 
          id, usuario_id, usuario_nome, usuario_email, acao, categoria,
          descricao, endpoint, metodo, ip_address, resultado,
          dados_anteriores, dados_novos, metadata, nivel_criticidade,
          data_hora, hash_integridade
        FROM audit_logs
        WHERE 1=1
      `;

      const valores = [];
      let paramCount = 1;

      // Aplicar filtros
      if (usuarioId) {
        query += ` AND usuario_id = $${paramCount}`;
        valores.push(parseInt(usuarioId));
        paramCount++;
      }

      if (acao) {
        query += ` AND acao = $${paramCount}`;
        valores.push(acao);
        paramCount++;
      }

      if (categoria) {
        query += ` AND categoria = $${paramCount}`;
        valores.push(categoria);
        paramCount++;
      }

      if (resultado) {
        query += ` AND resultado = $${paramCount}`;
        valores.push(resultado);
        paramCount++;
      }

      if (nivelCriticidade) {
        query += ` AND nivel_criticidade = $${paramCount}`;
        valores.push(nivelCriticidade);
        paramCount++;
      }

      if (dataInicio) {
        query += ` AND data_hora >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        query += ` AND data_hora <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Busca textual em múltiplos campos
      if (busca) {
        query += ` AND (
          usuario_nome ILIKE $${paramCount} OR
          usuario_email ILIKE $${paramCount} OR
          descricao ILIKE $${paramCount} OR
          endpoint ILIKE $${paramCount}
        )`;
        valores.push(`%${busca}%`);
        paramCount++;
      }

      // Contar total de registros
      const countQuery = query.replace(
        /SELECT[\s\S]+?FROM/i,
        "SELECT COUNT(*) FROM"
      );
      const countResult = await db.query(countQuery, valores);
      const total = parseInt(countResult.rows[0].count);

      // Adicionar ordenação e paginação
      const validOrderBy = [
        "data_hora",
        "acao",
        "categoria",
        "nivel_criticidade",
        "usuario_nome",
      ].includes(orderBy)
        ? orderBy
        : "data_hora";
      const validOrderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

      query += ` ORDER BY ${validOrderBy} ${validOrderDir}`;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      valores.push(parseInt(limit), offset);

      const result = await db.query(query, valores);

      return res.json({
        logs: result.rows,
        paginacao: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("[AuditController] Erro ao consultar logs:", error);
      return res.status(500).json({
        error: "Erro ao consultar logs de auditoria",
        details: error.message,
      });
    }
  }

  /**
   * Obter estatísticas de auditoria
   */
  static async obterEstatisticas(req, res) {
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

      // Total de logs
      const totalQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
      const totalResult = await db.query(totalQuery, valores);

      // Logs por categoria
      const categoriaQuery = `
        SELECT categoria, COUNT(*) as quantidade
        FROM audit_logs ${whereClause}
        GROUP BY categoria
        ORDER BY quantidade DESC
      `;
      const categoriaResult = await db.query(categoriaQuery, valores);

      // Logs por ação (top 10)
      const acaoQuery = `
        SELECT acao, COUNT(*) as quantidade
        FROM audit_logs ${whereClause}
        GROUP BY acao
        ORDER BY quantidade DESC
        LIMIT 10
      `;
      const acaoResult = await db.query(acaoQuery, valores);

      // Logs por resultado
      const resultadoQuery = `
        SELECT resultado, COUNT(*) as quantidade
        FROM audit_logs ${whereClause}
        GROUP BY resultado
      `;
      const resultadoResult = await db.query(resultadoQuery, valores);

      // Logs por nível de criticidade
      const criticidadeQuery = `
        SELECT nivel_criticidade, COUNT(*) as quantidade
        FROM audit_logs ${whereClause}
        GROUP BY nivel_criticidade
        ORDER BY 
          CASE nivel_criticidade
            WHEN 'CRITICO' THEN 1
            WHEN 'ALTO' THEN 2
            WHEN 'MEDIO' THEN 3
            WHEN 'BAIXO' THEN 4
          END
      `;
      const criticidadeResult = await db.query(criticidadeQuery, valores);

      // Usuários mais ativos
      const usuariosQuery = `
        SELECT usuario_nome, usuario_email, COUNT(*) as quantidade
        FROM audit_logs
        ${whereClause} AND usuario_nome IS NOT NULL
        GROUP BY usuario_nome, usuario_email
        ORDER BY quantidade DESC
        LIMIT 10
      `;
      const usuariosResult = await db.query(usuariosQuery, valores);

      // Atividade por dia (últimos 30 dias ou período especificado)
      const atividadeQuery = `
        SELECT DATE(data_hora) as data, COUNT(*) as quantidade
        FROM audit_logs ${whereClause}
        GROUP BY DATE(data_hora)
        ORDER BY data DESC
        LIMIT 30
      `;
      const atividadeResult = await db.query(atividadeQuery, valores);

      return res.json({
        total: parseInt(totalResult.rows[0].total),
        porCategoria: categoriaResult.rows,
        porAcao: acaoResult.rows,
        porResultado: resultadoResult.rows,
        porCriticidade: criticidadeResult.rows,
        usuariosMaisAtivos: usuariosResult.rows,
        atividadePorDia: atividadeResult.rows,
      });
    } catch (error) {
      console.error("[AuditController] Erro ao obter estatísticas:", error);
      return res.status(500).json({
        error: "Erro ao obter estatísticas de auditoria",
        details: error.message,
      });
    }
  }

  /**
   * Obter detalhes de um log específico
   */
  static async obterLogPorId(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id, usuario_id, usuario_nome, usuario_email, acao, categoria,
          descricao, endpoint, metodo, ip_address, user_agent, resultado,
          dados_anteriores, dados_novos, metadata, nivel_criticidade,
          data_hora, hash_integridade
        FROM audit_logs
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Log não encontrado" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error("[AuditController] Erro ao obter log:", error);
      return res.status(500).json({
        error: "Erro ao obter log de auditoria",
        details: error.message,
      });
    }
  }

  /**
   * Verificar integridade de um log
   * Recalcula o hash e compara com o armazenado
   */
  static async verificarIntegridade(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id, usuario_id, acao, categoria, descricao, data_hora,
          dados_anteriores, dados_novos, hash_integridade
        FROM audit_logs
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Log não encontrado" });
      }

      const log = result.rows[0];

      // Recalcular hash
      const hashQuery = `
        SELECT encode(
          digest(
            COALESCE($1::text, '') || '|' ||
            COALESCE($2, '') || '|' ||
            COALESCE($3, '') || '|' ||
            COALESCE($4, '') || '|' ||
            COALESCE($5::text, '') || '|' ||
            COALESCE($6::text, '') || '|' ||
            COALESCE($7::text, ''),
            'sha256'
          ),
          'hex'
        ) as hash_calculado
      `;

      const hashResult = await db.query(hashQuery, [
        log.usuario_id,
        log.acao,
        log.categoria,
        log.descricao,
        log.data_hora,
        log.dados_anteriores,
        log.dados_novos,
      ]);

      const hashCalculado = hashResult.rows[0].hash_calculado;
      const integro = hashCalculado === log.hash_integridade;

      return res.json({
        id: log.id,
        integro,
        hashArmazenado: log.hash_integridade,
        hashCalculado,
        mensagem: integro
          ? "Log íntegro - não foi modificado"
          : "ALERTA: Log pode ter sido comprometido!",
      });
    } catch (error) {
      console.error("[AuditController] Erro ao verificar integridade:", error);
      return res.status(500).json({
        error: "Erro ao verificar integridade do log",
        details: error.message,
      });
    }
  }

  /**
   * Exportar logs para auditoria externa
   */
  static async exportarLogs(req, res) {
    try {
      const { formato = "json", ...filtros } = req.query;

      // Reutilizar lógica de consulta
      const reqConsulta = { query: { ...filtros, limit: 10000 } };
      const resConsulta = {
        json: (data) => data,
      };

      const dados = await new Promise((resolve) => {
        const originalJson = res.json;
        res.json = resolve;
        AuditController.consultarLogs(reqConsulta, res);
        res.json = originalJson;
      });

      if (formato === "csv") {
        // Exportar como CSV
        const logs = dados.logs || [];
        let csv = "ID,Usuario,Email,Acao,Categoria,Descricao,Data/Hora,Resultado,Criticidade\n";

        logs.forEach((log) => {
          csv += `${log.id},"${log.usuario_nome || ""}","${log.usuario_email || ""}","${log.acao}","${log.categoria}","${(log.descricao || "").replace(/"/g, '""')}","${log.data_hora}","${log.resultado}","${log.nivel_criticidade}"\n`;
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${Date.now()}.csv"`);
        return res.send(csv);
      }

      // JSON por padrão
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${Date.now()}.json"`);
      return res.json(dados);
    } catch (error) {
      console.error("[AuditController] Erro ao exportar logs:", error);
      return res.status(500).json({
        error: "Erro ao exportar logs",
        details: error.message,
      });
    }
  }
}

export default AuditController;
