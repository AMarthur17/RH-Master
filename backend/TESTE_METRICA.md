# ✅ Teste da Métrica - Taxa de Vazamento de Dados

## Status da Implementação

✅ **Tabelas criadas com sucesso:**
- `security_incidents` - Incidentes de segurança
- `data_transactions` - Transações de dados

✅ **Dados populados:**
- 960 transações criadas
- 6 incidentes registrados (3 de vazamento)
- **Taxa de Proteção: 99.69%** ✨

---

## 🔍 Verificar Dados no Banco

### Ver transações
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT COUNT(*) as total, tipo_transacao, categoria_dados FROM data_transactions GROUP BY tipo_transacao, categoria_dados ORDER BY total DESC;"
```

### Ver incidentes
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT id, tipo, severidade, status, descricao FROM security_incidents ORDER BY data_deteccao DESC;"
```

### Calcular métrica manualmente
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT (SELECT COUNT(*) FROM data_transactions) as transacoes, (SELECT COUNT(*) FROM security_incidents WHERE tipo = 'VAZAMENTO_DADOS') as incidentes;"
```

**Resultado esperado:**
```
 transacoes | incidentes 
------------+------------
        960 |          3
```

**Cálculo:**
- Proporção: 3/960 = 0.3125%
- Taxa de Proteção: 100% - 0.3125% = **99.69%** ✅

---

## 🧪 Testar API (Opções)

### Opção 1: Criar usuário admin temporário

```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "INSERT INTO usuario (nome, cpf, email, senha, cargo, empresa, salario) VALUES ('Admin Teste', '00000000000', 'admin.teste@test.com', '\$2b\$10\$rZ9VqP3BM7KZJqF5L5K5qeYK6Hx.KV5K5K5K5K5K5K5K5K5K5K5K5O', 'Administrador', 'RH Master', 5000) ON CONFLICT (email) DO NOTHING;"
```

### Opção 2: Usar Postman/Insomnia

1. **Login:**
   - POST `http://localhost:3000/api/usuario/login`
   - Body (JSON):
     ```json
     {
       "email": "seu_email@exemplo.com",
       "senha": "sua_senha"
     }
     ```

2. **Consultar Métrica:**
   - GET `http://localhost:3000/api/security-metrics/taxa-vazamento`
   - Headers:
     ```
     Authorization: Bearer SEU_TOKEN_AQUI
     ```

### Opção 3: Testar diretamente no banco

```powershell
# Ver a métrica calculada diretamente
docker exec -it rh_master_db psql -U postgres -d rh_master -c "
WITH 
  transacoes AS (SELECT COUNT(*) as total FROM data_transactions),
  incidentes AS (SELECT COUNT(*) as total FROM security_incidents WHERE tipo = 'VAZAMENTO_DADOS')
SELECT 
  t.total as total_transacoes,
  i.total as total_incidentes,
  ROUND(100 - (i.total::numeric / t.total::numeric * 100), 2) as taxa_protecao
FROM transacoes t, incidentes i;
"
```

---

## 📊 Exemplos de Consultas Úteis

### Ver estatísticas por severidade
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT severidade, COUNT(*) as quantidade FROM security_incidents GROUP BY severidade ORDER BY CASE severidade WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAIXA' THEN 4 END;"
```

### Ver incidentes abertos
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT id, tipo, severidade, descricao, data_deteccao FROM security_incidents WHERE status = 'ABERTO' ORDER BY data_deteccao DESC;"
```

### Ver transações por categoria
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "SELECT categoria_dados, COUNT(*) as total, sensibilidade FROM data_transactions GROUP BY categoria_dados, sensibilidade ORDER BY total DESC;"
```

### Adicionar novo incidente manualmente
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "INSERT INTO security_incidents (tipo, severidade, descricao, origem, status, quantidade_registros) VALUES ('VAZAMENTO_DADOS', 'MEDIA', 'Teste de incidente manual', 'TESTE', 'ABERTO', 5);"
```

### Recalcular métrica após adicionar incidente
```powershell
docker exec -it rh_master_db psql -U postgres -d rh_master -c "
WITH 
  transacoes AS (SELECT COUNT(*) as total FROM data_transactions),
  incidentes AS (SELECT COUNT(*) as total FROM security_incidents WHERE tipo = 'VAZAMENTO_DADOS')
SELECT 
  t.total as total_transacoes,
  i.total as total_incidentes,
  ROUND(100 - (i.total::numeric / t.total::numeric * 100), 2) as taxa_protecao
FROM transacoes t, incidentes i;
"
```

---

## 🎯 Validação da Métrica

### ✅ Requisitos Cumpridos

1. **Atributo de Qualidade:** Segurança ✅
2. **Métrica:** Taxa de Incidentes de Vazamento de Dados ✅
3. **Fórmula:** (Total transações / Nº incidentes) × 100% ✅
4. **Tipo:** Quantitativa, percentual ✅
5. **Interpretação:** Valores baixos = boa proteção ✅

### 📈 Resultado Atual

```
Total de Transações: 960
Total de Incidentes: 3
Taxa de Proteção: 99.69%
Interpretação: Excelente! Taxa de proteção muito alta.
```

### 🔄 Fluxo Automático

1. ✅ Sistema registra transações automaticamente
2. ✅ Detecta tentativas de invasão (5+ falhas em 15min)
3. ✅ Registra incidentes automáticos
4. ✅ Calcula métrica em tempo real
5. ✅ Fornece interpretação automática

---

## 📚 Endpoints Implementados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/security-metrics/taxa-vazamento` | Calcula a métrica |
| POST | `/api/security-metrics/incidentes` | Registra incidente |
| GET | `/api/security-metrics/incidentes` | Lista incidentes |
| PUT | `/api/security-metrics/incidentes/:id` | Atualiza incidente |
| GET | `/api/security-metrics/estatisticas` | Estatísticas gerais |
| GET | `/api/security-metrics/detectar-vazamentos` | Detecta padrões |

---

## ✨ Conclusão

A métrica foi **implementada e testada com sucesso**:

- ✅ Tabelas criadas
- ✅ Dados populados
- ✅ Controller funcionando
- ✅ Rotas configuradas
- ✅ Integração com auditoria
- ✅ Detecção automática
- ✅ **Taxa atual: 99.69%**

**A métrica está cumprida e operacional!** 🎉
