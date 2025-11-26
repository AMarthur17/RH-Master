import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Importar rotas
import routes from "./routes/index.js";
import documentosRouter from "./routes/documentos.js";
import beneficiosRouter from "./routes/beneficios.js";
import logsRouter from "./routes/logs.js";
import performanceMetricsRouter from "./routes/performance-metrics.js";
import performanceAlertsRouter from "./routes/performance-alerts.js";
import performanceAnalyticsRouter from "./routes/performance-analytics.js";
import eventLogsRouter from "./routes/event-logs.js";
import reportScheduler from "./services/reportScheduler.service.js";

// Importar middleware de auditoria e performance
import { auditMiddleware } from "./middleware/audit.js";
import PerformanceMetricsController from "./controllers/PerformanceMetricsController.js";
import PerformanceMonitorService from "./services/performanceMonitor.service.js";

dotenv.config();

const app = express();

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());

// Middleware de performance - deve estar no início para rastrear todas as requisições
app.use(PerformanceMetricsController.middleware);

// Middleware de auditoria - captura automaticamente ações sensíveis
app.use(auditMiddleware);

// ====== SERVIR ARQUIVOS ESTÁTICOS ======
const uploadsDir = process.env.UPLOADS_DIR || "uploads";
app.use("/uploads", express.static(path.resolve(uploadsDir)));

// ====== ROTAS PRINCIPAIS ======
app.use("/", routes);

// Rotas de métricas de performance
app.use("/api/performance-metrics", performanceMetricsRouter);

// Rotas de alertas de performance
app.use("/api/performance-alerts", performanceAlertsRouter);

// Rotas de análise e histórico de performance
app.use("/api/performance-analytics", performanceAnalyticsRouter);

// Rotas de event logs (observabilidade - RNF-03)
app.use("/api/event-logs", eventLogsRouter);

// Rotas de logs (performance, alerts)
app.use("/logs", logsRouter);

// Rotas de documentos
app.use("/documentos", documentosRouter);

// Rotas de benefícios
app.use("/beneficios", beneficiosRouter);

// Rota de teste
app.get("/teste", (req, res) => {
  res.send("Servidor rodando!");
});

// ====== PORTA ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔒 Sistema de auditoria ativado`);

  // Iniciar serviço de monitoramento de performance
  try {
    PerformanceMonitorService.iniciar();
  } catch (err) {
    console.error("Erro ao iniciar serviço de monitoramento:", err);
  }

  // iniciar scheduler de relatórios após o servidor subir
  try {
    reportScheduler
      .start()
      .catch((err) => console.error("Erro ao iniciar scheduler", err));
  } catch (err) {
    console.error("Erro ao iniciar scheduler", err);
  }
});
