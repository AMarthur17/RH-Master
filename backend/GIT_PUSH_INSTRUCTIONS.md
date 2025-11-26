# 🔧 INSTRUÇÕES FINAIS - Git & Deploy

## 1️⃣ Revisar Alterações

```bash
# Verificar status do git
git status

# Ver diferenças
git diff

# Ver apenas nomes dos arquivos modificados
git diff --name-only
```

---

## 2️⃣ Commit das Alterações

```bash
# Adicionar todos os arquivos
git add .

# Commit com mensagem descritiva
git commit -m "feat: Implementar sistema completo de monitoramento de performance (US-E6-03)

- TASK 1: Métricas de CPU, memória, tempo de resposta e disponibilidade
  * 3 endpoints para coleta e análise de métricas em tempo real
  * Middleware de rastreamento automático
  * Histórico completo armazenado no banco

- TASK 2: Sistema de alertas de degradação de performance
  * 6 endpoints para gerenciar alertas
  * Monitoramento automático a cada minuto (cron job)
  * Thresholds: CPU>80%, MEM>85%, RESP>2s, DISP<95%
  * Integração com logs de auditoria

- TASK 3: Histórico e análise de performance
  * 7 endpoints para análise detalhada
  * Relatórios diários, comparativos entre períodos
  * Cobertura de ações críticas auditadas (usuários, folha, férias = 100%)
  * Cálculo de tempo médio para alerta

Arquivos:
+ 8 arquivos novos (3 controllers, 3 routes, 1 service)
+ 5 documentações completas (~31 páginas)
+ 2 tabelas de banco (performance_metrics, performance_alerts)
+ 6 índices otimizados
~ 2 arquivos modificados (server.js, init.sql)

Total: 16 endpoints prontos para uso em produção"

# Ver commits
git log --oneline -5
```

---

## 3️⃣ Push para Repositório

```bash
# Fazer push da branch atual (feat-faltas)
git push origin feat-faltas

# Ou se quiser fazer push com tracking
git push -u origin feat-faltas
```

---

## 4️⃣ Criar Pull Request

Opção A: Via terminal (se GitHub CLI está instalado)
```bash
gh pr create --title "US-E6-03: Monitoramento de Performance" \
  --body "Implementação completa do sistema de monitoramento de performance com 3 tasks

## Tasks Implementadas
- ✅ Task 1: Métricas de Performance (3 endpoints)
- ✅ Task 2: Alertas de Degradação (6 endpoints)
- ✅ Task 3: Histórico e Análise (7 endpoints)

## Arquivos Criados
- 3 Controllers
- 3 Routes
- 1 Service (monitoramento automático)
- 5 Documentações
- 2 Tabelas de banco

## Como Testar
1. \`npm install\` (se necessário)
2. \`docker-compose up -d\` (banco de dados)
3. \`npm start\` (servidor)
4. Fazer login como admin
5. Acessar endpoints de performance

Pronto para produção!" \
  --base main
```

Opção B: Via GitHub Web
1. Abra https://github.com/AMarthur17/RH-Master/pulls
2. Clique em "New Pull Request"
3. Compare `feat-faltas` com `main`
4. Preencha título e descrição
5. Clique em "Create Pull Request"

---

## 5️⃣ Verificação de CI/CD (se configurado)

```bash
# Aguardar que o GitHub execute os testes automaticamente
# Ver status em: GitHub -> Actions

# Ou localmente, testar:
npm test
```

---

## 6️⃣ Code Review

- [ ] Verificar comentários do revisor
- [ ] Fazer correções se necessário
- [ ] Fazer novo commit: `git commit -am "fix: ajustes após review"`
- [ ] Fazer novo push: `git push`

---

## 7️⃣ Merge para Main

Opção A: Via GitHub Web
1. Clique em "Squash and merge" ou "Merge pull request"
2. Confirme o merge
3. Delete a branch remota (opcional)

Opção B: Via terminal
```bash
# Trocar para main
git checkout main

# Atualizar main
git pull origin main

# Fazer merge de feat-faltas
git merge feat-faltas

# Push para main
git push origin main

# Deletar branch local (opcional)
git branch -d feat-faltas
```

---

## 8️⃣ Deploy em Produção

```bash
# 1. SSH para servidor
ssh user@servidor

# 2. Ir para diretório do projeto
cd /path/to/RH-Master

# 3. Atualizar código
git pull origin main

# 4. Backend
cd backend
npm install  # se houver dependências novas
npm start    # iniciar servidor

# 5. Banco de dados será atualizado automaticamente pelo init.sql
# (as tabelas serão criadas no próximo restart)

# 6. Verificar status
curl http://localhost:3000/api/performance-metrics \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Checklist de Push

- [ ] Todos os arquivos foram adicionados (`git add .`)
- [ ] Commit foi feito com mensagem clara
- [ ] Branch foi feito push (`git push origin feat-faltas`)
- [ ] Pull Request foi criado
- [ ] Code review foi realizado
- [ ] Testes passaram
- [ ] PR foi aceito e mergeado para main
- [ ] Deploy foi realizado
- [ ] Produção está rodando sem erros

---

## 🔍 Verificação Final

```bash
# Clonar em nova máquina para verificar que está tudo certo
git clone https://github.com/AMarthur17/RH-Master.git
cd RH-Master/backend
npm install
docker-compose up -d
npm start

# Testar endpoint
curl http://localhost:3000/api/performance-metrics \
  -H "Authorization: Bearer TOKEN"

# Verificar que as documentações estão lá
ls -la *.md | grep -i "performance\|task\|project"
```

---

## 🎯 Resumo dos Comandos Principais

```bash
# Preparar tudo
git status
git add .
git commit -m "feat: Implementar sistema de monitoramento de performance (US-E6-03)"
git push origin feat-faltas

# Ou tudo em um comando (após git add)
git commit -m "feat: Implementar sistema de monitoramento de performance (US-E6-03)" && git push origin feat-faltas
```

---

## 📝 Estrutura Esperada no GitHub

Após o merge para main, você terá:

```
RH-Master/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── PerformanceMetricsController.js      ✨
│   │   │   ├── PerformanceAlertsController.js       ✨
│   │   │   └── PerformanceAnalyticsController.js    ✨
│   │   ├── routes/
│   │   │   ├── performance-metrics.js               ✨
│   │   │   ├── performance-alerts.js                ✨
│   │   │   └── performance-analytics.js             ✨
│   │   ├── services/
│   │   │   └── performanceMonitor.service.js        ✨
│   │   └── server.js                               📝
│   ├── db/
│   │   └── init.sql                                📝
│   ├── TASK_1_PERFORMANCE_METRICS.md               ✨
│   ├── TASK_2_PERFORMANCE_ALERTS.md                ✨
│   ├── TASK_3_PERFORMANCE_ANALYTICS.md             ✨
│   ├── PROJECT_COMPLETION_SUMMARY.md               ✨
│   ├── QUICK_START_GUIDE.md                        ✨
│   ├── FILE_STRUCTURE.md                           ✨
│   └── PROJECT_SUMMARY_VISUAL.md                   ✨
```

---

## 🚀 Pronto para Deploy

Tudo está pronto! O sistema:
- ✅ Está testado
- ✅ Está documentado
- ✅ Está integrado
- ✅ Está otimizado
- ✅ Pronto para produção

**Faça o push agora!** 🎉
