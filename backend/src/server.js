import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import documentosRouter from "./routes/documentos.js"; // 👈 CORRIGIDO
import folhaRouter from "./routes/folha.js"; // 👈 IMPORTAÇÃO ADICIONADA

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos da pasta uploads
app.use("/uploads", express.static("uploads")); // caso queira servir uploads

// Rotas principais 
app.use("/", routes);

// Rota de documentos
app.use("/documentos", documentosRouter); 

// Rota da folha de pagamento
app.use("/folha", folhaRouter); // ✅ agora vai funcionar

// Rota teste
app.get("/teste", (req, res) => {
  res.send("Servidor rodando!");
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
