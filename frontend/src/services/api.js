// Define a URL da API via variável de ambiente ou fallback para localhost
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const resolveApiUrl = (value) => {
  if (typeof window === "undefined") return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.hostname === "backend" || url.hostname === "0.0.0.0") {
      url.hostname = window.location.hostname;
    }
    if (!url.port) {
      url.port = url.protocol === "https:" ? "443" : "3000";
    }
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    console.warn("[API] URL inválida, usando fallback padrão.", error);
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
};

export const API_URL = resolveApiUrl(rawApiUrl);

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
export function getAuthHeaders() {
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

// ===== Gestão de Usuários (Admin) =====
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

export const updateUsuario = async (id, data) => {
  const res = await fetch(`${API_URL}/usuario/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ===== Histórico de alterações do usuário =====
export const getHistorico = async (usuarioId) => {
  const res = await fetch(`${API_URL}/usuario/${usuarioId}/historico`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw await res.json();
  return res.json();
};
