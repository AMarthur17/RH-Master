import { calcularFerias } from "../src/services/ferias.service.js";

describe("Serviço de cálculo de férias proporcionais", () => {
  test("0 meses -> 0 dias e valores zerados", () => {
    const r = calcularFerias(3000, 0);
    expect(r.diasFerias).toBe(0);
    expect(r.valorFerias).toBe(0);
    expect(r.umTercoFerias).toBe(0);
    expect(r.valorTotal).toBe(0);
  });

  test("1 mês -> 2 dias (2.5 arredonda para baixo)", () => {
    const r = calcularFerias(3000, 1);
    expect(r.diasFerias).toBe(2);
    // valorFerias = (3000/30)*2 = 100*2 = 200
    expect(r.valorFerias).toBe(200);
    expect(r.umTercoFerias).toBeCloseTo(66.67, 2);
  });

  test("5 meses -> 12 dias (2.5*5=12.5 floor->12)", () => {
    const r = calcularFerias(2400, 5);
    expect(r.diasFerias).toBe(12);
    // valorFerias = (2400/30)*12 = 80*12 = 960
    expect(r.valorFerias).toBe(960);
    expect(r.umTercoFerias).toBeCloseTo(320, 2);
  });

  test("12 meses -> 30 dias", () => {
    const r = calcularFerias(1500, 12);
    expect(r.diasFerias).toBe(30);
    expect(r.valorFerias).toBe(1500);
    expect(r.umTercoFerias).toBeCloseTo(500, 2);
    expect(r.valorTotal).toBeCloseTo(2000, 2);
  });

  test("meses negativos -> 0 dias", () => {
    const r = calcularFerias(2000, -3);
    expect(r.diasFerias).toBe(0);
  });
});
