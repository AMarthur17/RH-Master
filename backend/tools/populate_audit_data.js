/**
 * Script para popular dados de exemplo no sistema de auditoria
 * Útil para testes e demonstrações
 */

import db from '../src/db.js';
import AuditController from '../src/controllers/AuditController.js';

const USUARIOS_EXEMPLO = [
  { id: 1, nome: 'Admin Silva', email: 'admin@empresa.com' },
  { id: 2, nome: 'João Santos', email: 'joao@empresa.com' },
  { id: 3, nome: 'Maria Oliveira', email: 'maria@empresa.com' },
  { id: 4, nome: 'Pedro Costa', email: 'pedro@empresa.com' },
  { id: 5, nome: 'Ana Paula', email: 'ana@empresa.com' },
];

const ACOES_EXEMPLO = [
  {
    acao: 'LOGIN',
    categoria: 'AUTENTICACAO',
    descricao: 'Login bem-sucedido no sistema',
    resultado: 'SUCESSO',
    nivelCriticidade: 'BAIXO',
  },
  {
    acao: 'LOGIN_FALHA_SENHA',
    categoria: 'AUTENTICACAO',
    descricao: 'Tentativa de login com senha incorreta',
    resultado: 'FALHA',
    nivelCriticidade: 'MEDIO',
  },
  {
    acao: 'CRIAR_USUARIO',
    categoria: 'USUARIO',
    descricao: 'Novo usuário cadastrado no sistema',
    resultado: 'SUCESSO',
    nivelCriticidade: 'ALTO',
  },
  {
    acao: 'EDITAR_SALARIO',
    categoria: 'USUARIO',
    descricao: 'Salário de funcionário alterado',
    resultado: 'SUCESSO',
    nivelCriticidade: 'CRITICO',
  },
  {
    acao: 'EXCLUIR_USUARIO',
    categoria: 'USUARIO',
    descricao: 'Usuário removido do sistema',
    resultado: 'SUCESSO',
    nivelCriticidade: 'CRITICO',
  },
  {
    acao: 'APROVAR_FOLHA_PAGAMENTO',
    categoria: 'FOLHA_PAGAMENTO',
    descricao: 'Folha de pagamento aprovada',
    resultado: 'SUCESSO',
    nivelCriticidade: 'CRITICO',
  },
  {
    acao: 'GERAR_RELATORIO',
    categoria: 'RELATORIO',
    descricao: 'Relatório de salários gerado',
    resultado: 'SUCESSO',
    nivelCriticidade: 'MEDIO',
  },
  {
    acao: 'VISUALIZAR_DOCUMENTO',
    categoria: 'DOCUMENTO',
    descricao: 'Documento visualizado',
    resultado: 'SUCESSO',
    nivelCriticidade: 'BAIXO',
  },
  {
    acao: 'EXCLUIR_DOCUMENTO',
    categoria: 'DOCUMENTO',
    descricao: 'Documento excluído',
    resultado: 'SUCESSO',
    nivelCriticidade: 'ALTO',
  },
  {
    acao: 'APROVAR_FERIAS',
    categoria: 'FERIAS',
    descricao: 'Solicitação de férias aprovada',
    resultado: 'SUCESSO',
    nivelCriticidade: 'ALTO',
  },
  {
    acao: 'EDITAR_PONTO',
    categoria: 'PONTO',
    descricao: 'Registro de ponto alterado',
    resultado: 'SUCESSO',
    nivelCriticidade: 'ALTO',
  },
  {
    acao: 'TENTATIVA_ACESSO_NEGADO',
    categoria: 'USUARIO',
    descricao: 'Tentativa de acesso a recurso não autorizado',
    resultado: 'NEGADO',
    nivelCriticidade: 'ALTO',
  },
];

