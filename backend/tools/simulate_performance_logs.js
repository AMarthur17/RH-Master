// Script simples para simular envio de logs de performance ao endpoint /logs/performance
// Uso: node simulate_performance_logs.js [count] [minMs] [maxMs]
// Exemplo: node simulate_performance_logs.js 10 100 3000

import fetch from 'node-fetch';

const args = process.argv.slice(2);
const count = Number(args[0]) || 10;
const minMs = Number(args[1]) || 50;
const maxMs = Number(args[2]) || 3000;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function send(i) {
  const tempo = rand(minMs, maxMs);
  const payload = {
    tela: 'TelaAdministrador',
    acao: i % 2 === 0 ? 'buscarUsuarios' : 'gerarRelatorio',
    tempoRespostaMs: tempo,
    usuario: 'simulacao',
    timestamp: new Date().toISOString()
  };
  try {
    const res = await fetch('http://localhost:3000/logs/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(i, tempo, res.status);
  } catch (e) {
    console.error('Erro ao enviar log', e.message);
  }
}

(async () => {
  for (let i = 0; i < count; i++) {
    await send(i);
  }
})();
