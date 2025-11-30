# Métrica: Cobertura de Logs de Observabilidade (CL)

Última atualização: 2025-11-26

## Resumo

Nome: **Cobertura de Logs de Observabilidade (CL)**

Fórmula: CL = (Nº de eventos críticos registrados / Nº total de eventos críticos definidos) × 100

Tipo: Quantitativa — percentual

Objetivo: medir o quanto o sistema está efetivamente gerando logs para os *eventos críticos* definidos (ex.: ações sensíveis, falhas, tentativas de abuso), garantindo visibilidade, auditoria e monitoramento eficaz.

Ideal: ≥ 100% (todas as categorias/ações críticas definidas estão sendo registradas; valores acima de 100% podem indicar logs extras — tratar com atenção).

Observação operacional: "eventos críticos definidos" devem ser uma lista canônica (fonte de verdade) — pode ser um arquivo de configuração, uma tabela no banco (`sensitive_events`) ou o mapeamento em código (por exemplo `ACOES_SENSIVEIS` em `backend/src/middleware/audit.js`). A métrica funciona melhor quando há um repositório formal dos eventos sensíveis.

## Fontes de dados no repositório

- `audit_logs` — tabela imutável que guarda registros de auditoria (ações sensíveis, autenticação, resultados, timestamps). É a fonte primária para o numerador.
- `ACOES_SENSIVEIS` (arquivo `backend/src/middleware/audit.js`) — mapeamento em código das ações consideradas sensíveis (p.ex. `CRIAR_USUARIO`, `EXCLUIR_USUARIO`, `LOGIN`, etc.). Pode ser usado para derivar o denominador, mas recomenda-se materializar essa lista em tabela para consultas e histórico.

## Como calcular (alternativas)

Opção A — Usando uma tabela canônica `sensitive_events` (recomendada):

1. Criar tabela (exemplo):

```sql
CREATE TABLE IF NOT EXISTS sensitive_events (
  event_key VARCHAR(100) PRIMARY KEY,
  descricao TEXT,
  categoria VARCHAR(50),
  nivel_criticidade VARCHAR(20),
  ativo BOOLEAN DEFAULT TRUE
);
```

2. Popular `sensitive_events` com as chaves (ex.: `CRIAR_USUARIO`, `EXCLUIR_USUARIO`, `LOGIN`, ...).

3. Denominador — total de eventos críticos definidos (e ativos):

```sql
SELECT COUNT(*) AS total_definidos FROM sensitive_events WHERE ativo = TRUE;
```

4. Numerador — eventos críticos registrados no período (contagem distinta por tipo de evento):

```sql
SELECT COUNT(DISTINCT se.event_key) AS total_registrados
FROM sensitive_events se
LEFT JOIN audit_logs al
  ON UPPER(al.acao) = UPPER(se.event_key)
  AND al.data_hora BETWEEN $1 AND $2; -- params: dataInicio, dataFim
```

5. Cálculo em SQL (percentual):

```sql
WITH denom AS (
  SELECT COUNT(*)::numeric AS total_definidos FROM sensitive_events WHERE ativo = TRUE
), num AS (
  SELECT COUNT(DISTINCT se.event_key)::numeric AS total_registrados
  FROM sensitive_events se
  LEFT JOIN audit_logs al
    ON UPPER(al.acao) = UPPER(se.event_key)
    AND al.data_hora BETWEEN $1 AND $2
)
SELECT (LEAST((num.total_registrados / NULLIF(denom.total_definidos,0)) * 100, 100)) AS cl_percentual,
       num.total_registrados, denom.total_definidos
FROM denom, num;
```

Notas:
- `LEAST(...,100)` limita o percentual a 100% por simplicidade; remova se quiser reportar valores >100% (p.ex. registros extra não previstos).
- `NULLIF(...,0)` evita divisão por zero; quando `denom = 0` a métrica deve ser tratada como não aplicável.

Opção B — Derivar o conjunto de eventos do código (`ACOES_SENSIVEIS`):

- Extrair a lista de chaves do arquivo `backend/src/middleware/audit.js` (manualmente ou via script) e usar as mesmas consultas acima substituindo `sensitive_events` por uma lista inline.
- Desvantagem: mudanças no código só refletem na métrica se houver sincronização/teste manual; por isso a tabela canônica é preferível.

Opção C — Aproximação por categoria (quando não há lista canônica):

- Denominador = número de *categorias críticas* esperadas (por exemplo, `AUTENTICACAO`, `USUARIO`, `FOLHA_PAGAMENTO`, `DOCUMENTO`, etc.).
- Numerador = categorias que de fato geraram pelo menos um log crítico no período. É uma medida mais grossa, mas útil quando a granularidade por ação não está definida.

