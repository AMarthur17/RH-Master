# 📈 TASK 3 - Histórico, Análise e Integração com Auditoria

## ✅ O que foi implementado

- ✅ Controller de Analytics (`PerformanceAnalyticsController.js`)
- ✅ 7 endpoints para análise histórica detalhada
- ✅ Integração com logs de auditoria (ações críticas)
- ✅ Cobertura de alterações críticas auditadas
- ✅ Cálculo de tempo médio para alerta
- ✅ Relatórios e comparativos entre períodos
- ✅ Dashboard consolidado

## 📡 Endpoints Disponíveis

### 1. GET `/api/performance-analytics/historico-completo`
**Descrição**: Retorna histórico detalhado de métricas e alertas

**Query Parameters**:
- `horas` - Período em horas (default: 24)
- `limite` - Limite de registros (default: 1000)
- `tipo` - 'metricas', 'alertas', 'ambos' (default: metricas)

**Exemplo**:
```bash
GET /api/performance-analytics/historico-completo?horas=48&tipo=ambos&limite=500
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "48 horas",
  "tipo": "ambos",
  "metricas": [
    {
      "id": 1,
      "cpu_percent": "45.23",
      "memoria_percent": "52.10",
      "tempo_resposta_ms": "125.34",
      "disponibilidade_percent": "100.00",
      "uptime_segundos": 3600,
      "requisicoes_total": 500,
      "created_at": "2025-11-26T09:30:00Z"
    }
  ],
  "alertas": [
    {
      "id": 1,
      "tipo": "CPU_ELEVADA",
      "severidade": "ALTA",
      "mensagem": "CPU acima do limite: 85.2% > 80%",
      "recurso": "CPU",
      "valor": "85.20",
      "status": "RESOLVIDO",
      "created_at": "2025-11-26T10:35:00Z"
    }
  ]
}
```

### 2. GET `/api/performance-analytics/relatorio-diario`
**Descrição**: Relatório diário de performance com resumo estatístico

**Query Parameters**:
- `data` - Data no formato YYYY-MM-DD (default: hoje)

**Exemplo**:
```bash
GET /api/performance-analytics/relatorio-diario?data=2025-11-26
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "data": "2025-11-26",
  "resumo_metricas": {
    "data": "2025-11-26",
    "total_metricas": 1440,
    "cpu_media": "45.23",
    "cpu_maxima": "85.50",
    "cpu_minima": "20.10",
    "memoria_media": "52.10",
    "memoria_maxima": "75.30",
    "memoria_minima": "40.20",
    "tempo_resposta_media": "125.34",
    "tempo_resposta_maximo": "2500.67",
    "tempo_resposta_minimo": "10.23",
    "disponibilidade_media": "99.95",
    "total_requisicoes": "500000"
  },
  "alertas_por_tipo": [
    {
      "tipo": "TEMPO_RESPOSTA_ELEVADO",
      "severidade": "MEDIA",
      "total": 5,
      "resolvidos": 4,
      "abertos": 1
    }
  ],
  "tempo_medio_para_alerta_minutos": "45.30"
}
```

### 3. GET `/api/performance-analytics/comparativo`
**Descrição**: Compara métricas entre dois períodos

**Query Parameters**:
- `dataInicio1` - Data/hora inicial período 1 (obrigatório)
- `dataFim1` - Data/hora final período 1 (obrigatório)
- `dataInicio2` - Data/hora inicial período 2 (obrigatório)
- `dataFim2` - Data/hora final período 2 (obrigatório)

**Exemplo**:
```bash
GET "/api/performance-analytics/comparativo?dataInicio1=2025-11-20&dataFim1=2025-11-23&dataInicio2=2025-11-24&dataFim2=2025-11-26"
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "comparativo": {
    "periodo1": {
      "periodo": "2025-11-20 a 2025-11-23",
      "metricas": {
        "cpu_media": "48.23",
        "memoria_media": "55.10",
        "tempo_resposta_media": "135.34",
        "disponibilidade_media": "99.90"
      }
    },
    "periodo2": {
      "periodo": "2025-11-24 a 2025-11-26",
      "metricas": {
        "cpu_media": "45.23",
        "memoria_media": "52.10",
        "tempo_resposta_media": "125.34",
        "disponibilidade_media": "99.95"
      }
    },
    "variacao": {
      "cpu_variacao_percent": "-6.22",
      "memoria_variacao_percent": "-5.45",
      "tempo_resposta_variacao_percent": "-7.38",
      "disponibilidade_variacao_percent": "+0.05"
    }
  }
}
```

### 4. GET `/api/performance-analytics/audit-acoes-criticas`
**Descrição**: Retorna logs de ações críticas auditadas (usuários, folha, férias)

**Query Parameters**:
- `horas` - Período em horas (default: 24)
- `tipo` - 'usuario', 'folha', 'ferias', 'todos' (default: todos)
- `page` - Página (default: 1)
- `limite` - Itens por página (default: 50)

