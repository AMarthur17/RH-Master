import db from '../db.js';

class SolicitacoesController {
  // Criar nova solicitação
  async criar(req, res) {
    try {
      const { usuario_id, tipo, data_inicio, data_fim, motivo } = req.body;
      if (!usuario_id || !tipo || !data_inicio || !data_fim) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      const result = await db.query(
        `INSERT INTO solicitacoes_licenca (usuario_id, tipo, data_inicio, data_fim, motivo)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [usuario_id, tipo, data_inicio, data_fim, motivo || null]
      );

      res.status(201).json({ solicitacao: result.rows[0] });
    } catch (err) {
      console.error('Erro ao criar solicitação:', err);
      res.status(500).json({ error: 'Erro ao criar solicitação' });
    }
  }

  // Listar solicitações de um usuário
  async listarPorUsuario(req, res) {
    try {
      const usuarioId = req.params.usuarioId;
      const { rows } = await db.query(
        'SELECT * FROM solicitacoes_licenca WHERE usuario_id = $1 ORDER BY criado_em DESC',
        [usuarioId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Erro ao buscar solicitações por usuário:', err);
      res.status(500).json({ error: 'Erro ao buscar solicitações' });
    }
  }

  // Listar solicitações (admin) - suportar filtros por empresa e pendentes
  async listar(req, res) {
    try {
      const { empresa, pendentes } = req.query;

      // Se empresa foi informada, buscar usuários da empresa e filtrar
      let baseQuery = `SELECT s.*, u.nome, u.email, u.empresa FROM solicitacoes_licenca s JOIN usuario u ON s.usuario_id = u.id`;
      const values = [];
      const where = [];

      if (empresa) {
        values.push(empresa);
        where.push(`u.empresa = $${values.length}`);
      }

      if (pendentes === 'true') {
        where.push(`s.status = 'pendente'`);
      }

      if (where.length) baseQuery += ' WHERE ' + where.join(' AND ');
      baseQuery += ' ORDER BY s.criado_em DESC';

      const { rows } = await db.query(baseQuery, values);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar solicitações (admin):', err);
      res.status(500).json({ error: 'Erro ao listar solicitações' });
    }
  }

  // Aprovar ou recusar solicitação
  async decidir(req, res) {
    try {
      const id = req.params.id;
      const { acao } = req.body; // 'aprovar' | 'recusar'
      const usuarioDecisor = req.user?.id || null;

      if (!acao || !['aprovar', 'recusar'].includes(acao)) {
        return res.status(400).json({ error: 'Ação inválida' });
      }

      const novoStatus = acao === 'aprovar' ? 'aprovado' : 'recusado';

      const { rows } = await db.query(
        `UPDATE solicitacoes_licenca SET status = $1, aprovado_por = $2, atualizado_em = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
        [novoStatus, usuarioDecisor, id]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Solicitação não encontrada' });

      res.json({ solicitacao: rows[0] });
    } catch (err) {
      console.error('Erro ao decidir solicitação:', err);
      res.status(500).json({ error: 'Erro ao decidir solicitação' });
    }
  }
}

export default new SolicitacoesController();
