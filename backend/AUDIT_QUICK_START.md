# 🚀 Guia Rápido - Sistema de Auditoria

## Início Rápido em 5 Minutos

### 1️⃣ Instalar Extensão pgcrypto (Obrigatório)

A extensão `pgcrypto` é necessária para o cálculo de hash SHA-256 dos logs.

```bash
docker exec -it rh_master_db psql -U postgres -d rh_master -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

**Saída esperada:**
```
CREATE EXTENSION
```

> ⚠️ **Importante:** Execute este comando antes de popular dados ou usar o sistema de auditoria.

### 2️⃣ Aplicar Schema do Banco de Dados

```bash
# Se estiver usando Docker
docker-compose down
docker-compose up -d
```

### 3️⃣ Reiniciar o Backend

```bash
cd backend
npm install
npm start
```

Você verá:
```
🚀 Servidor rodando na porta 3000
🔒 Sistema de auditoria ativado
```

### 4️⃣ Popular Dados de Exemplo (Opcional)

**Opção 1: Popular com dados completos (recomendado)**
```bash
docker exec -it rh_master_backend node tools/populate_audit_data.js
```

**Opção 2: Inserir apenas amostras básicas**
```bash
docker exec -it rh_master_backend node tools/insert_audit_samples.js
```

**Verificar dados criados:**
```bash
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT COUNT(*) FROM audit_logs;"
```

### 5️⃣ Testar as APIs

**Obter Token de Administrador:**
```bash
POST http://localhost:3000/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "senha": "senha123"
}
```

**Consultar Logs:**
```bash
GET http://localhost:3000/audit/logs
Authorization: Bearer SEU_TOKEN_AQUI
```

**Ver Estatísticas:**
```bash
GET http://localhost:3000/audit/statistics
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📋 Principais Endpoints

| Endpoint | Descrição | Acesso |
|----------|-----------|--------|
| `GET /audit/logs` | Lista logs com filtros | Admin/Auditor |
| `GET /audit/statistics` | Estatísticas gerais | Admin/Auditor |
| `GET /audit/critical` | Ações críticas | Admin/Auditor |
| `GET /audit/failed` | Tentativas falhas | Admin/Auditor |
| `GET /audit/export` | Exportar logs | Admin/Auditor |

---

## 🔍 Exemplos de Consultas

### Todas as tentativas de login falhadas
```bash
GET /audit/logs?categoria=AUTENTICACAO&resultado=FALHA
```

### Alterações críticas em folha de pagamento
```bash
GET /audit/logs?categoria=FOLHA_PAGAMENTO&nivelCriticidade=CRITICO
```

### Ações de um usuário específico
```bash
GET /audit/logs?usuarioId=5&dataInicio=2025-11-01
```

### Ações dos últimos 7 dias
```bash
GET /audit/logs?dataInicio=2025-11-07&dataFim=2025-11-14
```

### Exportar para CSV
```bash
GET /audit/export?formato=csv&categoria=USUARIO
```

---

## 🔧 Integração Rápida

### Auditoria Automática (Já Funciona!)

Rotas mapeadas são auditadas **AUTOMATICAMENTE**:

```javascript
// Esta rota é auditada automaticamente
router.post('/usuario', autenticar, permitir(['administrador']), async (req, res) => {
  // Sua lógica aqui
  const usuario = await criarUsuario(req.body);
  res.json(usuario);
  // Auditoria registrada automaticamente! ✅
});
```

### Auditoria Manual (Quando Precisar)

```javascript
import { registrarAuditoriaManual } from '../middleware/audit.js';

router.post('/acao-customizada', autenticar, async (req, res) => {
  // Sua lógica
  const resultado = await minhaFuncao();
  
  // Registrar auditoria
  await registrarAuditoriaManual(req, {
    acao: 'MINHA_ACAO',
    categoria: 'CATEGORIA',
    descricao: 'Descrição da ação',
    resultado: 'SUCESSO',
    nivelCriticidade: 'MEDIO'
  });
  
  res.json(resultado);
});
```

---

## 🧪 Testar o Sistema

### Executar Testes Automatizados

```bash
cd backend
npm test audit.test.js
```

### Testar Integridade

```bash
# 1. Obter ID de um log
GET /audit/logs?limit=1

# 2. Verificar integridade
GET /audit/logs/{id}/verify

# Resposta esperada:
{
  "integro": true,
  "hashArmazenado": "a1b2c3...",
  "hashCalculado": "a1b2c3...",
  "mensagem": "Log íntegro - não foi modificado"
}
```

---

## 📊 Dashboard Básico

### Ver Estatísticas Completas

```bash
GET /audit/statistics
```

Retorna:
- Total de logs
- Distribuição por categoria
- Top 10 ações
- Distribuição por resultado
- Distribuição por criticidade
- Usuários mais ativos
- Atividade por dia

### Ver Ações Críticas Recentes

```bash
GET /audit/critical?limit=20
```

### Ver Tentativas Falhas

```bash
GET /audit/failed?limit=20
```

---

## 🔒 Segurança

### Verificar Proteção de Imutabilidade

```sql
-- Tentar modificar um log (DEVE FALHAR)
UPDATE audit_logs SET acao = 'TESTE' WHERE id = 1;
-- Erro: Logs de auditoria são imutáveis e não podem ser modificados

-- Tentar excluir um log (DEVE FALHAR)
DELETE FROM audit_logs WHERE id = 1;
-- Erro: Logs de auditoria são imutáveis e não podem ser excluídos
```

✅ **Funcionando!** Logs são realmente imutáveis.

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

1. **`AUDIT_SYSTEM_README.md`** - Documentação completa da API
2. **`AUDIT_IMPLEMENTATION_SUMMARY.md`** - Resumo técnico
3. **`audit-integration-examples.js`** - Exemplos de código

---

## ❓ Troubleshooting

### Erro: "Tabela audit_logs não existe"
```bash
# Execute o schema novamente
psql -U postgres -d rh_master -f db/init.sql
```

### Erro: "Token ausente" ou "Acesso negado"
```bash
# 1. Faça login primeiro
POST /login
# 2. Use o token retornado
Authorization: Bearer SEU_TOKEN
```

### Nenhum log está sendo registrado
```bash
# Verifique se o middleware está ativo no server.js
# Deve ter esta linha:
app.use(auditMiddleware);
```

---

## 🎯 Checklist de Verificação

Verifique se tudo está funcionando:

- [ ] Tabela `audit_logs` existe no banco
- [ ] Triggers de integridade estão ativos
- [ ] Triggers de imutabilidade estão ativos
- [ ] Backend inicia com "Sistema de auditoria ativado"
- [ ] Endpoint `GET /audit/logs` retorna 401 sem token
- [ ] Endpoint `GET /audit/logs` retorna dados com token admin
- [ ] Tentativa de UPDATE em audit_logs falha
- [ ] Tentativa de DELETE em audit_logs falha
- [ ] Hash de integridade está sendo calculado
- [ ] Logs automáticos estão sendo registrados

---

## 🎉 Pronto!

Seu sistema de auditoria está **100% operacional**!

Para casos de uso e exemplos avançados, consulte:
- `AUDIT_SYSTEM_README.md`
- `audit-integration-examples.js`

**Dúvidas?** Consulte a documentação completa. 📚
