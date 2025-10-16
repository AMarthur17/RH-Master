import pool from "../db.js";

// ==========================
// LISTAR TODOS OS BENEFÍCIOS
// ==========================
export const listarBeneficios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.nome AS nome_usuario
       FROM beneficios b
       JOIN usuario u ON b.usuario_id = u.id
       ORDER BY b.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar benefícios:", error);
    res.status(500).json({ error: "Erro ao listar benefícios" });
  }
};

// ==========================
// CRIAR NOVO BENEFÍCIO
// ==========================
export const criarBeneficio = async (req, res) => {
  try {
    const { usuario_id, tipo, valor, descricao, data_inicio, data_fim, ativo } =
      req.body;

    const result = await pool.query(
      `INSERT INTO beneficios (usuario_id, tipo, valor, descricao, data_inicio, data_fim, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [usuario_id, tipo, valor, descricao, data_inicio, data_fim, ativo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar benefício:", error);
    res.status(500).json({ error: "Erro ao criar benefício" });
  }
};

// ==========================
// ATUALIZAR BENEFÍCIO
// ==========================
export const atualizarBeneficio = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, valor, descricao, data_inicio, data_fim, ativo } = req.body;

    const result = await pool.query(
      `UPDATE beneficios
       SET tipo = $1, valor = $2, descricao = $3, data_inicio = $4, data_fim = $5, ativo = $6
       WHERE id = $7
       RETURNING *`,
      [tipo, valor, descricao, data_inicio, data_fim, ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Benefício não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar benefício:", error);
    res.status(500).json({ error: "Erro ao atualizar benefício" });
  }
};

// ==========================
// EXCLUIR BENEFÍCIO
// ==========================
export const deletarBeneficio = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM beneficios WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Benefício não encontrado" });
    }

    res.json({ message: "Benefício removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar benefício:", error);
    res.status(500).json({ error: "Erro ao deletar benefício" });
  }
};
