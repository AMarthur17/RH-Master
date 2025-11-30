# metricaCL — Cobertura de Logs de Observabilidade (CL)

Descrição curta
- CL mede a cobertura de registro de eventos críticos do sistema: quantos dos eventos sensíveis definidos têm, ao menos uma vez, um log registrado.

Fórmula
- CL = (Nº de eventos críticos registrados / Nº total de eventos críticos definidos) × 100

Como é implementado (simples)
- Usa `access_rules` como lista operacional de funcionalidades; considera críticas as com `nivel_risco = 'CRITICO'`.
- Numerador: contagem de funcionalidades críticas que tiveram ao menos um registro em `audit_logs` no período.
- Denominador: contagem total de funcionalidades críticas definidas em `access_rules`.

Endpoint
- `GET /security-metrics/log-coverage` (nova)
  - Query params (opcionais): `from`, `to`, `categoria`
  - Nota: os parâmetros legados `dataInicio`/`dataFim`/`perfil` continuam aceitos por compatibilidade (rota `/security-metrics/cl`).
  - Protegido por autenticação e permissão `Administrador`.

Exemplo de uso (PowerShell) — parâmetros novos:
```powershell
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/security-metrics/log-coverage?from=2025-01-01&to=2025-11-26&categoria=FOLHA_PAGAMENTO"
```

Exemplo legada (compatibilidade):
```powershell
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/security-metrics/cl?dataInicio=2025-01-01&dataFim=2025-11-26"
```

Como rodar os testes
- Pré-requisitos: Node >= 18 e dependências instaladas no diretório `backend`.
- Instalar dependências (PowerShell):
```powershell
cd .\backend
npm install
```
- Executar apenas os testes da métrica CL:
```powershell
cd .\backend
npm test -- tests/security-metrics.cl.test.js
```

Interpretação (sugestão)
- >= 100% — Excelente (todos os eventos críticos registrados)
- 90–99% — Bom
- 70–89% — Atenção
- < 70% — Crítico — revisar instrumentação de logs

Local do código
- Controller: `backend/src/controllers/SecurityMetricsController.js` (`calcularCoberturaLogs`)
- Rotas: `backend/src/routes/security-metrics.js` (`/log-coverage`) — rota compatível `/cl` mantida
- Testes unitários: `backend/tests/security-metrics.cl.test.js`
