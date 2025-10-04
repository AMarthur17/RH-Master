import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import documentosRouter from "./routes/documentos.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta de uploads
app.use("/uploads", express.static(process.env.UPLOADS_DIR || "uploads"));

// Rotas principais
app.use("/", routes);

// Rotas de documentos
app.use("/documentos", documentosRouter);

// Rota de teste
app.get("/teste", (req, res) => {
  res.send("Servidor rodando!");
});

// Porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
