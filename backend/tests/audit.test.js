/**
 * Testes para o Sistema de Auditoria
 * US-E6-02 - Auditoria e Logs de Segurança
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import db from '../db.js';
import AuditController from '../controllers/AuditController.js';

describe('Sistema de Auditoria - US-E6-02', () => {
  let adminToken;
  let auditorToken;
  let colaboradorToken;
  let testLogId;

  beforeAll(async () => {
    // Setup: Criar usuários de teste e obter tokens
    // adminToken = await createTestUser('admin');
    // auditorToken = await createTestUser('auditor');
    // colaboradorToken = await createTestUser('colaborador');
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    // await db.query('DELETE FROM audit_logs WHERE usuario_email LIKE $1', ['%@test.com']);
  });

  describe('Registro de Logs', () => {
    it('deve registrar um log de auditoria com sucesso', async () => {
      const logData = {
        usuarioId: 1,
        usuarioNome: 'Teste Usuario',
        usuarioEmail: 'teste@test.com',
        acao: 'TESTE_ACAO',
        categoria: 'TESTE',
        descricao: 'Teste de registro de log',
        resultado: 'SUCESSO',
        nivelCriticidade: 'BAIXO',
      };

      const log = await AuditController.registrarLog(logData);

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.acao).toBe('TESTE_ACAO');
      expect(log.hash_integridade).toBeDefined();
      expect(log.hash_integridade.length).toBe(64); // SHA-256

      testLogId = log.id;
    });

    it('deve calcular hash de integridade automaticamente', async () => {
      const query = 'SELECT hash_integridade FROM audit_logs WHERE id = $1';
      const result = await db.query(query, [testLogId]);

      expect(result.rows[0].hash_integridade).toBeDefined();
      expect(result.rows[0].hash_integridade.length).toBe(64);
    });

    it('deve impedir UPDATE em logs de auditoria', async () => {
      const query = 'UPDATE audit_logs SET acao = $1 WHERE id = $2';

      await expect(
        db.query(query, ['ACAO_MODIFICADA', testLogId])
      ).rejects.toThrow();
    });

    it('deve impedir DELETE em logs de auditoria', async () => {
      const query = 'DELETE FROM audit_logs WHERE id = $1';

      await expect(
        db.query(query, [testLogId])
      ).rejects.toThrow();
    });
  });

  describe('Consulta de Logs - GET /audit/logs', () => {
    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('deve retornar 403 para colaborador sem permissão', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .expect(403);

      expect(response.body.error).toBe('Acesso negado');
    });

    it('deve retornar logs para administrador', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.logs).toBeDefined();
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body.paginacao).toBeDefined();
      expect(response.body.paginacao.total).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar logs para auditor', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${auditorToken}`)
        .expect(200);

      expect(response.body.logs).toBeDefined();
    });

    it('deve filtrar logs por categoria', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ categoria: 'AUTENTICACAO' })
        .expect(200);

      response.body.logs.forEach(log => {
        expect(log.categoria).toBe('AUTENTICACAO');
      });
    });

    it('deve filtrar logs por ação', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ acao: 'LOGIN' })
        .expect(200);

      response.body.logs.forEach(log => {
        expect(log.acao).toBe('LOGIN');
      });
    });

    it('deve filtrar logs por resultado', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ resultado: 'FALHA' })
        .expect(200);

      response.body.logs.forEach(log => {
        expect(log.resultado).toBe('FALHA');
      });
    });

    it('deve filtrar logs por criticidade', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ nivelCriticidade: 'CRITICO' })
        .expect(200);

      response.body.logs.forEach(log => {
        expect(log.nivel_criticidade).toBe('CRITICO');
      });
    });

    it('deve filtrar logs por período de datas', async () => {
      const dataInicio = '2025-11-01T00:00:00Z';
      const dataFim = '2025-11-30T23:59:59Z';

      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ dataInicio, dataFim })
        .expect(200);

      response.body.logs.forEach(log => {
        const dataLog = new Date(log.data_hora);
        expect(dataLog >= new Date(dataInicio)).toBe(true);
        expect(dataLog <= new Date(dataFim)).toBe(true);
      });
    });

    it('deve buscar logs por texto', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ busca: 'login' })
        .expect(200);

      expect(response.body.logs.length).toBeGreaterThanOrEqual(0);
    });

    it('deve paginar resultados corretamente', async () => {
      const page1 = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(page1.body.logs.length).toBeLessThanOrEqual(5);
      expect(page1.body.paginacao.page).toBe(1);

      const page2 = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(page2.body.paginacao.page).toBe(2);
    });

    it('deve ordenar logs por campo e direção', async () => {
      const response = await request(app)
        .get('/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ orderBy: 'data_hora', orderDir: 'DESC', limit: 10 })
        .expect(200);

      const datas = response.body.logs.map(log => new Date(log.data_hora));
      for (let i = 1; i < datas.length; i++) {
        expect(datas[i - 1] >= datas[i]).toBe(true);
      }
    });
  });

  describe('Log Específico - GET /audit/logs/:id', () => {
    it('deve retornar detalhes de um log específico', async () => {
      const response = await request(app)
        .get(`/audit/logs/${testLogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testLogId);
      expect(response.body.acao).toBeDefined();
      expect(response.body.hash_integridade).toBeDefined();
    });

    it('deve retornar 404 para log inexistente', async () => {
      const response = await request(app)
        .get('/audit/logs/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Log não encontrado');
    });
  });

  describe('Estatísticas - GET /audit/statistics', () => {
    it('deve retornar estatísticas gerais', async () => {
      const response = await request(app)
        .get('/audit/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.total).toBeDefined();
      expect(response.body.porCategoria).toBeDefined();
      expect(response.body.porAcao).toBeDefined();
      expect(response.body.porResultado).toBeDefined();
      expect(response.body.porCriticidade).toBeDefined();
      expect(response.body.usuariosMaisAtivos).toBeDefined();
      expect(response.body.atividadePorDia).toBeDefined();
    });

    it('deve filtrar estatísticas por período', async () => {
      const response = await request(app)
        .get('/audit/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          dataInicio: '2025-11-01',
          dataFim: '2025-11-30'
        })
        .expect(200);

      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Verificação de Integridade - GET /audit/logs/:id/verify', () => {
    it('deve verificar integridade de log íntegro', async () => {
      const response = await request(app)
        .get(`/audit/logs/${testLogId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.integro).toBe(true);
      expect(response.body.hashArmazenado).toBe(response.body.hashCalculado);
      expect(response.body.mensagem).toContain('íntegro');
    });
  });

  describe('Exportação - GET /audit/export', () => {
    it('deve exportar logs em formato JSON', async () => {
      const response = await request(app)
        .get('/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ formato: 'json', limit: 10 })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.logs).toBeDefined();
    });

    it('deve exportar logs em formato CSV', async () => {
      const response = await request(app)
        .get('/audit/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ formato: 'csv', limit: 10 })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('ID,Usuario,Email,Acao');
    });
  });

  describe('Endpoints Auxiliares', () => {
    it('deve listar ações disponíveis', async () => {
      const response = await request(app)
        .get('/audit/actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve listar categorias', async () => {
      const response = await request(app)
        .get('/audit/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve listar usuários com atividades', async () => {
      const response = await request(app)
        .get('/audit/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar ações recentes', async () => {
      const response = await request(app)
        .get('/audit/recent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(100);
    });

    it('deve retornar ações críticas', async () => {
      const response = await request(app)
        .get('/audit/critical')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(log => {
        expect(['CRITICO', 'ALTO']).toContain(log.nivel_criticidade);
      });
    });

    it('deve retornar tentativas falhas', async () => {
      const response = await request(app)
        .get('/audit/failed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(log => {
        expect(['FALHA', 'NEGADO']).toContain(log.resultado);
      });
    });
  });

  describe('Middleware de Auditoria Automática', () => {
    it('deve registrar auditoria automaticamente no login', async () => {
      const beforeCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE acao = $1',
        ['LOGIN']
      );

      await request(app)
        .post('/login')
        .send({ email: 'teste@test.com', senha: 'senha123' });

      const afterCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE acao = $1',
        ['LOGIN']
      );

      expect(parseInt(afterCount.rows[0].count)).toBeGreaterThan(
        parseInt(beforeCount.rows[0].count)
      );
    });

    it('deve registrar auditoria em criação de usuário', async () => {
      const beforeCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE acao = $1',
        ['CRIAR_USUARIO']
      );

      await request(app)
        .post('/usuario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Novo Usuario',
          cpf: '12345678901',
          email: 'novo@test.com',
          senha: 'senha123'
        });

      const afterCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE acao = $1',
        ['CRIAR_USUARIO']
      );

      expect(parseInt(afterCount.rows[0].count)).toBeGreaterThan(
        parseInt(beforeCount.rows[0].count)
      );
    });

    it('deve registrar auditoria em tentativa negada', async () => {
      const beforeCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE resultado = $1',
        ['NEGADO']
      );

      await request(app)
        .delete('/usuario/1')
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .expect(403);

      const afterCount = await db.query(
        'SELECT COUNT(*) FROM audit_logs WHERE resultado = $1',
        ['NEGADO']
      );

      expect(parseInt(afterCount.rows[0].count)).toBeGreaterThan(
        parseInt(beforeCount.rows[0].count)
      );
    });
  });

  describe('Cenários de Segurança', () => {
    it('deve detectar múltiplas tentativas de login falhadas', async () => {
      const email = 'teste.seguranca@test.com';

      // Simular 3 tentativas de login falhadas
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/login')
          .send({ email, senha: 'senha_errada' });
      }

      const query = `
        SELECT COUNT(*) 
        FROM audit_logs 
        WHERE usuario_email = $1 
        AND acao LIKE '%LOGIN%' 
        AND resultado = 'FALHA'
        AND data_hora > NOW() - INTERVAL '1 hour'
      `;

      const result = await db.query(query, [email]);
      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(3);
    });

    it('deve registrar acesso a dados sensíveis', async () => {
      await request(app)
        .get('/relatorios/salarios')
        .set('Authorization', `Bearer ${adminToken}`);

      const query = `
        SELECT * FROM audit_logs 
        WHERE categoria = 'RELATORIO' 
        AND nivel_criticidade IN ('ALTO', 'CRITICO')
        ORDER BY data_hora DESC 
        LIMIT 1
      `;

      const result = await db.query(query);
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
