import express from "express";
import usuariosRoutes from "./usuarios.js";
import registroPontoRoutes from "./registro-ponto.js";
import folhaPagamentoRoutes from "./folhaPagamento.routes.js"; 

const router = express.Router();

router.use("/usuario", usuariosRoutes);
router.use("/registro-ponto", registroPontoRoutes);
router.use("/folha", folhaPagamentoRoutes); 

export default router;
