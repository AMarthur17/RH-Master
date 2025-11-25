# 🎯 Plano de Melhoria da Cobertura RBAC

## 📊 Situação Atual

| Perfil | Cobertura Atual | Meta | Gap | Prioridade |
|--------|----------------|------|-----|------------|
| **Admin** | 100% (10/10) | 100% | 0 | ✅ Completo |
| **Colaborador** | 77.78% (7/9) | 100% | 2 funcionalidades | 🔴 ALTA |
| **Gerente** | 0% (0/5) | 100% | 5 funcionalidades | 🔴 CRÍTICA |
| **RH** | 20% (1/5) | 100% | 4 funcionalidades | 🔴 CRÍTICA |

**Cobertura Total**: 62.07% → **Meta: 100%**

---

## 🚨 Vulnerabilidades por Prioridade

### 🔴 RISCO CRÍTICO - Implementar IMEDIATAMENTE

#### 1. VER_FOLHA_PROPRIA (Colaborador)
- **Rota**: `GET /api/folha/:usuarioId`
- **Arquivo**: `backend/src/routes/folhaPagamento.routes.js`
- **Problema**: Qualquer colaborador pode ver a folha de qualquer outro
- **Solução**: Adicionar verificação de que o usuário só vê sua própria folha ou permitir admin/rh

```javascript
// ANTES (vulnerável):
router.get("/:usuarioId", autenticar, getFolhaUsuario);

// DEPOIS (seguro):
router.get("/:usuarioId", autenticar, permitir(["admin", "administrador", "rh", "colaborador"]), getFolhaUsuario);

// E no controller, adicionar verificação:
if (req.user.perfil.toLowerCase() === 'colaborador' && req.user.id !== parseInt(usuarioId)) {
  return res.status(403).json({ error: "Você só pode ver sua própria folha" });
}
```

#### 2. PROCESSAR_FOLHA (RH)
- **Rota**: `POST /api/folha/gerar`
- **Arquivo**: `backend/src/routes/folhaPagamento.routes.js`
- **Problema**: Qualquer usuário autenticado pode processar folha
- **Solução**: Restringir apenas para Admin e RH

```javascript
// ANTES (vulnerável):
router.post("/gerar", autenticar, gerarFolha);

// DEPOIS (seguro):
router.post("/gerar", autenticar, permitir(["admin", "administrador", "rh"]), gerarFolha);
```

---

### 🟠 RISCO ALTO - Implementar em 1 Semana

#### 3. UPLOAD_DOCUMENTOS (Colaborador)
- **Rota**: `POST /api/documentos/:usuario_id`
- **Arquivo**: `backend/src/routes/documentos.js`
- **Problema**: Apenas admin pode fazer upload, colaborador deveria poder fazer upload de seus documentos
- **Solução**: Permitir colaborador fazer upload apenas de seus próprios documentos

```javascript
// ANTES (muito restritivo):
router.post("/:usuario_id", autenticar, permitir(["admin", "administrador"]), upload.single("arquivo"), ...);

// DEPOIS (seguro e funcional):
router.post("/:usuario_id", autenticar, verificarProprioOuAdmin, upload.single("arquivo"), ...);

// Criar middleware verificarProprioOuAdmin:
function verificarProprioOuAdmin(req, res, next) {
  const { usuario_id } = req.params;
  const perfil = (req.user?.perfil || "").toLowerCase();
  
  if (perfil === "admin" || perfil === "administrador") {
    return next(); // Admin pode fazer upload para qualquer um
  }
  
  if (req.user.id === parseInt(usuario_id)) {
    return next(); // Colaborador pode fazer upload para si mesmo
  }
  
  return res.status(403).json({ error: "Você só pode fazer upload de seus próprios documentos" });
}
```

#### 4. GERENCIAR_BENEFICIOS_GERAL (RH)
- **Rota**: `POST /api/beneficios`
- **Arquivo**: `backend/src/routes/beneficios.js`
- **Problema**: Precisa verificar se a rota existe e adicionar RBAC
- **Solução**: Restringir para Admin e RH

```javascript
router.post("/", autenticar, permitir(["admin", "administrador", "rh"]), criarBeneficio);
```

