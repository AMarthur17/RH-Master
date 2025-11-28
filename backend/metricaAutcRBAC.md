# metricaAutcRBAC — TAC (resumido)

Descrição curta
- TAC (Taxa de Autenticação e Controle de Acesso Correto) mede a porcentagem de acessos legítimos a funcionalidades com RBAC que foram autorizados corretamente.

Fórmula
- TAC = (Nº de acessos autorizados corretamente / Nº de acessos legítimos solicitados) × 100

Como é calculado (resumo operacional)
- Usa `audit_logs` (eventos de acesso) e `access_rules` (mapeamento de funcionalidades).
- Filtra apenas regras com `tem_rbac = TRUE` e faz JOIN por `endpoint`/`metodo`.
- Numerador: contagem de logs com `resultado = 'SUCESSO'`.
- Denominador: contagem total de logs para essas funcionalidades.

Endpoint
- `GET /security-metrics/tac`
  - Query params (opcionais): `perfil`, `dataInicio`, `dataFim`
  - Protegido por autenticação e permissão `Administrador` (mesma proteção das outras métricas).

Exemplo (PowerShell/curl)
```powershell
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/security-metrics/tac?perfil=admin&dataInicio=2025-01-01&dataFim=2025-11-26"
```

Notas rápidas
- Se o denominador for 0, a implementação retorna 100% por convenção (nenhuma solicitação no período).
- Junção por `endpoint` pode falhar para rotas dinâmicas; considere normalizar rotas ou gravar `funcionalidade` nos logs para maior robustez.

Local do código
- Controller: `backend/src/controllers/SecurityMetricsController.js` (`calcularTAC`)
- Rotas: `backend/src/routes/security-metrics.js` (`/tac`)
- Testes unitários: `backend/tests/security-metrics.tac.test.js`

Licença: internal/operacional — use conforme políticas do projeto.

Como rodar os testes
- Pré-requisitos: Node >= 18 e dependências instaladas no diretório `backend`.
- Instalar dependências (PowerShell):
```powershell
cd .\backend
npm install
```
- Executar apenas o teste da métrica TAC (arquivo específico):
```powershell
# no diretório raiz do projeto
cd .\backend
npm test -- tests/security-metrics.tac.test.js
```
- Executar toda a suíte de testes do backend:
```powershell
cd .\backend
npm test
```

Observações rápidas
- O script `test` em `backend/package.json` usa Jest via `node --experimental-vm-modules ...` (compatibilidade ESM). Rodar os comandos acima em PowerShell para evitar problemas de path.
- Se ocorrerem erros relacionados a dependências, execute `npm install` dentro de `backend` antes de rodar os testes.
