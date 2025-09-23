const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ===== Usuário =====
export const cadastroUsuario = async (data) => {
  const res = await fetch(`${API_URL}/usuario/cadastro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const loginUsuario = async (data) => {
  const res = await fetch(`${API_URL}/usuario/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ===== Autorização =====
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ===== Registro de Ponto =====
export const baterPonto = async (usuario_id, tipo) => {
  const res = await fetch(`${API_URL}/registro-ponto`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ usuario_id, tipo }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const buscarHistorico = async (usuario_id) => {
  const res = await fetch(`${API_URL}/registro-ponto/${usuario_id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
};

export const buscarColaboradores = async (empresa) => {
  const res = await fetch(`${API_URL}/registro-ponto/admin/${empresa}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao buscar colaboradores");
  return res.json();
};

// ===== Gestão de Usuários (Admin) =====

// Buscar todos usuários de uma empresa (com filtro opcional por nome)
export const getUsuarios = async ({ nome = "", empresa = "" } = {}) => {
  const q = new URLSearchParams();
  if (nome) q.append("nome", nome);
  if (empresa) q.append("empresa", empresa);

  const res = await fetch(`${API_URL}/usuario?${q.toString()}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// Atualizar dados de um usuário
export const updateUsuario = async (id, data) => {
  const res = await fetch(`${API_URL}/usuario/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// Buscar histórico de alterações de um usuário
export const getHistorico = async (usuarioId) => {
  const res = await fetch(`${API_URL}/usuario/${usuarioId}/historico`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw await res.json();
  return res.json();
};