const IPS_EXEMPLO = [
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102',
  '10.0.0.50',
  '172.16.0.10',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function popularDadosExemplo() {
  console.log('🔄 Iniciando população de dados de exemplo para auditoria...\n');

  try {
    // Verificar se já existem logs
    const checkQuery = 'SELECT COUNT(*) FROM audit_logs';
    const checkResult = await db.query(checkQuery);
    const logsExistentes = parseInt(checkResult.rows[0].count);

    if (logsExistentes > 100) {
      console.log(`⚠️  Já existem ${logsExistentes} logs no sistema.`);
      console.log('   Execute este script apenas em ambiente de desenvolvimento/teste.\n');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const resposta = await new Promise(resolve => {
        readline.question('Deseja continuar e adicionar mais logs? (s/n): ', resolve);
      });
      
      readline.close();

      if (resposta.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada.');
        return;
      }
    }

    console.log('📊 Gerando 200 logs de exemplo...\n');

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30); // 30 dias atrás
    const dataFim = new Date();

    let sucessos = 0;
    let falhas = 0;

    for (let i = 0; i < 200; i++) {
      const usuario = randomItem(USUARIOS_EXEMPLO);
      const acao = randomItem(ACOES_EXEMPLO);
      const dataHora = randomDate(dataInicio, dataFim);

      const logData = {
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        acao: acao.acao,
        categoria: acao.categoria,
        descricao: acao.descricao,
        endpoint: `/api/${acao.categoria.toLowerCase()}`,
        metodo: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        ipAddress: randomItem(IPS_EXEMPLO),
        userAgent: randomItem(USER_AGENTS),
        resultado: acao.resultado,
        nivelCriticidade: acao.nivelCriticidade,
        metadata: {
          exemplo: true,
          timestamp: dataHora.toISOString(),
          aleatorio: Math.random()
        }
      };

      // Para alguns logs, adicionar dados anteriores e novos
      if (['EDITAR_SALARIO', 'EDITAR_PONTO', 'EDITAR_USUARIO'].includes(acao.acao)) {
        logData.dadosAnteriores = {
          campo: 'valor_anterior',
          salario: 3000 + Math.random() * 5000
        };
        logData.dadosNovos = {
          campo: 'valor_novo',
          salario: 3500 + Math.random() * 5000
        };
      }

      try {
        // Inserir com data customizada
        const query = `
          INSERT INTO audit_logs (
            usuario_id, usuario_nome, usuario_email, acao, categoria, descricao,
            endpoint, metodo, ip_address, user_agent, resultado,
            dados_anteriores, dados_novos, metadata, nivel_criticidade, data_hora
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

        await db.query(query, [
          logData.usuarioId,
          logData.usuarioNome,
          logData.usuarioEmail,
          logData.acao,
          logData.categoria,
          logData.descricao,
          logData.endpoint,
          logData.metodo,
          logData.ipAddress,
          logData.userAgent,
          logData.resultado,
          logData.dadosAnteriores ? JSON.stringify(logData.dadosAnteriores) : null,
          logData.dadosNovos ? JSON.stringify(logData.dadosNovos) : null,
          JSON.stringify(logData.metadata),
          logData.nivelCriticidade,
          dataHora
        ]);

        sucessos++;

        if ((i + 1) % 50 === 0) {
          console.log(`   ✅ ${i + 1}/200 logs criados...`);
        }
      } catch (error) {
        falhas++;
        console.error(`   ❌ Erro ao criar log ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ População concluída!`);
    console.log(`   📊 Logs criados com sucesso: ${sucessos}`);
    console.log(`   ❌ Falhas: ${falhas}\n`);

    // Mostrar estatísticas
    console.log('📈 Estatísticas dos logs gerados:\n');

    const categorias = await db.query(`
      SELECT categoria, COUNT(*) as total
      FROM audit_logs
      WHERE metadata->>'exemplo' = 'true'
      GROUP BY categoria
      ORDER BY total DESC
    `);

    console.log('   Por Categoria:');
    categorias.rows.forEach(row => {
      console.log(`      ${row.categoria}: ${row.total} logs`);
    });

    const criticidade = await db.query(`
      SELECT nivel_criticidade, COUNT(*) as total
      FROM audit_logs
      WHERE metadata->>'exemplo' = 'true'
      GROUP BY nivel_criticidade
      ORDER BY 
        CASE nivel_criticidade
          WHEN 'CRITICO' THEN 1
          WHEN 'ALTO' THEN 2
          WHEN 'MEDIO' THEN 3
          WHEN 'BAIXO' THEN 4
        END
    `);

    console.log('\n   Por Criticidade:');
    criticidade.rows.forEach(row => {
      console.log(`      ${row.nivel_criticidade}: ${row.total} logs`);
    });

    const resultado = await db.query(`
      SELECT resultado, COUNT(*) as total
      FROM audit_logs
      WHERE metadata->>'exemplo' = 'true'
      GROUP BY resultado
    `);

    console.log('\n   Por Resultado:');
    resultado.rows.forEach(row => {
      console.log(`      ${row.resultado}: ${row.total} logs`);
    });

    console.log('\n🎉 Dados de exemplo populados com sucesso!');
    console.log('   Você pode agora testar as APIs de consulta e filtros.\n');
    console.log('📝 Exemplos de requisições:');
    console.log('   GET /audit/logs?categoria=AUTENTICACAO');
    console.log('   GET /audit/logs?nivelCriticidade=CRITICO');
    console.log('   GET /audit/statistics');
    console.log('   GET /audit/critical\n');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    await db.end();
  }
}

// Função para limpar logs de exemplo
async function limparDadosExemplo() {
  console.log('🗑️  Limpando logs de exemplo...\n');

  try {
    // Como audit_logs é imutável, precisamos desabilitar temporariamente os triggers
    console.log('⚠️  ATENÇÃO: Esta operação desabilita temporariamente as proteções de imutabilidade!\n');
    
    const result = await db.query(`
      SELECT COUNT(*) FROM audit_logs WHERE metadata->>'exemplo' = 'true'
    `);
    
    const total = parseInt(result.rows[0].count);
    
    if (total === 0) {
      console.log('✅ Nenhum log de exemplo encontrado.');
      return;
    }

    console.log(`   📊 ${total} logs de exemplo encontrados.\n`);

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const resposta = await new Promise(resolve => {
      readline.question(`Confirma a exclusão de ${total} logs? (s/n): `, resolve);
    });
    
    readline.close();

    if (resposta.toLowerCase() !== 's') {
      console.log('❌ Operação cancelada.');
      return;
    }

    // Desabilitar triggers temporariamente
    await db.query('ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_delete');
    
    // Excluir logs de exemplo
    await db.query(`DELETE FROM audit_logs WHERE metadata->>'exemplo' = 'true'`);
    
    // Reabilitar triggers
    await db.query('ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_delete');

    console.log(`\n✅ ${total} logs de exemplo removidos com sucesso!`);
    console.log('   🔒 Proteções de imutabilidade reativadas.\n');

  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    
    // Garantir que os triggers sejam reabilitados
    try {
      await db.query('ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_delete');
    } catch (e) {
      console.error('❌ Erro ao reabilitar triggers:', e);
    }
  } finally {
    await db.end();
  }
}

// Executar baseado em argumento
const acao = process.argv[2];

if (acao === 'limpar') {
  limparDadosExemplo();
} else {
  popularDadosExemplo();
}
