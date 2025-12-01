import express from "express";
import db from "../db.js";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

const validarUsuario = async (usuarioId) => {
  const result = await db.query(
    "SELECT id, nome, empresa FROM usuario WHERE id = $1",
    [usuarioId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

router.get(
  "/:usuario_id/relatorio",
  autenticar,
  permitir(["admin", "administrador", "gerente", "rh"]),
  async (req, res) => {
    try {
      const usuarioId = Number(req.params.usuario_id);
      if (Number.isNaN(usuarioId)) {
        return res.status(400).json({ error: "ID do usuário inválido" });
      }

      const usuario = await validarUsuario(usuarioId);

      const totalQuery = await db.query(
        `SELECT COUNT(*)::INT AS total_registros, COALESCE(SUM(valor), 0)::NUMERIC AS valor_total
       FROM beneficios WHERE usuario_id = $1`,
        [usuarioId]
      );

      const porTipoQuery = await db.query(
        `SELECT tipo, COUNT(*)::INT AS quantidade, COALESCE(SUM(valor), 0)::NUMERIC AS valor_total
       FROM beneficios WHERE usuario_id = $1
       GROUP BY tipo
       ORDER BY tipo`,
        [usuarioId]
      );

      res.json({
        usuario,
        total: {
          quantidade: totalQuery.rows[0]?.total_registros || 0,
          valor: Number(totalQuery.rows[0]?.valor_total || 0),
        },
        porTipo: porTipoQuery.rows.map((row) => ({
          tipo: row.tipo,
          quantidade: row.quantidade,
          valor: Number(row.valor_total),
        })),
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("[BENEFICIOS][RELATORIO] Erro:", error);
      res
        .status(status)
        .json({ error: error.message || "Erro ao gerar relatório" });
    }
  }
);

router.get("/:usuario_id", autenticar, async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    if (Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    await validarUsuario(usuarioId);

    const result = await db.query(
      `SELECT id, usuario_id, tipo, valor, descricao, criado_em
       FROM beneficios
       WHERE usuario_id = $1
       ORDER BY criado_em DESC`,
      [usuarioId]
    );

    res.json(
      result.rows.map((row) => ({
        ...row,
        valor: Number(row.valor),
      }))
    );
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("[BENEFICIOS][LISTA] Erro:", error);
    res
      .status(status)
      .json({ error: error.message || "Erro ao listar benefícios" });
  }
});

router.post(
  "/:usuario_id",
  autenticar,
  permitir(["admin", "administrador", "rh"]),
  async (req, res) => {
    try {
      const usuarioId = Number(req.params.usuario_id);
      const { tipo, valor, descricao } = req.body;

      if (Number.isNaN(usuarioId)) {
        return res.status(400).json({ error: "ID do usuário inválido" });
      }

      if (!tipo || tipo.trim() === "") {
        return res
          .status(400)
          .json({ error: "Tipo do benefício é obrigatório" });
      }

      await validarUsuario(usuarioId);

      const valorNumerico = Number(valor) || 0;

      const result = await db.query(
        `INSERT INTO beneficios (usuario_id, tipo, valor, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, usuario_id, tipo, valor, descricao, criado_em`,
        [usuarioId, tipo.trim(), valorNumerico, descricao || null]
      );

      res
        .status(201)
        .json({
          beneficio: { ...result.rows[0], valor: Number(result.rows[0].valor) },
        });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("[BENEFICIOS][CRIAR] Erro:", error);
      res
        .status(status)
        .json({ error: error.message || "Erro ao criar benefício" });
    }
  }
);

router.put(
  "/:id",
  autenticar,
  permitir(["admin", "administrador", "rh"]),
  async (req, res) => {
    try {
      const beneficioId = Number(req.params.id);
      const { tipo, valor, descricao } = req.body;

      if (Number.isNaN(beneficioId)) {
        return res.status(400).json({ error: "ID do benefício inválido" });
      }

      const beneficioAtual = await db.query(
        "SELECT * FROM beneficios WHERE id = $1",
        [beneficioId]
      );
      if (beneficioAtual.rows.length === 0) {
        return res.status(404).json({ error: "Benefício não encontrado" });
      }

      const campos = [];
      const valores = [];
      let idx = 1;

      if (tipo !== undefined) {
        if (tipo.trim() === "") {
          return res
            .status(400)
            .json({ error: "Tipo do benefício não pode ser vazio" });
        }
        campos.push(`tipo = $${idx++}`);
        valores.push(tipo.trim());
      }

      if (valor !== undefined) {
        const valorNumerico = Number(valor);
        if (Number.isNaN(valorNumerico)) {
          return res.status(400).json({ error: "Valor inválido" });
        }
        campos.push(`valor = $${idx++}`);
        valores.push(valorNumerico);
      }

      if (descricao !== undefined) {
        campos.push(`descricao = $${idx++}`);
        valores.push(descricao === null ? null : descricao.trim());
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: "Nenhum campo para atualizar" });
      }

      valores.push(beneficioId);

      const result = await db.query(
        `UPDATE beneficios SET ${campos.join(", ")}
       WHERE id = $${idx}
       RETURNING id, usuario_id, tipo, valor, descricao, criado_em`,
        valores
      );

      res.json({
        beneficio: { ...result.rows[0], valor: Number(result.rows[0].valor) },
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("[BENEFICIOS][ATUALIZAR] Erro:", error);
      res
        .status(status)
        .json({ error: error.message || "Erro ao atualizar benefício" });
    }
  }
);

router.delete(
  "/:id",
  autenticar,
  permitir(["admin", "administrador", "rh"]),
  async (req, res) => {
    try {
      const beneficioId = Number(req.params.id);

      if (Number.isNaN(beneficioId)) {
        return res.status(400).json({ error: "ID do benefício inválido" });
      }

      const result = await db.query(
        "DELETE FROM beneficios WHERE id = $1 RETURNING id",
        [beneficioId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Benefício não encontrado" });
      }

      res.json({ success: true });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error("[BENEFICIOS][REMOVER] Erro:", error);
      res
        .status(status)
        .json({ error: error.message || "Erro ao remover benefício" });
    }
  }
);

export default router;
