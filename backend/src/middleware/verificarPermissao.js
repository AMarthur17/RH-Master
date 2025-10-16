import db from "../db.js";

export const verificarPermissao = (acao) => {
  return async (req, res, next) => {
    try {
      const usuarioId = req.usuario.id; // definido pelo middleware autenticar
      const documentoId = Number(
        req.params.documento_id || req.body.documento_id
      );

      if (Number.isNaN(documentoId)) {
        return res.status(400).json({ error: "ID do documento inválido" });
      }

      const result = await db.query(
        `SELECT * FROM documento_permissao
                 WHERE documento_id = $1 AND usuario_id = $2`,
        [documentoId, usuarioId]
      );

      const permissao = result.rows[0];

      if (!permissao || !permissao[acao]) {
        await db.query(
          `INSERT INTO acesso_documento_negado
                     (documento_id, usuario_id, acao, data_hora)
                     VALUES ($1, $2, $3, NOW())`,
          [documentoId, usuarioId, acao]
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
