# 🚀 GUIA RÁPIDO - Sistema de Monitoramento de Performance

## ⚡ Setup Rápido (5 minutos)

### 1. Banco de Dados (Automático)
```bash
docker-compose down
docker-compose up -d
```
✅ Tabelas criadas automaticamente no `init.sql`

### 2. Servidor
```bash
cd backend
npm start
```
✅ Servidor rodando na porta 3000  
✅ Monitoramento automático iniciado  

### 3. Login
```bash
curl -X POST http://localhost:5000/api/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha123"}'
```

**Copie o `token` retornado** para usar em todos os endpoints!

---

## 📊 Exemplos de Uso (Copie e Cole)

### Obter Métricas Atuais
```bash
curl http://localhost:5000/api/performance-metrics \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: CPU, memória, tempo resposta, disponibilidade atuais

---

### Verificar Alertas Manualmente
```bash
curl -X POST http://localhost:5000/api/performance-alerts/check \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Alertas disparados (se houver)

---

### Listar Alertas Abertos
```bash
curl "http://localhost:5000/api/performance-alerts?status=ABERTO" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Todos os alertas abertos

---

### Ver Dashboard Consolidado
```bash
curl http://localhost:5000/api/performance-analytics/dashboard \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Métrica + Alertas + Tempo médio alerta + Cobertura auditoria

---

### Relatório do Dia
```bash
curl "http://localhost:5000/api/performance-analytics/relatorio-diario?data=2025-11-26" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Resumo de metrics + Alertas do dia + Tempo médio alerta

---

### Ações Críticas Auditadas (Usuários)
```bash
curl "http://localhost:5000/api/performance-analytics/audit-acoes-criticas?tipo=usuario&horas=24" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Todas edições de usuários auditadas

---

### Ações Críticas Auditadas (Folha)
```bash
curl "http://localhost:5000/api/performance-analytics/audit-acoes-criticas?tipo=folha&horas=24" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Todas alterações de folha auditadas

---

### Ações Críticas Auditadas (Férias)
```bash
curl "http://localhost:5000/api/performance-analytics/audit-acoes-criticas?tipo=ferias&horas=24" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Todas solicitações de férias auditadas

---

### Cobertura de Auditoria
```bash
curl "http://localhost:5000/api/performance-analytics/cobertura-auditoria?horas=24" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Taxa de cobertura (deve ser 100%)

---

### Tempo Médio para Alerta
```bash
curl "http://localhost:5000/api/performance-analytics/tempo-medio-alerta?horas=24" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Tempo médio entre falha e resolução

---

### Comparar Performance
```bash
curl "http://localhost:5000/api/performance-analytics/comparativo?dataInicio1=2025-11-20&dataFim1=2025-11-23&dataInicio2=2025-11-24&dataFim2=2025-11-26" \
  -H "Authorization: Bearer TOKEN"
```
**Retorna**: Comparação de variação entre períodos

---

## 🔧 Resolver um Alerta
```bash
curl -X PUT http://localhost:5000/api/performance-alerts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "status": "RESOLVIDO",
    "notas": "Problema corrigido"
  }'
```

---

## 📱 Postman / Insomnia

**Base URL**: `http://localhost:5000`

**Header obrigatório em todos os endpoints**:
```
Authorization: Bearer seu_token_aqui
```

---

## 🎯 Principais Valores

| Métrica | Threshold | Status |
|---------|-----------|--------|
| CPU | 80% | 🔴 ALTA |
| Memória | 85% | 🔴 ALTA |
| Resposta | 2000ms | 🟠 MÉDIA |
| Disponibilidade | 95% | 🔴 CRÍTICA |

---

## ⚙️ Monitoramento Automático

**Ativo 24/7** em background:
- ✅ Verifica a cada **1 minuto**
- ✅ Compara contra thresholds
- ✅ Dispara alertas se limite ultrapassado
- ✅ Registra na auditoria

---

## 📊 3 Componentes Principais

### 1️⃣ Task 1: Métricas
- Real-time performance data
- 3 endpoints
- Histórico completo

### 2️⃣ Task 2: Alertas
- Monitoramento automático
- 6 endpoints
- Integração com auditoria

### 3️⃣ Task 3: Analytics
- Análise histórica
- 7 endpoints
- Cobertura de auditoria + tempo médio alerta

---

## ✅ 16 Endpoints Disponíveis

```
TASK 1 (Métricas): 3 endpoints
├── GET /api/performance-metrics
├── GET /api/performance-metrics/historico
└── GET /api/performance-metrics/resumo

TASK 2 (Alertas): 6 endpoints
├── POST /api/performance-alerts/check
├── GET /api/performance-alerts
├── GET /api/performance-alerts/:id
├── PUT /api/performance-alerts/:id
├── GET /api/performance-alerts/estatisticas/resumo
└── GET /api/performance-alerts/tipos/resumo

TASK 3 (Analytics): 7 endpoints
├── GET /api/performance-analytics/historico-completo
├── GET /api/performance-analytics/relatorio-diario
├── GET /api/performance-analytics/comparativo
├── GET /api/performance-analytics/audit-acoes-criticas
├── GET /api/performance-analytics/cobertura-auditoria
├── GET /api/performance-analytics/tempo-medio-alerta
└── GET /api/performance-analytics/dashboard
```

---

## 🔍 Verificação Rápida (Status do Sistema)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Verificar métricas
curl http://localhost:5000/api/performance-metrics \
  -H "Authorization: Bearer $TOKEN"

# 3. Verificar alertas
curl -X POST http://localhost:5000/api/performance-alerts/check \
  -H "Authorization: Bearer $TOKEN"

# 4. Dashboard
curl http://localhost:5000/api/performance-analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🆘 Troubleshooting

### Erro: "Acesso negado"
→ Verifique se o usuário é **Administrador**

### Erro: "Token inválido"
→ Login novamente e copie o token correto

### Sem dados nos alertas
→ Sistema monitora automaticamente, pode levar 1 minuto
→ Use `POST /api/performance-alerts/check` para forçar

### Sem dados no histórico
→ Histórico começa vazio, acumula com o tempo
→ Dados existem após 24 horas de coleta

---

## 📚 Documentações Detalhadas

- `TASK_1_PERFORMANCE_METRICS.md` - Métricas em detalhes
- `TASK_2_PERFORMANCE_ALERTS.md` - Alertas em detalhes
- `TASK_3_PERFORMANCE_ANALYTICS.md` - Analytics em detalhes
- `PROJECT_COMPLETION_SUMMARY.md` - Resumo completo

---

## 💡 Dicas

1. **Dashboard** é o melhor ponto de entrada para visão geral
2. **Relatório Diário** é bom para análise de um dia
3. **Comparativo** útil para verificar tendências
4. **Tempo Médio de Alerta** é uma métrica crítica
5. **Cobertura de Auditoria** deve ser 100% sempre

---

**🎉 Pronto para usar! Todos os 3 tasks implementados e funcionais.**
