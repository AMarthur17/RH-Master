import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Importar rotas
import routes from "./routes/index.js";
import documentosRouter from "./routes/documentos.js";
import beneficiosRouter from "./routes/beneficios.js";
import logsRouter from "./routes/logs.js";
import reportScheduler from './services/reportScheduler.service.js';

dotenv.config();

const app = express();

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());

// ====== SERVIR ARQUIVOS ESTÁTICOS ======
const uploadsDir = process.env.UPLOADS_DIR || "uploads";
app.use("/uploads", express.static(path.resolve(uploadsDir)));

// ====== ROTAS PRINCIPAIS ======
app.use("/", routes);

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
  // iniciar scheduler após o servidor subir
  try {
    reportScheduler.start().catch(err => console.error('Erro ao iniciar scheduler', err));
  } catch (err) {
    console.error('Erro ao iniciar scheduler', err);
  }
});
