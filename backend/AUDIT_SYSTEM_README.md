# Sistema de Auditoria e Logs de Segurança

## US-E6-02 - Auditoria e Logs de Segurança

**Descrição**: Sistema completo de auditoria que registra todas as ações sensíveis do sistema de forma segura e imutável.

---

## 📋 Visão Geral

O sistema de auditoria captura automaticamente ações sensíveis no sistema RH-Master, armazenando informações detalhadas sobre:
- Quem realizou a ação
- Qual ação foi realizada
- Quando foi realizada
- Resultado da ação (sucesso, falha, negado)
- Dados antes e depois da alteração
- Metadados (IP, User Agent, etc.)

### ✅ Critérios de Aceitação

- ✅ Logs incluem usuário, ação, data e hora
- ✅ Filtros permitem busca rápida por tipo de ação
- ✅ Logs são armazenados de forma segura e imutável

---

## 🔒 Segurança e Imutabilidade

### Proteções Implementadas

1. **Hash de Integridade (SHA-256)**
   - Cada log recebe um hash calculado automaticamente
   - O hash garante que qualquer tentativa de adulteração seja detectada
   - Inclui todos os campos críticos do log

2. **Imutabilidade**
   - Triggers do PostgreSQL impedem UPDATE e DELETE em `audit_logs`
   - Tentativas de modificação geram exceção
   - Garantia de histórico completo e inalterado

