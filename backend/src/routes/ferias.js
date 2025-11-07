import express from "express";
import { calcular } from "../controllers/ferias.controller.js";
import { autenticar } from "../middleware/auth.js";

const router = express.Router();

// POST /ferias/calcular
router.post("/calcular", autenticar, calcular);

export default router;
