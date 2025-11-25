import express from "express";
import db from "../db.js";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/rbac.js";

const router = express.Router();

// Registrar ponto
router.post("/", autenticar, async (req, res) => {
  try {
    const { usuario_id, tipo, data_hora, motivo } = req.body;

    if (!usuario_id || !tipo) {
      return res.status(400).json({ error: "usuario_id e tipo são obrigatórios" });
    }

    // Verificar duplicata no dia especificado (data_hora quando fornecida) ou hoje
    if (data_hora) {
      const checkQuery = `
        SELECT * FROM registro_ponto
        WHERE usuario_id = $1 AND tipo = $2 AND data_hora::date = $3::date
      `;
      const checkResult = await db.query(checkQuery, [usuario_id, tipo, data_hora]);
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: `Ponto de ${tipo} já registrado nesta data.` });
      }
    } else {
      const checkQuery = `
        SELECT * FROM registro_ponto 
        WHERE usuario_id = $1 AND tipo = $2 AND data_hora::date = CURRENT_DATE
      `;
      const checkResult = await db.query(checkQuery, [usuario_id, tipo]);
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: `Ponto de ${tipo} já registrado hoje.` });
      }
    }

    // Inserir registro (usa data_hora quando fornecida)
    let insertQuery;
    let values;
    if (data_hora) {
      insertQuery = `INSERT INTO registro_ponto (usuario_id, tipo, data_hora, motivo) VALUES ($1, $2, $3, $4) RETURNING *`;
      values = [usuario_id, tipo, data_hora, motivo || null];
    } else {
      insertQuery = `INSERT INTO registro_ponto (usuario_id, tipo, motivo) VALUES ($1, $2, $3) RETURNING *`;
      values = [usuario_id, tipo, motivo || null];
    }

    const result = await db.query(insertQuery, values);
    const novo = result.rows[0];

    // Se a requisição foi feita por um admin ou foi fornecida data_hora manualmente,
    // registre a operação na tabela de histórico
    try {
      await db.query(
        `INSERT INTO registro_ponto_historico (registro_ponto_id, usuario_id, tipo_antigo, data_hora_antigo, tipo_novo, data_hora_novo, alterado_por, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [novo.id, novo.usuario_id, null, null, novo.tipo, novo.data_hora, req.user?.id || null, motivo || null]
      );
    } catch (auditErr) {
      console.error("Erro ao gravar histórico de ponto:", auditErr);
      // Não falhar a requisição principal por falha no audit
    }

    res.status(201).json({ registro: novo });
  } catch (err) {
    console.error("Erro ao registrar ponto:", err);
    res.status(500).json({ error: "Erro ao registrar ponto" });
  }
});

// Listar pontos de um usuário (com opção de filtrar somente hoje)
router.get("/:usuario_id", autenticar, async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { hoje } = req.query;

    let query = "SELECT * FROM registro_ponto WHERE usuario_id = $1";
    const values = [usuario_id];

    if (hoje === "true") {
      query += " AND data_hora::date = CURRENT_DATE";
    }

    query += " ORDER BY data_hora DESC";

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar registros:", err);
    res.status(500).json({ error: "Erro ao buscar registros" });
  }
});

// Atualizar registro de ponto (administradores e gerentes)
router.put("/:id", autenticar, permitir(["admin", "administrador", "gerente"]), async (req, res) => {
  try {
    const registroId = req.params.id;
    const { tipo, data_hora, motivo } = req.body; // data_hora opcional (ISO string)

    // Buscar registro atual
    const { rows: existentes } = await db.query("SELECT * FROM registro_ponto WHERE id = $1", [registroId]);
    if (existentes.length === 0) return res.status(404).json({ error: "Registro não encontrado." });

    const atual = existentes[0];
    const tipoAntigo = atual.tipo;
    const dataHoraAntiga = atual.data_hora;

    // Montar novos valores
    const novoTipo = tipo !== undefined ? tipo : tipoAntigo;
    const novaDataHora = data_hora !== undefined ? data_hora : dataHoraAntiga;

    // Atualizar
  const updateQuery = `UPDATE registro_ponto SET tipo = $1, data_hora = $2, motivo = $3 WHERE id = $4 RETURNING *`;
  const { rows: updatedRows } = await db.query(updateQuery, [novoTipo, novaDataHora, motivo || null, registroId]);
    const atualizado = updatedRows[0];

    // Inserir histórico
    await db.query(
      `INSERT INTO registro_ponto_historico (registro_ponto_id, usuario_id, tipo_antigo, data_hora_antigo, tipo_novo, data_hora_novo, alterado_por, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [registroId, atualizado.usuario_id, tipoAntigo, dataHoraAntiga, novoTipo, novaDataHora, req.user.id, motivo || null]
    );

    res.json({ registro: atualizado });
  } catch (err) {
    console.error("Erro ao atualizar registro:", err);
    res.status(500).json({ error: "Erro ao atualizar registro" });
  }
});

// Rota para gerente/admin ver pontos da equipe
router.get(
  "/equipe/pontos",
  autenticar,
  permitir(["admin", "administrador", "gerente"]),
  async (req, res) => {
    try {
      const { data_inicio, data_fim } = req.query;
      const perfil = (req.user?.perfil || "").toLowerCase();
      
      let query = `
        SELECT rp.*, u.nome as usuario_nome, u.empresa
        FROM registro_ponto rp
        INNER JOIN usuario u ON rp.usuario_id = u.id
        WHERE 1=1
      `;
      const valores = [];
      let paramCount = 1;
      
      // Gerente vê apenas sua empresa
      if (perfil === "gerente") {
        const gerenteQuery = await db.query("SELECT empresa FROM usuario WHERE id = $1", [req.user.id]);
        if (gerenteQuery.rows.length > 0) {
          query += ` AND u.empresa = $${paramCount}`;
          valores.push(gerenteQuery.rows[0].empresa);
          paramCount++;
        }
      }
      
      if (data_inicio) {
        query += ` AND rp.data_hora >= $${paramCount}`;
        valores.push(data_inicio);
        paramCount++;
      }
      
      if (data_fim) {
        query += ` AND rp.data_hora <= $${paramCount}`;
        valores.push(data_fim);
        paramCount++;
      }
      
      query += " ORDER BY rp.data_hora DESC";
      
      const result = await db.query(query, valores);
      res.json(result.rows);
    } catch (error) {
      console.error("[EQUIPE] Erro ao listar pontos:", error);
      res.status(500).json({ error: "Erro ao listar pontos da equipe" });
    }
  }
);

export default router;

