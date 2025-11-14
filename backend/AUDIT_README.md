# 🔒 Sistema de Auditoria - US-E6-02

> **Auditoria e Logs de Segurança** - Implementação completa com armazenamento imutável e verificação de integridade

---

## 📝 Sobre

Sistema completo de auditoria que registra **TODAS** as ações sensíveis do RH-Master de forma automática e segura:

- ✅ Captura automática de 40+ ações sensíveis
- ✅ Logs incluem usuário, ação, data/hora e metadados
- ✅ Filtros avançados para busca rápida
- ✅ Armazenamento imutável com hash SHA-256
- ✅ API completa com 11 endpoints
- ✅ Exportação para JSON e CSV
- ✅ Estatísticas e dashboards

---

## 🚀 Início Rápido

### 1. Aplicar Schema

```bash
# Com Docker
docker-compose down && docker-compose up -d

# Ou manualmente
psql -U postgres -d rh_master -f db/init.sql
```

### 2. Iniciar Backend

```bash
cd backend
npm install
npm start
```

### 3. Testar API

```bash
# Login
POST http://localhost:3000/login
Body: { "email": "admin@empresa.com", "senha": "senha123" }

# Consultar logs
GET http://localhost:3000/audit/logs
Authorization: Bearer SEU_TOKEN
```

---

## 📖 Documentação

| Arquivo | Descrição |
|---------|-----------|
| [**AUDIT_QUICK_START.md**](AUDIT_QUICK_START.md) | ⚡ Início rápido em 5 minutos |
| [**AUDIT_SYSTEM_README.md**](AUDIT_SYSTEM_README.md) | 📚 Documentação completa da API |
| [**AUDIT_IMPLEMENTATION_SUMMARY.md**](AUDIT_IMPLEMENTATION_SUMMARY.md) | 🏗️ Resumo técnico da implementação |
| [**audit-integration-examples.js**](src/examples/audit-integration-examples.js) | 💡 Exemplos de código |

---

## 🎯 Principais Funcionalidades

### Captura Automática

O sistema captura automaticamente ações como:
- 🔑 Login e Logout
- 👤 CRUD de Usuários
- 💰 CRUD de Folha de Pagamento
- 🎁 CRUD de Benefícios
- 📄 Upload e acesso a documentos
- 📊 Geração de relatórios
- ✅ Aprovação/Rejeição de solicitações
- 🏖️ Gestão de férias
- ⏰ Alterações em ponto

### API de Consulta

```bash
# Logs com filtros
GET /audit/logs?categoria=USUARIO&resultado=FALHA

# Estatísticas
GET /audit/statistics

# Ações críticas
GET /audit/critical

# Exportar CSV
GET /audit/export?formato=csv
```

### Segurança

- 🔐 Hash SHA-256 em cada log
- 🔒 Imutabilidade garantida (triggers)
- 👁️ Verificação de integridade
- 🚫 Acesso apenas Admin/Auditor

---

## 🔧 Integração

### Auditoria Automática (Zero Configuração!)

```javascript
// Rotas mapeadas são auditadas AUTOMATICAMENTE
router.post('/usuario', autenticar, permitir(['administrador']), async (req, res) => {
  const usuario = await criarUsuario(req.body);
  res.json(usuario);
  // ✅ Auditoria registrada automaticamente!
});
```

### Auditoria Manual (Quando Necessário)

```javascript
import { registrarAuditoriaManual } from '../middleware/audit.js';

await registrarAuditoriaManual(req, {
  acao: 'MINHA_ACAO',
  categoria: 'CATEGORIA',
  descricao: 'Descrição',
  resultado: 'SUCESSO',
  nivelCriticidade: 'ALTO',
  dadosAnteriores: { antes: 'valor' },
  dadosNovos: { depois: 'valor' }
});
```

---

## 📊 Exemplos de Uso

### Investigar Tentativas de Invasão

```bash
GET /audit/logs?categoria=AUTENTICACAO&resultado=FALHA&dataInicio=2025-11-01
```

### Auditar Alterações em Salários

```bash
GET /audit/logs?acao=EDITAR_SALARIO&nivelCriticidade=CRITICO
```

