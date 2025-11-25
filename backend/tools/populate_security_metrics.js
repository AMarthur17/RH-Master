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

    // 6. Criar regras de acesso por perfil
    console.log("🔐 Criando regras de acesso por perfil...\n");

    const regrasAcesso = [
      // Admin - Todas as funcionalidades com RBAC
      { perfil: "admin", funcionalidade: "CADASTRAR_USUARIO", endpoint: "/api/usuario", metodo: "POST", temRbac: true, nivelRisco: "ALTO", descricao: "Criar novos usuários no sistema" },
      { perfil: "admin", funcionalidade: "LISTAR_USUARIOS", endpoint: "/api/usuario/lista", metodo: "GET", temRbac: true, nivelRisco: "MEDIO", descricao: "Visualizar lista de todos os usuários" },
      { perfil: "admin", funcionalidade: "EDITAR_USUARIO", endpoint: "/api/usuario/:id", metodo: "PUT", temRbac: true, nivelRisco: "ALTO", descricao: "Editar dados de usuários" },
      { perfil: "admin", funcionalidade: "GERAR_RELATORIO_FOLHA", endpoint: "/api/relatorios/folha", metodo: "GET", temRbac: true, nivelRisco: "CRITICO", descricao: "Gerar relatório de folha de pagamento" },
      { perfil: "admin", funcionalidade: "GERAR_RELATORIO_PRESENCA", endpoint: "/api/relatorios/presenca", metodo: "GET", temRbac: true, nivelRisco: "MEDIO", descricao: "Gerar relatório de presença" },
      { perfil: "admin", funcionalidade: "APROVAR_SOLICITACAO", endpoint: "/api/solicitacoes/:id/decidir", metodo: "PUT", temRbac: true, nivelRisco: "ALTO", descricao: "Aprovar ou recusar solicitações" },
      { perfil: "admin", funcionalidade: "GERENCIAR_BENEFICIOS", endpoint: "/api/beneficios", metodo: "POST", temRbac: true, nivelRisco: "ALTO", descricao: "Criar e gerenciar benefícios" },
      { perfil: "admin", funcionalidade: "VISUALIZAR_AUDIT_LOGS", endpoint: "/api/audit/logs", metodo: "GET", temRbac: true, nivelRisco: "MEDIO", descricao: "Visualizar logs de auditoria" },
      { perfil: "admin", funcionalidade: "CALCULAR_FERIAS", endpoint: "/api/ferias/calcular", metodo: "POST", temRbac: true, nivelRisco: "ALTO", descricao: "Calcular valores de férias" },
      { perfil: "admin", funcionalidade: "AGENDAR_RELATORIOS", endpoint: "/api/schedules", metodo: "POST", temRbac: true, nivelRisco: "MEDIO", descricao: "Agendar geração automática de relatórios" },

      // Colaborador - Funcionalidades básicas
      { perfil: "colaborador", funcionalidade: "VER_PERFIL_PROPRIO", endpoint: "/api/usuario/me", metodo: "GET", temRbac: true, nivelRisco: "BAIXO", descricao: "Visualizar próprio perfil" },
      { perfil: "colaborador", funcionalidade: "EDITAR_PERFIL_PROPRIO", endpoint: "/api/usuario/:id", metodo: "PUT", temRbac: true, nivelRisco: "MEDIO", descricao: "Editar próprio perfil" },
      { perfil: "colaborador", funcionalidade: "REGISTRAR_PONTO", endpoint: "/api/registro-ponto", metodo: "POST", temRbac: true, nivelRisco: "MEDIO", descricao: "Registrar entrada/saída" },
      { perfil: "colaborador", funcionalidade: "VER_PONTOS_PROPRIOS", endpoint: "/api/registro-ponto", metodo: "GET", temRbac: true, nivelRisco: "BAIXO", descricao: "Ver registros de ponto próprios" },
      { perfil: "colaborador", funcionalidade: "SOLICITAR_FERIAS", endpoint: "/api/solicitacoes", metodo: "POST", temRbac: true, nivelRisco: "MEDIO", descricao: "Solicitar férias ou licença" },
      { perfil: "colaborador", funcionalidade: "VER_SOLICITACOES_PROPRIAS", endpoint: "/api/solicitacoes/:usuarioId", metodo: "GET", temRbac: true, nivelRisco: "BAIXO", descricao: "Ver próprias solicitações" },
      { perfil: "colaborador", funcionalidade: "UPLOAD_DOCUMENTOS", endpoint: "/api/documentos/upload", metodo: "POST", temRbac: false, nivelRisco: "ALTO", descricao: "Upload de documentos pessoais" },
      { perfil: "colaborador", funcionalidade: "VER_FOLHA_PROPRIA", endpoint: "/api/folha/:usuarioId", metodo: "GET", temRbac: false, nivelRisco: "CRITICO", descricao: "Visualizar própria folha de pagamento" },
      { perfil: "colaborador", funcionalidade: "VER_BENEFICIOS_PROPRIOS", endpoint: "/api/beneficios/:usuarioId", metodo: "GET", temRbac: true, nivelRisco: "MEDIO", descricao: "Ver benefícios próprios" },

      // Gerente - Funcionalidades intermediárias
      { perfil: "gerente", funcionalidade: "VER_EQUIPE", endpoint: "/api/usuario/equipe", metodo: "GET", temRbac: false, nivelRisco: "MEDIO", descricao: "Visualizar usuários da equipe" },
      { perfil: "gerente", funcionalidade: "APROVAR_FERIAS_EQUIPE", endpoint: "/api/solicitacoes/:id/aprovar", metodo: "PUT", temRbac: false, nivelRisco: "ALTO", descricao: "Aprovar férias da equipe" },
      { perfil: "gerente", funcionalidade: "VER_PONTOS_EQUIPE", endpoint: "/api/registro-ponto/equipe", metodo: "GET", temRbac: false, nivelRisco: "MEDIO", descricao: "Ver pontos da equipe" },
      { perfil: "gerente", funcionalidade: "GERAR_RELATORIO_EQUIPE", endpoint: "/api/relatorios/equipe", metodo: "GET", temRbac: false, nivelRisco: "ALTO", descricao: "Gerar relatórios da equipe" },
      { perfil: "gerente", funcionalidade: "EDITAR_PONTO_EQUIPE", endpoint: "/api/registro-ponto/:id", metodo: "PUT", temRbac: false, nivelRisco: "ALTO", descricao: "Editar registros de ponto da equipe" },

      // RH - Funcionalidades de recursos humanos
      { perfil: "rh", funcionalidade: "CADASTRAR_COLABORADOR", endpoint: "/api/usuario", metodo: "POST", temRbac: false, nivelRisco: "ALTO", descricao: "Cadastrar novos colaboradores" },
      { perfil: "rh", funcionalidade: "GERENCIAR_BENEFICIOS_GERAL", endpoint: "/api/beneficios", metodo: "POST", temRbac: false, nivelRisco: "ALTO", descricao: "Gerenciar benefícios de todos" },
      { perfil: "rh", funcionalidade: "PROCESSAR_FOLHA", endpoint: "/api/folha/processar", metodo: "POST", temRbac: false, nivelRisco: "CRITICO", descricao: "Processar folha de pagamento" },
      { perfil: "rh", funcionalidade: "VER_TODAS_SOLICITACOES", endpoint: "/api/solicitacoes", metodo: "GET", temRbac: true, nivelRisco: "MEDIO", descricao: "Visualizar todas as solicitações" },
      { perfil: "rh", funcionalidade: "GERAR_RELATORIO_RH", endpoint: "/api/relatorios/rh", metodo: "GET", temRbac: false, nivelRisco: "ALTO", descricao: "Gerar relatórios de RH" },
    ];

    for (const regra of regrasAcesso) {
      await db.query(
        `INSERT INTO access_rules 
         (perfil, funcionalidade, endpoint, metodo, tem_rbac, nivel_risco, descricao)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (perfil, funcionalidade) DO NOTHING`,
        [
          regra.perfil,
          regra.funcionalidade,
          regra.endpoint,
          regra.metodo,
          regra.temRbac,
          regra.nivelRisco,
          regra.descricao,
        ]
      );
    }

    console.log(`✅ ${regrasAcesso.length} regras de acesso criadas\n`);

    // 7. Calcular e exibir a métrica de cobertura
    console.log("📊 Calculando métrica de cobertura de acesso...\n");

    const resultTotalRegras = await db.query(
      "SELECT COUNT(*) as total FROM access_rules"
    );
    const totalRegras = parseInt(resultTotalRegras.rows[0].total);

    const resultComRBAC = await db.query(
      "SELECT COUNT(*) as total FROM access_rules WHERE tem_rbac = TRUE"
    );
    const totalComRBAC = parseInt(resultComRBAC.rows[0].total);

    const cobertura = ((totalComRBAC / totalRegras) * 100).toFixed(2);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("   MÉTRICA: COBERTURA DE REGRAS DE ACESSO POR PERFIL      ");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`📊 Total de Funcionalidades: ${totalRegras}`);
    console.log(`✅ Funcionalidades com RBAC: ${totalComRBAC}`);
    console.log(`❌ Funcionalidades sem RBAC: ${totalRegras - totalComRBAC}`);
    console.log(`📈 Cobertura: ${cobertura}%`);
    console.log("═══════════════════════════════════════════════════════════");

    if (parseFloat(cobertura) === 100) {
      console.log("✨ Interpretação: Excelente! Controle de acesso completo.");
    } else if (parseFloat(cobertura) >= 90) {
      console.log("👍 Interpretação: Muito bom! Alta cobertura.");
    } else if (parseFloat(cobertura) >= 70) {
      console.log("⚠️  Interpretação: Bom, mas pode melhorar.");
    } else {
      console.log("🔴 Interpretação: Crítico! Baixa cobertura de acesso.");
    }

    console.log("\n");

    // Estatísticas por perfil
    const resultPorPerfil = await db.query(`
      SELECT 
        perfil,
        COUNT(*) as total,
        SUM(CASE WHEN tem_rbac = TRUE THEN 1 ELSE 0 END) as com_rbac,
        ROUND((SUM(CASE WHEN tem_rbac = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as cobertura
      FROM access_rules
      GROUP BY perfil
      ORDER BY cobertura ASC
    `);

    console.log("📋 Cobertura por Perfil:");
    resultPorPerfil.rows.forEach((row) => {
      const emoji = parseFloat(row.cobertura) >= 90 ? "✅" : parseFloat(row.cobertura) >= 70 ? "⚠️" : "❌";
      console.log(`   ${emoji} ${row.perfil}: ${row.com_rbac}/${row.total} (${row.cobertura}%)`);
    });

    console.log("\n");
    console.log("✅ População de dados concluída com sucesso!");
    console.log("\n🚀 Para consultar as métricas via API:");
    console.log("   GET http://localhost:5000/api/security-metrics/taxa-vazamento");
    console.log("   GET http://localhost:5000/api/security-metrics/cobertura-acesso");
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
