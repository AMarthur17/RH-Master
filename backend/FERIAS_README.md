Férias — Cálculo proporcional (implementação do RH-Master)
=========================================================

Resumo
------
Este módulo implementa o cálculo de férias proporcionais adotado pelo projeto. O objetivo principal é garantir que a fórmula esteja correta, que o arredondamento seja consistente e que todo cálculo seja auditável.

Fórmula adotada
---------------
- Considera-se 30 dias de férias para cada período aquisitivo completo de 12 meses.
- Dias proporcionais: se mesesTrabalhados >= 12, dias = 30; senão dias = floor(mesesTrabalhados * (30 / 12)).
  - Isso equivale a 2,5 dias por mês trabalhado, com truncamento (arredondamento para baixo) para evitar pagamento de frações menores que 1 dia.
- Valor das férias: (salario / 30) * dias
- Adicional constitucional: 1/3 sobre o valor das férias (valorFerias / 3)
- Todos os valores monetários são arredondados para 2 casas decimais usando `toFixed(2)` e transformados em Number para evitar imprecisão de string.

Arredondamento e comportamento
------------------------------
- Dias: usamos `Math.floor(...)` (truncamento). Se a legislação ou política da empresa exigir outro comportamento (arredondamento para cima ou para o inteiro mais próximo), altere `calcularFerias` no serviço `backend/src/services/ferias.service.js`.
- Valores monetários: usamos `Number(Number(value).toFixed(2))` para garantir valores numéricos com duas casas.

Auditoria
--------
- Cada execução do endpoint `/ferias/calcular` grava um registro em `ferias_calculos` com dados: `usuario_id`, `meses_trabalhados`, `dias_ferias`, `valor_ferias`, `um_terco`, `valor_total`, `salario_referencia` e `criado_em`.

Fonte do salário
----------------
- O controller prioriza `usuario.salario` (nova coluna adicionada em `db/init.sql`). Se não existir ou for zero, tenta usar a última `salario_base` registrada em `folha_pagamento`. Se ainda não houver, usa um fallback de R$ 2.000 — esse fallback deve ser substituído em produção por um valor correto (contracheque, tabela salarial, etc.).

Testes
------
- Os testes do serviço estão em `backend/tests/ferias.service.test.js` e cobrem casos de 0, 1, 5 e 12 meses e meses negativos. Execute na pasta `backend`:

```powershell
cd backend
npm install
npm test
```

Próximos passos recomendados
---------------------------
1. Rever a regra de arredondamento com o departamento jurídico / RH e, se necessário, atualizar `calcularFerias`.
2. Substituir o fallback de R$ 2.000 por uma fonte oficial do salário (adicionar/popular `usuario.salario` via migração ou interface administrativa).
3. Caso necessário, adicionar testes de integração que validem a persistência no banco (para auditoria).

Contato
-------
Se quiser que eu aplique qualquer mudança adicional (alterar regra de arredondamento, criar migração SQL separada, adicionar testes de integração), diga qual opção prefere e eu faço as alterações.
