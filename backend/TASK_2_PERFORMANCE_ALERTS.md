# 🚨 TASK 2 - Alertas de Degradação de Performance

## ✅ O que foi implementado

- ✅ Controller de Alertas (`PerformanceAlertsController.js`)
- ✅ Sistema automático de thresholds (limites de alerta)
- ✅ Rotas API para gerenciar alertas
- ✅ Integração com logs de auditoria
- ✅ Serviço de monitoramento automático (cron job)
- ✅ Armazenamento de alertas no banco de dados
- ✅ Estatísticas de alertas

## ⚙️ Thresholds Configurados (Padrão)

| Métrica | Threshold | Severidade |
|---------|-----------|------------|
| **CPU** | > 80% | 🔴 ALTA |
| **Memória** | > 85% | 🔴 ALTA |
| **Tempo de Resposta** | > 2000ms (2s) | 🟠 MÉDIA |
| **Disponibilidade** | < 95% | 🔴 CRÍTICA |

## 📡 Endpoints Disponíveis

### 1. POST `/api/performance-alerts/check`
**Descrição**: Verifica métricas atuais manualmente e dispara alertas

**Autenticação**: Admin

**Exemplo de resposta**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:35:00.000Z",
  "metricas": {
    "cpu_percent": 45.2,
    "memoria_percent": 75.5,
    "tempo_resposta_ms": 1250.34,
    "disponibilidade_percent": 99.95
  },
  "alertas_disparados": 0,
  "alertas": [],
  "thresholds": {
    "cpu": 80,
    "memoria": 85,
    "tempoResposta": 2000,
    "taxaErros": 10,
    "downtime": 0
  }
}
```

Se houver alertas:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:35:00.000Z",
  "metricas": {
    "cpu_percent": 85.2,
    "memoria_percent": 87.5,
    "tempo_resposta_ms": 2500.34,
    "disponibilidade_percent": 92.5
  },
  "alertas_disparados": 3,
  "alertas": [
    {
      "tipo": "CPU_ELEVADA",
      "severidade": "ALTA",
      "valor": 85.2,
      "threshold": 80,
      "mensagem": "CPU acima do limite: 85.2% > 80%",
      "recurso": "CPU"
    },
    {
      "tipo": "MEMORIA_ELEVADA",
      "severidade": "ALTA",
      "valor": 87.5,
      "threshold": 85,
      "mensagem": "Memória acima do limite: 87.5% > 85%",
      "recurso": "MEMORIA"
    },
    {
      "tipo": "TEMPO_RESPOSTA_ELEVADO",
      "severidade": "MEDIA",
      "valor": 2500.34,
      "threshold": 2000,
      "mensagem": "Tempo de resposta acima do limite: 2500.34ms > 2000ms",
      "recurso": "TEMPO_RESPOSTA"
    }
  ],
  "thresholds": {
    "cpu": 80,
    "memoria": 85,
    "tempoResposta": 2000,
    "taxaErros": 10,
    "downtime": 0
  }
}
```

### 2. GET `/api/performance-alerts`
**Descrição**: Lista alertas com filtros e paginação

**Query Parameters**:
- `tipo` - Tipo de alerta (CPU_ELEVADA, MEMORIA_ELEVADA, etc)
- `severidade` - BAIXA, MEDIA, ALTA, CRITICA
- `status` - ABERTO, EM_INVESTIGACAO, RESOLVIDO, FALSO_POSITIVO (default: ABERTO)
- `dataInicio` - Data inicial (ISO format)
- `dataFim` - Data final (ISO format)
- `page` - Página (default: 1)
- `limite` - Itens por página (default: 50)

**Exemplo**:
```bash
GET /api/performance-alerts?severidade=CRITICA&status=ABERTO&page=1&limite=20
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "paginacao": {
    "page": 1,
    "limite": 20,
    "total": 5,
    "paginas": 1
  },
  "alertas": [
    {
      "id": 1,
      "tipo": "CPU_ELEVADA",
      "severidade": "ALTA",
      "mensagem": "CPU acima do limite: 85.2% > 80%",
      "recurso": "CPU",
      "valor": "85.20",
      "usuario_id": null,
      "status": "ABERTO",
      "notas": null,
      "created_at": "2025-11-26T10:35:00Z",
      "atualizado_em": "2025-11-26T10:35:00Z"
    }
  ]
}
```

### 3. GET `/api/performance-alerts/:id`
**Descrição**: Obter detalhes de um alerta específico

**Exemplo**:
```bash
GET /api/performance-alerts/1
Authorization: Bearer <token_admin>
```

### 4. PUT `/api/performance-alerts/:id`
**Descrição**: Atualizar status de um alerta

**Body**:
```json
{
  "status": "RESOLVIDO",
  "notas": "CPU normalizada após reinicialização do serviço"
}
```

**Resposta**:
```json
{
  "status": "ok",
  "mensagem": "Alerta atualizado com sucesso",
  "alerta": {
    "id": 1,
    "tipo": "CPU_ELEVADA",
    "severidade": "ALTA",
    "status": "RESOLVIDO",
    "notas": "CPU normalizada após reinicialização do serviço",
    "atualizado_em": "2025-11-26T10:40:00Z"
  }
}
```

### 5. GET `/api/performance-alerts/estatisticas/resumo`
**Descrição**: Estatísticas gerais de alertas

**Query Parameters**:
- `horas` - Período em horas (default: 24)

