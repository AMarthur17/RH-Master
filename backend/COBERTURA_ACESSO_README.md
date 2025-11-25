# Métrica de Segurança: Cobertura de Regras de Acesso por Perfil

## 📊 Visão Geral

Esta métrica mede o nível de controle de acesso implementado no sistema através do RBAC (Role-Based Access Control).

### Fórmula
```
X = (Funcionalidades com RBAC / Total de funcionalidades com acesso restrito) × 100
```

### Interpretação
- **X = 100%**: Indica controle de acesso completo. Abaixo disso, há risco de falhas de segurança.
- **X ≥ 90%**: Muito bom! Alta cobertura de regras de acesso
- **X ≥ 70%**: Bom. Cobertura adequada, mas pode melhorar
- **X ≥ 50%**: Atenção! Cobertura abaixo do ideal
- **X < 50%**: Crítico! Baixa cobertura de regras de acesso

### Tipo de Medida
**Interna** - Avalia controles internos do sistema

---

## 🗄️ Estrutura de Dados

### Tabela: `access_rules`

```sql
CREATE TABLE access_rules (
  id SERIAL PRIMARY KEY,
  perfil VARCHAR(50) NOT NULL,              -- 'admin', 'colaborador', 'gerente', 'rh'
  funcionalidade VARCHAR(100) NOT NULL,      -- Nome da funcionalidade
  endpoint VARCHAR(255),                     -- Endpoint da API
  metodo VARCHAR(10),                        -- GET, POST, PUT, DELETE
  tem_rbac BOOLEAN DEFAULT FALSE,            -- Se tem controle RBAC
  nivel_risco VARCHAR(20) DEFAULT 'MEDIO',   -- BAIXO, MEDIO, ALTO, CRITICO
  descricao TEXT,                            -- Descrição da funcionalidade
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(perfil, funcionalidade)
);
```

### Perfis do Sistema
- **admin/administrador**: Acesso completo ao sistema
- **colaborador**: Funcionalidades básicas (ver perfil, registrar ponto, solicitar férias)
- **gerente**: Funcionalidades intermediárias (gerenciar equipe, aprovar férias)
- **rh**: Funcionalidades de RH (cadastrar colaboradores, processar folha)

---

## 🔌 Endpoints da API

### 1. Calcular Cobertura de Acesso

**GET** `/api/security-metrics/cobertura-acesso`

Calcula a métrica de cobertura de regras de acesso por perfil.

**Autenticação**: Requerida (Admin/Administrador)

**Query Parameters**:
- `perfil` (opcional): Filtrar por perfil específico
- `nivelRisco` (opcional): Filtrar por nível de risco (BAIXO, MEDIO, ALTO, CRITICO)

**Exemplo de Resposta**:
```json
{
  "metrica": "Cobertura de Regras de Acesso por Perfil",
  "formula": "X = (Funcionalidades com RBAC / Total de funcionalidades) × 100%",
  "filtros": {
    "perfil": "Todos",
    "nivelRisco": "Todos"
  },
  "dados": {
    "totalFuncionalidades": 29,
    "totalComRBAC": 18,
    "totalSemRBAC": 11,
    "coberturaPercentual": 62.07
  },
  "interpretacao": "Crítico! Baixa cobertura de acesso.",
  "tipo": "Interna",
  "medida": "Percentual",
  "funcionalidadesSemRBAC": [
    {
      "perfil": "colaborador",
      "funcionalidade": "VER_FOLHA_PROPRIA",
      "endpoint": "/api/folha/:usuarioId",
      "metodo": "GET",
      "nivel_risco": "CRITICO",
      "descricao": "Visualizar própria folha de pagamento"
    }
  ],
  "estatisticasPorPerfil": [
    {
      "perfil": "gerente",
      "total_funcionalidades": 5,
      "com_rbac": 0,
      "cobertura_percentual": 0.00
    },
    {
      "perfil": "admin",
      "total_funcionalidades": 10,
      "com_rbac": 10,
      "cobertura_percentual": 100.00
    }
  ],
  "estatisticasPorNivelRisco": [
    {
      "nivel_risco": "CRITICO",
      "total_funcionalidades": 3,
      "com_rbac": 1,
      "cobertura_percentual": 33.33
    }
  ]
}
```

**Exemplos de Uso**:
```bash
# Todas as funcionalidades
GET /api/security-metrics/cobertura-acesso

# Filtrar por perfil
GET /api/security-metrics/cobertura-acesso?perfil=colaborador

# Filtrar por nível de risco
GET /api/security-metrics/cobertura-acesso?nivelRisco=CRITICO

# Filtros combinados
GET /api/security-metrics/cobertura-acesso?perfil=gerente&nivelRisco=ALTO
```

