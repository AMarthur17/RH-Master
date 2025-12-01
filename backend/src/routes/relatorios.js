import express from 'express';
import RelatoriosController from '../controllers/RelatoriosController.js';
import { autenticar } from '../middleware/auth.js';
import { permitir } from '../middleware/rbac.js';
import db from '../db.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(autenticar);

// Rotas de admin, gerente e rh
router.get('/funcionarios', permitir(['admin', 'administrador', 'rh']), (req, res) => RelatoriosController.gerarRelatorioFuncionarios(req, res));
router.get('/presenca', permitir(['admin', 'administrador', 'gerente', 'rh']), (req, res) => RelatoriosController.gerarRelatorioPresenca(req, res));
router.get('/beneficios', permitir(['admin', 'administrador', 'gerente', 'rh']), (req, res) => RelatoriosController.gerarRelatorioBeneficios(req, res));
router.get('/folha', permitir(['admin', 'administrador', 'rh']), (req, res) => RelatoriosController.gerarRelatorioFolha(req, res));

// Relatório de equipe para gerentes
router.get(
  '/equipe',
  permitir(['admin', 'administrador', 'gerente']),
  async (req, res) => {
    try {
      const perfil = (req.user?.perfil || "").toLowerCase();
      const { tipo } = req.query; // 'presenca', 'beneficios', 'geral'
      
      let empresaFilter = "";
      const valores = [];
      
      if (perfil === "gerente") {
        const gerenteQuery = await db.query("SELECT empresa FROM usuario WHERE id = $1", [req.user.id]);
        if (gerenteQuery.rows.length > 0) {
          empresaFilter = " WHERE u.empresa = $1";
          valores.push(gerenteQuery.rows[0].empresa);
        }
      }
      
      let query;
      if (tipo === 'presenca') {
        query = `
          SELECT u.nome, u.empresa, COUNT(rp.id) as total_pontos
          FROM usuario u
          LEFT JOIN registro_ponto rp ON u.id = rp.usuario_id
          ${empresaFilter}
          GROUP BY u.id, u.nome, u.empresa
          ORDER BY total_pontos DESC
        `;
      } else if (tipo === 'beneficios') {
        query = `
          SELECT u.nome, u.empresa, COUNT(b.id) as total_beneficios, COALESCE(SUM(b.valor), 0) as valor_total
          FROM usuario u
          LEFT JOIN beneficios b ON u.id = b.usuario_id
          ${empresaFilter}
          GROUP BY u.id, u.nome, u.empresa
          ORDER BY valor_total DESC
        `;
      } else {
        query = `
          SELECT u.nome, u.email, u.cargo, u.empresa, u.salario
          FROM usuario u
          ${empresaFilter}
          ORDER BY u.nome
        `;
      }
      
      const result = await db.query(query, valores);
      res.json({ equipe: result.rows });
    } catch (error) {
      console.error("[RELATORIO EQUIPE] Erro:", error);
      res.status(500).json({ error: "Erro ao gerar relatório da equipe" });
    }
  }
);

// Relatório de RH
router.get(
  '/rh',
  permitir(['admin', 'administrador', 'rh']),
  async (req, res) => {
    try {
      // Estatísticas gerais de RH
      const totalUsuarios = await db.query("SELECT COUNT(*) FROM usuario");
      const totalFolhas = await db.query("SELECT COUNT(*) FROM folha_pagamento");
      const totalBeneficios = await db.query("SELECT COUNT(*), COALESCE(SUM(valor), 0) as valor_total FROM beneficios");
      const totalSolicitacoes = await db.query("SELECT status, COUNT(*) FROM solicitacoes_licenca GROUP BY status");
      
      res.json({
        resumo: {
          total_colaboradores: parseInt(totalUsuarios.rows[0].count),
          total_folhas_processadas: parseInt(totalFolhas.rows[0].count),
          total_beneficios: parseInt(totalBeneficios.rows[0].count),
          valor_total_beneficios: parseFloat(totalBeneficios.rows[0].valor_total),
        },
        solicitacoes_por_status: totalSolicitacoes.rows,
      });
    } catch (error) {
      console.error("[RELATORIO RH] Erro:", error);
      res.status(500).json({ error: "Erro ao gerar relatório de RH" });
    }
  }
);

export default router;