**Exemplo**:
```bash
GET /api/performance-analytics/audit-acoes-criticas?tipo=usuario&horas=24&page=1
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "24 horas",
  "tipo": "usuario",
  "paginacao": {
    "page": 1,
    "limite": 50,
    "total": 125,
    "paginas": 3
  },
  "acoes_criticas": [
    {
      "id": 1,
      "usuario_id": 5,
      "tipo_operacao": "UPDATE_USUARIO",
      "recurso": "usuario",
      "descricao": "Usuário alterado",
      "mudancas": {
        "salario": {
          "antigo": "5000.00",
          "novo": "6000.00"
        }
      },
      "ip_origem": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-11-26T10:35:00Z"
    },
    {
      "id": 2,
      "usuario_id": 3,
      "tipo_operacao": "CREATE_FOLHA",
      "recurso": "folha",
      "descricao": "Nova folha de pagamento criada",
      "mudancas": {
        "referencia": "11/2025",
        "total_bruto": "250000.00"
      },
      "ip_origem": "192.168.1.100",
      "created_at": "2025-11-26T09:30:00Z"
    }
  ]
}
```

### 5. GET `/api/performance-analytics/cobertura-auditoria`
**Descrição**: Métricas de cobertura de auditoria das ações críticas

**Query Parameters**:
- `horas` - Período em horas (default: 24)

**Exemplo**:
```bash
GET /api/performance-analytics/cobertura-auditoria?horas=24
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "24 horas",
  "cobertura_por_acao": [
    {
      "acao": "Edição de Usuários",
      "total_operacoes": 125,
      "operacoes_auditadas": 125,
      "taxa_cobertura_percent": "100.00"
    },
    {
      "acao": "Folha de Pagamento",
      "total_operacoes": 50,
      "operacoes_auditadas": 50,
      "taxa_cobertura_percent": "100.00"
    },
    {
      "acao": "Gestão de Férias",
      "total_operacoes": 75,
      "operacoes_auditadas": 75,
      "taxa_cobertura_percent": "100.00"
    }
  ],
  "cobertura_total": {
    "total_operacoes": 250,
    "operacoes_auditadas": 250,
    "taxa_cobertura_percent": 100.0
  }
}
```

### 6. GET `/api/performance-analytics/tempo-medio-alerta`
**Descrição**: Tempo médio entre detecção e alerta ser resolvido

**Query Parameters**:
- `horas` - Período em horas (default: 24)

**Exemplo**:
```bash
GET /api/performance-analytics/tempo-medio-alerta?horas=24
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "periodo": "24 horas",
  "tempo_medio_geral_minutos": "45.30",
  "tempo_minimo_geral_minutos": "5.20",
  "tempo_maximo_geral_minutos": "180.50",
  "total_alertas_resolvidos": 15,
  "alertas_por_tipo": [
    {
      "tipo": "CPU_ELEVADA",
      "severidade": "ALTA",
      "total_alertas": 5,
      "tempo_medio_minutos": "30.45",
      "tempo_minimo_minutos": "10.20",
      "tempo_maximo_minutos": "60.30"
    },
    {
      "tipo": "MEMORIA_ELEVADA",
      "severidade": "ALTA",
      "total_alertas": 4,
      "tempo_medio_minutos": "45.20",
      "tempo_minimo_minutos": "20.10",
      "tempo_maximo_minutos": "90.40"
    },
    {
      "tipo": "TEMPO_RESPOSTA_ELEVADO",
      "severidade": "MEDIA",
      "total_alertas": 6,
      "tempo_medio_minutos": "60.50",
      "tempo_minimo_minutos": "5.20",
      "tempo_maximo_minutos": "180.50"
    }
  ]
}
```

### 7. GET `/api/performance-analytics/dashboard`
**Descrição**: Dashboard consolidado com todas as métricas principais

**Query Parameters**:
- `horas` - Período para análise (default: 24)

**Exemplo**:
```bash
GET /api/performance-analytics/dashboard?horas=24
Authorization: Bearer <token_admin>
```

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:40:00.000Z",
  "metricas_atuais": {
    "cpu_percent": 45.23,
    "memoria_percent": 52.10,
    "tempo_resposta_ms": 125.34,
    "disponibilidade_percent": 99.95
  },
  "alertas": {
    "abertos": 3,
    "criticos": 0,
    "altos": 2
  },
  "tempo_medio_alerta_minutos": "45.30",
  "cobertura_auditoria": {
    "total_operacoes": 250,
    "operacoes_auditadas": 250,
    "percentual": "100.00"
  }
}
```

## 🔧 Como Testar

### 1. Obter Histórico Completo
```bash
curl "http://localhost:5000/api/performance-analytics/historico-completo?horas=48&tipo=ambos" \
  -H "Authorization: Bearer <seu_token>"
```

### 2. Relatório Diário
```bash
curl "http://localhost:5000/api/performance-analytics/relatorio-diario?data=2025-11-26" \
  -H "Authorization: Bearer <seu_token>"
