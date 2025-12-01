import express from 'express';
import ScheduledReportsController from '../controllers/ScheduledReportsController.js';
import { autenticar } from '../middleware/auth.js';
import { permitir } from '../middleware/rbac.js';

const router = express.Router();

// Todas as rotas de agendamento requerem autenticação e permissão de admin, gerente ou rh
router.use(autenticar);
router.use(permitir(['admin', 'administrador', 'gerente', 'rh']));

router.get('/', (req, res) => ScheduledReportsController.list(req, res));
router.post('/', (req, res) => ScheduledReportsController.create(req, res));
router.delete('/:id', (req, res) => ScheduledReportsController.remove(req, res));
router.post('/:id/run', (req, res) => ScheduledReportsController.runNow(req, res));

export default router;
