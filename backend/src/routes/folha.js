import express from "express";
import { pool } from "../db.js"; // seu pool PostgreSQL

const router = express.Router();

// Função para calcular a folha de pagamento
function calcularFolha(usuario) {
  const salarioBruto = usuario.salario_base || 0;
  const inss = salarioBruto * 0.08; // exemplo 8%
  const valeTransporte = salarioBruto * 0.06;
  const salarioLiquido = salarioBruto - inss - valeTransporte;

  return {
    usuarioId: usuario.id,
    nome: usuario.nome,
    salarioBruto,
    descontos: { inss, valeTransporte },
    beneficios: {},
    salarioLiquido,
  };
}

// GET /folha/:empresaId - gerar folha
router.get("/:empresaId", async (req, res) => {
  const { empresaId } = req.params;
  try {
    const { rows: usuarios } = await pool.query(
      "SELECT id, nome, salario_base FROM usuarios WHERE empresa = $1",
      [empresaId]
    );

    const relatorio = usuarios.map(calcularFolha);
    res.json(relatorio);
  } catch (err) {
    console.error("Erro ao gerar folha:", err);
    res.status(500).json({ erro: "Falha ao gerar folha" });
  }
});

// POST /folha/confirmar - salvar folha confirmada
router.post("/confirmar", async (req, res) => {
  try {
    const { folha } = req.body;

    for (let f of folha) {
      await pool.query(
        `INSERT INTO folha_pagamento 
        (usuarioid, nome, salariobruto, descontos, beneficios, salarioliquido, mes, ano, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          f.usuarioId,
          f.nome,
          f.salarioBruto,
          JSON.stringify(f.descontos),
          JSON.stringify(f.beneficios),
          f.salarioLiquido,
          new Date().getMonth() + 1,
          new Date().getFullYear(),
          "confirmado",
        ]
      );
    }

    res.json({ sucesso: true, mensagem: "Folha confirmada e salva com sucesso!" });
  } catch (err) {
    console.error("Erro ao confirmar folha:", err);
    res.status(500).json({ erro: "Falha ao confirmar folha" });
  }
});

export default router;
