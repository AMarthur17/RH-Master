# RNF-04: Cálculo de Horas Extras e Noturnas

## 📋 Visão Geral

Este documento descreve a implementação do RNF-04 (Requisito Não Funcional 04) que adiciona cálculo automatizado de **horas extras** e **horas noturnas** ao sistema de folha de pagamento.

## 🎯 Objetivos

- ✅ Detectar automaticamente horas trabalhadas além de 8h/dia
- ✅ Identificar jornadas em horário noturno (22h-05h)
- ✅ Aplicar multiplicadores corretos de salário
- ✅ Integrar ao cálculo da folha de pagamento
- ✅ Fornecer relatórios de horas extras/noturnas

## 📐 Regras de Cálculo

### 1. Hora Extra (Horas Extras)
- **Definição**: Qualquer hora trabalhada acima de 8h por dia
- **Multiplicador**: 1.5x (150% do valor/hora base)
- **Fórmula**: 
  ```
  Valor Extra = (Horas Extras do Dia - 8h) × Valor Hora Base × 1.5
  ```

### 2. Hora Noturna (Madrugada)
- **Definição**: Horas trabalhadas entre 22h (10 PM) e 05h (5 AM)
- **Multiplicador**: 1.2x (120% = 20% de acréscimo)
- **Fórmula**: 
  ```
  Valor Noturno = Horas Noturnas × Valor Hora Base × 1.2
  ```

### 3. Sobreposição (Hora Extra + Noturna)
Se um período de trabalho se enquadrar **em ambas** as categorias:
- A hora é contada como **noturna extra**
- Ambos os multiplicadores se aplicam acumulativamente

**Exemplo**:
- Trabalhou 22h-06h (8 horas)
- Das 22h-05h = 7 horas noturnas
- 05h-06h = 1 hora normal (mas após 8h do dia, conta como extra)
- **Resultado**: 7h noturnas + 1h extra noturna

## 🗄️ Estrutura de Dados

### Tabela: `registro_ponto`
Campos adicionados:
```sql
hora_inicio TIME,        -- Hora de início da jornada
hora_fim TIME,           -- Hora de término da jornada
tipo_jornada VARCHAR(20) -- 'normal', 'noturna', 'fim-semana', etc.
```

### Tabela: `folha_pagamento`
Campos adicionados:
```sql
horas_extras NUMERIC(10,2),    -- Total de horas extras no mês
valor_extras NUMERIC(12,2),    -- Valor monetário das horas extras
horas_noturnas NUMERIC(10,2),  -- Total de horas noturnas no mês
valor_noturnas NUMERIC(12,2)   -- Valor monetário das horas noturnas
```

## 🔧 Implementação Técnica

### 1. Serviço de Cálculo: `horasExtraService.js`

**Métodos principais**:

#### `calcularHorasExtras(usuarioId, mes, ano)`
- Busca todos os registros de ponto do período
- Agrupa por dia
- Calcula horas normais, extras e noturnas
- Retorna objeto com totais e valores

**Retorno**:
```javascript
{
  horasExtras: 10.5,
  horasNoturnas: 12.0,
  valorExtras: 450.00,
  valorNoturnas: 250.00,
  valorHoraBase: 13.64
}
```

#### `_separaHorasPorTipo(horaInicio, horaFim, totalHoras)`
- Algoritmo para separar horas em categorias
- Detecta períodos noturnos (22h-05h)
- Calcula excedentes (extras)
- Retorna breakdown: `{ hNormal, hExtra, hNoturna }`

**Lógica**:
1. Se jornada virou a noite (ex: 22h-05h), tudo é noturno
2. Se jornada está em horário normal (ex: 08h-18h), verifica se excede 8h
3. Se jornada se sobrepõe (ex: 20h-23h), separa parte normal de noturna

#### `buscarHistorico(usuarioId, mes, ano)`
- Consulta folha de pagamento processada
- Retorna dados já calculados e salvos

### 2. Controller: `folhaPagamento.controller.js`

**Função `gerarFolha` (modificada)**:
- Chama `horasExtraService.calcularHorasExtras()`
- Insere nas colunas `horas_extras`, `valor_extras`, `horas_noturnas`, `valor_noturnas`
- Mantém compatibilidade com cálculos anteriores

**Exemplo de resposta**:
```javascript
{
  "message": "Folhas geradas com sucesso",
  "folhas": [
    {
      "usuario_id": 5,
      "folhaId": 42,
      "totalPontos": 24,
      "valor": 1200,
      "horasExtras": 10.5,
      "valorExtras": 450.00,
      "horasNoturnas": 12.0,
      "valorNoturnas": 250.00
    }
  ]
}
```

### 3. Rotas: `folhaPagamento.routes.js`

**Novo endpoint**:
```
GET /folha/horas-extras/:usuarioId?mes=11&ano=2025
```

**Autenticação**: 
- Admin, RH, Colaborador (com RBAC)
- Colaborador vê apenas suas próprias horas

