/**
 * Script para popular dados de teste de métricas de segurança
 * Simula transações e incidentes para demonstração da métrica
 */

import db from "../src/db.js";

async function popularDadosTeste() {
  console.log("🔄 Iniciando população de dados de teste...\n");

  try {
    // 1. Criar transações de dados (operações normais do sistema)
    console.log("📊 Criando transações de dados...");

    const transacoes = [
      // Consultas normais (baixa sensibilidade)
      ...Array(500).fill(null).map((_, i) => ({
        tipo: "CONSULTA",
        categoria: "USUARIO",
        sensibilidade: "BAIXA",
        registros: 1,
      })),

      // Operações em documentos (sensibilidade alta)
      ...Array(200).fill(null).map((_, i) => ({
        tipo: "CONSULTA",
        categoria: "DOCUMENTO",
        sensibilidade: "ALTA",
        registros: 1,
      })),

      // Operações em folha de pagamento (crítica)
      ...Array(100).fill(null).map((_, i) => ({
        tipo: "CONSULTA",
        categoria: "FOLHA_PAGAMENTO",
        sensibilidade: "CRITICA",
        registros: 1,
      })),

      // Criações
      ...Array(50).fill(null).map((_, i) => ({
        tipo: "CRIACAO",
        categoria: "USUARIO",
        sensibilidade: "ALTA",
        registros: 1,
      })),

      // Atualizações
      ...Array(80).fill(null).map((_, i) => ({
        tipo: "ATUALIZACAO",
        categoria: "BENEFICIO",
        sensibilidade: "ALTA",
        registros: 1,
      })),

      // Exportações
      ...Array(30).fill(null).map((_, i) => ({
        tipo: "EXPORTACAO",
        categoria: "RELATORIO",
        sensibilidade: "MEDIA",
        registros: Math.floor(Math.random() * 50) + 1,
      })),
    ];

    for (const transacao of transacoes) {
      await db.query(
        `INSERT INTO data_transactions 
         (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
         VALUES ($1, $2, $3, $4, NOW() - (RANDOM() * INTERVAL '30 days'))`,
        [
          transacao.tipo,
          transacao.categoria,
          transacao.registros,
          transacao.sensibilidade,
        ]
      );
    }

    console.log(`✅ ${transacoes.length} transações criadas\n`);

    // 2. Criar alguns incidentes de segurança (poucos para manter taxa alta)
    console.log("🚨 Criando incidentes de segurança...");

    const incidentes = [
      {
        tipo: "VAZAMENTO_DADOS",
        severidade: "ALTA",
        descricao: "Acesso não autorizado a dados de colaboradores detectado via log de auditoria",
        dadosAfetados: "Dados pessoais de 15 colaboradores",
        quantidadeRegistros: 15,
        origem: "AUDITORIA_AUTOMATICA",
        status: "RESOLVIDO",
        acaoCorretiva: "Permissões corrigidas e usuários notificados. Senha do sistema alterada.",
        diasAtras: 25,
      },
      {
        tipo: "TENTATIVAS_FALHAS_AUTENTICACAO",
        severidade: "MEDIA",
        descricao: "Múltiplas tentativas de login com credenciais inválidas",
        dadosAfetados: null,
        quantidadeRegistros: 0,
        origem: "AUDITORIA_AUTOMATICA",
        status: "RESOLVIDO",
        acaoCorretiva: "IP bloqueado temporariamente. Conta do usuário verificada.",
        diasAtras: 15,
      },
      {
        tipo: "ACESSO_NAO_AUTORIZADO",
        severidade: "MEDIA",
        descricao: "Tentativa de acesso a endpoint restrito sem permissão adequada",
        dadosAfetados: null,
        quantidadeRegistros: 0,
        origem: "MONITORAMENTO_MANUAL",
        status: "FALSO_POSITIVO",
        acaoCorretiva: "Verificado que era um erro de configuração do cliente.",
        diasAtras: 10,
      },
      {
        tipo: "VAZAMENTO_DADOS",
        severidade: "CRITICA",
        descricao: "Documento com dados salariais compartilhado incorretamente",
        dadosAfetados: "Dados salariais de 50 colaboradores",
        quantidadeRegistros: 50,
        origem: "RELATO_USUARIO",
        status: "RESOLVIDO",
        acaoCorretiva: "Documento removido, acesso revisado, colaboradores notificados conforme LGPD.",
        diasAtras: 5,
      },
      {
        tipo: "VAZAMENTO_DADOS",
        severidade: "ALTA",
        descricao: "Exportação massiva de dados detectada fora do horário comercial",
        dadosAfetados: "Lista completa de colaboradores com dados de contato",
        quantidadeRegistros: 200,
        origem: "AUDITORIA_AUTOMATICA",
        status: "EM_INVESTIGACAO",
        acaoCorretiva: null,
        diasAtras: 1,
      },
      {
        tipo: "ACESSO_NAO_AUTORIZADO",
        severidade: "BAIXA",
        descricao: "Tentativa de acesso a documentos de outro departamento",
        dadosAfetados: null,
        quantidadeRegistros: 0,
        origem: "AUDITORIA_LOGS",
        status: "ABERTO",
        acaoCorretiva: null,
        diasAtras: 0,
      },
    ];

    for (const incidente of incidentes) {
      const dataDeteccao = `NOW() - INTERVAL '${incidente.diasAtras} days'`;
      const dataResolucao = incidente.status === "RESOLVIDO" || incidente.status === "FALSO_POSITIVO"
        ? `NOW() - INTERVAL '${incidente.diasAtras - 1} days'`
        : "NULL";

      await db.query(
        `INSERT INTO security_incidents 
         (tipo, severidade, descricao, dados_afetados, quantidade_registros, 
          origem, status, acao_corretiva, data_deteccao, data_resolucao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${dataDeteccao}, ${dataResolucao})`,
        [
          incidente.tipo,
          incidente.severidade,
          incidente.descricao,
          incidente.dadosAfetados,
          incidente.quantidadeRegistros,
          incidente.origem,
          incidente.status,
          incidente.acaoCorretiva,
        ]
      );
    }

    console.log(`✅ ${incidentes.length} incidentes criados\n`);

    // 3. Calcular e exibir a métrica
    console.log("📈 Calculando métrica de segurança...\n");

    const resultTransacoes = await db.query(
      "SELECT COUNT(*) as total FROM data_transactions"
    );
    const totalTransacoes = parseInt(resultTransacoes.rows[0].total);

    const resultIncidentes = await db.query(
      "SELECT COUNT(*) as total FROM security_incidents WHERE tipo = 'VAZAMENTO_DADOS'"
    );
    const totalIncidentes = parseInt(resultIncidentes.rows[0].total);

    const proporcaoIncidentes = (totalIncidentes / totalTransacoes) * 100;
    const taxaProtecao = (100 - proporcaoIncidentes).toFixed(2);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("           MÉTRICA DE SEGURANÇA - RESULTADOS               ");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`📊 Total de Transações: ${totalTransacoes}`);
    console.log(`🚨 Total de Incidentes (Vazamento): ${totalIncidentes}`);
    console.log(`📉 Proporção de Incidentes: ${proporcaoIncidentes.toFixed(4)}%`);
    console.log(`✅ Taxa de Proteção: ${taxaProtecao}%`);
    console.log("═══════════════════════════════════════════════════════════");

    if (parseFloat(taxaProtecao) >= 99) {
      console.log("✨ Interpretação: Excelente! Taxa de proteção muito alta.");
    } else if (parseFloat(taxaProtecao) >= 95) {
      console.log("👍 Interpretação: Bom! Boa proteção de dados.");
    } else if (parseFloat(taxaProtecao) >= 90) {
      console.log("⚠️  Interpretação: Aceitável, mas requer atenção.");
    } else {
      console.log("🔴 Interpretação: Crítico! Revisar segurança urgentemente.");
    }

    console.log("\n");

    // 4. Exibir estatísticas por severidade
    const resultSeveridade = await db.query(`
      SELECT severidade, COUNT(*) as quantidade
      FROM security_incidents
      GROUP BY severidade
      ORDER BY 
        CASE severidade
          WHEN 'CRITICA' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MEDIA' THEN 3
          WHEN 'BAIXA' THEN 4
        END
    `);

    console.log("📊 Incidentes por Severidade:");
    resultSeveridade.rows.forEach((row) => {
      const emoji = {
        CRITICA: "🔴",
        ALTA: "🟠",
        MEDIA: "🟡",
        BAIXA: "🟢",
      }[row.severidade];
      console.log(`   ${emoji} ${row.severidade}: ${row.quantidade}`);
    });

    console.log("\n");

    // 5. Exibir estatísticas por status
    const resultStatus = await db.query(`
      SELECT status, COUNT(*) as quantidade
      FROM security_incidents
      GROUP BY status
    `);

    console.log("📋 Incidentes por Status:");
    resultStatus.rows.forEach((row) => {
      const emoji = {
        ABERTO: "🆕",
        EM_INVESTIGACAO: "🔍",
        RESOLVIDO: "✅",
        FALSO_POSITIVO: "❌",
      }[row.status];
      console.log(`   ${emoji} ${row.status}: ${row.quantidade}`);
    });

    console.log("\n");
    console.log("✅ População de dados concluída com sucesso!");
    console.log("\n🚀 Para consultar a métrica via API:");
    console.log("   GET http://localhost:5000/api/security-metrics/taxa-vazamento");
    console.log("\n");
  } catch (error) {
    console.error("❌ Erro ao popular dados:", error);
    throw error;
  }
}

// Executar script
popularDadosTeste()
  .then(() => {
    console.log("✨ Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro fatal:", error);
    process.exit(1);
  });
