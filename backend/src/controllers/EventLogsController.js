import db from "../db.js";

/**
 * Controller para gerenciar event logs (observabilidade do sistema)
 * Implementa a RNF-03 - Observabilidade do Sistema
 * 
 * Responsabilidades:
 * - Registrar eventos críticos (usuários, folha, férias)
 * - Manter imutabilidade dos logs
 * - Fornecer filtros por data, tipo e criticidade
 * - Gerar alertas para eventos críticos
 */
class EventLogsController {
  /**
   * Registrar um evento no sistema
   * @param {Object} dados - Dados do evento
   */
  static async registrarEvento(dados) {
    const {
      tipoEvento,
      usuarioId,
      usuarioNome,
      usuarioEmail,
      enderecoIp,
      userAgent,
      detalhes = {},
      nivelCriticidade = "NORMAL",
      metadata = {},
    } = dados;

    try {
      const query = `
        INSERT INTO event_logs (
          tipo_evento, usuario_id, usuario_nome, usuario_email,
          endereco_ip, user_agent, detalhes, nivel_criticidade, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const valores = [
        tipoEvento,
        usuarioId || null,
        usuarioNome || null,
        usuarioEmail || null,
        enderecoIp || null,
        userAgent || null,
        JSON.stringify(detalhes),
        nivelCriticidade,
        JSON.stringify(metadata),
      ];

      const resultado = await db.query(query, valores);
      const evento = resultado.rows[0];

      // Se o evento é crítico, disparar alerta
      if (nivelCriticidade === "CRITICO") {
        await EventLogsController.dispararAlertaCritico(evento);
      }

      return evento;
    } catch (error) {
      console.error("[EventLogsController] Erro ao registrar evento:", error);
      return null;
    }
  }

  /**
   * Disparar alerta para eventos críticos
   */
  static async dispararAlertaCritico(evento) {
    try {
      // Registrar em performance_alerts com flag de evento crítico
      const alertQuery = `
        INSERT INTO performance_alerts (
          tipo, severidade, mensagem, recurso, valor, usuario_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const valores = [
        "EVENTO_CRITICO",
        "CRITICA",
        `Evento crítico detectado: ${evento.tipo_evento}`,
        "EVENT_LOG",
        evento.id,
        evento.usuario_id,
        "ABERTO",
      ];

      await db.query(alertQuery, valores);

      // Também registrar em audit_logs para rastreamento
      const auditQuery = `
        INSERT INTO audit_logs (
          usuario_id, usuario_nome, usuario_email, acao, categoria, descricao,
          resultado, nivel_criticidade, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await db.query(auditQuery, [
        evento.usuario_id,
        evento.usuario_nome,
        evento.usuario_email,
        "EVENTO_CRITICO_DETECTADO",
        "SEGURANCA",
        `Evento crítico: ${evento.tipo_evento}`,
        "SUCESSO",
        "CRITICO",
        JSON.stringify({
          event_log_id: evento.id,
          tipo_evento: evento.tipo_evento,
        }),
      ]);
    } catch (error) {
      console.error("[EventLogsController] Erro ao disparar alerta crítico:", error);
    }
  }

  /**
   * Listar eventos com filtros avançados
   */
  static async listarEventos(req, res) {
    try {
      const {
        tipoEvento,
        nivelCriticidade,
        usuarioId,
        dataInicio,
        dataFim,
        status,
        busca,
        page = 1,
        limit = 50,
        orderBy = "timestamp",
        orderDir = "DESC",
      } = req.query;

      // Construir query dinâmica
      let query = `
        SELECT 
          id, tipo_evento, usuario_id, usuario_nome, usuario_email,
          endereco_ip, timestamp, detalhes, status, nivel_criticidade,
          hash_integridade, metadata
        FROM event_logs
        WHERE 1=1
      `;

      const valores = [];
      let paramCount = 1;

      // Aplicar filtros
      if (tipoEvento) {
        query += ` AND tipo_evento = $${paramCount}`;
        valores.push(tipoEvento);
        paramCount++;
      }

      if (nivelCriticidade) {
        query += ` AND nivel_criticidade = $${paramCount}`;
        valores.push(nivelCriticidade);
        paramCount++;
      }

      if (usuarioId) {
        query += ` AND usuario_id = $${paramCount}`;
        valores.push(parseInt(usuarioId));
        paramCount++;
      }

      if (dataInicio) {
        query += ` AND timestamp >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        query += ` AND timestamp <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      if (status) {
        query += ` AND status = $${paramCount}`;
        valores.push(status);
        paramCount++;
      }

      // Busca textual
      if (busca) {
        query += ` AND (
          usuario_nome ILIKE $${paramCount} OR
          usuario_email ILIKE $${paramCount} OR
          tipo_evento ILIKE $${paramCount}
        )`;
        valores.push(`%${busca}%`);
        paramCount++;
      }

      // Contar total
      const countQuery = query.replace(
        /SELECT[\s\S]+?FROM/i,
        "SELECT COUNT(*) FROM"
      );
      const countResult = await db.query(countQuery, valores);
      const total = parseInt(countResult.rows[0].count);

      // Adicionar ordenação
      const validOrderBy = [
        "timestamp",
        "tipo_evento",
        "nivel_criticidade",
        "usuario_nome",
      ].includes(orderBy)
        ? orderBy
        : "timestamp";
      const validOrderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

      query += ` ORDER BY ${validOrderBy} ${validOrderDir}`;

      // Paginação
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      valores.push(parseInt(limit), offset);

      const result = await db.query(query, valores);

      return res.json({
        eventos: result.rows,
        paginacao: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("[EventLogsController] Erro ao listar eventos:", error);
      return res.status(500).json({
        error: "Erro ao listar eventos",
        details: error.message,
      });
    }
  }

  /**
   * Obter evento por ID
   */
  static async obterEventoPorId(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id, tipo_evento, usuario_id, usuario_nome, usuario_email,
          endereco_ip, user_agent, timestamp, detalhes, status,
          nivel_criticidade, hash_integridade, metadata
        FROM event_logs
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error("[EventLogsController] Erro ao obter evento:", error);
      return res.status(500).json({
        error: "Erro ao obter evento",
        details: error.message,
      });
    }
  }

  /**
   * Obter estatísticas de eventos
   */
  static async obterEstatisticas(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;

      let whereClause = "WHERE 1=1";
      const valores = [];
      let paramCount = 1;

      if (dataInicio) {
        whereClause += ` AND timestamp >= $${paramCount}`;
        valores.push(dataInicio);
        paramCount++;
      }

      if (dataFim) {
        whereClause += ` AND timestamp <= $${paramCount}`;
        valores.push(dataFim);
        paramCount++;
      }

      // Total de eventos
      const totalQuery = `SELECT COUNT(*) as total FROM event_logs ${whereClause}`;
      const totalResult = await db.query(totalQuery, valores);

      // Eventos por tipo
      const tipoQuery = `
        SELECT tipo_evento, COUNT(*) as quantidade
        FROM event_logs ${whereClause}
        GROUP BY tipo_evento
        ORDER BY quantidade DESC
      `;
      const tipoResult = await db.query(tipoQuery, valores);

      // Eventos por criticidade
      const criticidadeQuery = `
        SELECT nivel_criticidade, COUNT(*) as quantidade
        FROM event_logs ${whereClause}
        GROUP BY nivel_criticidade
        ORDER BY 
          CASE nivel_criticidade
            WHEN 'CRITICO' THEN 1
            WHEN 'IMPORTANTE' THEN 2
            WHEN 'NORMAL' THEN 3
          END
      `;
      const criticidadeResult = await db.query(criticidadeQuery, valores);

      // Eventos por status
      const statusQuery = `
        SELECT status, COUNT(*) as quantidade
        FROM event_logs ${whereClause}
        GROUP BY status
      `;
      const statusResult = await db.query(statusQuery, valores);

      // Usuários mais ativos
      const usuariosQuery = `
        SELECT usuario_nome, usuario_email, COUNT(*) as quantidade
        FROM event_logs
        ${whereClause} AND usuario_nome IS NOT NULL
        GROUP BY usuario_nome, usuario_email
        ORDER BY quantidade DESC
        LIMIT 10
      `;
      const usuariosResult = await db.query(usuariosQuery, valores);

      // Eventos críticos (últimos 24h por padrão)
      const criticosQuery = `
        SELECT id, tipo_evento, usuario_nome, timestamp
        FROM event_logs
        WHERE nivel_criticidade = 'CRITICO' ${dataInicio ? 'AND timestamp >= $1' : ''}
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      const criticosValues = dataInicio ? [dataInicio] : [];
      const criticosResult = await db.query(criticosQuery, criticosValues);

      return res.json({
        total: parseInt(totalResult.rows[0].total),
        porTipo: tipoResult.rows,
        porCriticidade: criticidadeResult.rows,
        porStatus: statusResult.rows,
        usuariosMaisAtivos: usuariosResult.rows,
        eventosCriticos: criticosResult.rows,
      });
    } catch (error) {
      console.error("[EventLogsController] Erro ao obter estatísticas:", error);
      return res.status(500).json({
        error: "Erro ao obter estatísticas de eventos",
        details: error.message,
      });
    }
  }

  /**
   * Verificar integridade de um evento
   */
  static async verificarIntegridade(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id, usuario_id, tipo_evento, timestamp,
          detalhes, nivel_criticidade, hash_integridade
        FROM event_logs
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      const evento = result.rows[0];

      // Recalcular hash
      const hashQuery = `
        SELECT encode(
          digest(
            COALESCE($1::text, '') || '|' ||
            COALESCE($2, '') || '|' ||
            COALESCE($3::text, '') || '|' ||
            COALESCE($4::text, '') || '|' ||
            COALESCE($5, ''),
            'sha256'
          ),
          'hex'
        ) as hash_calculado
      `;

      const hashResult = await db.query(hashQuery, [
        evento.usuario_id,
        evento.tipo_evento,
        evento.timestamp,
        evento.detalhes,
        evento.nivel_criticidade,
      ]);

      const hashCalculado = hashResult.rows[0].hash_calculado;
      const integro = hashCalculado === evento.hash_integridade;

      return res.json({
        id: evento.id,
        integro,
        hashArmazenado: evento.hash_integridade,
        hashCalculado,
        mensagem: integro
          ? "Evento íntegro - não foi modificado"
          : "ALERTA: Evento pode ter sido comprometido!",
      });
    } catch (error) {
      console.error("[EventLogsController] Erro ao verificar integridade:", error);
      return res.status(500).json({
        error: "Erro ao verificar integridade do evento",
        details: error.message,
      });
    }
  }

