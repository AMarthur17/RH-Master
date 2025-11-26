# Métricas de Segurança - TAC

## Taxa de Autenticação e Controle de Acesso Correto (TAC)

- Fórmula: `TAC = (Nº de acessos autorizados corretamente / Nº de acessos legítimos solicitados) × 100`
- Tipo: Quantitativa — percentual

### Definição operacional
Esta métrica mede a eficácia do controle de acesso (autenticação + autorização por perfil). Para fins práticos, a implementação atual considera:

- Denominador (Nº de acessos legítimos solicitados): entradas em `audit_logs` que correspondem a `access_rules` onde `tem_rbac = TRUE` (ou seja, funcionalidades com RBAC implementado). Filtragem por `perfil` e intervalo de datas é suportada.
- Numerador (Nº de acessos autorizados corretamente): subconjunto das entradas acima cujo campo `resultado` é `SUCESSO`.

### Interpretação

- Valores próximos de 100%: bom funcionamento do controle de acesso.
- 95–99%: aceitável, possíveis negações indevidas em raros casos.
- 90–95%: atenção, revisar regras e logs para identificar causas.
- <90%: investigação urgente — configurações de permissão ou problemas de autenticação podem estar bloqueando acessos legítimos.

### Limitações e observações

- A definição de "legítimo" aqui é operacional (requisitions matched to access_rules); casos onde o `access_rules` está incompleto podem afetar o denominador.
- A métrica não detecta autorizações indevidas (ex.: um usuário sem permissão que obteve sucesso). Para isso, recomenda-se implementar uma métrica complementar que conte `SUCESSO` em ações para perfis sem permissão.

### Endpoint

- `GET /security-metrics/tac`
  - Query params: `perfil` (opcional), `dataInicio` (opcional), `dataFim` (opcional)
  - Retorna JSON com `totalSolicitacoes`, `totalAutorizados`, `tacPercentual`, `interpretacao`.
# Métricas de Segurança - Taxa de Incidentes de Vazamento de Dados

## 📊 Visão Geral

Este módulo implementa a métrica de qualidade **Taxa de Incidentes de Vazamento de Dados** para o sistema RH-Master, cumprindo os requisitos de segurança da informação.

### Atributo de Qualidade: Segurança

**Métrica**: Taxa de Incidentes de Vazamento de Dados

**Fórmula**: 
```
Taxa de Proteção = (1 - (Nº de incidentes / Total de transações)) × 100%
```

**Interpretação**: 
Mede a proporção de operações sem incidentes de vazamento. Valores baixos indicam boa proteção de informações sensíveis.

**Tipo de Medida**: Quantitativa, percentual

---

## 🏗️ Estrutura Implementada

### 1. Tabelas do Banco de Dados

#### `security_incidents`
Registra todos os incidentes de segurança detectados:
- **id**: Identificador único
- **tipo**: Tipo do incidente (VAZAMENTO_DADOS, ACESSO_NAO_AUTORIZADO, etc)
- **severidade**: BAIXA, MEDIA, ALTA, CRITICA
- **descricao**: Descrição detalhada
- **dados_afetados**: Descrição dos dados afetados
- **quantidade_registros**: Quantidade de registros comprometidos
- **origem**: Como foi detectado
- **status**: ABERTO, EM_INVESTIGACAO, RESOLVIDO, FALSO_POSITIVO
- **data_deteccao**: Quando foi detectado
- **data_resolucao**: Quando foi resolvido

#### `data_transactions`
Registra todas as transações de dados do sistema:
- **tipo_transacao**: CONSULTA, CRIACAO, ATUALIZACAO, EXCLUSAO, EXPORTACAO
- **categoria_dados**: USUARIO, FOLHA_PAGAMENTO, DOCUMENTO, etc
- **quantidade_registros**: Quantidade de registros envolvidos
- **sensibilidade**: BAIXA, NORMAL, ALTA, CRITICA
- **data_transacao**: Timestamp da transação

### 2. Controller

`SecurityMetricsController.js` implementa:
- ✅ Cálculo da métrica de vazamento
- ✅ Registro de incidentes
- ✅ Listagem e filtros de incidentes
- ✅ Estatísticas de segurança
- ✅ Detecção automática de padrões suspeitos
- ✅ Atualização de status de incidentes

### 3. Rotas API

Base URL: `/api/security-metrics`

#### GET `/taxa-vazamento`
Calcula a taxa de incidentes de vazamento.

**Query Parameters**:
- `dataInicio` (opcional): Data inicial no formato ISO
- `dataFim` (opcional): Data final no formato ISO
- `tipoIncidente` (opcional): Tipo específico de incidente

