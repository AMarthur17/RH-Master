import express from "express";

const router = express.Router();

// Rota raiz de logs - confirma que a rota existe
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Rota de logs ativa" });
});

// Recebe um evento de log simples e escreve no console (padrão de dev)
router.post("/event", (req, res) => {
  const { level = "info", message = "" } = req.body || {};
  try {
    console.log(`[LOG] [${level.toUpperCase()}]`, message);
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Erro ao registrar log:", err);
    return res.status(500).json({ ok: false, error: "Erro ao registrar log" });
  }
});

// Endpoint simples de health/performance (placeholder)
router.get("/stats", (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  };
  res.json(stats);
});

export default router;