**Exemplo**:
```bash
GET /api/performance-alerts/estatisticas/resumo?horas=24
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "24 horas",
  "estatisticas": {
    "total": 15,
    "por_severidade": {
      "criticos": 1,
      "altos": 5,
      "medios": 7,
      "baixos": 2
    },
    "por_status": {
      "abertos": 3,
      "resolvidos": 12
    },
    "tempo_medio_resolucao_minutos": "45.30",
    "ultimo_alerta": "2025-11-26T10:35:00Z"
  }
}
```

### 6. GET `/api/performance-alerts/tipos/resumo`
**Descrição**: Alertas agrupados por tipo

**Query Parameters**:
- `horas` - Período em horas (default: 24)

**Exemplo**:
```bash
GET /api/performance-alerts/tipos/resumo?horas=48
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "48 horas",
  "alertas_por_tipo": [
    {
      "tipo": "TEMPO_RESPOSTA_ELEVADO",
      "total": 8,
      "severidade_maxima": "MEDIA",
      "ultimo_alerta": "2025-11-26T10:35:00Z"
    },
    {
      "tipo": "CPU_ELEVADA",
      "total": 5,
      "severidade_maxima": "ALTA",
      "ultimo_alerta": "2025-11-26T10:30:00Z"
    }
  ]
}
```

## 🔧 Como Testar

### 1. Verificar Métricas Manualmente
```bash
curl -X POST http://localhost:5000/api/performance-alerts/check \
  -H "Authorization: Bearer <seu_token>"
```

### 2. Listar Alertas Abertos
```bash
curl http://localhost:5000/api/performance-alerts?status=ABERTO \
  -H "Authorization: Bearer <seu_token>"
```

### 3. Listar Alertas Críticos
```bash
curl http://localhost:5000/api/performance-alerts?severidade=CRITICA \
  -H "Authorization: Bearer <seu_token>"
```

### 4. Obter Estatísticas
```bash
curl http://localhost:5000/api/performance-alerts/estatisticas/resumo?horas=24 \
  -H "Authorization: Bearer <seu_token>"
```

### 5. Resolver um Alerta
```bash
curl -X PUT http://localhost:5000/api/performance-alerts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token>" \
  -d '{
    "status": "RESOLVIDO",
    "notas": "Problema identificado e corrigido"
  }'
```

## 🤖 Monitoramento Automático

O sistema **automaticamente**:

1. ✅ Verifica métricas **a cada minuto**
2. ✅ Compara contra thresholds
3. ✅ **Dispara alertas** se limites ultrapassados
4. ✅ **Registra na auditoria** alertas críticos
5. ✅ Armazena no banco para análise

**Status**: Sistema rodando em background após startup do servidor

## 📊 Status dos Alertas

| Status | Significado |
|--------|-------------|
| **ABERTO** | Alerta recém-disparado, aguardando ação |
| **EM_INVESTIGACAO** | Equipe investigando o problema |
| **RESOLVIDO** | Problema corrigido e alerta fechado |
| **FALSO_POSITIVO** | Alerta incorreto, cancelado |

## 🔴 Níveis de Severidade

| Severidade | Cor | Ação Recomendada |
|------------|-----|------------------|
| **BAIXA** | 🟢 | Monitorar |
| **MÉDIA** | 🟡 | Investigar em breve |
| **ALTA** | 🟠 | Investigar imediatamente |
| **CRÍTICA** | 🔴 | Ação emergencial |

## 💾 Banco de Dados

Tabela `performance_alerts`:

```sql
CREATE TABLE performance_alerts (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50),              -- Tipo de alerta
  severidade VARCHAR(20),        -- Nível de severidade
  mensagem TEXT,                 -- Descrição do alerta
  recurso VARCHAR(50),           -- Recurso afetado
  valor NUMERIC(7,2),            -- Valor que disparou
  usuario_id INTEGER,            -- Quem detectou
  status VARCHAR(30),            -- Status atual
  notas TEXT,                    -- Notas sobre resolução
  created_at TIMESTAMP,          -- Quando foi criado
  atualizado_em TIMESTAMP        -- Última atualização
);
```

## 🎯 Integração com Auditoria

Quando alertas **críticos** são disparados:

1. Sistema registra automaticamente em `audit_logs`
2. Tipo de operação: `ALERT_PERFORMANCE_CRITICO`
3. Rastreabilidade completa de quando/quem detectou
4. Metadados salvos com detalhes do alerta

Exemplo de log:
```json
{
  "usuario_id": 0,
  "tipo_operacao": "ALERT_PERFORMANCE_CRITICO",
  "recurso": "SISTEMA",
  "descricao": "Sistema dispara 1 alerta(s) crítico(s)",
  "mudancas": {
    "alertas": [
      {
        "tipo": "DISPONIBILIDADE_BAIXA",
        "severidade": "CRITICA",
        "valor": 92.5
      }
    ]
  }
}
```

## 📈 KPIs Monitorados

1. **Taxa de Alertas**: Total de alertas por período
2. **Tempo Médio de Resolução**: Quanto leva para resolver um alerta
3. **Distribuição por Severidade**: Quantos são críticos, altos, etc
4. **Taxa de Falsos Positivos**: Alertas incorretos vs totais
5. **Tempo de Resposta ao Alerta**: Tempo entre detecção e resolução

---

**✅ Task 2 concluída com sucesso!**

Próximo: Task 3 (Histórico, Análise e Integração com Auditoria)