**Resposta**:
```json
{
  "metrica": "Taxa de Incidentes de Vazamento de Dados",
  "formula": "(Total de transações / Nº de incidentes) × 100%",
  "periodo": {
    "dataInicio": "2024-01-01",
    "dataFim": "2024-12-31"
  },
  "dados": {
    "totalTransacoes": 10000,
    "totalIncidentes": 5,
    "taxaProtecao": 99.95,
    "proporcaoIncidentes": "0.0500%"
  },
  "interpretacao": "Excelente! Taxa de proteção muito alta.",
  "tipo": "Quantitativa - percentual",
  "incidentesRecentes": [...]
}
```

#### POST `/incidentes`
Registra um novo incidente de segurança.

**Body**:
```json
{
  "tipo": "VAZAMENTO_DADOS",
  "severidade": "ALTA",
  "descricao": "Acesso não autorizado a dados de folha de pagamento",
  "dadosAfetados": "Dados salariais de 50 colaboradores",
  "quantidadeRegistros": 50,
  "origem": "MONITORAMENTO_MANUAL"
}
```

#### GET `/incidentes`
Lista incidentes com filtros.

**Query Parameters**:
- `tipo`: Filtrar por tipo
- `severidade`: Filtrar por severidade
- `status`: Filtrar por status
- `dataInicio`: Data inicial
- `dataFim`: Data final
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 50)

#### PUT `/incidentes/:id`
Atualiza o status de um incidente.

**Body**:
```json
{
  "status": "RESOLVIDO",
  "acaoCorretiva": "Permissões corrigidas e usuários notificados"
}
```

#### GET `/estatisticas`
Retorna estatísticas gerais de segurança.

#### GET `/detectar-vazamentos`
Analisa logs de auditoria para detectar padrões suspeitos:
- Múltiplas tentativas falhas de autenticação
- Exportações massivas de dados
- Acessos fora do horário comercial

---

## 🔄 Integração Automática

### Registro Automático de Transações

O middleware de auditoria foi atualizado para registrar automaticamente cada operação sensível como uma transação de dados. Isso acontece transparentemente para todas as rotas monitoradas.

**Categorias de Sensibilidade**:
- **CRITICA**: Folha de pagamento, benefícios
- **ALTA**: Usuários, documentos
- **NORMAL**: Solicitações, relatórios padrão
- **BAIXA**: Consultas simples

### Detecção Automática de Incidentes

O sistema detecta automaticamente:

1. **Tentativas de Invasão**: 
   - 5+ tentativas falhas de login do mesmo IP em 15 minutos
   - Registra incidente automático de severidade ALTA

2. **Padrões Suspeitos**:
   - Exportações massivas
   - Acessos fora do horário
   - Múltiplas falhas de autenticação

---

## 📈 Como Usar

### 1. Consultar a Métrica

```bash
# Métrica geral (todo o período)
GET /api/security-metrics/taxa-vazamento

# Métrica de um período específico
GET /api/security-metrics/taxa-vazamento?dataInicio=2024-01-01&dataFim=2024-12-31

# Apenas vazamentos de dados
GET /api/security-metrics/taxa-vazamento?tipoIncidente=VAZAMENTO_DADOS
```

### 2. Registrar um Incidente Manualmente

```bash
POST /api/security-metrics/incidentes
Content-Type: application/json

{
  "tipo": "VAZAMENTO_DADOS",
  "severidade": "CRITICA",
  "descricao": "Documento sensível compartilhado incorretamente",
  "dadosAfetados": "Contratos de trabalho",
  "quantidadeRegistros": 10,
  "origem": "RELATO_USUARIO"
}
```

### 3. Investigar Incidentes

```bash
# Listar todos os incidentes abertos
GET /api/security-metrics/incidentes?status=ABERTO

# Incidentes críticos não resolvidos
GET /api/security-metrics/incidentes?severidade=CRITICA&status=ABERTO

# Histórico de incidentes resolvidos
GET /api/security-metrics/incidentes?status=RESOLVIDO&dataInicio=2024-01-01
```

### 4. Resolver um Incidente

```bash
PUT /api/security-metrics/incidentes/123
Content-Type: application/json

{
  "status": "RESOLVIDO",
  "acaoCorretiva": "Permissões revisadas, logs auditados, usuários treinados"
}
```

### 5. Detectar Vazamentos Automáticos

```bash
# Analisar logs dos últimos 7 dias
GET /api/security-metrics/detectar-vazamentos?dataInicio=2024-11-17

# Ver alertas em tempo real
GET /api/security-metrics/detectar-vazamentos
```

---

## 🎯 Interpretação dos Resultados

### Taxa de Proteção

