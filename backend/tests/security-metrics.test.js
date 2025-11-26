import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

// Mock ESM module for db
const mockDb = {
  query: jest.fn(),
};

jest.unstable_mockModule('../src/db.js', () => ({ default: mockDb }));

let SecurityMetricsController;

describe('SecurityMetricsController.calcularTAC', () => {
  let req;
  let res;

  beforeAll(async () => {
    const mod = await import('../src/controllers/SecurityMetricsController.js');
    SecurityMetricsController = mod.default;
  });

  beforeEach(() => {
    req = { query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
    mockDb.query.mockReset();
  });

  it('retorna mensagem quando não há solicitações', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] }); // totalSolicitacoes
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] }); // totalAutorizados

    await SecurityMetricsController.calcularTAC(req, res);

    expect(res.json).toHaveBeenCalled();
    const result = res.json.mock.calls[0][0];
    expect(result.dados.totalSolicitacoes).toBe(0);
    expect(result.dados.totalAutorizados).toBe(0);
    expect(result.dados.tacPercentual).toBe(0);
    expect(result.interpretacao).toMatch(/Não há solicitações/);
  });

  it('calcula TAC corretamente quando existem solicitações e autorizações', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ total: '200' }] }) // totalSolicitacoes
      .mockResolvedValueOnce({ rows: [{ total: '190' }] }); // totalAutorizados

    await SecurityMetricsController.calcularTAC(req, res);

    expect(res.json).toHaveBeenCalled();
    const result = res.json.mock.calls[0][0];
    expect(result.dados.totalSolicitacoes).toBe(200);
    expect(result.dados.totalAutorizados).toBe(190);
    expect(result.dados.tacPercentual).toBeCloseTo(95.0, 2);
    expect(result.interpretacao).toMatch(/Bom|Excelente|Atenção|Problema/);
  });

  it('aceita filtro por perfil e retorna porcentagem correta', async () => {
    req.query = { perfil: 'admin', dataInicio: '2025-01-01', dataFim: '2025-12-31' };

    mockDb.query
      .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // totalSolicitacoes
      .mockResolvedValueOnce({ rows: [{ total: '49' }] }); // totalAutorizados

    await SecurityMetricsController.calcularTAC(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.filtros.perfil).toBe('admin');
    expect(result.dados.totalSolicitacoes).toBe(50);
    expect(result.dados.totalAutorizados).toBe(49);
    expect(result.dados.tacPercentual).toBeCloseTo(98.0, 2);
  });
});