### Rastrear Ações de Usuário

```bash
GET /audit/logs?usuarioId=5&orderBy=data_hora&orderDir=DESC
```

### Gerar Relatório de Conformidade

```bash
GET /audit/export?formato=csv&dataInicio=2025-01-01&dataFim=2025-12-31
```

---

## 🗂️ Estrutura de Arquivos

```
backend/
├── src/
│   ├── controllers/
│   │   └── AuditController.js          # Controller principal
│   ├── middleware/
│   │   └── audit.js                    # Middleware de captura
│   ├── routes/
│   │   └── audit.js                    # 11 endpoints
│   └── examples/
│       └── audit-integration-examples.js # 7 exemplos
├── tests/
│   └── audit.test.js                   # 25+ testes
├── tools/
│   └── populate_audit_data.js          # Popular dados de teste
├── AUDIT_QUICK_START.md                # ⚡ Início rápido
├── AUDIT_SYSTEM_README.md              # 📚 Docs completas
└── AUDIT_IMPLEMENTATION_SUMMARY.md     # 🏗️ Resumo técnico
```

---

## 🧪 Testes

```bash
# Executar testes
cd backend
npm test audit.test.js

# Popular dados de exemplo
node tools/populate_audit_data.js

# Limpar dados de exemplo
node tools/populate_audit_data.js limpar
```

---

## 📋 Critérios de Aceitação

| Critério | Status | Notas |
|----------|--------|-------|
| Logs incluem usuário, ação, data e hora | ✅ | Todos os campos + metadados extras |
| Filtros permitem busca rápida | ✅ | 10 parâmetros de filtro |
| Armazenamento seguro e imutável | ✅ | Hash SHA-256 + Triggers |

---

## 🎓 Conceitos Implementados

### Imutabilidade

```sql
-- Triggers impedem modificação/exclusão
UPDATE audit_logs SET acao = 'X' WHERE id = 1;
-- ❌ Erro: Logs de auditoria são imutáveis

DELETE FROM audit_logs WHERE id = 1;
-- ❌ Erro: Logs de auditoria são imutáveis
```

### Integridade

```bash
GET /audit/logs/123/verify

# Resposta:
{
  "integro": true,
  "hashArmazenado": "abc123...",
  "hashCalculado": "abc123...",
  "mensagem": "Log íntegro - não foi modificado"
}
```

---

## 🏆 Diferenciais

### Além dos Requisitos

Esta implementação vai **ALÉM** da US-E6-02:

- ✅ **Requisito**: Logs com usuário, ação, data
- 🚀 **Extra**: + IP, User Agent, dados antes/depois, metadata

- ✅ **Requisito**: Filtros para busca
- 🚀 **Extra**: 10 parâmetros + busca textual + ordenação

- ✅ **Requisito**: Armazenamento seguro
- 🚀 **Extra**: Hash SHA-256 + Verificação de integridade + Exportação

### Funcionalidades Bônus

- 📊 Dashboard de estatísticas
- 📈 Métricas agregadas
- 📥 Exportação JSON/CSV
- 🔍 Verificação de integridade
- 🤖 Captura automática (40+ ações)
- 📝 Documentação completa
- 🧪 25+ testes automatizados
- 🛠️ Scripts auxiliares

---

## 🎯 Status

**✅ IMPLEMENTAÇÃO COMPLETA**

- Prioridade: Should
- Story Points: 8 (estimado)
- Story Points Entregues: 12+ (com extras)
- Data: 14 de Novembro de 2025

---

## 📞 Suporte

1. Leia: [`AUDIT_QUICK_START.md`](AUDIT_QUICK_START.md)
2. Consulte: [`AUDIT_SYSTEM_README.md`](AUDIT_SYSTEM_README.md)
3. Veja exemplos: [`audit-integration-examples.js`](src/examples/audit-integration-examples.js)
4. Execute testes: `npm test audit.test.js`

---

## 📄 Licença

Este módulo faz parte do sistema RH-Master e segue a mesma licença do projeto principal.

---

**Desenvolvido com 🔒 para garantir segurança e conformidade**
