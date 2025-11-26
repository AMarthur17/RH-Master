import cron from 'node-cron';
import PerformanceAlertsController from '../controllers/PerformanceAlertsController.js';
import PerformanceMetricsController from '../controllers/PerformanceMetricsController.js';

/**
 * Serviço de monitoramento automático de performance
 * Verifica métricas a cada minuto e dispara alertas se necessário
 */

let cronJob = null;
let isRunning = false;

export default {
  /**
   * Inicia o monitoramento automático
   * Executa verificação a cada 1 minuto
   */
  iniciar() {
    if (isRunning) {
      console.log('⚠️ Monitoramento de performance já está ativo');
      return;
    }

    // Agendar para executar a cada minuto
    cronJob = cron.schedule('*/1 * * * *', async () => {
      try {
        await this.verificarEDispararAlertas();
      } catch (error) {
        console.error('❌ Erro no monitoramento de performance:', error);
      }
    });

    isRunning = true;
    console.log('✅ Monitoramento de performance iniciado (verificação a cada minuto)');
  },

  /**
   * Para o monitoramento automático
   */
  parar() {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
      isRunning = false;
      console.log('⛔ Monitoramento de performance parado');
    }
  },

  /**
   * Verifica métricas e dispara alertas
   */
  async verificarEDispararAlertas() {
    try {
      const contadores = PerformanceMetricsController.obterContadores();
      const THRESHOLDS = PerformanceAlertsController.obterThresholds();

      // Verificar tempo de resposta
      const avgResponseTime = contadores.avgResponseTime || 0;
      if (avgResponseTime > THRESHOLDS.tempoResposta) {
        await PerformanceAlertsController.salvarAlerta(
          'TEMPO_RESPOSTA_ELEVADO',
          'MEDIA',
          `Tempo de resposta elevado: ${avgResponseTime.toFixed(2)}ms > ${THRESHOLDS.tempoResposta}ms`,
          'TEMPO_RESPOSTA',
          avgResponseTime
        );
      }

      // Log de monitoramento (silencioso)
      console.log(`[MONITOR] Verificação realizada - Req: ${contadores.requestCount}, AvgResponse: ${avgResponseTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Erro ao verificar e disparar alertas:', error);
    }
  },

  /**
   * Verifica se está rodando
   */
  estaAtivo() {
    return isRunning;
  }
};
