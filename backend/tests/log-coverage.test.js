import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

// Mock ESM module for db
const mockDb = { query: jest.fn() };
jest.unstable_mockModule('../src/db.js', () => ({ default: mockDb }));

let SecurityMetricsController;

describe('SecurityMetricsController.calcularCoberturaLogs', () => {
  let req;

  beforeAll(async () => {
    const mod = await import('../src/controllers/SecurityMetricsController.js');
    SecurityMetricsController = mod.default;
  });

  beforeEach(() => {
    req = { query: {} };
    mockDb.query.mockReset();
  });

  function makeRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }

  it('retorna 400 quando a tabela sensitive_events não existe', async () => {
    mockDb.query.mockRejectedValueOnce(new Error("relation \"sensitive_events\" does not exist"));

    const res = makeRes();
    await SecurityMetricsController.calcularCoberturaLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toMatch(/Tabela 'sensitive_events' não encontrada/);
  });

  it('retorna 0 quando não há eventos definidos', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const res = makeRes();
    await SecurityMetricsController.calcularCoberturaLogs(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.dados.totalDefinidos).toBe(0);
    expect(payload.dados.totalRegistrados).toBe(0);
    expect(payload.dados.clPercentual).toBe(0);
  });

  it('calcula percentual corretamente quando existem definidos e registrados', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] }) // totalDefinidos
      .mockResolvedValueOnce({ rows: [{ total_registrados: '3' }] }); // totalRegistrados

    const res = makeRes();
    await SecurityMetricsController.calcularCoberturaLogs(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.dados.totalDefinidos).toBe(4);
    expect(payload.dados.totalRegistrados).toBe(3);
    expect(payload.dados.clPercentual).toBeCloseTo(75.0, 2);
  });
});