3. **Trigger Automático**
   - Hash calculado automaticamente antes do INSERT
   - Não requer intervenção manual

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,                    -- ID do usuário que executou a ação
  usuario_nome VARCHAR(100),             -- Nome do usuário (desnormalizado para histórico)
  usuario_email VARCHAR(100),            -- Email do usuário (desnormalizado para histórico)
  acao VARCHAR(100) NOT NULL,            -- Tipo da ação (LOGIN, CRIAR_USUARIO, etc)
  categoria VARCHAR(50) NOT NULL,        -- Categoria (AUTENTICACAO, USUARIO, FOLHA, etc)
  descricao TEXT,                        -- Descrição detalhada da ação
  endpoint VARCHAR(255),                 -- Rota HTTP acessada
  metodo VARCHAR(10),                    -- Método HTTP (GET, POST, PUT, DELETE)
  ip_address VARCHAR(45),                -- Endereço IP (suporta IPv4 e IPv6)
  user_agent TEXT,                       -- User Agent do navegador/cliente
  resultado VARCHAR(20) DEFAULT 'SUCESSO', -- SUCESSO, FALHA, NEGADO
  dados_anteriores JSONB,                -- Estado anterior (para alterações)
  dados_novos JSONB,                     -- Estado novo (para alterações)
  metadata JSONB,                        -- Informações adicionais
  nivel_criticidade VARCHAR(20) DEFAULT 'BAIXO', -- BAIXO, MEDIO, ALTO, CRITICO
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hash_integridade VARCHAR(64)           -- Hash SHA-256 para garantir imutabilidade
);
```

### Índices Otimizados

```sql
CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX idx_audit_logs_categoria ON audit_logs(categoria);
CREATE INDEX idx_audit_logs_data_hora ON audit_logs(data_hora DESC);
CREATE INDEX idx_audit_logs_resultado ON audit_logs(resultado);
CREATE INDEX idx_audit_logs_nivel ON audit_logs(nivel_criticidade);
CREATE INDEX idx_audit_logs_composite ON audit_logs(categoria, acao, data_hora DESC);
```

---

## 📡 API Endpoints

### Base URL
```
/audit
```

### Autenticação
Todas as rotas requerem autenticação via JWT e perfil de **Administrador** ou **Auditor**.

---

### 1. Consultar Logs

**Endpoint**: `GET /audit/logs`

**Descrição**: Consulta logs de auditoria com filtros avançados e paginação.

**Query Parameters**:
- `usuarioId` (number): Filtrar por ID do usuário
- `acao` (string): Filtrar por tipo de ação
- `categoria` (string): Filtrar por categoria
- `resultado` (string): Filtrar por resultado (SUCESSO, FALHA, NEGADO)
- `nivelCriticidade` (string): Filtrar por criticidade (BAIXO, MEDIO, ALTO, CRITICO)
- `dataInicio` (string): Data inicial (ISO 8601)
- `dataFim` (string): Data final (ISO 8601)
- `busca` (string): Busca textual em vários campos
- `page` (number): Página (padrão: 1)
- `limit` (number): Registros por página (padrão: 50, máx: 1000)
- `orderBy` (string): Campo para ordenação (data_hora, acao, categoria, etc)
- `orderDir` (string): Direção da ordenação (ASC, DESC)

**Exemplo de Requisição**:
```bash
GET /audit/logs?categoria=AUTENTICACAO&resultado=FALHA&page=1&limit=20
Authorization: Bearer <token>
```

**Resposta**:
```json
{
  "logs": [
    {
      "id": 1234,
      "usuario_id": 5,
      "usuario_nome": "João Silva",
      "usuario_email": "joao@empresa.com",
      "acao": "LOGIN",
      "categoria": "AUTENTICACAO",
      "descricao": "POST /login - Status: 401",
      "endpoint": "/login",
      "metodo": "POST",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "resultado": "FALHA",
      "dados_anteriores": null,
      "dados_novos": null,
      "metadata": { "statusCode": 401 },
      "nivel_criticidade": "MEDIO",
      "data_hora": "2025-11-14T10:30:00Z",
      "hash_integridade": "a1b2c3d4..."
    }
  ],
  "paginacao": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 2. Obter Log Específico

**Endpoint**: `GET /audit/logs/:id`

**Descrição**: Obtém detalhes completos de um log específico.

**Exemplo**:
```bash
GET /audit/logs/1234
Authorization: Bearer <token>
```

---

### 3. Estatísticas de Auditoria

**Endpoint**: `GET /audit/statistics`

**Descrição**: Retorna estatísticas e métricas agregadas dos logs.

**Query Parameters**:
- `dataInicio` (string): Data inicial para estatísticas
- `dataFim` (string): Data final para estatísticas

**Resposta**:
```json
{
  "total": 10523,
  "porCategoria": [
    { "categoria": "AUTENTICACAO", "quantidade": 2500 },
    { "categoria": "USUARIO", "quantidade": 1800 },
    { "categoria": "FOLHA_PAGAMENTO", "quantidade": 450 }
  ],
  "porAcao": [
    { "acao": "LOGIN", "quantidade": 2000 },
    { "acao": "EDITAR_USUARIO", "quantidade": 800 }
  ],
  "porResultado": [
    { "resultado": "SUCESSO", "quantidade": 9800 },
    { "resultado": "FALHA", "quantidade": 500 },
    { "resultado": "NEGADO", "quantidade": 223 }
  ],
  "porCriticidade": [
    { "nivel_criticidade": "CRITICO", "quantidade": 120 },
    { "nivel_criticidade": "ALTO", "quantidade": 890 },
    { "nivel_criticidade": "MEDIO", "quantidade": 3500 },
    { "nivel_criticidade": "BAIXO", "quantidade": 6013 }
  ],
  "usuariosMaisAtivos": [
    { "usuario_nome": "Admin", "usuario_email": "admin@empresa.com", "quantidade": 1500 }
  ],
  "atividadePorDia": [
    { "data": "2025-11-14", "quantidade": 350 },
    { "data": "2025-11-13", "quantidade": 420 }
  ]
}
```

---

### 4. Verificar Integridade

**Endpoint**: `GET /audit/logs/:id/verify`

**Descrição**: Verifica a integridade de um log recalculando seu hash.

**Resposta**:
```json
{
  "id": 1234,
  "integro": true,
  "hashArmazenado": "a1b2c3d4e5f6...",
  "hashCalculado": "a1b2c3d4e5f6...",
  "mensagem": "Log íntegro - não foi modificado"
}
```

Se o log foi comprometido:
```json
{
  "id": 1234,
  "integro": false,
  "hashArmazenado": "a1b2c3d4e5f6...",
  "hashCalculado": "x9y8z7w6v5u4...",
  "mensagem": "ALERTA: Log pode ter sido comprometido!"
}
```

---

### 5. Exportar Logs

**Endpoint**: `GET /audit/export`

**Descrição**: Exporta logs para auditoria externa.

**Query Parameters**:
- `formato` (string): Formato de exportação (json, csv)
- Aceita os mesmos filtros de `/audit/logs`

**Exemplo**:
```bash
GET /audit/export?formato=csv&categoria=FOLHA_PAGAMENTO&dataInicio=2025-01-01
Authorization: Bearer <token>
```

---

### 6. Listar Ações Disponíveis

**Endpoint**: `GET /audit/actions`

**Descrição**: Lista todos os tipos de ações registradas no sistema.

---

### 7. Listar Categorias

**Endpoint**: `GET /audit/categories`

**Descrição**: Lista todas as categorias disponíveis com contadores.

---

### 8. Usuários com Atividades

**Endpoint**: `GET /audit/users`

**Descrição**: Lista usuários que possuem atividades auditadas.

---

### 9. Ações Recentes

**Endpoint**: `GET /audit/recent`

**Descrição**: Retorna as últimas 100 ações registradas.

---

### 10. Ações Críticas

**Endpoint**: `GET /audit/critical`

**Descrição**: Retorna ações de criticidade alta e crítica.

**Query Parameters**:
- `limit` (number): Número máximo de registros (padrão: 100)

---

### 11. Tentativas Falhas

**Endpoint**: `GET /audit/failed`

**Descrição**: Retorna tentativas de ações que falharam ou foram negadas.

---

## 🎯 Categorias de Ações

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| `AUTENTICACAO` | Ações de autenticação | LOGIN, LOGOUT |
| `USUARIO` | Gerenciamento de usuários | CRIAR_USUARIO, EDITAR_USUARIO, EXCLUIR_USUARIO |
| `FOLHA_PAGAMENTO` | Folha de pagamento | CRIAR_FOLHA, EDITAR_FOLHA, EXCLUIR_FOLHA |
| `BENEFICIO` | Benefícios | CRIAR_BENEFICIO, EDITAR_BENEFICIO |
| `DOCUMENTO` | Documentos | UPLOAD_DOCUMENTO, VISUALIZAR_DOCUMENTO, EXCLUIR_DOCUMENTO |
| `RELATORIO` | Relatórios | GERAR_RELATORIO, CONSULTAR_RELATORIO |
| `SOLICITACAO` | Solicitações | CRIAR_SOLICITACAO, APROVAR_SOLICITACAO, REJEITAR_SOLICITACAO |
| `FERIAS` | Férias | SOLICITAR_FERIAS, APROVAR_FERIAS |
| `PONTO` | Registro de ponto | REGISTRAR_PONTO, EDITAR_PONTO, EXCLUIR_PONTO |

---

## ⚡ Níveis de Criticidade

| Nível | Descrição | Exemplos |
|-------|-----------|----------|
| `BAIXO` | Ações de leitura e operações rotineiras | LOGIN, VISUALIZAR_DOCUMENTO, REGISTRAR_PONTO |
| `MEDIO` | Ações de escrita e geração | CRIAR_SOLICITACAO, GERAR_RELATORIO, UPLOAD_DOCUMENTO |
| `ALTO` | Alterações em dados sensíveis | EDITAR_USUARIO, EDITAR_FOLHA, APROVAR_FERIAS, EXCLUIR_DOCUMENTO |
| `CRITICO` | Operações de exclusão e alterações críticas | EXCLUIR_USUARIO, EXCLUIR_FOLHA, EXCLUIR_PONTO |

---

## 🔄 Captura Automática

O sistema captura automaticamente ações sensíveis através do middleware `auditMiddleware`. Ações monitoradas incluem:

- ✅ Login e Logout
- ✅ CRUD de Usuários
- ✅ CRUD de Folha de Pagamento
- ✅ CRUD de Benefícios
- ✅ Upload e acesso a documentos
- ✅ Geração de relatórios
- ✅ Aprovação/Rejeição de solicitações
- ✅ Gestão de férias
- ✅ Alterações em registro de ponto

---

## 💡 Uso Programático

### Registrar Log Manualmente

```javascript
import AuditController from '../controllers/AuditController.js';

await AuditController.registrarLog({
  usuarioId: 5,
  usuarioNome: "João Silva",
  usuarioEmail: "joao@empresa.com",
  acao: "EXPORTAR_DADOS",
  categoria: "RELATORIO",
  descricao: "Exportou dados de funcionários",
  endpoint: "/api/relatorios/export",
  metodo: "GET",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  resultado: "SUCESSO",
  nivelCriticidade: "ALTO",
  metadata: { formato: "csv", registros: 150 }
});
```

### Usar Helper em Controllers

```javascript
import { registrarAuditoriaManual } from '../middleware/audit.js';

// No seu controller
async minhaFuncao(req, res) {
  // ... lógica do controller ...
  
  await registrarAuditoriaManual(req, {
    acao: "ACAO_ESPECIAL",
    categoria: "CATEGORIA",
    descricao: "Descrição da ação",
    resultado: "SUCESSO",
    nivelCriticidade: "ALTO",
    dadosNovos: { campo: "valor" }
  });
  
  res.json({ success: true });
}
```

---

## 📊 Casos de Uso

### 1. Investigar Tentativas de Acesso Não Autorizado

```bash
GET /audit/logs?categoria=AUTENTICACAO&resultado=NEGADO&dataInicio=2025-11-01
```

### 2. Auditar Alterações em Folha de Pagamento

```bash
GET /audit/logs?categoria=FOLHA_PAGAMENTO&acao=EDITAR_FOLHA_PAGAMENTO&dataInicio=2025-11-01&dataFim=2025-11-30
```

### 3. Monitorar Ações de um Usuário Específico

```bash
GET /audit/logs?usuarioId=5&orderBy=data_hora&orderDir=DESC
```

### 4. Gerar Relatório de Conformidade

```bash
GET /audit/export?formato=csv&dataInicio=2025-01-01&dataFim=2025-12-31
```

### 5. Verificar Integridade de Logs Críticos

```bash
GET /audit/critical?limit=50
# Para cada log, verificar:
GET /audit/logs/{id}/verify
```

---

## 🛡️ Boas Práticas

1. **Retenção de Logs**: Configure políticas de retenção baseadas em requisitos legais
2. **Backup Regular**: Faça backup dos logs de auditoria regularmente
3. **Monitoramento**: Configure alertas para ações críticas e falhas
4. **Revisão Periódica**: Realize auditorias periódicas dos logs
5. **Controle de Acesso**: Apenas administradores e auditores devem acessar logs

---

## 🔧 Configuração

### Variáveis de Ambiente

Nenhuma configuração adicional é necessária. O sistema usa as configurações padrão do banco de dados.

---

## ✅ Checklist de Implementação

- ✅ Tabela `audit_logs` criada com todos os campos necessários
- ✅ Triggers para hash de integridade implementados
- ✅ Triggers para imutabilidade implementados
- ✅ Índices otimizados criados
- ✅ Controller de auditoria implementado
- ✅ Middleware de captura automática implementado
- ✅ Rotas de consulta e filtros implementadas
- ✅ Sistema de exportação implementado
- ✅ Verificação de integridade implementada
- ✅ Estatísticas e dashboards implementados
- ✅ Documentação completa criada

---

## 📝 Exemplo Completo de Fluxo

1. **Usuário faz login** → Sistema registra automaticamente no audit_logs
2. **Usuário edita salário** → Sistema captura dados anteriores e novos
3. **Auditor consulta logs** → Filtra por categoria "FOLHA_PAGAMENTO"
4. **Auditor verifica integridade** → Confirma que logs não foram alterados
5. **Auditor exporta relatório** → Gera CSV para análise externa

---

## 🎓 Conclusão

O sistema de auditoria implementado atende completamente aos requisitos da US-E6-02:

✅ **Logs detalhados**: Incluem usuário, ação, data/hora e muito mais  
✅ **Filtros avançados**: Busca rápida por categoria, ação, período, etc  
✅ **Armazenamento seguro**: Hash SHA-256 e triggers de imutabilidade  
✅ **Pronto para produção**: Otimizado, documentado e testável

---

**Prioridade**: Should  
**Story Points**: 8  
**Status**: ✅ Implementado