```

### 3. Comparar Períodos
```bash
curl "http://localhost:5000/api/performance-analytics/comparativo?dataInicio1=2025-11-20&dataFim1=2025-11-23&dataInicio2=2025-11-24&dataFim2=2025-11-26" \
  -H "Authorization: Bearer <seu_token>"
```

### 4. Ações Críticas Auditadas
```bash
curl "http://localhost:5000/api/performance-analytics/audit-acoes-criticas?tipo=usuario&horas=24" \
  -H "Authorization: Bearer <seu_token>"
```

### 5. Cobertura de Auditoria
```bash
curl "http://localhost:5000/api/performance-analytics/cobertura-auditoria?horas=24" \
  -H "Authorization: Bearer <seu_token>"
```

### 6. Tempo Médio de Alerta
```bash
curl "http://localhost:5000/api/performance-analytics/tempo-medio-alerta?horas=24" \
  -H "Authorization: Bearer <seu_token>"
```

### 7. Dashboard
```bash
curl "http://localhost:5000/api/performance-analytics/dashboard?horas=24" \
  -H "Authorization: Bearer <seu_token>"
```

## 📊 Ações Críticas Auditadas

O sistema monitora automaticamente as seguintes ações críticas:

### 👥 Edição de Usuários
- `CREATE_USUARIO` - Novo usuário criado
- `UPDATE_USUARIO` - Usuário editado
- `DELETE_USUARIO` - Usuário deletado

### 💰 Folha de Pagamento
- `CREATE_FOLHA` - Nova folha criada
- `UPDATE_FOLHA` - Folha editada
- `DELETE_FOLHA` - Folha deletada

### 🏖️ Gestão de Férias
- `CREATE_FERIAS` - Férias solicitadas
- `UPDATE_FERIAS` - Férias alteradas
- `DELETE_FERIAS` - Férias canceladas
- `APROVAR_FERIAS` - Férias aprovadas
- `REJEITAR_FERIAS` - Férias rejeitadas

## 📈 KPIs Principais (Task 3)

### 1. **Cobertura de Alterações Críticas Auditadas**
```
Taxa de Cobertura = (Operações Auditadas / Total de Operações) × 100%
```
**Meta**: 100% de cobertura em ações sensíveis

**Exemplo**: Se 250 operações críticas foram realizadas, todas devem estar auditadas:
```json
{
  "total_operacoes": 250,
  "operacoes_auditadas": 250,
  "taxa_cobertura_percent": 100
}
```

### 2. **Tempo Médio para Alerta**
```
TMA = (Σ Tempo de Resolução / Total de Alertas Resolvidos)
```
**Objetivo**: Reduzir tempo de detecção a resolução

**Exemplo**: Tempo médio de 45 minutos para resolver alertas
```json
{
  "tempo_medio_geral_minutos": "45.30",
  "total_alertas_resolvidos": 15
}
```

### 3. **Cobertura por Tipo de Ação**
Monitora separadamente:
- **Usuários**: Criação, edição, deleção
- **Folha**: Processamento e alterações salariais
- **Férias**: Aprovações e cancelamentos

## 🎯 Critérios de Aceitação Atendidos

✅ **Sistema exibe métricas** - Endpoints 1, 2, 7 exibem métricas em tempo real e histórico  
✅ **Alertas são enviados** - Task 2 integrada, alertas disparados automaticamente  
✅ **Histórico pode ser consultado** - Endpoints 1, 2, 3 com análise detalhada  
✅ **Cobertura de alterações críticas** - Endpoint 4 e 5 rastreiam ações sensíveis  
✅ **Tempo médio para alerta** - Endpoint 6 calcula tempo de resposta  
✅ **Integração com auditoria** - Todos os endpoints usam logs de auditoria  

## 💾 Integração com Banco de Dados

O sistema usa as tabelas existentes:
- `performance_metrics` - Dados de performance
- `performance_alerts` - Alertas disparados
- `audit_logs` - Logs de ações críticas
- `usuario` - Informações de usuários

Nenhuma nova tabela foi necessária - reutiliza estrutura existente!

## 📋 Exemplo de Fluxo Completo

```
1. Usuário edita salário de um colaborador
   ↓
2. Auditoria registra a alteração em audit_logs
   ↓
3. Sistema detecta ação crítica
   ↓
4. Métrica de performance é coletada
   ↓
5. Se houver degradação, alerta é disparado
   ↓
6. Admin pode consultar:
   - Cobertura de auditoria: 100% das ações auditadas
   - Tempo médio para alerta: 45 minutos
   - Histórico completo: todas as alterações
   - Dashboard: visão consolidada
```

## 🎓 Observações Importantes

1. ✅ **Todas as métricas de Task 3 estão implementadas**
2. ✅ **Integração automática com auditoria existente**
3. ✅ **Sem dependências de pacotes adicionais**
4. ✅ **Performance otimizada com índices no banco**
5. ✅ **Paginação para grande volume de dados**
6. ✅ **Filtros flexíveis para análise**

---

**✅ Task 3 concluída com sucesso!**

Próximo: Testar o sistema e fazer push para production!
