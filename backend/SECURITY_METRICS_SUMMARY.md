# Resumo de Métricas de Segurança — RH-Master

Última atualização: 2025-11-26

Este arquivo consolida as métricas implementadas no repositório, com referências para a documentação detalhada, endpoints e instruções rápidas para testar localmente.

## Métricas implementadas

- **TAC — Taxa de Autenticação e Controle de Acesso Correto**
  - Fórmula: `TAC = (Nº de acessos autorizados corretamente / Nº de acessos legítimos solicitados) × 100`
  - Controller: `backend/src/controllers/SecurityMetricsController.js` (`calcularTAC`)
  - Rota: `GET /security-metrics/tac`
  - Documentação detalhada: `backend/SECURITY_METRICS_TAC_DETAILED.md`
  - Testes unitários: `backend/tests/security-metrics.test.js`

- **RT — Tempo de Resposta (Response Time)**
  - Medidas: `avg`, `p50`, `p75`, `p90`, `p95`, `p99`, `percentBelowThreshold`
  - Requisito operacional: `p95` deve ser ≤ 2000 ms (95% das respostas abaixo de 2s)
  - Endpoints relacionados:
    - `POST /logs/performance` — gravar log de performance (payload JSON com `tempoRespostaMs`)
    - `GET /logs/performance/metrics` — agregações e percentis
    - `GET /logs/performance/health` — checagem de saúde (p95 ≤ threshold)
  - Documentação detalhada: `backend/SECURITY_METRICS_RESPONSE_TIME.md`

- **CL — Cobertura de Logs de Observabilidade**
  - Fórmula: `CL = (Nº de eventos críticos registrados / Nº total de eventos críticos definidos) × 100`
  - Controller: `backend/src/controllers/SecurityMetricsController.js` (`calcularCoberturaLogs`)
  - Rota: `GET /security-metrics/log-coverage`
  - Tabela recomendada: `sensitive_events` (script: `backend/tools/create_sensitive_events.sql`)
  - Scripts auxiliar: `backend/tools/populate_sensitive_events.js` (popula a tabela), `backend/tools/insert_audit_samples.js` (insere logs de exemplo)
  - Documentação detalhada: `backend/SECURITY_METRICS_LOG_COVERAGE.md`
  - Testes unitários: `backend/tests/log-coverage.test.js`

## Scripts úteis (demonstração/local)

- Criar/popular `sensitive_events`:

  ```powershell
  node backend/tools/populate_sensitive_events.js
  ```

- Inserir amostras em `audit_logs` (para demo):

  ```powershell
  node backend/tools/insert_audit_samples.js
  ```

- Executar cálculo de cobertura localmente (bypass HTTP/auth) e imprimir JSON:

  ```powershell
  node backend/tools/run_log_coverage.js
  ```

- Rodar testes unitários específicos (exemplo):

  ```powershell
  node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand tests/log-coverage.test.js
  ```

## Recomendações para validação manual rápida

1. Garanta que o backend esteja rodando e que as variáveis de ambiente do DB estejam corretas.
2. Popule `sensitive_events` com `node backend/tools/populate_sensitive_events.js`.
3. Insira amostras: `node backend/tools/insert_audit_samples.js`.
4. Execute `node backend/tools/run_log_coverage.js` e verifique saída JSON.
5. (Opcional) Chame via HTTP `GET /security-metrics/log-coverage` com token admin para integração completa.

## Próximos passos sugeridos

- Criar endpoint CRUD para `sensitive_events` para facilitar gestão via API.
- Adicionar testes de integração que criam dados reais em uma DB de teste e confirmam métricas e cleanup.
- Integrar alertas (Slack/Email) quando `CL` ou `RT` violarem thresholds por N períodos consecutivos.

---

Se quiser, eu posso:
- abrir esse arquivo no editor para revisão; ou
- criar um branch + PR com essas alterações prontas para revisão; ou
- implementar o endpoint de gerenciamento `sensitive-events` (CRUD).
