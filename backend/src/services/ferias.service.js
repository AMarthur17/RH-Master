// serviço responsável pelo cálculo de férias proporcionais
export function roundTo2(value) {
  return Number(Number(value).toFixed(2));
}

export function calcularFerias(salarioBase, mesesTrabalhados) {
  const salario = Number(salarioBase) || 0;
  const meses = Number(mesesTrabalhados) || 0;

  // Regra adotada:
  // - 30 dias = 12 meses
  // - dias proporcionais = floor(meses * 30/12) (arredondamento para baixo conforme prática comum)
  // - se meses >= 12 => 30 dias
  const dias = meses >= 12 ? 30 : Math.floor(Math.max(0, meses) * (30 / 12));

  // Valor das férias proporcional aos dias (salário dividido por 30 dias do mês)
  const valorFerias = roundTo2((salario / 30) * dias);

  // Adicional de 1/3 constitucional
  const umTercoFerias = roundTo2(valorFerias / 3);

  const valorTotal = roundTo2(valorFerias + umTercoFerias);

  return {
    diasFerias: dias,
    valorFerias,
    umTercoFerias,
    valorTotal,
  };
}

export default { calcularFerias };
