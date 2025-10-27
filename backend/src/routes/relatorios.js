import express from 'express';
import RelatoriosController from '../controllers/RelatoriosController.js';
import { autenticar } from '../middleware/auth.js';
import { permitir } from '../middleware/rbac.js';

const router = express.Router();

// Todas as rotas requerem autenticação e permissão de administrador
router.use(autenticar);
router.use(permitir(['admin', 'administrador']));

router.get('/funcionarios', (req, res) => RelatoriosController.gerarRelatorioFuncionarios(req, res));
router.get('/presenca', (req, res) => RelatoriosController.gerarRelatorioPresenca(req, res));
router.get('/beneficios', (req, res) => RelatoriosController.gerarRelatorioBeneficios(req, res));
router.get('/folha', (req, res) => RelatoriosController.gerarRelatorioFolha(req, res));

export default router;