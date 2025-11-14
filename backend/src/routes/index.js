import express from "express";
import usuariosRoutes from "./usuarios.js";
import registroPontoRoutes from "./registro-ponto.js";
import folhaPagamentoRoutes from "./folhaPagamento.routes.js";
import relatoriosRoutes from "./relatorios.js";
import healthRoutes from "./health.js";
import solicitacoesRoutes from "./solicitacoes.js";
import feriasRoutes from "./ferias.js";
import schedulesRoutes from "./schedules.js";
import auditRoutes from "./audit.js";

const router = express.Router();

router.use("/usuario", usuariosRoutes);
router.use("/registro-ponto", registroPontoRoutes);
router.use("/folha", folhaPagamentoRoutes);
router.use("/relatorios", relatoriosRoutes);
router.use("/health", healthRoutes);
router.use("/solicitacoes", solicitacoesRoutes);
router.use("/ferias", feriasRoutes);
router.use("/schedules", schedulesRoutes);
router.use("/audit", auditRoutes);

export default router;
