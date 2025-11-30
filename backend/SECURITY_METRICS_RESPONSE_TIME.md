# Métrica: Tempo de Resposta (RT) — Saúde de Performance (p95 / % abaixo do limiar)

Última atualização: 2025-11-26

## Resumo

Esta métrica monitora o tempo de resposta das requisições do sistema e avalia se as rotas críticas atendem aos requisitos de performance operacionais. A regra de aceitação definida é:

- 95% das respostas (p95) devem estar abaixo de 2 segundos (2000 ms).

São calculadas duas medidas principais:

- p95: Percentil 95 do tempo de resposta (valor abaixo do qual 95% das latências se encontram).
- percentBelowThreshold: porcentagem de solicitações cujo tempo de resposta é menor ou igual ao limiar (por exemplo 2000 ms).

Além disso, calcula-se a média aritmética (avg) e outras estatísticas descritivas (min, max, p50, p75, p90, p99) para análises complementares.

## Fonte dos dados

Na implementação atual do projeto os tempos de resposta são coletados e armazenados em arquivo de logs (pasta `logs/`, arquivo `performance.log`) via rota HTTP:

- `POST /logs/performance` — payload JSON:

```json
{
  "tela": "NomeDaTela",
  "acao": "ACAO_IDENTIFICADOR",
  "tempoRespostaMs": 1234,
  "usuario": "usuario@example.com",
  "timestamp": "2025-11-26T12:34:56.789Z",
  "tipoRelatorio": null
}
```

O middleware de monitoramento descrito registra `Date.now()` no início e no final da execução da rota e calcula `tempoRespostaMs = end - start`. Em seguida os dados são enviados ao endpoint acima (ou escritos diretamente no `performance.log`).

O arquivo `backend/src/routes/logs.js` contém utilitários para persistir esses registros e expor duas rotas úteis:

- `GET /logs/performance/metrics` — agrega e retorna estatísticas (avg, min, max, percentiles, percentBelowThreshold). Aceita filtros: `tela`, `acao`, `from`, `to`.
- `GET /logs/performance/health` — verifica se `p95 <= threshold` (default `2000` ms) e retorna `{ ok: boolean, p95, threshold, sampleCount }`.

## Cálculos e fórmulas

- Média aritmética (avg):

  avg = (Σ tempoRespostaMs) / N

- Percentil 95 (p95): ordenar a amostra ascendente e selecionar o valor na posição ceil(0.95 * N) - 1 (0-indexed). Implementação usada no repo usa esse método simples.

- Percentual abaixo do limiar (percentBelowThreshold):

  percentBelowThreshold = (count(tempoRespostaMs <= threshold) / N) × 100

Onde `threshold` tipicamente é 2000 (ms), configurável via `PERF_ALERT_THRESHOLD_MS`.

Observação: para conjuntos grandes ou requisitos estatísticos mais rigorosos, recomenda-se usar interpolação de percentis (ex.: método R-7) ou bibliotecas de estatística para maior precisão.

## Exemplo de código (leitura/agregação)

Trecho simplificado inspirado em `backend/src/routes/logs.js` para calcular métricas:

```javascript
// ler performance.log -> array de objetos
const tempos = items.map(i => Number(i.tempoRespostaMs)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
const count = tempos.length;
const sum = tempos.reduce((s,v)=>s+v,0);
const avg = sum / count;
const p95 = tempos[Math.ceil(0.95 * count) - 1];
const threshold = Number(process.env.PERF_ALERT_THRESHOLD_MS) || 2000;
const percentBelowThreshold = (tempos.filter(t => t <= threshold).length / count) * 100;
```

## Endpoints relevantes (já implementados)

- `POST /logs/performance` — grava um registro de performance (payload acima). Deve ser protegido (se o middleware postar internamente, não é público).
- `GET /logs/performance/metrics` — retorna estatísticas agregadas (aceita filtros `tela`, `acao`, `from`, `to`).
- `GET /logs/performance/health` — retorna se `p95 <= threshold` e grava alertas quando não estiver dentro do limite.

Exemplo de resposta de `/logs/performance/metrics`:

```json
{
  "count": 1200,
  "avg": 432.5,
  "min": 12,
  "max": 5123,
  "percentiles": { "p50": 400, "p75": 700, "p90": 1200, "p95": 1800, "p99": 3000 },
  "percentBelowThreshold": 96.5
}
```

## Requisito operacional (SLA)

- Regra: 95% das respostas (p95) devem estar abaixo de 2000 ms.
- Em termos de percentBelowThreshold, isso equivale a: percentBelowThreshold >= 95% para `threshold = 2000`.

Como checar:

1. Chamar `GET /logs/performance/health` (filtros: `tela`/`acao` quando desejar avaliar rota específica).
2. Se `ok` for `false`, `p95` > `threshold` e o sistema registra um alerta em `logs/health_alerts.log`.

## Alertas e ações recomendadas

- Quando `p95` ultrapassar o limiar:
  - registrar um alerta (atual código já escreve em `logs/health_alerts.log`);
  - coletar amostra de traces e analisar endpoints com maior latência (p99, p95);
  - verificar recursos: CPU, memória, conexões de banco, pool de DB e latências externas (APIs/SMTP);
  - identificar regressões recentes (deploys, mudanças em queries ou integrações externas);
  - se for rota crítica (login, geração de folha, exportação), priorizar investigação imediata.

## Testes e simulação

- Há uma ferramenta de simulação no repositório: `backend/tools/simulate_performance_logs.js` — ela gera linhas no `performance.log` com tempos variados. Use-a para testar agregações e alertas.

Exemplo de uso (PowerShell):

```powershell
cd backend
node tools/simulate_performance_logs.js --count 1000 --min 50 --max 3000
```

- Rodar `GET /logs/performance/metrics` e `GET /logs/performance/health` para validar resultados.

## Boas práticas e melhorias sugeridas

- Normalizar composição de `endpoint` antes de gravar logs (remover IDs dinâmicos) para agregar métricas por rota funcional.
- Ao enviar logs do middleware para o endpoint, fazer batches para reduzir I/O (ex.: buffer + flush periódico).
- Para produção com alto volume, preferir armazenar métricas em banco/TSDB (InfluxDB, Prometheus) e usar agregações nativas de percentis.
- Instrumentar com tracing distribuído (OpenTelemetry) para correlacionar tempos de resposta com chamadas a serviços externos.

## Limitações

- Arquivo de logs pode crescer e exigir rotação/compactação; operações de leitura para calcular percentis podem ficar pesadas em arquivos grandes.
- Cálculo de percentil usado é simples; em amostras muito grandes ou requisitos estatísticos deve-se usar métodos mais robustos.
- Precisão depende da consistência do envio de `tempoRespostaMs` pelo middleware — perdas de logs afetam métricas.

---
Arquivo gerado automaticamente com explicação completa da métrica de Tempo de Resposta (RT).
