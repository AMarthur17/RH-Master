# 🚀 Guia Rápido - Métrica de Taxa de Incidentes de Vazamento de Dados

## ⚡ Quick Start (5 minutos)

### 1. Atualizar o Banco de Dados

```bash
# Reiniciar containers para aplicar as novas tabelas
cd c:\Users\kevaut\Desktop\RH-Master
docker-compose down
docker-compose up -d
```

### 2. Popular Dados de Teste

```bash
# Entrar no container do backend
docker exec -it rh-master-backend-1 /bin/sh

# Executar script de população
node tools/populate_security_metrics.js

# Sair do container
exit
```

### 3. Testar a API

```bash
# 1. Fazer login (obter token)
curl -X POST http://localhost:5000/api/usuario/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"senha\":\"suaSenha\"}"

# 2. Consultar a métrica (substitua SEU_TOKEN)
curl http://localhost:5000/api/security-metrics/taxa-vazamento ^
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resultado Esperado:**
```json
{
  "metrica": "Taxa de Incidentes de Vazamento de Dados",
  "dados": {
    "totalTransacoes": 960,
    "totalIncidentes": 3,
    "taxaProtecao": 99.69
  },
  "interpretacao": "Excelente! Taxa de proteção muito alta."
}
```

---

## 📊 Endpoints Disponíveis

### GET `/api/security-metrics/taxa-vazamento`
Consulta a métrica principal

**Exemplo:**
```bash
curl "http://localhost:5000/api/security-metrics/taxa-vazamento?dataInicio=2024-11-01&dataFim=2024-11-30" ^
  -H "Authorization: Bearer SEU_TOKEN"
```

### POST `/api/security-metrics/incidentes`
Registra um novo incidente

**Exemplo:**
```bash
curl -X POST http://localhost:5000/api/security-metrics/incidentes ^
  -H "Authorization: Bearer SEU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"tipo\":\"VAZAMENTO_DADOS\",\"severidade\":\"ALTA\",\"descricao\":\"Teste de incidente\",\"quantidadeRegistros\":10}"
```

### GET `/api/security-metrics/incidentes`
Lista todos os incidentes

**Exemplo:**
```bash
curl "http://localhost:5000/api/security-metrics/incidentes?status=ABERTO" ^
  -H "Authorization: Bearer SEU_TOKEN"
```

### PUT `/api/security-metrics/incidentes/:id`
Atualiza status de um incidente

**Exemplo:**
```bash
curl -X PUT http://localhost:5000/api/security-metrics/incidentes/1 ^
  -H "Authorization: Bearer SEU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"RESOLVIDO\",\"acaoCorretiva\":\"Problema corrigido\"}"
```

### GET `/api/security-metrics/estatisticas`
Retorna estatísticas gerais

**Exemplo:**
```bash
curl http://localhost:5000/api/security-metrics/estatisticas ^
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET `/api/security-metrics/detectar-vazamentos`
Detecta padrões suspeitos nos logs

**Exemplo:**
```bash
curl http://localhost:5000/api/security-metrics/detectar-vazamentos ^
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🎯 Como a Métrica Funciona

### Fórmula
```
Taxa de Proteção = (1 - (Nº Incidentes / Total Transações)) × 100%
```

### Exemplo de Cálculo
```
Total de Transações: 1000
Incidentes de Vazamento: 5
Proporção: 5/1000 = 0.005 = 0.5%
Taxa de Proteção: 100% - 0.5% = 99.5%
```

### Interpretação
| Taxa | Status | Ação |
|------|--------|------|
| 99%+ | ✅ Excelente | Continue monitorando |
| 95-99% | 👍 Bom | Revisar incidentes |
| 90-95% | ⚠️ Aceitável | Investigar causas |
| 80-90% | 🟠 Preocupante | Ação urgente |
| <80% | 🔴 Crítico | Revisão completa |

---

## 🔄 Integração Automática

### O que é registrado automaticamente?

✅ **Transações de Dados:**
- Toda operação sensível (CRUD em usuários, folha, documentos, etc)
- Consultas a dados críticos
- Exportações de relatórios

✅ **Incidentes Detectados:**
- 5+ tentativas falhas de login do mesmo IP em 15min
- Padrões suspeitos identificados pela detecção automática

### Categorias de Sensibilidade

- **CRITICA**: Folha de pagamento, benefícios
- **ALTA**: Usuários, documentos
- **NORMAL**: Solicitações, relatórios
- **BAIXA**: Consultas simples

---

## 🖥️ Frontend (Opcional)

### Adicionar rota no frontend

Edite `frontend/src/App.jsx`:

```jsx
import SecurityMetrics from './pages/SecurityMetrics';

// Adicionar na lista de rotas:
<Route path="/security-metrics" element={<SecurityMetrics />} />
```

### Adicionar link no menu

```jsx
<Link to="/security-metrics">🔐 Métricas de Segurança</Link>
```

---

## 🔍 Verificar Instalação

```bash
# 1. Verificar tabelas criadas
docker exec -it rh-master-db-1 psql -U postgres -d rh_master -c "\dt security_*"

# Deve mostrar:
# - security_incidents
# - data_transactions

# 2. Verificar dados populados
docker exec -it rh-master-db-1 psql -U postgres -d rh_master -c "SELECT COUNT(*) FROM data_transactions;"

# 3. Verificar incidentes
docker exec -it rh-master-db-1 psql -U postgres -d rh_master -c "SELECT COUNT(*) FROM security_incidents;"

# 4. Testar endpoint (substitua token)
curl http://localhost:5000/api/security-metrics/taxa-vazamento -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📋 Checklist de Implementação

- [x] Tabelas criadas no banco (`security_incidents`, `data_transactions`)
- [x] Controller implementado (`SecurityMetricsController.js`)
- [x] Rotas configuradas (`security-metrics.js`)
- [x] Integração com auditoria (registro automático)
- [x] Detecção automática de incidentes
- [x] Script de população de dados
- [x] Frontend exemplo (opcional)
- [x] Documentação completa

---

## 🐛 Troubleshooting

### Erro: "Token não encontrado"
**Solução:** Certifique-se de estar logado como administrador:
```bash
curl -X POST http://localhost:5000/api/usuario/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"senha\":\"suaSenha\"}"
```

### Erro: "Tabela não existe"
**Solução:** Reinicie os containers:
```bash
docker-compose down
docker-compose up -d
```

### Métrica retorna 0 transações
**Solução:** Execute o script de população:
```bash
docker exec -it rh-master-backend-1 node tools/populate_security_metrics.js
```

### Permissão negada
**Solução:** Apenas administradores podem acessar. Verifique o cargo do usuário:
```sql
SELECT nome, email, cargo FROM usuario WHERE email = 'seu@email.com';
```

---

## 📞 Suporte

Para dúvidas:
1. Consulte `SECURITY_METRICS_README.md` (documentação completa)
2. Verifique logs: `docker-compose logs backend`
3. Verifique estrutura: `\dt security_*` no PostgreSQL

---

**✨ Implementação concluída com sucesso!**
