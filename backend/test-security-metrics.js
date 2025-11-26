/**
 * Script para testar as métricas de segurança
 */

const BASE_URL = 'http://localhost:3001';

// Função para fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login...\n');
  
  const response = await fetch(`${BASE_URL}/api/usuario/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'kevin@gmail.com',
      senha: 'senha123', // Pode precisar ajustar
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro no login: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Login realizado com sucesso!');
  console.log(`👤 Usuário: ${data.usuario?.nome || 'N/A'}`);
  console.log(`🎫 Token obtido\n`);
  
  return data.token;
}

// Função para testar Taxa de Vazamento
async function testarTaxaVazamento(token) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   TESTE: TAXA DE INCIDENTES DE VAZAMENTO DE DADOS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const response = await fetch(`${BASE_URL}/api/security-metrics/taxa-vazamento`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  console.log(`📊 Métrica: ${data.metrica}`);
  console.log(`📐 Fórmula: ${data.formula}`);
  console.log(`\n📈 DADOS:`);
  console.log(`   Total de Transações: ${data.dados.totalTransacoes}`);
  console.log(`   Total de Incidentes: ${data.dados.totalIncidentes}`);
  console.log(`   Taxa de Proteção: ${data.dados.taxaProtecao}%`);
  console.log(`   Proporção de Incidentes: ${data.dados.proporcaoIncidentes}`);
  console.log(`\n💡 Interpretação: ${data.interpretacao}`);
  
  if (data.incidentesRecentes && data.incidentesRecentes.length > 0) {
    console.log(`\n🚨 Incidentes Recentes (${data.incidentesRecentes.length}):`);
    data.incidentesRecentes.slice(0, 3).forEach((inc, i) => {
      console.log(`   ${i + 1}. [${inc.severidade}] ${inc.tipo}`);
      console.log(`      Status: ${inc.status}`);
      console.log(`      Descrição: ${inc.descricao.substring(0, 60)}...`);
    });
  }

  console.log('\n');
  return data;
}

// Função para testar Cobertura de Acesso
async function testarCoberturaAcesso(token) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   TESTE: COBERTURA DE REGRAS DE ACESSO POR PERFIL');
  console.log('═══════════════════════════════════════════════════════════\n');

  const response = await fetch(`${BASE_URL}/api/security-metrics/cobertura-acesso`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  console.log(`📊 Métrica: ${data.metrica}`);
  console.log(`📐 Fórmula: ${data.formula}`);
  console.log(`\n📈 DADOS:`);
  console.log(`   Total de Funcionalidades: ${data.dados.totalFuncionalidades}`);
  console.log(`   Com RBAC: ${data.dados.totalComRBAC}`);
  console.log(`   Sem RBAC: ${data.dados.totalSemRBAC}`);
  console.log(`   Cobertura: ${data.dados.coberturaPercentual}%`);
  console.log(`\n💡 Interpretação: ${data.interpretacao}`);

  if (data.estatisticasPorPerfil && data.estatisticasPorPerfil.length > 0) {
    console.log(`\n👥 Estatísticas por Perfil:`);
    data.estatisticasPorPerfil.forEach((perfil) => {
      const emoji = parseFloat(perfil.cobertura_percentual) >= 90 ? '✅' : 
                    parseFloat(perfil.cobertura_percentual) >= 70 ? '⚠️' : '❌';
      console.log(`   ${emoji} ${perfil.perfil}: ${perfil.com_rbac}/${perfil.total_funcionalidades} (${perfil.cobertura_percentual}%)`);
    });
  }

  if (data.estatisticasPorNivelRisco && data.estatisticasPorNivelRisco.length > 0) {
    console.log(`\n⚠️  Estatísticas por Nível de Risco:`);
    data.estatisticasPorNivelRisco.forEach((risco) => {
      const emoji = risco.nivel_risco === 'CRITICO' ? '🔴' :
                    risco.nivel_risco === 'ALTO' ? '🟠' :
                    risco.nivel_risco === 'MEDIO' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${risco.nivel_risco}: ${risco.com_rbac}/${risco.total_funcionalidades} (${risco.cobertura_percentual || 0}%)`);
    });
  }

  if (data.funcionalidadesSemRBAC && data.funcionalidadesSemRBAC.length > 0) {
    console.log(`\n❌ Funcionalidades SEM RBAC (${data.funcionalidadesSemRBAC.length} encontradas):`);
    data.funcionalidadesSemRBAC.slice(0, 5).forEach((func, i) => {
      const emoji = func.nivel_risco === 'CRITICO' ? '🔴' :
                    func.nivel_risco === 'ALTO' ? '🟠' :
                    func.nivel_risco === 'MEDIO' ? '🟡' : '🟢';
      console.log(`   ${i + 1}. ${emoji} [${func.perfil}] ${func.funcionalidade}`);
      console.log(`      Endpoint: ${func.endpoint || 'N/A'} | Risco: ${func.nivel_risco}`);
    });
  }

  console.log('\n');
  return data;
}

// Função para testar estatísticas gerais
async function testarEstatisticas(token) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   TESTE: ESTATÍSTICAS GERAIS DE SEGURANÇA');
  console.log('═══════════════════════════════════════════════════════════\n');

  const response = await fetch(`${BASE_URL}/api/security-metrics/estatisticas`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  console.log('📊 INCIDENTES POR TIPO:');
  if (data.porTipo && data.porTipo.length > 0) {
    data.porTipo.forEach((item) => {
      console.log(`   ${item.tipo}: ${item.quantidade}`);
    });
  } else {
    console.log('   Nenhum incidente registrado');
  }

  console.log('\n🎯 INCIDENTES POR SEVERIDADE:');
  if (data.porSeveridade && data.porSeveridade.length > 0) {
    data.porSeveridade.forEach((item) => {
      const emoji = item.severidade === 'CRITICA' ? '🔴' :
                    item.severidade === 'ALTA' ? '🟠' :
                    item.severidade === 'MEDIA' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${item.severidade}: ${item.quantidade}`);
    });
  }

  console.log('\n📋 INCIDENTES POR STATUS:');
  if (data.porStatus && data.porStatus.length > 0) {
    data.porStatus.forEach((item) => {
      const emoji = item.status === 'ABERTO' ? '🆕' :
                    item.status === 'EM_INVESTIGACAO' ? '🔍' :
                    item.status === 'RESOLVIDO' ? '✅' : '❌';
      console.log(`   ${emoji} ${item.status}: ${item.quantidade}`);
    });
  }

  console.log(`\n📊 Total de Registros Afetados: ${data.totalRegistrosAfetados}`);
  console.log(`⏱️  Tempo Médio de Resolução: ${data.tempoMedioResolucaoHoras} horas`);

  console.log('\n');
  return data;
}

// Executar todos os testes
async function executarTestes() {
  try {
    console.log('\n🚀 Iniciando testes das métricas de segurança...\n');
    
    const token = await login();
    
    await testarTaxaVazamento(token);
    await testarCoberturaAcesso(token);
    await testarEstatisticas(token);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
executarTestes();
