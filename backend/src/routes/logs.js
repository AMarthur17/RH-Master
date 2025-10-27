import express from 'express';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const router = express.Router();

const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

async function ensureLogsDir() {
  try {
    await fsPromises.mkdir(logsDir, { recursive: true });
  } catch (e) {
    console.error('Erro ao criar pasta de logs', e);
  }
}

// POST /logs/performance
router.post('/performance', async (req, res) => {
  try {
    const { tela, acao, tempoRespostaMs, usuario, timestamp, tipoRelatorio } = req.body || {};

    if (!tela || !acao || typeof tempoRespostaMs !== 'number') {
      return res.status(400).json({ error: 'Payload inválido. Campos obrigatórios: tela, acao, tempoRespostaMs (number).' });
    }

    await ensureLogsDir();

    const log = {
      tela,
      acao,
      tipoRelatorio: tipoRelatorio || null,
      tempoRespostaMs,
      usuario: usuario || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    const line = JSON.stringify(log) + '\n';
    const perfPath = path.join(logsDir, 'performance.log');
    await fsPromises.appendFile(perfPath, line, { encoding: 'utf8' });

    // Gera alerta simples se tempo ultrapassar 2000ms
    const ALERT_THRESHOLD = Number(process.env.PERF_ALERT_THRESHOLD_MS) || 2000;
    if (tempoRespostaMs > ALERT_THRESHOLD) {
      const alert = { ...log, alert: 'TEMPO_ALTO', threshold: ALERT_THRESHOLD };
      const alertLine = JSON.stringify(alert) + '\n';
      const alertsPath = path.join(logsDir, 'alerts.log');
      await fsPromises.appendFile(alertsPath, alertLine, { encoding: 'utf8' });
      console.warn('ALERTA DE PERFORMANCE:', alert);
      // Aqui podemos integrar e-mail/Slack/Teams no futuro
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao salvar log de performance', err);
    return res.status(500).json({ error: 'Erro interno ao salvar log' });
  }
});

// GET /logs/performance/metrics
// Optional query params: tela, acao, from (ISO), to (ISO)
router.get('/performance/metrics', async (req, res) => {
  try {
    await ensureLogsDir();
    const perfPath = path.join(logsDir, 'performance.log');
    const exists = fs.existsSync(perfPath);
    if (!exists) return res.json({ count: 0, data: [] });

    const raw = await fsPromises.readFile(perfPath, { encoding: 'utf8' });
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const items = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        items.push(obj);
      } catch (e) {
        // ignore malformed lines
      }
    }

    const { tela, acao, from, to } = req.query;
    let filtered = items;
    if (tela) filtered = filtered.filter(i => i.tela === tela);
    if (acao) filtered = filtered.filter(i => i.acao === acao);
    if (from) {
      const fromD = new Date(from);
      if (!isNaN(fromD)) filtered = filtered.filter(i => new Date(i.timestamp) >= fromD);
    }
    if (to) {
      const toD = new Date(to);
      if (!isNaN(toD)) filtered = filtered.filter(i => new Date(i.timestamp) <= toD);
    }

    const tempos = filtered.map(f => Number(f.tempoRespostaMs)).filter(n => !isNaN(n));
    tempos.sort((a,b) => a-b);
    const count = tempos.length;
    if (count === 0) return res.json({ count: 0, avg: 0, min: 0, max: 0, percentiles: {}, percentBelowThreshold: 0 });

    const sum = tempos.reduce((s,v)=>s+v,0);
    const avg = sum / count;
    const min = tempos[0];
    const max = tempos[tempos.length - 1];

    function percentile(arr, p) {
      if (arr.length === 0) return 0;
      const idx = Math.ceil((p/100) * arr.length) - 1;
      return arr[Math.max(0, Math.min(idx, arr.length-1))];
    }

    const percentiles = {
      p50: percentile(tempos, 50),
      p75: percentile(tempos, 75),
      p90: percentile(tempos, 90),
      p95: percentile(tempos, 95),
      p99: percentile(tempos, 99),
    };

    const ALERT_THRESHOLD = Number(process.env.PERF_ALERT_THRESHOLD_MS) || 2000;
    const percentBelowThreshold = (tempos.filter(t => t <= ALERT_THRESHOLD).length / count) * 100;

    return res.json({
      count,
      avg,
      min,
      max,
      percentiles,
      percentBelowThreshold
    });
  } catch (err) {
    console.error('Erro ao calcular métricas de performance', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /logs/performance/health
// Returns whether p95 is <= threshold (default 2000ms). Optional query: tela, acao
router.get('/performance/health', async (req, res) => {
  try {
    const metricsReq = { query: req.query };
    // reuse logic by reading file similarly
    await ensureLogsDir();
    const perfPath = path.join(logsDir, 'performance.log');
    const exists = fs.existsSync(perfPath);
    if (!exists) return res.json({ ok: true, reason: 'no_data' });

    const raw = await fsPromises.readFile(perfPath, { encoding: 'utf8' });
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const items = [];
    for (const line of lines) {
      try { items.push(JSON.parse(line)); } catch (e) {}
    }

    let filtered = items;
    const { tela, acao } = req.query;
    if (tela) filtered = filtered.filter(i => i.tela === tela);
    if (acao) filtered = filtered.filter(i => i.acao === acao);

    const tempos = filtered.map(f => Number(f.tempoRespostaMs)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
    if (tempos.length === 0) return res.json({ ok: true, reason: 'no_data' });

    function percentile(arr, p) { const idx = Math.ceil((p/100) * arr.length) - 1; return arr[Math.max(0, Math.min(idx, arr.length-1))]; }
    const p95 = percentile(tempos, 95);
    const ALERT_THRESHOLD = Number(process.env.PERF_ALERT_THRESHOLD_MS) || 2000;
    const ok = p95 <= ALERT_THRESHOLD;

    if (!ok) {
      // record health alert
      const alertObj = { timestamp: new Date().toISOString(), p95, threshold: ALERT_THRESHOLD, tela: tela || null, acao: acao || null };
      const alertsPath = path.join(logsDir, 'health_alerts.log');
      await fsPromises.appendFile(alertsPath, JSON.stringify(alertObj) + '\n', { encoding: 'utf8' });
      console.error('HEALTH ALERT: p95 above threshold', alertObj);
    }

    return res.json({ ok, p95, threshold: ALERT_THRESHOLD, sampleCount: tempos.length });
  } catch (err) {
    console.error('Erro ao calcular health', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