**Resposta**:
```json
{
  "periodo": "11/2025",
  "calculos": {
    "horasExtras": 10.5,
    "horasNoturnas": 12.0,
    "valorExtras": 450.00,
    "valorNoturnas": 250.00
  },
  "folhaPagamento": {
    "id": 42,
    "usuario_id": 5,
    "mes": 11,
    "ano": 2025,
    "valor": 1200.00,
    "horas_extras": 10.5,
    "valor_extras": 450.00,
    "horas_noturnas": 12.0,
    "valor_noturnas": 250.00,
    "status": "pendente"
  }
}
```

## 📊 Exemplos de Cálculo

### Exemplo 1: Jornada Normal (8h)
```
Entrada: 08:00
Saída:   16:00
Duração: 8 horas

Resultado:
- Horas Normais: 8h
- Horas Extras: 0h
- Horas Noturnas: 0h
```

### Exemplo 2: Jornada com Extras (10h)
```
Entrada: 08:00
Saída:   18:00
Duração: 10 horas

Resultado:
- Horas Normais: 8h
- Horas Extras: 2h × R$13.64 × 1.5 = R$40.92
- Horas Noturnas: 0h
```

### Exemplo 3: Jornada Noturna (7h)
```
Entrada: 22:00
Saída:   05:00
Duração: 7 horas

Resultado:
- Horas Normais: 0h
- Horas Extras: 0h
- Horas Noturnas: 7h × R$13.64 × 1.2 = R$114.54
```

### Exemplo 4: Jornada Noturna com Extras (9h)
```
Entrada: 21:00
Saída:   06:00
Duração: 9 horas

Resultado:
- Horas Normais: 3h (21h-00h)
- Horas Noturnas: 5h (00h-05h)
- Horas Extras: 1h (05h-06h, após 8h do dia)
- Valor Total: (3×13.64) + (5×13.64×1.2) + (1×13.64×1.5) = ...
```

## 🚀 Como Usar

### 1. Gerar Folha com Cálculo de Extras
```bash
curl -X POST http://localhost:3000/folha/gerar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": 5,
    "mes": 11,
    "ano": 2025
  }'
```

### 2. Consultar Horas Extras de um Usuário
```bash
curl http://localhost:3000/folha/horas-extras/5?mes=11&ano=2025 \
  -H "Authorization: Bearer <token>"
```

### 3. Consultar Folha Completa (com detalhes de extras)
```bash
curl http://localhost:3000/folha/5?mes=11&ano=2025 \
  -H "Authorization: Bearer <token>"
```

## 🧪 Testes

Arquivo: `backend/tests/horasExtras.test.js`

**Executar testes**:
```bash
cd backend
node tests/horasExtras.test.js
```

**Casos de teste inclusos**:
1. ✓ Conversão de hora para minutos
2. ✓ Separação de horas normais vs extras
3. ✓ Jornada noturna (22h-05h)
4. ✓ Jornada noturna com extras
5. ✓ Jornada com final noturno
6. ✓ Cálculo de valor monetário

## ⚠️ Riscos e Considerações

### 1. Precisão de Dados
- **Risco**: Registros de ponto incompletos ou incorretos afetam cálculos
- **Mitigação**: Validar `hora_inicio` e `hora_fim` antes de usar; registrar avisos

### 2. Mudança de Salário no Mês
- **Risco**: Se salário mudar durante o mês, qual valor usar?
- **Mitigação**: Usar salário vigente na data; considerar regras de convenção coletiva

### 3. Variações Legais (CLT, Convenções Coletivas)
- **Risco**: Legislação pode variar por setor, região, empresa
- **Mitigação**: Implementar como **configurable**; permitir multiplicadores customizáveis

### 4. Performance em Grandes Volumes
- **Risco**: Cálculo mensal com milhares de registros de ponto pode ser lento
- **Mitigação**: Adicionar índices em `registro_ponto(usuario_id, data_hora)`; considerar agregação nocturna

### 5. Erros de Arredondamento
- **Risco**: Acumular erros de ponto flutuante em múltiplos dias
- **Mitigação**: Usar `NUMERIC` no BD; arredondar apenas na exibição final

## 📈 Melhorias Futuras

1. **Configuração de Multiplicadores**: Permitir customização por empresa/setor
2. **DSR (Descanso Semanal Remunerado)**: Incluir cálculo de fim de semana
3. **Ausências**: Tratar feriados, abonos, licenças
4. **Relatórios Detalhados**: Dashboard de horas por tipo
5. **Integração com Sistema Externo**: API para sincronizar com RH/Folha externo
6. **Auditoria**: Registrar mudanças em cálculos (quem, quando, por quê)

## 📝 Status

- ✅ Implementação base completa
- ✅ Testes unitários inclusos
- ✅ Endpoints funcionais
- ✅ Documentação pronta
- ⏳ Deploy em produção (próximo ciclo)

---

**Última atualização**: Dezembro de 2025  
**Responsável**: Time de Desenvolvimento  
**Status**: Pronto para QA
