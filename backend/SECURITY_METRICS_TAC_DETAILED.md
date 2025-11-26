# TAC — Taxa de Autenticação e Controle de Acesso Correto

Última atualização: 2025-11-26

## Resumo

TAC (Taxa de Autenticação e Controle de Acesso Correto) mede a eficácia do sistema de controle de acesso e autenticação em termos percentuais. A métrica responde à pergunta: entre as solicitações legítimas a funcionalidades protegidas por RBAC, qual porcentagem foi autorizada corretamente (resultado = SUCESSO)?

Fórmula operacional utilizada na implementação:

TAC = (Nº de acessos autorizados corretamente / Nº de acessos legítimos solicitados) × 100

Onde:
- Numerador = contagem de registros em `audit_logs` associados a funcionalidades com `tem_rbac = TRUE` cujo `resultado` é `SUCESSO`.
- Denominador = contagem total de registros em `audit_logs` associados às mesmas funcionalidades (independentemente de `resultado`).

Esta definição é operacional (baseada em logs e na tabela `access_rules`) e permite filtrar por `perfil` e intervalo de datas.

## Tabelas e campos relevantes

- `audit_logs` (fonte primária dos eventos de acesso)
  - `endpoint`, `metodo`, `resultado`, `data_hora`, `usuario_email`, `usuario_nome`, `usuario_id`, `metadata`
- `access_rules` (mapeia funcionalidades e informa se possuem RBAC)
  - `perfil`, `funcionalidade`, `endpoint`, `metodo`, `tem_rbac`, `nivel_risco`

Índices recomendados (já presentes no schema): índices em `audit_logs(data_hora)`, `audit_logs(resultado)`, `access_rules(tem_rbac)`, `access_rules(perfil)`.

## Como a implementação funciona (passo a passo)

1. Recebe parâmetros via API: `perfil` (opcional), `dataInicio` (opcional), `dataFim` (opcional).
2. Constrói filtros de tempo aplicados a `audit_logs.data_hora` quando `dataInicio`/`dataFim` forem informados.
3. Se `perfil` for informado, limita o cálculo às regras em `access_rules` cujo `perfil` corresponda.
4. Faz uma junção (JOIN) entre `audit_logs` e `access_rules` com base em `endpoint` e `metodo` para identificar logs que correspondem a funcionalidades com RBAC (`tem_rbac = TRUE`).
   - Observação de implementação: a junção atualmente aceita correspondência direta `endpoint` = `endpoint` e `metodo` = `metodo`. Em implementações reais, pode ser necessário normalizar rotas (parâmetros, prefixos) ou mapear por funcionalidade.
5. Conta o total de registros resultantes (denominador) e conta quantos têm `resultado = 'SUCESSO'` (numerador).
6. Calcula TAC = (numerador / denominador) * 100 com duas casas decimais e retorna JSON com interpretação.

## SQL de exemplo (ilustrativo)

Denominador (total de solicitações a funcionalidades com RBAC):

```sql
SELECT COUNT(*) AS total
FROM audit_logs al
JOIN access_rules ar
  ON (al.endpoint = ar.endpoint OR ar.endpoint IS NULL OR ar.endpoint = '')
  AND (al.metodo = ar.metodo OR ar.metodo IS NULL OR ar.metodo = '')
WHERE al.data_hora >= $1
  AND al.data_hora <= $2
  AND ar.tem_rbac = TRUE
  AND ar.perfil = $3; -- opcional
```

Numerador (autorizados corretamente):

```sql
SELECT COUNT(*) AS total
FROM audit_logs al
JOIN access_rules ar
  ON (al.endpoint = ar.endpoint OR ar.endpoint IS NULL OR ar.endpoint = '')
  AND (al.metodo = ar.metodo OR ar.metodo IS NULL OR ar.metodo = '')
WHERE al.data_hora >= $1
  AND al.data_hora <= $2
  AND ar.tem_rbac = TRUE
  AND UPPER(al.resultado) = 'SUCESSO'
  AND ar.perfil = $3; -- opcional
```

Observação: os parâmetros `$1`, `$2`, `$3` representam `dataInicio`, `dataFim`, `perfil` respectivamente quando usados pela API.

