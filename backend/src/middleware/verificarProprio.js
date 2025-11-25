/**
 * Middleware para verificar se o usuário está acessando seus próprios dados
 * ou se é admin/administrador
 */
export function verificarProprioOuAdmin(paramName = 'usuario_id') {
  return (req, res, next) => {
    const targetUserId = parseInt(req.params[paramName] || req.body[paramName]);
    const perfil = (req.user?.perfil || "").toLowerCase();
    const currentUserId = req.user?.id;

    // Admin pode acessar qualquer recurso
    if (perfil === "admin" || perfil === "administrador") {
      return next();
    }

    // RH pode acessar recursos de colaboradores
    if (perfil === "rh") {
      return next();
    }

    // Usuário só pode acessar seus próprios dados
    if (currentUserId === targetUserId) {
      return next();
    }

    return res.status(403).json({ 
      error: "Acesso negado. Você só pode acessar seus próprios recursos." 
    });
  };
}

/**
 * Middleware específico para gerentes - verifica se gerencia a equipe
 */
export function verificarGerenteOuAdmin(req, res, next) {
  const perfil = (req.user?.perfil || "").toLowerCase();
  
  if (perfil === "admin" || perfil === "administrador" || perfil === "gerente") {
    return next();
  }
  
  return res.status(403).json({ 
    error: "Acesso negado. Apenas gerentes e administradores podem acessar este recurso." 
  });
}

/**
 * Middleware para verificar se colaborador está acessando apenas seus dados
 */
export function verificarApenasColaboradorProprio(req, res, next) {
  const perfil = (req.user?.perfil || "").toLowerCase();
  const targetUserId = parseInt(req.params.usuarioId || req.params.usuario_id);
  const currentUserId = req.user?.id;

  // Admin e RH podem acessar dados de todos
  if (perfil === "admin" || perfil === "administrador" || perfil === "rh") {
    return next();
  }

  // Colaborador só pode acessar seus próprios dados
  if (perfil === "colaborador" && currentUserId !== targetUserId) {
    return res.status(403).json({ 
      error: "Acesso negado. Você só pode visualizar seus próprios dados." 
    });
  }

  return next();
}