#### 5-8. Funcionalidades do Gerente
- **VER_EQUIPE**: `GET /api/usuario/equipe`
- **APROVAR_FERIAS_EQUIPE**: `PUT /api/solicitacoes/:id/aprovar`
- **VER_PONTOS_EQUIPE**: `GET /api/registro-ponto/equipe`
- **GERAR_RELATORIO_EQUIPE**: `GET /api/relatorios/equipe`
- **EDITAR_PONTO_EQUIPE**: `PUT /api/registro-ponto/:id`

**Solução Geral para Gerente**:
```javascript
// Adicionar em todas as rotas de gerente:
router.get("/equipe", autenticar, permitir(["admin", "administrador", "gerente"]), ...);
router.put("/:id/aprovar", autenticar, permitir(["admin", "administrador", "gerente"]), ...);
```

---

## 📝 Implementação Passo a Passo

### Fase 1: CRÍTICO (Hoje)

#### Passo 1.1: Corrigir Folha de Pagamento

**Arquivo**: `backend/src/routes/folhaPagamento.routes.js`

```javascript
import express from "express";
import { gerarFolha, getFolhaUsuario, efetivarFolha } from "../controllers/folhaPagamento.controller.js";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

// CRÍTICO: Processar folha - Apenas Admin e RH
router.post("/gerar", autenticar, permitir(["admin", "administrador", "rh"]), gerarFolha);

// CRÍTICO: Ver folha - Colaborador vê apenas a própria, Admin/RH veem todas
router.get("/:usuarioId", autenticar, permitir(["admin", "administrador", "rh", "colaborador"]), getFolhaUsuario);

// ALTO: Efetivar folha - Apenas Admin e RH
router.put("/:folhaId/efetivar", autenticar, permitir(["admin", "administrador", "rh"]), efetivarFolha);

export default router;
```

**Arquivo**: `backend/src/controllers/folhaPagamento.controller.js`

Adicionar no método `getFolhaUsuario`:
```javascript
export async function getFolhaUsuario(req, res) {
  const { usuarioId } = req.params;
  const perfil = (req.user?.perfil || "").toLowerCase();
  
  // RBAC: Colaborador só pode ver sua própria folha
  if (perfil === 'colaborador' && req.user.id !== parseInt(usuarioId)) {
    return res.status(403).json({ 
      error: "Acesso negado. Você só pode visualizar sua própria folha de pagamento." 
    });
  }
  
  // ... resto do código
}
```

#### Passo 1.2: Criar Middleware de Verificação

**Arquivo**: `backend/src/middleware/verificarProprio.js` (criar novo)

```javascript
/**
 * Middleware para verificar se o usuário está acessando seus próprios dados
 * ou se é admin/administrador
 */
export function verificarProprioOuAdmin(paramName = 'usuario_id') {
  return (req, res, next) => {
    const targetUserId = parseInt(req.params[paramName] || req.body[paramName]);
    const perfil = (req.user?.perfil || "").toLowerCase();
    const currentUserId = req.user?.id;

    // Admin pode acessar qualquer recurso
    if (perfil === "admin" || perfil === "administrador") {
      return next();
    }

    // Usuário só pode acessar seus próprios dados
    if (currentUserId === targetUserId) {
      return next();
    }

    return res.status(403).json({ 
      error: "Acesso negado. Você só pode acessar seus próprios recursos." 
    });
  };
}

/**
 * Middleware específico para gerentes - verifica se gerencia a equipe
 */
export function verificarGerenteOuAdmin(req, res, next) {
  const perfil = (req.user?.perfil || "").toLowerCase();
  
  if (perfil === "admin" || perfil === "administrador" || perfil === "gerente") {
    return next();
  }
  
  return res.status(403).json({ 
    error: "Acesso negado. Apenas gerentes e administradores podem acessar este recurso." 
  });
}
```

---

### Fase 2: ALTO (Esta Semana)

#### Passo 2.1: Corrigir Upload de Documentos

**Arquivo**: `backend/src/routes/documentos.js`

