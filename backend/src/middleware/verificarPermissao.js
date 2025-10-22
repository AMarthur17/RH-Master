import db from "../db.js";

export const verificarPermissao = (acao) => {
  return async (req, res, next) => {
    try {
      const usuarioId = req.user.id;
      const documentoId = Number(
        req.params.documento_id || req.body.documento_id
      );

      console.log(
        "[PERMISSAO] usuarioId:",
        usuarioId,
        "documentoId:",
        documentoId,
        "acao:",
        acao,
        "perfil:",
        req.user.role || req.user.perfil
      );

      if (Number.isNaN(documentoId)) {
        return res.status(400).json({ error: "ID do documento inválido" });
      }

      const perfil = (req.user.role || req.user.perfil || "").toLowerCase();
      if (perfil === "admin" || perfil === "administrador") {
        await db.query(
          `INSERT INTO logs_acesso (usuario_id, documento_id, acao, resultado, data)
           VALUES ($1, $2, $3, $4, NOW())`,
          [usuarioId, documentoId, acao, "permitido"]
        );
        return next();
      }

      const acoesValidas = ["pode_visualizar", "pode_editar", "pode_excluir"];
      const coluna = acoesValidas.includes(acao) ? acao : null;
      if (!coluna) {
        return res.status(400).json({ error: "Ação de permissão inválida" });
      }

      const result = await db.query(
        `SELECT ${coluna} AS permitido FROM documento_permissao WHERE documento_id = $1 AND usuario_id = $2`,
        [documentoId, usuarioId]
      );

      const permitido = result.rows[0]?.permitido || false;

      await db.query(
        `INSERT INTO logs_acesso (usuario_id, documento_id, acao, resultado, data)
         VALUES ($1, $2, $3, $4, NOW())`,
        [usuarioId, documentoId, acao, permitido ? "permitido" : "negado"]
      );

      if (!permitido) {
        console.warn(
          `[PERMISSAO NEGADA] Usuário ${usuarioId} tentou ${acao} no documento ${documentoId}`
        );
        return res.status(403).json({ error: "Acesso não autorizado" });
      }

      next();
    } catch (error) {
      console.error("[PERMISSAO][DOCUMENTO] Erro:", error);
      res.status(500).json({ error: "Erro ao verificar permissões" });
    }
  };
};
