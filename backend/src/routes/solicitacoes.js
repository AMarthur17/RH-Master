import express from 'express';
import solicitacoesController from '../controllers/solicitacoes.controller.js';
import { autenticar } from '../middleware/auth.js';
import { permitir } from '../middleware/rbac.js';

const router = express.Router();

// Criar solicitação (qualquer colaborador autenticado pode criar a sua)
router.post('/', autenticar, async (req, res) => {
  try {
    // garantir que o usuário só crie em seu próprio id, a não ser que seja admin
    const bodyUsuarioId = req.body.usuario_id;
    const requesterId = req.user.id;
    const perfil = (req.user.perfil || '').toLowerCase();
    if (bodyUsuarioId && bodyUsuarioId !== requesterId && perfil !== 'admin' && perfil !== 'administrador') {
      return res.status(403).json({ error: 'Não autorizado a criar solicitação para outro usuário' });
    }

    // se não veio usuario_id no body, usar requester
    if (!bodyUsuarioId) req.body.usuario_id = requesterId;

    return solicitacoesController.criar(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Listar solicitações de um usuário (o próprio usuário ou admin)
router.get('/:usuarioId', autenticar, async (req, res) => {
  const requesterId = req.user.id;
  const perfil = (req.user.perfil || '').toLowerCase();
  const usuarioId = Number(req.params.usuarioId);
  if (requesterId !== usuarioId && perfil !== 'admin' && perfil !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  return solicitacoesController.listarPorUsuario(req, res);
});

// Listar (admin) com filtros por empresa e pendentes
router.get('/', autenticar, permitir(['admin', 'administrador']), solicitacoesController.listar.bind(solicitacoesController));

// Decidir (aprovar/recusar)
router.put('/:id/decidir', autenticar, permitir(['admin', 'administrador']), solicitacoesController.decidir.bind(solicitacoesController));

export default router;
