import os from "os";
import db from "../db.js";

/**
 * Controller para métricas de performance da aplicação
 * Coleta CPU, Memória, Tempo de Resposta e Disponibilidade
 */

// Variáveis para rastreamento de uptime e resposta
let startTime = Date.now();
let requestCount = 0;
let totalResponseTime = 0;
let maxResponseTime = 0;
let minResponseTime = Infinity;

export default {
  /**
   * GET /api/performance-metrics
   * Retorna as métricas atuais de performance
   */
  async obterMetricasAtuals(req, res) {
    try {
      // Calcular CPU e Memória do sistema
      const cpus = os.cpus();
      const cpuCount = cpus.length;

      // Uptime do servidor
      const uptimeSegundos = Math.floor(process.uptime());
      const uptimeHoras = Math.floor(uptimeSegundos / 3600);
      const uptimeMinutos = Math.floor((uptimeSegundos % 3600) / 60);

      // Memória do processo Node.js
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Memória do sistema
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memPercent = (usedMem / totalMem) * 100;

      // Tempo médio de resposta
      const avgResponseTime =
        requestCount > 0 ? totalResponseTime / requestCount : 0;

      // Disponibilidade (100% se uptime > 1 hora, senão proporcional)
      const disponibilidade =
        uptimeSegundos >= 3600 ? 100 : (uptimeSegundos / 3600) * 100;

      // Salvar métrica no banco
      const query = `
        INSERT INTO performance_metrics 
        (cpu_percent, memoria_percent, tempo_resposta_ms, disponibilidade_percent, uptime_segundos, requisicoes_total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const cpuPercent = 50; // Aproximação - em produção usar 'os-utils' para CPU real
      await database.query(query, [
        cpuPercent,
        heapUsedPercent,
        avgResponseTime,
        disponibilidade,
        uptimeSegundos,
        requestCount,
      ]);

      // Resposta
      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        metricas: {
          cpu: {
            percent: cpuPercent,
            cores: cpuCount,
          },
          memoria: {
            process: {
              usado_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
              total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
              percent: heapUsedPercent.toFixed(2),
            },
            sistema: {
              total_mb: Math.round(totalMem / 1024 / 1024),
              usado_mb: Math.round(usedMem / 1024 / 1024),
              livre_mb: Math.round(freeMem / 1024 / 1024),
              percent: memPercent.toFixed(2),
            },
          },
          tempoResposta: {
            media_ms: avgResponseTime.toFixed(2),
            minimo_ms:
              minResponseTime === Infinity ? 0 : minResponseTime.toFixed(2),
            maximo_ms: maxResponseTime.toFixed(2),
            total_requisicoes: requestCount,
          },
          disponibilidade: {
            percent: disponibilidade.toFixed(2),
            uptime: `${uptimeHoras}h ${uptimeMinutos}m`,
            uptime_segundos: uptimeSegundos,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao obter métricas:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao obter métricas", detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-metrics/historico
   * Retorna histórico das últimas N horas
   */
  async obterHistorico(req, res) {
    try {
      const { horas = 24, limite = 100 } = req.query;

      const query = `
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

      const resultado = await database.query(query, [limite]);

      return res.json({
        status: "ok",
        periodo: `${horas} horas`,
        total_registros: resultado.rows.length,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error("Erro ao obter histórico:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao obter histórico", detalhes: error.message });
    }
  },

  /**
   * GET /api/performance-metrics/resumo
   * Retorna resumo estatístico das métricas
   */
  async obterResumo(req, res) {
    try {
      const { horas = 24 } = req.query;

      const query = `
        SELECT 
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
          
          COUNT(*) as total_amostras
        FROM performance_metrics
        WHERE created_at >= NOW() - INTERVAL '${horas} hours'
      `;

      const resultado = await database.query(query);
      const stats = resultado.rows[0];

      return res.json({
        status: "ok",
        periodo: `${horas} horas`,
        estatisticas: {
          cpu: {
            media: parseFloat(stats.cpu_media),
            maxima: parseFloat(stats.cpu_maxima),
            minima: parseFloat(stats.cpu_minima),
          },
          memoria: {
            media: parseFloat(stats.memoria_media),
            maxima: parseFloat(stats.memoria_maxima),
            minima: parseFloat(stats.memoria_minima),
          },
          tempoResposta: {
            media: parseFloat(stats.tempo_resposta_media),
            maximo: parseFloat(stats.tempo_resposta_maximo),
            minimo: parseFloat(stats.tempo_resposta_minimo),
          },
          disponibilidade: {
            media: parseFloat(stats.disponibilidade_media),
          },
          total_amostras: stats.total_amostras,
        },
      });
    } catch (error) {
      console.error("Erro ao obter resumo:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao obter resumo", detalhes: error.message });
    }
  },

  /**
   * Middleware - Registra tempo de resposta de cada requisição
   * Deve ser usado no início do server.js
   */
  middleware: (req, res, next) => {
    const startTime = Date.now();

    // Interceptar o método send original
    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;

      requestCount++;
      totalResponseTime += responseTime;
      maxResponseTime = Math.max(maxResponseTime, responseTime);
      if (responseTime > 0) {
        minResponseTime = Math.min(minResponseTime, responseTime);
      }

      // Chamar o send original
      return originalSend.call(this, data);
    };

    next();
  },

  /**
   * Reset de métricas (útil para testes)
   */
  resetarMetricas() {
    startTime = Date.now();
    requestCount = 0;
    totalResponseTime = 0;
    maxResponseTime = 0;
    minResponseTime = Infinity;
  },

  /**
   * Getter para obter contadores internos
   */
  obterContadores() {
    return {
      requestCount,
      totalResponseTime,
      maxResponseTime,
      minResponseTime,
      avgResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
    };
  },
};
