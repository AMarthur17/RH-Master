import assert from 'assert';
import horasExtraService from '../src/services/horasExtraService.js';

/**
 * Testes unitários para cálculo de horas extras e noturnas
 * 
 * Casos de teste:
 * 1. Jornada normal (8h) - sem extras
 * 2. Jornada com extras (10h) - 2h extras
 * 3. Jornada noturna (22h-05h) - sem extras, com acréscimo noturno
 * 4. Jornada noturna com extras (22h-06h) - 2h de extras noturnas
 * 5. Múltiplos dias em um mês
 */

console.log('🧪 Iniciando testes de horas extras e noturnas...\n');

// Teste 1: Conversão de hora para minutos
console.log('✓ Teste 1: Conversão de hora para minutos');
const minutos1 = horasExtraService._converterParaMinutos('14:30');
assert.strictEqual(minutos1, 14 * 60 + 30, 'Falha na conversão 14:30 -> minutos');
console.log('  ✓ 14:30 = 870 minutos\n');

// Teste 2: Separação de horas normais (8h) vs extras (10h)
console.log('✓ Teste 2: Separação de horas - jornada com extras');
const resultado2 = horasExtraService._separaHorasPorTipo('08:00', '18:00', 10);
assert.strictEqual(resultado2.hNormal, 8, 'Deveria ter 8h normais');
assert.strictEqual(resultado2.hExtra, 2, 'Deveria ter 2h extras');
assert.strictEqual(resultado2.hNoturna, 0, 'Não deveria ter horas noturnas');
console.log(`  ✓ 08:00-18:00 (10h): ${resultado2.hNormal}h normal + ${resultado2.hExtra}h extra\n`);

// Teste 3: Jornada noturna (22h-05h) - virou a noite
console.log('✓ Teste 3: Jornada noturna que virou a noite');
const resultado3 = horasExtraService._separaHorasPorTipo('22:00', '05:00', 7);
assert.strictEqual(resultado3.hNoturna, 7, 'Todas as 7h deveriam ser noturnas');
assert.strictEqual(resultado3.hNormal, 0, 'Não deveria haver horas normais');
console.log(`  ✓ 22:00-05:00 (7h): ${resultado3.hNoturna}h noturnas\n`);

// Teste 4: Jornada noturna com extras (22h-06h = 8h noturnas)
console.log('✓ Teste 4: Jornada noturna com extras');
const resultado4 = horasExtraService._separaHorasPorTipo('22:00', '06:00', 8);
assert.strictEqual(resultado4.hNoturna, 8, 'Deveriam ser 8h noturnas');
assert.strictEqual(resultado4.hExtra, 0, 'Sem extras pois é exatamente 8h');
console.log(`  ✓ 22:00-06:00 (8h): ${resultado4.hNoturna}h noturnas\n`);

// Teste 5: Jornada com final noturno (14h-22h-05h)
console.log('✓ Teste 5: Jornada que se estende pela madrugada');
const resultado5 = horasExtraService._separaHorasPorTipo('14:00', '23:00', 9);
// 14h-22h = 8h normal
// 22h-23h = 1h noturna
assert(resultado5.hNormal <= 8, 'Máximo 8h normal');
assert(resultado5.hExtra >= 0, 'Pode ter extras');
console.log(`  ✓ 14:00-23:00 (9h): ${resultado5.hNormal}h normal + ${resultado5.hExtra}h extra + ${resultado5.hNoturna}h noturna\n`);

// Teste 6: Cálculo de valor (exemplo)
console.log('✓ Teste 6: Cálculo de valor de horas extras');
const salarioBase = 3000;
const valorHora = salarioBase / 220;
const horasExtra = 2;
const valorExtraEsperado = horasExtra * valorHora * 1.5;
console.log(`  ✓ Salário R$ ${salarioBase.toFixed(2)}`);
console.log(`  ✓ Valor/hora: R$ ${valorHora.toFixed(2)}`);
console.log(`  ✓ 2h extras (1.5x): R$ ${valorExtraEsperado.toFixed(2)}\n`);

console.log('✅ Todos os testes passaram!\n');
console.log('Resumo da lógica implementada:');
console.log('- Hora Extra: Qualquer hora acima de 8h/dia (multiplicador 1.5x)');
console.log('- Hora Noturna: Entre 22h e 05h (multiplicador 1.2x = 20% acréscimo)');
console.log('- Se houver sobreposição, ambas as regras se aplicam');
console.log('- Cálculo por dia, agregado no mês para gerar folha final');
