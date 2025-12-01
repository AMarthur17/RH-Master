// Definição de perfis/roles do sistema
export const ROLES = {
  ADMIN: "administrador",
  GERENTE: "gerente",
  RH: "rh",
  COLABORADOR: "colaborador"
};

// Middleware para verificar se o usuário tem um dos perfis permitidos
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

// Middleware alternativo que aceita um array de roles e verifica acesso
export function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = (req.user?.cargo || req.user?.perfil || "").toLowerCase();
    
    if (!req.user || !userRole) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    
    const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
    
    if (!allowedRolesLower.includes(userRole)) {
      console.warn(`[RBAC] Acesso negado: ${userRole} tentou acessar recurso restrito a ${allowedRoles.join(", ")}`);
      return res.status(403).json({ error: "Acesso negado. Permissão insuficiente." });
    }
    
    next();
  };
}

