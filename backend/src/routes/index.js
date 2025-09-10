// src/routes/index.js
import express from "express";
import usuariosRoutes from "./usuarios.js";

const router = express.Router();

router.use("/usuario", usuariosRoutes);

export default router;