  /**
   * Obter eventos críticos recentes
   */
  static async obterEventosCriticos(req, res) {
    try {
      const { horas = 24, limit = 20 } = req.query;

      const query = `
        SELECT 
          id, tipo_evento, usuario_id, usuario_nome, usuario_email,
          endereco_ip, timestamp, detalhes, status, nivel_criticidade
        FROM event_logs
        WHERE nivel_criticidade = 'CRITICO'
        AND timestamp >= NOW() - INTERVAL '${parseInt(horas)} hours'
        ORDER BY timestamp DESC
        LIMIT $1
      `;

      const result = await db.query(query, [parseInt(limit)]);

      return res.json({
        eventosCriticos: result.rows,
        periodo: {
          horas: parseInt(horas),
          desde: new Date(Date.now() - parseInt(horas) * 3600000).toISOString(),
          ate: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[EventLogsController] Erro ao obter eventos críticos:", error);
      return res.status(500).json({
        error: "Erro ao obter eventos críticos",
        details: error.message,
      });
    }
  }

  /**
   * Exportar eventos para auditoria
   */
  static async exportarEventos(req, res) {
    try {
      const { formato = "json", ...filtros } = req.query;

      let query = `
        SELECT 
          id, tipo_evento, usuario_nome, usuario_email, endereco_ip,
          timestamp, nivel_criticidade, status, detalhes
        FROM event_logs
        WHERE 1=1
      `;

      const valores = [];
      let paramCount = 1;

      if (filtros.tipoEvento) {
        query += ` AND tipo_evento = $${paramCount}`;
        valores.push(filtros.tipoEvento);
        paramCount++;
      }

      if (filtros.nivelCriticidade) {
        query += ` AND nivel_criticidade = $${paramCount}`;
        valores.push(filtros.nivelCriticidade);
        paramCount++;
      }

      if (filtros.dataInicio) {
        query += ` AND timestamp >= $${paramCount}`;
        valores.push(filtros.dataInicio);
        paramCount++;
      }

      if (filtros.dataFim) {
        query += ` AND timestamp <= $${paramCount}`;
        valores.push(filtros.dataFim);
        paramCount++;
      }

      query += ` ORDER BY timestamp DESC LIMIT 10000`;

      const result = await db.query(query, valores);
      const eventos = result.rows;

      if (formato === "csv") {
        let csv =
          "ID,Tipo,Usuario,Email,IP,Timestamp,Criticidade,Status\n";
        eventos.forEach((evt) => {
          csv += `${evt.id},"${evt.tipo_evento}","${evt.usuario_nome || ""}","${evt.usuario_email || ""}","${evt.endereco_ip || ""}","${evt.timestamp}","${evt.nivel_criticidade}","${evt.status}"\n`;
        });

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="event_logs_${Date.now()}.csv"`
        );
        return res.send(csv);
      }

      // JSON por padrão
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="event_logs_${Date.now()}.json"`
      );
      return res.json({ eventos });
    } catch (error) {
      console.error("[EventLogsController] Erro ao exportar eventos:", error);
      return res.status(500).json({
        error: "Erro ao exportar eventos",
        details: error.message,
      });
    }
  }
}

export default EventLogsController;
