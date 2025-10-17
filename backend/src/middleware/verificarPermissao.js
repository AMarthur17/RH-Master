import db from "../db.js";

export const verificarPermissao = (acao) => {
  return async (req, res, next) => {
    try {
      const usuarioId = req.user.id; // definido pelo middleware autenticar
      const documentoId = Number(
        req.params.documento_id || req.body.documento_id
      );

      if (Number.isNaN(documentoId)) {
        return res.status(400).json({ error: "ID do documento inválido" });
      }

      // Verifica permissão do usuário para a ação no documento
      const result = await db.query(
        `SELECT ${acao} 
         FROM permissoes_documentos
         WHERE documento_id = $1 AND usuario_id = $2`,
        [documentoId, usuarioId]
      );

      const permitido = result.rows[0]?.[acao] || false;

      // Registrar tentativa de acesso na tabela logs_acesso
      await db.query(
        `INSERT INTO logs_acesso (usuario_id, documento_id, acao, resultado, data)
         VALUES ($1, $2, $3, $4, NOW())`,
        [usuarioId, documentoId, acao, permitido ? "permitido" : "negado"]
      );

      if (!permitido) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }

      next();
    } catch (error) {
      console.error("[PERMISSAO][DOCUMENTO] Erro:", error);
      res.status(500).json({ error: "Erro ao verificar permissões" });
    }
  };
};
