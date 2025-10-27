Performance logging and testing
================================

This document describes how the performance logging implemented for RNF-02 works and how to test it locally.

What was added
--------------
- Route: POST /logs/performance -> saves JSON lines to ./logs/performance.log and records alerts in ./logs/alerts.log when tempoRespostaMs > 2000ms
- Script: backend/tools/simulate_performance_logs.js -> simulate POSTs to the above endpoint

Quick test flow (PowerShell)
----------------------------

# 1) Start backend (Docker Compose) or run locally
# Using Docker Compose (from repository root):
docker compose up -d --build

# OR run backend locally (requires Node 18+ recommended)
cd backend
npm install
node ./src/server.js

# 2) Send a manual performance log via PowerShell (example)
$payload = @{ tela='TelaAdministrador'; acao='buscarUsuarios'; tempoRespostaMs=2500; usuario='test'; timestamp=(Get-Date).ToString('o') } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/logs/performance -Body $payload -ContentType 'application/json'

# 3) Simulate multiple logs (Node script)
node backend/tools/simulate_performance_logs.js 20 50 3000

# 4) Check logs
Get-Content .\backend\logs\performance.log -Tail 30
Get-Content .\backend\logs\alerts.log -Tail 30

Notes
-----
- Logs are simple JSON lines. For production you should use structured logging (Winston, Bunyan) and a central log aggregator (ELK / Loki / Cloud provider).
- Alerts are written to alerts.log and printed to console. Integrate with PagerDuty/Slack/email for operational alerts.
