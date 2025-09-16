export function permitir(perfis) {
  return (req, res, next) => {
    const perfilUsuario = (req.user?.perfil || "").toLowerCase();
    const perfisLower = perfis.map(p => p.toLowerCase());
    console.log("[RBAC] Perfil recebido:", perfilUsuario, "Perfis permitidos:", perfisLower);
    if (!req.user || !perfisLower.includes(perfilUsuario)) {
      // Log de tentativa negada pode ser feito aqui
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}
