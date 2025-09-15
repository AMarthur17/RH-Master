import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import documentosRouter from "./routes/documentos.js"; // 👈 ADICIONADO

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos da pasta uploads
app.use("/uploads", express.static("uploads")); // 👈 ADICIONADO

// Rotas principais 
app.use("/", routes);

// Rota de documentos
app.use("/documentos", documentosRouter); // 👈 ADICIONADO

// Rota teste
app.get("/teste", (req, res) => {
  res.send("Servidor rodando!");
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