```javascript
import { verificarProprioOuAdmin } from "../middleware/verificarProprio.js";

// Upload - Colaborador pode fazer upload de seus documentos, Admin pode fazer de qualquer um
router.post(
  "/:usuario_id",
  autenticar,
  verificarProprioOuAdmin('usuario_id'),
  upload.single("arquivo"),
  async (req, res) => {
    // ... código existente
  }
);
```

#### Passo 2.2: Proteger Rotas de Gerente

**Criar/Verificar**: `backend/src/routes/usuarios.js`

```javascript
// Ver equipe - Gerentes veem sua equipe, Admin vê todos
router.get("/equipe", autenticar, permitir(["admin", "administrador", "gerente"]), listarEquipe);
```

**Arquivo**: `backend/src/routes/registro-ponto.js`

```javascript
// Ver pontos da equipe
router.get("/equipe", autenticar, permitir(["admin", "administrador", "gerente"]), verPontosEquipe);

// Editar ponto da equipe
router.put("/:id", autenticar, permitir(["admin", "administrador", "gerente"]), editarPonto);
```

**Arquivo**: `backend/src/routes/relatorios.js`

```javascript
// Gerar relatório da equipe
router.get("/equipe", autenticar, permitir(["admin", "administrador", "gerente"]), gerarRelatorioEquipe);
```

**Arquivo**: `backend/src/routes/solicitacoes.js`

```javascript
// Aprovar férias da equipe
router.put("/:id/aprovar", autenticar, permitir(["admin", "administrador", "gerente"]), aprovarFerias);
```

#### Passo 2.3: Proteger Rotas de RH

**Arquivo**: `backend/src/routes/usuarios.js`

```javascript
// Cadastrar colaborador
router.post("/cadastrar", autenticar, permitir(["admin", "administrador", "rh"]), cadastrarColaborador);
```

**Arquivo**: `backend/src/routes/beneficios.js`

```javascript
// Gerenciar benefícios
router.post("/", autenticar, permitir(["admin", "administrador", "rh"]), criarBeneficio);
router.put("/:id", autenticar, permitir(["admin", "administrador", "rh"]), atualizarBeneficio);
router.delete("/:id", autenticar, permitir(["admin", "administrador", "rh"]), deletarBeneficio);
```

**Arquivo**: `backend/src/routes/relatorios.js`

```javascript
// Relatórios de RH
router.get("/rh", autenticar, permitir(["admin", "administrador", "rh"]), gerarRelatorioRH);
```

---

## 🔄 Atualizar Tabela access_rules

Após implementar cada correção, atualizar o banco:

```sql
-- Marcar funcionalidades como protegidas conforme forem implementadas
UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = 'colaborador' AND funcionalidade = 'VER_FOLHA_PROPRIA';
UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = 'rh' AND funcionalidade = 'PROCESSAR_FOLHA';
UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = 'colaborador' AND funcionalidade = 'UPLOAD_DOCUMENTOS';
UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = 'gerente';
UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = 'rh' AND funcionalidade != 'PROCESSAR_FOLHA';
```

Ou via script:

```javascript
// backend/tools/update_rbac_status.js
import db from "../src/db.js";

async function atualizarStatus() {
  const funcionalidadesImplementadas = [
    { perfil: 'colaborador', funcionalidade: 'VER_FOLHA_PROPRIA' },
    { perfil: 'rh', funcionalidade: 'PROCESSAR_FOLHA' },
    { perfil: 'colaborador', funcionalidade: 'UPLOAD_DOCUMENTOS' },
    { perfil: 'gerente', funcionalidade: 'VER_EQUIPE' },
    // ... adicionar conforme implementa
  ];

  for (const func of funcionalidadesImplementadas) {
    await db.query(
      'UPDATE access_rules SET tem_rbac = TRUE WHERE perfil = $1 AND funcionalidade = $2',
      [func.perfil, func.funcionalidade]
    );
    console.log(`✅ ${func.perfil} - ${func.funcionalidade} marcado como protegido`);
  }
}

atualizarStatus().then(() => process.exit(0));
```

---

## 📈 Roadmap de Melhoria

### Semana 1 (Atual)
- [x] Identificar vulnerabilidades (CONCLUÍDO)
- [ ] Implementar proteção CRÍTICA (folha de pagamento)
- [ ] Criar middlewares auxiliares
- [ ] Atualizar tabela access_rules