---

### 2. Registrar/Atualizar Regra de Acesso

**POST** `/api/security-metrics/regras-acesso`

Registra ou atualiza uma regra de acesso no sistema.

**Autenticação**: Requerida (Admin/Administrador)

**Body**:
```json
{
  "perfil": "colaborador",
  "funcionalidade": "UPLOAD_DOCUMENTOS",
  "endpoint": "/api/documentos/upload",
  "metodo": "POST",
  "temRbac": true,
  "nivelRisco": "ALTO",
  "descricao": "Upload de documentos pessoais"
}
```

**Resposta**:
```json
{
  "message": "Regra de acesso registrada com sucesso",
  "regra": {
    "id": 15,
    "perfil": "colaborador",
    "funcionalidade": "UPLOAD_DOCUMENTOS",
    "endpoint": "/api/documentos/upload",
    "metodo": "POST",
    "tem_rbac": true,
    "nivel_risco": "ALTO",
    "descricao": "Upload de documentos pessoais",
    "criado_em": "2025-11-25T10:30:00.000Z",
    "atualizado_em": "2025-11-25T10:30:00.000Z"
  }
}
```

---

### 3. Listar Regras de Acesso

**GET** `/api/security-metrics/regras-acesso`

Lista todas as regras de acesso com filtros opcionais.

**Autenticação**: Requerida (Admin/Administrador)

**Query Parameters**:
- `perfil` (opcional): Filtrar por perfil
- `temRbac` (opcional): Filtrar por presença de RBAC (true/false)
- `nivelRisco` (opcional): Filtrar por nível de risco
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 100)

**Exemplo de Resposta**:
```json
{
  "regras": [
    {
      "id": 1,
      "perfil": "admin",
      "funcionalidade": "CADASTRAR_USUARIO",
      "endpoint": "/api/usuario",
      "metodo": "POST",
      "tem_rbac": true,
      "nivel_risco": "ALTO",
      "descricao": "Criar novos usuários no sistema",
      "criado_em": "2025-11-25T10:00:00.000Z",
      "atualizado_em": "2025-11-25T10:00:00.000Z"
    }
  ],
  "paginacao": {
    "total": 29,
    "page": 1,
    "limit": 100,
    "totalPages": 1
  }
}
```

**Exemplos de Uso**:
```bash
# Todas as regras
GET /api/security-metrics/regras-acesso

# Regras sem RBAC (vulneráveis)
GET /api/security-metrics/regras-acesso?temRbac=false

# Regras de alto risco sem RBAC
GET /api/security-metrics/regras-acesso?temRbac=false&nivelRisco=CRITICO

# Regras do perfil gerente
GET /api/security-metrics/regras-acesso?perfil=gerente
```

---

## 🚀 Como Usar

### 1. Popular Dados de Teste

Execute o script de população de dados:

```bash
docker exec -it rh_master_backend node tools/populate_security_metrics.js
```

Este script irá:
- ✅ Criar 29 regras de acesso para diferentes perfis
- ✅ Configurar quais funcionalidades têm RBAC implementado
- ✅ Definir níveis de risco para cada funcionalidade
- ✅ Calcular e exibir a métrica de cobertura

### 2. Consultar a Métrica via API

**Requisição com autenticação**:

```bash
# 1. Fazer login como administrador
curl -X POST http://localhost:5000/api/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "senha": "senha123"}'

# Resposta conterá o token JWT
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {...}
}

# 2. Usar o token para consultar a métrica
curl -X GET http://localhost:5000/api/security-metrics/cobertura-acesso \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Exemplo com Node.js

```javascript
const axios = require('axios');

