import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SecurityMetricsController from '../src/controllers/SecurityMetricsController.js';
import db from '../src/db.js';

describe('SecurityMetricsController - CL', () => {
  beforeEach(() => {
    db.query = jest.fn();
  });

  it('retorna 100 quando não há eventos críticos definidos', async () => {
    // total definidos = 0, total cobertos = 0
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] }); // total definidos
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] }); // total cobertos

    const req = { query: {} };
    const json = jest.fn();
    const res = { json };

    await SecurityMetricsController.calcularCL(req, res);

    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.dados.totalDefinidos).toBe(0);
    expect(body.dados.totalCobertos).toBe(0);
    expect(body.dados.clPercentual).toBe(100);
  });

  it('calcula CL corretamente com valores fornecidos', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '20' }] }); // total definidos
    db.query.mockResolvedValueOnce({ rows: [{ total: '15' }] }); // total cobertos

    const req = { query: { dataInicio: '2025-01-01', dataFim: '2025-12-31' } };
    const json = jest.fn();
    const res = { json };

    await SecurityMetricsController.calcularCL(req, res);

    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.dados.totalDefinidos).toBe(20);
    expect(body.dados.totalCobertos).toBe(15);
    expect(body.dados.clPercentual).toBeCloseTo(75.00);
  });
});