## Exemplo de requisição HTTP

GET /security-metrics/tac?perfil=admin&dataInicio=2025-01-01&dataFim=2025-11-26

Headers:
- `Authorization: Bearer <TOKEN>`

Exemplo de resposta JSON:

```json
{
  "metrica": "Taxa de Autenticação e Controle de Acesso Correto (TAC)",
  "formula": "(Nº de acessos autorizados corretamente / Nº de acessos legítimos solicitados) × 100",
  "filtros": { "perfil": "admin", "dataInicio": "2025-01-01", "dataFim": "2025-11-26" },
  "dados": {
    "totalSolicitacoes": 1200,
    "totalAutorizados": 1188,
    "tacPercentual": 99.0
  },
  "interpretacao": "Excelente — controle de acesso funcionando corretamente.",
  "tipo": "Quantitativa - percentual"
}
```

## Interpretação e thresholds recomendados

- >= 99% — Excelente. Muito poucas negações indevidas.
- 95%–99% — Bom. Revisões pontuais nas regras podem aumentar a taxa.
- 90%–95% — Atenção. Possíveis problemas de configuração/permissões.
- < 90% — Crítico. Investigação urgente recomendada.

Esses thresholds são sugestões operacionais e devem ser adaptados ao contexto da organização e ao volume de acessos.

## Limitações e pontos de atenção

- Definição de “legítimo”: nesta implementação, consideramos "legítimas" as requisições que correspondem a `access_rules` com RBAC. Se `access_rules` estiver incompleto, o denominador pode subestimar o volume real de solicitações.
- Junção por `endpoint`/`metodo` é frágil quando as rotas têm parâmetros dinâmicos (ex.: `/api/usuarios/:id`). Avalie normalização ou um campo `funcionalidade` persistente nos logs para correspondência robusta.
- A métrica não detecta autorizações indevidas (casos em que `resultado = 'SUCESSO'` para usuários que não deveriam ter acesso). Para isso, implemente uma métrica complementar que compare `usuario.perfil` contra `access_rules` e conte sucessos indevidos.
- Logs incompletos ou perdas de audit logs (por problemas de ingestão) afetam resultados.
- Performance: junções entre `audit_logs` e `access_rules` podem ser caras em datasets muito grandes; garantir índices e/ou pré-agrupamentos (materialized views) se necessário.

## Como testar localmente (unit e integração)

1. Unit tests:
   - Mockar `db.query` e validar cenários: sem solicitações (0/0), poucas solicitações com sucesso parcial, filtro por `perfil`.
   - Exemplo: veja `backend/tests/security-metrics.test.js` (já incluído neste repositório).
2. Testes de integração:
   - Popular `audit_logs` e `access_rules` com dados de exemplo (scripts em `backend/tools/populate_audit_data.js` e `backend/tools/populate_security_metrics.js` podem ajudar).
   - Rodar o endpoint `/security-metrics/tac` apontando para o banco de dados de teste e comparar o resultado com uma query SQL direta.

## Extensões e melhorias sugeridas

- Mapear rotas para `funcionalidade` durante a inserção do log, reduzindo fragilidade da junção por `endpoint`.
- Adicionar métrica complementar para "Taxa de Autorização Indevida": conta `SUCESSO` em ações para perfis sem permissão.
- Gerar alertas/SLAs: configurar alertas quando `tacPercentual` cair abaixo de um limiar (por exemplo 95%) por X períodos consecutivos.
- Criar materialized views que agreguem contagens por dia/perfil para análises históricas eficientes.

## Considerações de segurança e compliance

- Certifique-se de que `audit_logs` permaneçam imutáveis (triggers presentes no schema), para garantir integridade dos dados usados no cálculo.
- Proteger o endpoint `/security-metrics/tac` com autenticação forte e permissões apropriadas (já protegido por `verificarPermissao(['Administrador'])`).

## Contato / responsável

Se precisar de ajustes na definição operacional (por exemplo, incluir/excluir certas categorias de logs), informe o time de Segurança/Dev para alinharmos a implementação.

---