| Taxa | Interpretação | Ação Recomendada |
|------|---------------|------------------|
| 99%+ | Excelente | Manter monitoramento |
| 95-99% | Bom | Revisar incidentes ocasionais |
| 90-95% | Aceitável | Investigar causas recorrentes |
| 80-90% | Preocupante | Ação corretiva urgente |
| <80% | Crítico | Revisão completa de segurança |

### Severidade dos Incidentes

- **BAIXA**: Sem impacto significativo, alerta informativo
- **MEDIA**: Risco moderado, requer atenção
- **ALTA**: Dados sensíveis comprometidos, ação imediata
- **CRITICA**: Vazamento grave, resposta emergencial

---

## 🔧 Configuração Inicial

### 1. Executar Migrations

```bash
# Certifique-se de que o banco está atualizado
docker-compose down
docker-compose up -d
```

As tabelas `security_incidents` e `data_transactions` serão criadas automaticamente pelo `init.sql`.

### 2. Verificar Permissões

Apenas usuários com cargo **Administrador** podem:
- Consultar a métrica
- Registrar incidentes
- Ver estatísticas
- Detectar vazamentos

### 3. Testar a API

```bash
# Health check
curl http://localhost:5000/api/health

# Login como admin
curl -X POST http://localhost:5000/api/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"senha123"}'

# Consultar métrica (use o token retornado)
curl http://localhost:5000/api/security-metrics/taxa-vazamento \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📊 Dashboard Recomendado

Para visualização completa, crie um dashboard com:

1. **KPI Principal**: Taxa de Proteção (%)
2. **Gráfico de Linha**: Evolução de incidentes ao longo do tempo
3. **Gráfico de Pizza**: Incidentes por severidade
4. **Gráfico de Barras**: Incidentes por tipo
5. **Lista**: Últimos 10 incidentes
6. **Alertas**: Detecção automática em tempo real

---

## 🔐 Segurança e Privacidade

- ✅ Logs de auditoria são **imutáveis** (não podem ser alterados/excluídos)
- ✅ Hash de integridade SHA-256 em cada log
- ✅ IPs e User Agents registrados
- ✅ Descrições de incidentes **não incluem dados sensíveis**
- ✅ Referência cruzada com logs de auditoria
- ✅ Rastreabilidade completa de quem detectou/resolveu

---

## 📝 Exemplos de Uso

### Cenário 1: Monitoramento Mensal

```javascript
// Consultar métrica do mês atual
const primeiroDiaMes = new Date(2024, 10, 1).toISOString();
const ultimoDiaMes = new Date(2024, 10, 30).toISOString();

const response = await fetch(
  `/api/security-metrics/taxa-vazamento?dataInicio=${primeiroDiaMes}&dataFim=${ultimoDiaMes}`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const metrica = await response.json();
console.log(`Taxa de Proteção: ${metrica.dados.taxaProtecao}%`);
```

### Cenário 2: Resposta a Incidente

```javascript
// 1. Detectar padrões suspeitos
const alertas = await fetch('/api/security-metrics/detectar-vazamentos');

// 2. Registrar incidente se necessário
if (alertas.totalAlertas > 0) {
  await fetch('/api/security-metrics/incidentes', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo: 'ACESSO_NAO_AUTORIZADO',
      severidade: 'ALTA',
      descricao: 'Múltiplas tentativas de acesso detectadas',
      origem: 'AUDITORIA_AUTOMATICA'
    })
  });
}

// 3. Após investigação, resolver
await fetch('/api/security-metrics/incidentes/123', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'RESOLVIDO',
    acaoCorretiva: 'IP bloqueado, senha resetada'
  })
});
```

---

## 🚀 Próximos Passos

1. ✅ Implementação básica da métrica
2. ✅ Integração com sistema de auditoria
3. ✅ Detecção automática de incidentes
4. 🔄 Dashboard visual no frontend
5. 🔄 Alertas por email para incidentes críticos
6. 🔄 Relatórios automatizados mensais
7. 🔄 Machine Learning para detecção de anomalias

---

## 📚 Referências

- **Atributo de Qualidade**: Segurança
- **Métrica**: Taxa de Incidentes de Vazamento de Dados
- **Fórmula**: (Total de transações / Nº de incidentes) × 100%
- **Tipo**: Quantitativa, percentual
- **Objetivo**: Medir a proporção de operações sem vazamento, indicando boa proteção de dados sensíveis

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do backend: `docker-compose logs backend`
2. Consulte a documentação de auditoria: `AUDIT_README.md`
3. Revise as permissões de usuário no banco de dados

---

**Desenvolvido para RH-Master - Sistema de Gestão de Recursos Humanos**
