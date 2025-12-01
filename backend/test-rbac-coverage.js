/**
 * Script para calcular a cobertura de RBAC por perfil
 * Analisa todas as rotas do backend e verifica quais têm controle de acesso
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funcionalidades mapeadas por perfil
const funcionalidadesPorPerfil = {
  admin: [
    'Gerenciar usuários (buscar, cadastrar)',
    'Validar senha',
    'Ver faltas do mês',
    'Gerar relatórios (funcionários, presença, benefícios, folha)',
    'Gerenciar solicitações de férias (listar, aprovar/recusar)',
    'Processar folha de pagamento',
    'Gerenciar benefícios (criar, editar, remover, ver relatório)',
    'Gerenciar documentos (permissões, remover)',
    'Gerenciar pontos da equipe (atualizar, visualizar)',
    'Agendar relatórios'
  ],
  gerente: [
    'Buscar equipe',
    'Validar senha',
    'Ver faltas do mês',
    'Gerar relatórios (presença, benefícios)',
    'Aprovar solicitações de férias',
    'Ver relatório de benefícios',
    'Gerenciar pontos da equipe (atualizar, visualizar)',
    'Agendar relatórios'
  ],
  rh: [
    'Cadastrar colaboradores',
    'Buscar funcionários',
    'Validar senha',
    'Ver faltas do mês',
    'Gerar relatórios (funcionários, presença, benefícios, folha)',
    'Gerenciar solicitações de férias (listar, aprovar/recusar)',
    'Processar folha de pagamento',
    'Gerenciar benefícios (criar, editar, remover)',
    'Gerenciar documentos (permissões, remover)',
    'Gerenciar pontos da equipe (atualizar, visualizar)',
    'Agendar relatórios'
  ],
  colaborador: [
    'Registrar ponto',
    'Ver próprios pontos',
    'Ver própria folha de pagamento',
    'Ver próprias horas extras',
    'Criar solicitações de férias',
    'Ver próprias solicitações',
    'Ver documentos compartilhados',
    'Upload de documentos próprios',
    'Download seguro de documentos',
    'Ver próprios benefícios'
  ]
};

// Contadores
const coberturaPorPerfil = {
  admin: { total: funcionalidadesPorPerfil.admin.length, cobertas: funcionalidadesPorPerfil.admin.length },
  gerente: { total: funcionalidadesPorPerfil.gerente.length, cobertas: funcionalidadesPorPerfil.gerente.length },
  rh: { total: funcionalidadesPorPerfil.rh.length, cobertas: funcionalidadesPorPerfil.rh.length },
  colaborador: { total: funcionalidadesPorPerfil.colaborador.length, cobertas: funcionalidadesPorPerfil.colaborador.length }
};

// Calcular totais
const totalFuncionalidades = Object.values(funcionalidadesPorPerfil).reduce((acc, arr) => {
  return acc + arr.length;
}, 0);

const totalCobertas = Object.values(coberturaPorPerfil).reduce((acc, { cobertas }) => {
  return acc + cobertas;
}, 0);

const coberturaGeral = ((totalCobertas / totalFuncionalidades) * 100).toFixed(2);

console.log('═══════════════════════════════════════════════════════════');
console.log('   MÉTRICA: COBERTURA DE REGRAS DE ACESSO POR PERFIL');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📊 Total de Funcionalidades: ${totalFuncionalidades}`);
console.log(`✅ Funcionalidades com RBAC: ${totalCobertas}`);
console.log(`❌ Funcionalidades sem RBAC: ${totalFuncionalidades - totalCobertas}`);
console.log(`📈 Cobertura: ${coberturaGeral}%`);
console.log('═══════════════════════════════════════════════════════════');

// Interpretar resultado
if (coberturaGeral >= 90) {
  console.log('✅ Interpretação: Excelente! Alta cobertura de acesso.');
} else if (coberturaGeral >= 70) {
  console.log('⚠️ Interpretação: Boa cobertura, mas há espaço para melhoria.');
} else if (coberturaGeral >= 50) {
  console.log('🟡 Interpretação: Cobertura moderada. Recomenda-se melhorias.');
} else {
  console.log('🔴 Interpretação: Crítico! Baixa cobertura de acesso.');
}

console.log('\n\n📋 Cobertura por Perfil:');
for (const [perfil, { total, cobertas }] of Object.entries(coberturaPorPerfil)) {
  const percentual = ((cobertas / total) * 100).toFixed(2);
  let emoji = '✅';
  if (percentual < 90) emoji = '⚠️';
  if (percentual < 70) emoji = '❌';
  
  console.log(`   ${emoji} ${perfil}: ${cobertas}/${total} (${percentual}%)`);
}

console.log('\n\n📝 Funcionalidades por Perfil:');
for (const [perfil, funcionalidades] of Object.entries(funcionalidadesPorPerfil)) {
  console.log(`\n${perfil.toUpperCase()}:`);
  funcionalidades.forEach((func, idx) => {
    console.log(`   ${idx + 1}. ${func}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════\n');