### Semana 2
- [ ] Implementar proteção ALTA (upload, gerente)
- [ ] Adicionar testes de RBAC
- [ ] Documentar mudanças

### Semana 3
- [ ] Implementar funcionalidades restantes de RH
- [ ] Revisar todas as rotas
- [ ] Atingir 100% de cobertura

### Semana 4
- [ ] Auditoria completa
- [ ] Configurar alertas automáticos
- [ ] Treinamento da equipe

---

## ✅ Checklist de Implementação

### Crítico (Fazer Hoje)
- [ ] Adicionar RBAC em `POST /api/folha/gerar` (RH, Admin)
- [ ] Adicionar RBAC em `GET /api/folha/:usuarioId` (Colaborador próprio, RH, Admin)
- [ ] Adicionar verificação no controller da folha
- [ ] Criar middleware `verificarProprioOuAdmin`
- [ ] Testar manualmente as rotas críticas
- [ ] Atualizar status no banco de dados

### Alto (Esta Semana)
- [ ] Proteger upload de documentos
- [ ] Proteger todas as rotas de gerente (5 rotas)
- [ ] Proteger rotas de RH restantes (3 rotas)
- [ ] Criar testes automatizados
- [ ] Documentar mudanças

### Validação Final
- [ ] Rodar script de população
- [ ] Verificar cobertura: deve estar próxima de 100%
- [ ] Testar cada perfil manualmente
- [ ] Verificar logs de auditoria

---

## 🧪 Como Testar

### Teste Manual das Correções

```bash
# 1. Criar usuários de teste (se ainda não existem)
docker exec -it rh_master_db psql -U postgres -d rh_master -c "
INSERT INTO usuario (nome, cpf, email, senha, cargo, empresa, salario) VALUES
('Colaborador Teste', '11111111111', 'colab@test.com', '\$2b\$10\$hash...', 'colaborador', 'Test', 3000),
('Gerente Teste', '22222222222', 'gerente@test.com', '\$2b\$10\$hash...', 'gerente', 'Test', 8000),
('RH Teste', '33333333333', 'rh@test.com', '\$2b\$10\$hash...', 'rh', 'Test', 5000)
ON CONFLICT DO NOTHING;
"

# 2. Testar que colaborador NÃO pode processar folha
# (deve retornar 403 Forbidden)

# 3. Testar que colaborador só vê sua própria folha
# (deve retornar 403 ao tentar ver folha de outro)

# 4. Testar que RH pode processar folha
# (deve retornar 200 OK)
```

### Script de Teste Automatizado

```javascript
// backend/tests/rbac.test.js
describe('RBAC Tests', () => {
  it('Colaborador não deve poder processar folha', async () => {
    const token = await loginAs('colab@test.com');
    const response = await request(app)
      .post('/api/folha/gerar')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('Colaborador só deve ver sua própria folha', async () => {
    const token = await loginAs('colab@test.com', userId: 1);
    const response = await request(app)
      .get('/api/folha/2') // Tentar ver folha de outro usuário
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('RH deve poder processar folha', async () => {
    const token = await loginAs('rh@test.com');
    const response = await request(app)
      .post('/api/folha/gerar')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
```

---

## 📊 Métricas de Sucesso

### Antes
```
Cobertura Total: 62.07%
- Admin: 100%
- Colaborador: 77.78%
- Gerente: 0%
- RH: 20%

Vulnerabilidades: 11
```

### Meta Final
```
Cobertura Total: 100%
- Admin: 100% ✅
- Colaborador: 100% ✅
- Gerente: 100% ✅
- RH: 100% ✅

Vulnerabilidades: 0
```

---

## 🎯 Conclusão

Seguindo este plano, a cobertura RBAC passará de **62.07% para 100%** em aproximadamente 3 semanas, eliminando todas as 11 vulnerabilidades identificadas.

**Prioridade**: Começar pelas funcionalidades CRÍTICAS (folha de pagamento) hoje mesmo!

**Próximo passo imediato**: Implementar as correções da Fase 1 - CRÍTICO.
