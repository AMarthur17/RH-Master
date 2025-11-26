# 📊 TASK 1 - Métricas de Performance

## ✅ O que foi implementado

- ✅ Controller de Performance Metrics (`PerformanceMetricsController.js`)
- ✅ Rotas API para obter métricas (`/api/performance-metrics`)
- ✅ Middleware para rastreamento de tempo de resposta
- ✅ Armazenamento de métricas no banco de dados
- ✅ Histórico de métricas para análise

## 📡 Endpoints Disponíveis

### 1. GET `/api/performance-metrics`
**Descrição**: Retorna as métricas atuais de performance do servidor

**Autenticação**: Requer token JWT + cargo de Administrador

**Exemplo de resposta**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:30:45.123Z",
  "metricas": {
    "cpu": {
      "percent": 45.2,
      "cores": 8
    },
    "memoria": {
      "process": {
        "usado_mb": 256,
        "total_mb": 512,
        "percent": "50.00"
      },
      "sistema": {
        "total_mb": 8192,
        "usado_mb": 4096,
        "livre_mb": 4096,
        "percent": "50.00"
      }
    },
    "tempoResposta": {
      "media_ms": "125.45",
      "minimo_ms": "10.23",
      "maximo_ms": "2500.67",
      "total_requisicoes": 1500
    },
    "disponibilidade": {
      "percent": "99.95",
      "uptime": "24h 30m",
      "uptime_segundos": 88200
    }
  }
}
```

### 2. GET `/api/performance-metrics/historico`
**Descrição**: Retorna histórico das últimas N horas

**Query Parameters**:
- `horas` (default: 24) - Quantas horas de histórico retornar
- `limite` (default: 100) - Limite de registros

**Exemplo**:
```bash
GET /api/performance-metrics/historico?horas=48&limite=200
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "48 horas",
  "total_registros": 48,
  "dados": [
    {
      "id": 1,
      "cpu_percent": "45.23",
      "memoria_percent": "52.10",
      "tempo_resposta_ms": "125.34",
      "disponibilidade_percent": "100.00",
      "uptime_segundos": 3600,
      "requisicoes_total": 500,
      "created_at": "2025-11-26T09:30:00Z"
    },
    ...
  ]
}
```

### 3. GET `/api/performance-metrics/resumo`
**Descrição**: Retorna resumo estatístico das métricas (média, máximo, mínimo)

**Query Parameters**:
- `horas` (default: 24) - Período para cálculo

**Exemplo**:
```bash
GET /api/performance-metrics/resumo?horas=7
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "7 horas",
  "estatisticas": {
    "cpu": {
      "media": 45.23,
      "maxima": 85.50,
      "minima": 20.10
    },
    "memoria": {
      "media": 52.10,
      "maxima": 75.30,
      "minima": 40.20
    },
    "tempoResposta": {
      "media": 125.34,
      "maximo": 2500.67,
      "minimo": 10.23
    },
    "disponibilidade": {
      "media": 99.95
    },
    "total_amostras": 168
  }
}
```

## 🔧 Como Testar

### 1. Login como Admin
```bash
curl -X POST http://localhost:5000/api/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha123"}'
```

Copie o `token` retornado.

### 2. Obter Métricas Atuais
```bash
curl http://localhost:5000/api/performance-metrics \
  -H "Authorization: Bearer <seu_token>"
```

### 3. Obter Histórico das Últimas 24 Horas
```bash
curl http://localhost:5000/api/performance-metrics/historico \
  -H "Authorization: Bearer <seu_token>"
```

### 4. Obter Resumo Estatístico
```bash
curl http://localhost:5000/api/performance-metrics/resumo?horas=24 \
  -H "Authorization: Bearer <seu_token>"
```

## 📊 O que é Monitorado

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| **CPU** | Percentual de uso de CPU do sistema | % |
| **Memória do Processo** | Heap usado pelo Node.js | MB e % |
| **Memória do Sistema** | RAM total do servidor | MB e % |
| **Tempo de Resposta** | Média, mínima e máxima de todas as requisições | ms |
| **Disponibilidade** | Percentual de uptime do servidor | % |
| **Uptime** | Tempo total que o servidor está rodando | s, h:m |
| **Requisições** | Total de requisições processadas | #unidade |

## 💾 Banco de Dados

A tabela `performance_metrics` armazena:

```sql
CREATE TABLE performance_metrics (
  id SERIAL PRIMARY KEY,
  cpu_percent NUMERIC(5,2),           -- Percentual de CPU
  memoria_percent NUMERIC(5,2),       -- Percentual de memória
  tempo_resposta_ms NUMERIC(7,2),     -- Tempo médio em ms
  disponibilidade_percent NUMERIC(5,2), -- % de disponibilidade
  uptime_segundos INTEGER,            -- Segundos de uptime
  requisicoes_total INTEGER,          -- Total de requisições
  created_at TIMESTAMP                -- Timestamp do snapshot
);
```

**Limpeza de dados antigos** (recomendado):
```sql
-- Deletar métricas com mais de 30 dias
DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '30 days';
```

## 🎯 Próximos Passos (Task 2 e 3)

- **Task 2**: Sistema de alertas quando métricas ultrapassam thresholds
- **Task 3**: Histórico detalhado e integração com auditoria de ações críticas

## ⚠️ Notas Importantes

1. **Apenas Administradores** podem acessar os endpoints de performance
2. O middleware está configurado para **rastrear automaticamente** todas as requisições
3. As métricas são salvaguardadas **a cada requisição** no banco de dados
4. CPU real requer instalação de pacote adicional (`os-utils`) - por enquanto usa aproximação
5. O uptime é calculado desde o start do servidor Node.js
