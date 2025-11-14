/**
 * Exemplos de Integração do Sistema de Auditoria
 * 
 * Este arquivo demonstra como integrar o sistema de auditoria
 * em diferentes cenários e rotas do sistema RH-Master
 */

import express from 'express';
import { autenticar } from '../middleware/auth.js';
import { permitir } from '../middleware/rbac.js';
import { registrarAuditoriaManual } from '../middleware/audit.js';
import AuditController from '../controllers/AuditController.js';
import db from '../db.js';

const router = express.Router();

// ========================================
// EXEMPLO 1: Auditoria Automática
// ========================================
// Para rotas mapeadas no middleware audit.js, a auditoria é AUTOMÁTICA
// Não é necessário adicionar código adicional

/**
 * Esta rota será auditada automaticamente porque está mapeada
 * em ACOES_SENSIVEIS do middleware audit.js
 */
router.post('/usuario', autenticar, permitir(['administrador']), async (req, res) => {
  try {
    const { nome, cpf, email, cargo, salario } = req.body;
    
    const query = `
      INSERT INTO usuario (nome, cpf, email, cargo, salario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [nome, cpf, email, cargo, salario]);
    
    // A auditoria é registrada AUTOMATICAMENTE pelo middleware
    // Registra: CRIAR_USUARIO, categoria USUARIO, criticidade ALTO
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXEMPLO 2: Auditoria Manual com Dados Detalhados
// ========================================
// Para operações que precisam de mais contexto ou não estão mapeadas

/**
 * Exemplo de auditoria manual para capturar dados anteriores
 * antes de uma alteração
 */
router.put('/usuario/:id', autenticar, permitir(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { salario, cargo } = req.body;
    
    // 1. BUSCAR DADOS ANTERIORES (importante para auditoria)
    const dadosAnteriores = await db.query(
      'SELECT salario, cargo FROM usuario WHERE id = $1',
      [id]
    );
    
    if (dadosAnteriores.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const anterior = dadosAnteriores.rows[0];
    
    // 2. REALIZAR ALTERAÇÃO
    const query = `
      UPDATE usuario 
      SET salario = $1, cargo = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [salario, cargo, id]);
    const novo = result.rows[0];
    
    // 3. REGISTRAR AUDITORIA MANUALMENTE com dados anteriores e novos
    await registrarAuditoriaManual(req, {
      acao: 'EDITAR_SALARIO_CARGO',
      categoria: 'USUARIO',
      descricao: `Alterou salário de R$ ${anterior.salario} para R$ ${salario} e cargo de ${anterior.cargo} para ${cargo}`,
      resultado: 'SUCESSO',
      nivelCriticidade: 'CRITICO', // Alteração de salário é crítica
      dadosAnteriores: {
        salario: anterior.salario,
        cargo: anterior.cargo
      },
      dadosNovos: {
        salario: novo.salario,
        cargo: novo.cargo
      },
      metadata: {
        usuarioAlteradoId: id,
        diferencaSalario: parseFloat(salario) - parseFloat(anterior.salario)
      }
    });
    
    return res.json(novo);
  } catch (error) {
    // Registrar falha na auditoria
    await registrarAuditoriaManual(req, {
      acao: 'EDITAR_SALARIO_CARGO',
      categoria: 'USUARIO',
      descricao: `Tentativa de alterar salário falhou: ${error.message}`,
      resultado: 'FALHA',
      nivelCriticidade: 'CRITICO',
      metadata: { erro: error.message }
    });
    
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXEMPLO 3: Auditoria de Operação Complexa
// ========================================

/**
 * Exemplo: Aprovação de folha de pagamento
 * Operação crítica que afeta múltiplos registros
 */
router.post('/folha/:id/aprovar', autenticar, permitir(['administrador']), async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { observacoes } = req.body;
    
    // Buscar folha antes da aprovação
    const folhaResult = await client.query(
      'SELECT * FROM folha_pagamento WHERE id = $1',
      [id]
    );
    
    if (folhaResult.rows.length === 0) {
      throw new Error('Folha não encontrada');
    }
    
    const folha = folhaResult.rows[0];
    
    // Aprovar folha
    await client.query(
      'UPDATE folha_pagamento SET status = $1, aprovado_por = $2, aprovado_em = NOW() WHERE id = $3',
      ['aprovado', req.user.id, id]
    );
    
    // Registrar aprovação em histórico
    await client.query(
      'INSERT INTO historico_folha (folha_id, acao, usuario_id, observacoes) VALUES ($1, $2, $3, $4)',
      [id, 'APROVACAO', req.user.id, observacoes]
    );
    
    await client.query('COMMIT');
    
    // Registrar auditoria detalhada
    await AuditController.registrarLog({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      usuarioEmail: req.user.email,
      acao: 'APROVAR_FOLHA_PAGAMENTO',
      categoria: 'FOLHA_PAGAMENTO',
      descricao: `Aprovou folha de pagamento #${id} - Mês: ${folha.mes}/${folha.ano} - Valor: R$ ${folha.valor}`,
      endpoint: req.path,
      metodo: req.method,
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      nivelCriticidade: 'CRITICO',
      dadosAnteriores: {
        status: folha.status,
        aprovado_por: folha.aprovado_por
      },
      dadosNovos: {
        status: 'aprovado',
        aprovado_por: req.user.id,
        observacoes
      },
      metadata: {
        folhaId: id,
        mes: folha.mes,
        ano: folha.ano,
        valor: folha.valor,
        usuarioFolhaId: folha.usuario_id
      }
    });
    
    return res.json({ 
      success: true, 
      message: 'Folha aprovada com sucesso',
      auditado: true 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Registrar falha na auditoria
    await AuditController.registrarLog({
      usuarioId: req.user?.id,
      usuarioNome: req.user?.nome,
      usuarioEmail: req.user?.email,
      acao: 'APROVAR_FOLHA_PAGAMENTO',
      categoria: 'FOLHA_PAGAMENTO',
      descricao: `Falha ao aprovar folha #${req.params.id}: ${error.message}`,
      endpoint: req.path,
      metodo: req.method,
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      resultado: 'FALHA',
      nivelCriticidade: 'CRITICO',
      metadata: { erro: error.message }
    });
    
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ========================================
// EXEMPLO 4: Auditoria de Acesso a Dados Sensíveis
// ========================================

/**
 * Exemplo: Visualização de dados sensíveis (salários de todos)
 */
router.get('/relatorios/salarios', autenticar, permitir(['administrador']), async (req, res) => {
  try {
    const query = 'SELECT id, nome, cargo, salario FROM usuario ORDER BY salario DESC';
    const result = await db.query(query);
    
    // Auditar acesso a dados sensíveis
    await registrarAuditoriaManual(req, {
      acao: 'VISUALIZAR_RELATORIO_SALARIOS',
      categoria: 'RELATORIO',
      descricao: 'Acessou relatório completo de salários de todos os funcionários',
      resultado: 'SUCESSO',
      nivelCriticidade: 'ALTO',
      metadata: {
        totalRegistros: result.rows.length,
        dataAcesso: new Date().toISOString()
      }
    });
    
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXEMPLO 5: Auditoria de Tentativa Negada
// ========================================

/**
 * Exemplo: Capturar tentativas de acesso não autorizado
 */
router.delete('/usuario/:id', autenticar, async (req, res) => {
  try {
    // Verificar permissão
    if (req.user.perfil !== 'administrador') {
      // Registrar tentativa negada
      await registrarAuditoriaManual(req, {
        acao: 'EXCLUIR_USUARIO',
        categoria: 'USUARIO',
        descricao: `Tentativa negada de excluir usuário #${req.params.id} - Perfil: ${req.user.perfil}`,
        resultado: 'NEGADO',
        nivelCriticidade: 'CRITICO',
        metadata: {
          usuarioTentandoExcluir: req.user.id,
          perfilUsuario: req.user.perfil,
          usuarioAlvoId: req.params.id
        }
      });
      
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar dados antes de excluir
    const usuario = await db.query('SELECT * FROM usuario WHERE id = $1', [req.params.id]);
    
    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Excluir usuário
    await db.query('DELETE FROM usuario WHERE id = $1', [req.params.id]);
    
    // Auditar exclusão
    await registrarAuditoriaManual(req, {
      acao: 'EXCLUIR_USUARIO',
      categoria: 'USUARIO',
      descricao: `Excluiu usuário: ${usuario.rows[0].nome} (${usuario.rows[0].email})`,
      resultado: 'SUCESSO',
      nivelCriticidade: 'CRITICO',
      dadosAnteriores: usuario.rows[0],
      metadata: {
        usuarioExcluidoId: req.params.id,
        cpf: usuario.rows[0].cpf
      }
    });
    
    return res.json({ success: true });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXEMPLO 6: Auditoria de Login/Logout
// ========================================

/**
 * Exemplo: Auditoria de autenticação
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Auditar tentativa de login com email inexistente
      await AuditController.registrarLog({
        usuarioId: null,
        usuarioNome: null,
        usuarioEmail: email,
        acao: 'LOGIN_FALHA_EMAIL',
        categoria: 'AUTENTICACAO',
        descricao: `Tentativa de login com email não cadastrado: ${email}`,
        endpoint: '/login',
        metodo: 'POST',
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resultado: 'FALHA',
        nivelCriticidade: 'MEDIO',
        metadata: { email }
      });
      
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const usuario = result.rows[0];
    
    // Verificar senha (exemplo simplificado)
    const senhaValida = true; // await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      // Auditar tentativa de login com senha incorreta
      await AuditController.registrarLog({
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        acao: 'LOGIN_FALHA_SENHA',
        categoria: 'AUTENTICACAO',
        descricao: `Tentativa de login com senha incorreta`,
        endpoint: '/login',
        metodo: 'POST',
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resultado: 'FALHA',
        nivelCriticidade: 'ALTO', // Múltiplas tentativas podem indicar ataque
        metadata: { tentativasFalhas: 1 }
      });
      
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Login bem-sucedido
    // const token = jwt.sign(...);
    
    // Auditar login bem-sucedido
    await AuditController.registrarLog({
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      acao: 'LOGIN',
      categoria: 'AUTENTICACAO',
      descricao: `Login bem-sucedido`,
      endpoint: '/login',
      metodo: 'POST',
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      resultado: 'SUCESSO',
      nivelCriticidade: 'BAIXO',
      metadata: {
        perfil: usuario.cargo,
        ultimoAcesso: new Date().toISOString()
      }
    });
    
    return res.json({ 
      token: 'fake_token', 
      usuario: { id: usuario.id, nome: usuario.nome } 
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXEMPLO 7: Auditoria em Background Jobs
// ========================================

/**
 * Exemplo: Auditoria de processos em background
 */
async function processarFolhaMensal() {
  try {
    console.log('Iniciando processamento de folha mensal...');
    
    // Processar folha...
    const resultado = { folhasProcessadas: 150, erros: 0 };
    
    // Auditar processo em background
    await AuditController.registrarLog({
      usuarioId: null, // Processo automático
      usuarioNome: 'SISTEMA',
      usuarioEmail: 'sistema@empresa.com',
      acao: 'PROCESSAR_FOLHA_AUTOMATICO',
      categoria: 'FOLHA_PAGAMENTO',
      descricao: `Processamento automático de folha mensal concluído`,
      endpoint: 'BACKGROUND_JOB',
      metodo: 'SYSTEM',
      ipAddress: '127.0.0.1',
      userAgent: 'NodeJS Background Job',
      resultado: 'SUCESSO',
      nivelCriticidade: 'ALTO',
      metadata: {
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        folhasProcessadas: resultado.folhasProcessadas,
        erros: resultado.erros,
        inicioProcessamento: new Date().toISOString()
      }
    });
    
  } catch (error) {
    // Auditar falha em processo em background
    await AuditController.registrarLog({
      usuarioId: null,
      usuarioNome: 'SISTEMA',
      usuarioEmail: 'sistema@empresa.com',
      acao: 'PROCESSAR_FOLHA_AUTOMATICO',
      categoria: 'FOLHA_PAGAMENTO',
      descricao: `Falha no processamento automático: ${error.message}`,
      endpoint: 'BACKGROUND_JOB',
      metodo: 'SYSTEM',
      ipAddress: '127.0.0.1',
      userAgent: 'NodeJS Background Job',
      resultado: 'FALHA',
      nivelCriticidade: 'CRITICO',
      metadata: { erro: error.message }
    });
  }
}

export default router;
