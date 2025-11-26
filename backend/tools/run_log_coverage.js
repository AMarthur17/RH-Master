import SecurityMetricsController from '../src/controllers/SecurityMetricsController.js';

async function run() {
  const req = { query: {} };
  // opções: from, to, categoria, nivelCriticidade
  const res = {
    jsonPayload: null,
    status(code) { this._status = code; return this; },
    json(obj) { this.jsonPayload = obj; console.log(JSON.stringify(obj, null, 2)); return obj; }
  };

  try {
    // chama o controller diretamente (não passa por autenticação HTTP)
    await SecurityMetricsController.calcularCoberturaLogs(req, res);
  } catch (err) {
    console.error('Erro ao executar calcularCoberturaLogs:', err);
    process.exit(1);
  }
}

run();