## Implementação prática e endpoint proposto

- Endpoint sugerido: `GET /security-metrics/log-coverage`
  - Query params: `from`, `to`, `categoria` (opcional), `nivel_criticidade` (opcional)
  - Nota de compatibilidade: a rota legada `/security-metrics/cl` e os parâmetros `dataInicio`/`dataFim`/`perfil` continuam suportados para compatibilidade com clientes antigos.
  - Resposta esperada:

```json
{
  "metrica": "Cobertura de Logs de Observabilidade",
  "formula": "(Nº de eventos críticos registrados / Nº total de eventos críticos definidos) × 100",
  "periodo": { "from": "2025-11-01", "to": "2025-11-26" },
  "dados": {
    "totalDefinidos": 40,
    "totalRegistrados": 38,
    "clPercentual": 95.0
  },
  "interpretacao": "Cobertura alta, faltam 2 eventos críticos sem registros; revisar implementações deste tipo de log.",
  "tipo": "Quantitativa - percentual"
}
```

## Interpretação e thresholds

- CL >= 100% — ideal (todos os eventos críticos definidos estão sendo registrados). Valores acima de 100% podem indicar eventos extras ou variações de nomenclatura.
- 90% ≤ CL < 100% — bom, porém revisar  os eventos não registrados e validar se são realmente esperados.
- 70% ≤ CL < 90% — atenção — lacunas relevantes na instrumentação; priorizar cobertura dos eventos não registrados.
- CL < 70% — crítico — instrumentação de observabilidade insuficiente; executar plano de ação para instrumentar eventos sensíveis.

## Exemplos de queries úteis

- Lista de eventos sensíveis sem registros no período:

```sql
SELECT se.event_key
FROM sensitive_events se
LEFT JOIN audit_logs al
  ON UPPER(al.acao) = UPPER(se.event_key)
  AND al.data_hora BETWEEN $1 AND $2
WHERE se.ativo = TRUE
GROUP BY se.event_key
HAVING COUNT(al.id) = 0;
```

- Contagem por categoria de eventos definidos vs registrados:

```sql
SELECT se.categoria,
       COUNT(*) FILTER (WHERE se.ativo = TRUE) AS definidos,
       COUNT(DISTINCT CASE WHEN al.id IS NOT NULL THEN se.event_key END) AS registrados
FROM sensitive_events se
LEFT JOIN audit_logs al
  ON UPPER(al.acao) = UPPER(se.event_key)
  AND al.data_hora BETWEEN $1 AND $2
GROUP BY se.categoria;
```

## Testes e validação

- Unit tests: mockar `audit_logs` e `sensitive_events` para validar cálculo do percentual, casos limite (denominador zero), e filtros por período/categoria.
- Integração: popular `sensitive_events` com a lista oficial e provocar eventos em ambiente de staging; verificar se `GET /security-metrics/log-coverage` retorna CL esperada.

## Ações recomendadas quando CL estiver baixo

- Validar se a lista `sensitive_events` está completa e consistente com requisitos de negócio.
- Verificar se o middleware de auditoria (`auditMiddleware`) está ativo nas rotas esperadas e se os controladores chamam `auditarAcao` quando apropriado.
- Corrigir bugs de logging (ex.: caminhos que não chamam o middleware, erros que impedem o registro, ou condições onde `registrarLog` falha silenciosamente).
- Adicionar testes automatizados que verifiquem que cada ação sensível dispara um `audit_log` correspondente.

## Boas práticas

- Mantenha `sensitive_events` como fonte de verdade (tabela no banco) — facilita auditoria, versionamento e consultas SQL diretas.
- Ao deployar mudanças que adicionam novas ações sensíveis, inclua migração para inserir o novo `event_key` em `sensitive_events` e um teste de integração que verifique a gravação em `audit_logs`.
- Use nomes padronizados e documentados para `acao` em `audit_logs` (sem variações de case ou espaçamento).

## Limitações

- Se a fonte do denominador for o código (`ACOES_SENSIVEIS`), a métrica depende de extração/sincronização e pode ficar desatualizada.
- Logs perdidos por problemas infra (I/O, falhas no registro) comprometem a métrica.
- Eventos que ocorrem indiretamente (por jobs assíncronos) podem não usar o mesmo fluxo de auditoria e devem ser mapeados explicitamente.

---
Arquivo gerado automaticamente com explicação completa da métrica de Cobertura de Logs de Observabilidade.
