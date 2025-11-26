import { database } from '../db.js';

/**
 * Controller para Análise de Performance e Histórico
 * Fornece relatórios, análises e integração com auditoria
 */

export const PerformanceAnalyticsController = {
  /**
   * GET /api/performance-analytics/historico-completo
   * Retorna histórico detalhado de métricas com análise
   */
  async obterHistoricoCompleto(req, res) {
    try {
      const { 
        horas = 24,
        limite = 1000,
        tipo = 'metricas' // 'metricas', 'alertas', 'ambos'
      } = req.query;

      let resultado = {};

      // Histórico de métricas
      if (tipo === 'metricas' || tipo === 'ambos') {
        const queryMetricas = `
          SELECT 
            id,
            cpu_percent,
            memoria_percent,
            tempo_resposta_ms,
            disponibilidade_percent,
            uptime_segundos,
            requisicoes_total,
            created_at
          FROM performance_metrics
          WHERE created_at >= NOW() - INTERVAL '${horas} hours'
          ORDER BY created_at DESC
          LIMIT $1
        `;

        const resMetricas = await database.query(queryMetricas, [limite]);
        resultado.metricas = resMetricas.rows;
      }

      // Histórico de alertas
      if (tipo === 'alertas' || tipo === 'ambos') {
        const queryAlertas = `
          SELECT 
            id,
            tipo,
            severidade,
            mensagem,
            recurso,
            valor,
            status,
            created_at,
            atualizado_em
          FROM performance_alerts
          WHERE created_at >= NOW() - INTERVAL '${horas} hours'
          ORDER BY created_at DESC
          LIMIT $1
        `;

        const resAlertas = await database.query(queryAlertas, [limite]);
        resultado.alertas = resAlertas.rows;
      }

      return res.json({
        status: 'ok',
        periodo: `${horas} horas`,
        tipo,
        ...resultado
      });
    } catch (error) {
      console.error('Erro ao obter histórico completo:', error);
      return res.status(500).json({ erro: 'Erro ao obter histórico', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/relatorio-diario
   * Retorna relatório diário de performance
   */
  async obterRelatorioDiario(req, res) {
    try {
      const { data = new Date().toISOString().split('T')[0] } = req.query;

      const query = `
        SELECT 
          DATE(created_at) as data,
          COUNT(*) as total_metricas,
          AVG(cpu_percent)::NUMERIC(5,2) as cpu_media,
          MAX(cpu_percent)::NUMERIC(5,2) as cpu_maxima,
          MIN(cpu_percent)::NUMERIC(5,2) as cpu_minima,
          
          AVG(memoria_percent)::NUMERIC(5,2) as memoria_media,
          MAX(memoria_percent)::NUMERIC(5,2) as memoria_maxima,
          MIN(memoria_percent)::NUMERIC(5,2) as memoria_minima,
          
          AVG(tempo_resposta_ms)::NUMERIC(7,2) as tempo_resposta_media,
          MAX(tempo_resposta_ms)::NUMERIC(7,2) as tempo_resposta_maximo,
          MIN(tempo_resposta_ms)::NUMERIC(7,2) as tempo_resposta_minimo,
          
          AVG(disponibilidade_percent)::NUMERIC(5,2) as disponibilidade_media,
          
          SUM(requisicoes_total) as total_requisicoes
        FROM performance_metrics
        WHERE DATE(created_at) = $1
        GROUP BY DATE(created_at)
      `;

      const resMetricas = await database.query(query, [data]);
      
      // Alertas do dia
      const queryAlertas = `
        SELECT 
          tipo,
          severidade,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'RESOLVIDO' THEN 1 ELSE 0 END) as resolvidos,
          SUM(CASE WHEN status = 'ABERTO' THEN 1 ELSE 0 END) as abertos
        FROM performance_alerts
        WHERE DATE(created_at) = $1
        GROUP BY tipo, severidade
        ORDER BY severidade DESC
      `;

      const resAlertas = await database.query(queryAlertas, [data]);

      // Calcular tempo médio de alerta
      const queryTempoMedioAlerta = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (atualizado_em - created_at))) as tempo_medio_segundos
        FROM performance_alerts
        WHERE DATE(created_at) = $1 AND status = 'RESOLVIDO'
      `;

      const resTempoAlerta = await database.query(queryTempoMedioAlerta, [data]);
      const tempoMedioAlerta = resTempoAlerta.rows[0]?.tempo_medio_segundos;

      return res.json({
        status: 'ok',
        data,
        resumo_metricas: resMetricas.rows[0] || {
          data,
          total_metricas: 0,
          cpu_media: 0,
          memoria_media: 0,
          tempo_resposta_media: 0,
          disponibilidade_media: 0
        },
        alertas_por_tipo: resAlertas.rows,
        tempo_medio_para_alerta_minutos: tempoMedioAlerta ? (tempoMedioAlerta / 60).toFixed(2) : 'N/A'
      });
    } catch (error) {
      console.error('Erro ao obter relatório diário:', error);
      return res.status(500).json({ erro: 'Erro ao obter relatório diário', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/comparativo
   * Compara métricas entre dois períodos
   */
  async obterComparativo(req, res) {
    try {
      const { 
        dataInicio1,
        dataFim1,
        dataInicio2,
        dataFim2
      } = req.query;

      if (!dataInicio1 || !dataFim1 || !dataInicio2 || !dataFim2) {
        return res.status(400).json({ erro: 'Parâmetros obrigatórios: dataInicio1, dataFim1, dataInicio2, dataFim2' });
      }

      const query = `
        SELECT 
          '${dataInicio1} a ${dataFim1}' as periodo,
          AVG(cpu_percent)::NUMERIC(5,2) as cpu_media,
          AVG(memoria_percent)::NUMERIC(5,2) as memoria_media,
          AVG(tempo_resposta_ms)::NUMERIC(7,2) as tempo_resposta_media,
          AVG(disponibilidade_percent)::NUMERIC(5,2) as disponibilidade_media
        FROM performance_metrics
        WHERE created_at >= $1 AND created_at <= $2
        
        UNION ALL
        
        SELECT 
          '${dataInicio2} a ${dataFim2}' as periodo,
          AVG(cpu_percent)::NUMERIC(5,2) as cpu_media,
          AVG(memoria_percent)::NUMERIC(5,2) as memoria_media,
          AVG(tempo_resposta_ms)::NUMERIC(7,2) as tempo_resposta_media,
          AVG(disponibilidade_percent)::NUMERIC(5,2) as disponibilidade_media
        FROM performance_metrics
        WHERE created_at >= $3 AND created_at <= $4
      `;

      const resultado = await database.query(query, [
        dataInicio1,
        dataFim1,
        dataInicio2,
        dataFim2
      ]);

      const dados = resultado.rows;
      let variacao = {};

      if (dados.length === 2) {
        variacao = {
          cpu_variacao_percent: ((dados[1].cpu_media - dados[0].cpu_media) / dados[0].cpu_media * 100).toFixed(2),
          memoria_variacao_percent: ((dados[1].memoria_media - dados[0].memoria_media) / dados[0].memoria_media * 100).toFixed(2),
          tempo_resposta_variacao_percent: ((dados[1].tempo_resposta_media - dados[0].tempo_resposta_media) / dados[0].tempo_resposta_media * 100).toFixed(2),
          disponibilidade_variacao_percent: ((dados[1].disponibilidade_media - dados[0].disponibilidade_media) / dados[0].disponibilidade_media * 100).toFixed(2)
        };
      }

      return res.json({
        status: 'ok',
        comparativo: {
          periodo1: {
            periodo: dados[0]?.periodo,
            metricas: dados[0] || {}
          },
          periodo2: {
            periodo: dados[1]?.periodo,
            metricas: dados[1] || {}
          },
          variacao
        }
      });
    } catch (error) {
      console.error('Erro ao obter comparativo:', error);
      return res.status(500).json({ erro: 'Erro ao obter comparativo', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/audit-acoes-criticas
   * Retorna logs de ações críticas auditadas (usuários, folha, férias)
   */
  async obterAcoesAuditadasCriticas(req, res) {
    try {
      const { 
        horas = 24,
        tipo = 'todos', // 'usuario', 'folha', 'ferias', 'todos'
        page = 1,
        limite = 50
      } = req.query;

      let operacoesCriticas = [
        'CREATE_USUARIO',
        'UPDATE_USUARIO',
        'DELETE_USUARIO',
        'UPDATE_SALARIO',
        'CREATE_FOLHA',
        'UPDATE_FOLHA',
        'DELETE_FOLHA',
        'CREATE_FERIAS',
        'UPDATE_FERIAS',
        'DELETE_FERIAS',
        'APROVAR_FERIAS',
        'REJEITAR_FERIAS'
      ];

      // Filtrar por tipo se especificado
      if (tipo !== 'todos') {
        if (tipo === 'usuario') {
          operacoesCriticas = operacoesCriticas.filter(op => op.includes('USUARIO'));
        } else if (tipo === 'folha') {
          operacoesCriticas = operacoesCriticas.filter(op => op.includes('FOLHA'));
        } else if (tipo === 'ferias') {
          operacoesCriticas = operacoesCriticas.filter(op => op.includes('FERIAS'));
        }
      }

      const placeholders = operacoesCriticas.map((_, i) => `$${i + 1}`).join(',');
      const offset = (page - 1) * limite;

      const query = `
        SELECT 
          id,
          usuario_id,
          tipo_operacao,
          recurso,
          descricao,
          mudancas,
          ip_origem,
          user_agent,
          created_at
        FROM audit_logs
        WHERE tipo_operacao IN (${placeholders})
        AND created_at >= NOW() - INTERVAL '${horas} hours'
        ORDER BY created_at DESC
        LIMIT $${operacoesCriticas.length + 1} OFFSET $${operacoesCriticas.length + 2}
      `;

      const resultado = await database.query(query, [
        ...operacoesCriticas,
        limite,
        offset
      ]);

      // Contar total
      const countQuery = `
        SELECT COUNT(*) FROM audit_logs
        WHERE tipo_operacao IN (${placeholders})
        AND created_at >= NOW() - INTERVAL '${horas} hours'
      `;

      const countResult = await database.query(countQuery, operacoesCriticas);
      const total = parseInt(countResult.rows[0].count);

      return res.json({
        status: 'ok',
        periodo: `${horas} horas`,
        tipo,
        paginacao: {
          page: parseInt(page),
          limite: parseInt(limite),
          total,
          paginas: Math.ceil(total / limite)
        },
        acoes_criticas: resultado.rows
      });
    } catch (error) {
      console.error('Erro ao obter ações auditadas críticas:', error);
      return res.status(500).json({ erro: 'Erro ao obter ações auditadas', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/cobertura-auditoria
   * Retorna métricas de cobertura de auditoria das ações críticas
   */
  async obterCoberturaAuditoria(req, res) {
    try {
      const { horas = 24 } = req.query;

      const query = `
        SELECT 
          'Edição de Usuários' as acao,
          COUNT(*) as total_operacoes,
          SUM(CASE WHEN tipo_operacao IN ('CREATE_USUARIO', 'UPDATE_USUARIO', 'DELETE_USUARIO') THEN 1 ELSE 0 END) as auditadas
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        
        UNION ALL
        
        SELECT 
          'Folha de Pagamento',
          COUNT(*),
          SUM(CASE WHEN tipo_operacao IN ('CREATE_FOLHA', 'UPDATE_FOLHA', 'DELETE_FOLHA') THEN 1 ELSE 0 END)
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        
        UNION ALL
        
        SELECT 
          'Gestão de Férias',
          COUNT(),
          SUM(CASE WHEN tipo_operacao IN ('CREATE_FERIAS', 'UPDATE_FERIAS', 'DELETE_FERIAS', 'APROVAR_FERIAS', 'REJEITAR_FERIAS') THEN 1 ELSE 0 END)
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
      `;

      const resultado = await database.query(query);
      
      const cobertura = resultado.rows.map(row => ({
        acao: row.acao,
        total_operacoes: parseInt(row.total_operacoes),
        operacoes_auditadas: parseInt(row.auditadas),
        taxa_cobertura_percent: row.total_operacoes > 0 
          ? (parseInt(row.auditadas) / parseInt(row.total_operacoes) * 100).toFixed(2)
          : 0
      }));

      // Total
      const totalOps = cobertura.reduce((sum, c) => sum + c.total_operacoes, 0);
      const totalAuditadas = cobertura.reduce((sum, c) => sum + c.operacoes_auditadas, 0);
      const coberturaTotalPercent = totalOps > 0 ? (totalAuditadas / totalOps * 100).toFixed(2) : 0;

      return res.json({
        status: 'ok',
        periodo: `${horas} horas`,
        cobertura_por_acao: cobertura,
        cobertura_total: {
          total_operacoes: totalOps,
          operacoes_auditadas: totalAuditadas,
          taxa_cobertura_percent: parseFloat(coberturaTotalPercent)
        }
      });
    } catch (error) {
      console.error('Erro ao obter cobertura de auditoria:', error);
      return res.status(500).json({ erro: 'Erro ao obter cobertura de auditoria', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/tempo-medio-alerta
   * Calcula tempo médio entre detecção e alerta
   */
  async obterTempoMedioAlerta(req, res) {
    try {
      const { horas = 24 } = req.query;

      const query = `
        SELECT 
          tipo,
          severidade,
          COUNT(*) as total_alertas,
          AVG(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_medio_segundos,
          MIN(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_minimo_segundos,
          MAX(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_maximo_segundos
        FROM performance_alerts
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        AND status = 'RESOLVIDO'
        GROUP BY tipo, severidade
        ORDER BY tempo_medio_segundos DESC
      `;

      const resultado = await database.query(query);

      // Calcular tempo geral
      const queryGeral = `
        SELECT 
          COUNT(*) as total_alertas,
          AVG(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_medio_segundos,
          MIN(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_minimo_segundos,
          MAX(EXTRACT(EPOCH FROM (atualizado_em - created_at)))::NUMERIC(10,2) as tempo_maximo_segundos
        FROM performance_alerts
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        AND status = 'RESOLVIDO'
      `;

      const resGeral = await database.query(queryGeral);

      const alertasPorTipo = resultado.rows.map(row => ({
        tipo: row.tipo,
        severidade: row.severidade,
        total_alertas: parseInt(row.total_alertas),
        tempo_medio_minutos: (parseFloat(row.tempo_medio_segundos) / 60).toFixed(2),
        tempo_minimo_minutos: (parseFloat(row.tempo_minimo_segundos) / 60).toFixed(2),
        tempo_maximo_minutos: (parseFloat(row.tempo_maximo_segundos) / 60).toFixed(2)
      }));

      const geral = resGeral.rows[0];
      const tempoMedioGeral = geral.tempo_medio_segundos 
        ? (parseFloat(geral.tempo_medio_segundos) / 60).toFixed(2)
        : 'N/A';

      return res.json({
        status: 'ok',
        periodo: `${horas} horas`,
        tempo_medio_geral_minutos: tempoMedioGeral,
        tempo_minimo_geral_minutos: geral.tempo_minimo_segundos 
          ? (parseFloat(geral.tempo_minimo_segundos) / 60).toFixed(2)
          : 'N/A',
        tempo_maximo_geral_minutos: geral.tempo_maximo_segundos 
          ? (parseFloat(geral.tempo_maximo_segundos) / 60).toFixed(2)
          : 'N/A',
        total_alertas_resolvidos: parseInt(geral.total_alertas || 0),
        alertas_por_tipo: alertasPorTipo
      });
    } catch (error) {
      console.error('Erro ao obter tempo médio de alerta:', error);
      return res.status(500).json({ erro: 'Erro ao obter tempo médio de alerta', detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-analytics/dashboard
   * Dashboard consolidado com todas as métricas
   */
  async obterDashboard(req, res) {
    try {
      const { horas = 24 } = req.query;

      // Últimas métricas
      const queryMetricas = `
        SELECT * FROM performance_metrics 
        ORDER BY created_at DESC LIMIT 1
      `;
      const resMetricas = await database.query(queryMetricas);

      // Alertas abertos
      const queryAlertas = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN severidade = 'CRITICA' THEN 1 ELSE 0 END) as criticos,
          SUM(CASE WHEN severidade = 'ALTA' THEN 1 ELSE 0 END) as altos
        FROM performance_alerts
        WHERE status = 'ABERTO'
      `;
      const resAlertas = await database.query(queryAlertas);

      // Tempo médio de alerta
      const queryTempoAlerta = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (atualizado_em - created_at))) as tempo_medio
        FROM performance_alerts
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
        AND status = 'RESOLVIDO'
      `;
      const resTempoAlerta = await database.query(queryTempoAlerta);

      // Cobertura de auditoria
      const queryCoberturaUsuarios = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN tipo_operacao IN ('CREATE_USUARIO', 'UPDATE_USUARIO', 'DELETE_USUARIO') THEN 1 ELSE 0 END) as auditadas
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
      `;
      const resCoberturaUsuarios = await database.query(queryCoberturaUsuarios);

      const metricaAtual = resMetricas.rows[0];
      const alertasInfo = resAlertas.rows[0];
      const tempoMedioAlerta = resTempoAlerta.rows[0]?.tempo_medio;
      const cobertura = resCoberturaUsuarios.rows[0];

      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        metricas_atuais: {
          cpu_percent: metricaAtual?.cpu_percent || 0,
          memoria_percent: metricaAtual?.memoria_percent || 0,
          tempo_resposta_ms: metricaAtual?.tempo_resposta_ms || 0,
          disponibilidade_percent: metricaAtual?.disponibilidade_percent || 0
        },
        alertas: {
          abertos: parseInt(alertasInfo?.total || 0),
          criticos: parseInt(alertasInfo?.criticos || 0),
          altos: parseInt(alertasInfo?.altos || 0)
        },
        tempo_medio_alerta_minutos: tempoMedioAlerta ? (tempoMedioAlerta / 60).toFixed(2) : 'N/A',
        cobertura_auditoria: {
          total_operacoes: parseInt(cobertura?.total || 0),
          operacoes_auditadas: parseInt(cobertura?.auditadas || 0),
          percentual: cobertura?.total > 0 ? (parseInt(cobertura?.auditadas) / parseInt(cobertura?.total) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Erro ao obter dashboard:', error);
      return res.status(500).json({ erro: 'Erro ao obter dashboard', detalhes: error.message });
    }
  }
};
