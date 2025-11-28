import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SecurityMetricsController from '../src/controllers/SecurityMetricsController.js';
import db from '../src/db.js';

describe('SecurityMetricsController - TAC', () => {
  beforeEach(() => {
    db.query = jest.fn();
  });

  it('retorna 100 quando não há solicitações (denominador = 0)', async () => {
    // Primeiro call: denominador, segundo call: numerador
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const req = { query: {} };
    const json = jest.fn();
    const res = { json };

    await SecurityMetricsController.calcularTAC(req, res);

    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.dados.totalSolicitacoes).toBe(0);
    expect(body.dados.totalAutorizados).toBe(0);
    expect(body.dados.tacPercentual).toBe(100);
  });

  it('calcula TAC corretamente com valores fornecidos', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '200' }] }); // denominador
    db.query.mockResolvedValueOnce({ rows: [{ total: '190' }] }); // numerador

    const req = { query: { perfil: 'admin', dataInicio: '2025-01-01', dataFim: '2025-12-31' } };
    const json = jest.fn();
    const res = { json };

    await SecurityMetricsController.calcularTAC(req, res);

    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.dados.totalSolicitacoes).toBe(200);
    expect(body.dados.totalAutorizados).toBe(190);
    expect(body.dados.tacPercentual).toBeCloseTo(95.00);
  });
});