async function consultarCoberturaAcesso() {
  // 1. Login
  const loginResponse = await axios.post('http://localhost:5000/api/usuario/login', {
    email: 'admin@example.com',
    senha: 'senha123'
  });
  
  const token = loginResponse.data.token;
  
  // 2. Consultar métrica
  const metricaResponse = await axios.get(
    'http://localhost:5000/api/security-metrics/cobertura-acesso',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  console.log('Cobertura:', metricaResponse.data.dados.coberturaPercentual + '%');
  console.log('Interpretação:', metricaResponse.data.interpretacao);
  
  // 3. Ver funcionalidades sem RBAC
  console.log('\nFuncionalidades vulneráveis:');
  metricaResponse.data.funcionalidadesSemRBAC.forEach(func => {
    console.log(`- ${func.funcionalidade} (${func.nivel_risco})`);
  });
}

consultarCoberturaAcesso();
```

---

## 📈 Exemplos de Resultados

### Resultado Atual do Sistema
```
═══════════════════════════════════════════════════════════
   MÉTRICA: COBERTURA DE REGRAS DE ACESSO POR PERFIL
═══════════════════════════════════════════════════════════
📊 Total de Funcionalidades: 29
✅ Funcionalidades com RBAC: 18
❌ Funcionalidades sem RBAC: 11
📈 Cobertura: 62.07%
═══════════════════════════════════════════════════════════
🔴 Interpretação: Crítico! Baixa cobertura de acesso.

📋 Cobertura por Perfil:
   ❌ gerente: 0/5 (0.00%)
   ❌ rh: 1/5 (20.00%)
   ⚠️ colaborador: 7/9 (77.78%)
   ✅ admin: 10/10 (100.00%)
```

### Funcionalidades Prioritárias para Implementar RBAC

**Risco CRÍTICO** (prioridade máxima):
1. `VER_FOLHA_PROPRIA` - Colaborador visualizar folha de pagamento
2. `PROCESSAR_FOLHA` - RH processar folha de pagamento

**Risco ALTO** (alta prioridade):
3. `UPLOAD_DOCUMENTOS` - Upload de documentos
4. `GERENCIAR_BENEFICIOS_GERAL` - RH gerenciar benefícios
5. `APROVAR_FERIAS_EQUIPE` - Gerente aprovar férias
6. `GERAR_RELATORIO_EQUIPE` - Gerente gerar relatórios
7. `EDITAR_PONTO_EQUIPE` - Gerente editar pontos

---

## 🔍 Insights de Segurança

### Análise por Perfil

**Admin (100% de cobertura)** ✅
- Todas as funcionalidades administrativas têm RBAC
- Controle completo sobre ações sensíveis

**Colaborador (77.78% de cobertura)** ⚠️
- Funcionalidades básicas protegidas
- **Vulnerabilidade**: Acesso à folha de pagamento sem RBAC (CRÍTICO)
- **Vulnerabilidade**: Upload de documentos sem validação adequada

**Gerente (0% de cobertura)** ❌
- Perfil completamente desprotegido
- Urgente: Implementar RBAC para todas as funcionalidades de gerente

**RH (20% de cobertura)** ❌
- Apenas 1 de 5 funcionalidades protegidas
- **Vulnerabilidade crítica**: Processamento de folha sem RBAC

### Recomendações

1. **Imediato**: Implementar RBAC nas funcionalidades de risco CRÍTICO
2. **Curto prazo**: Proteger todas as funcionalidades dos perfis Gerente e RH
3. **Médio prazo**: Alcançar 100% de cobertura em todos os perfis
4. **Contínuo**: Auditar regularmente novas funcionalidades

---

## 🎯 Boas Práticas

### 1. Registro de Novas Funcionalidades
Sempre registre novas funcionalidades na tabela `access_rules`:

```javascript
// Ao criar um novo endpoint
app.post('/api/nova-funcionalidade', 
  autenticar, 
  permitir(['admin']),  // ✅ RBAC implementado
  (req, res) => {
    // Registrar na tabela
    await db.query(`
      INSERT INTO access_rules 
      (perfil, funcionalidade, endpoint, metodo, tem_rbac, nivel_risco, descricao)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['admin', 'NOVA_FUNCIONALIDADE', '/api/nova-funcionalidade', 'POST', true, 'MEDIO', 'Descrição']);
  }
);
```

### 2. Auditoria Regular
Execute a verificação mensalmente:

```bash
# Script de auditoria
docker exec -it rh_master_backend node tools/populate_security_metrics.js
```

### 3. Priorização por Risco
Implemente RBAC seguindo esta ordem:
1. CRITICO → 2. ALTO → 3. MEDIO → 4. BAIXO

---

## 📚 Integração com Sistema de Auditoria

A métrica se integra com o sistema de auditoria existente para rastrear:
- Tentativas de acesso negadas
- Funcionalidades acessadas sem RBAC
- Padrões de uso por perfil

Ver mais em: [AUDIT_SYSTEM_README.md](./AUDIT_SYSTEM_README.md)

---

## ✅ Checklist de Implementação

- [x] Criar tabela `access_rules`
- [x] Implementar método `calcularCoberturaAcesso`
- [x] Implementar método `registrarRegraAcesso`
- [x] Implementar método `listarRegrasAcesso`
- [x] Criar rotas da API
- [x] Popular dados de teste
- [x] Documentação completa
- [ ] Implementar RBAC nas funcionalidades vulneráveis
- [ ] Integrar com dashboard de segurança
- [ ] Configurar alertas automáticos quando cobertura < 80%

---

**Data de Implementação**: 25 de Novembro de 2025  
**Versão**: 1.0  
**Autor**: Sistema RH-Master
