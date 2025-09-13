const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export const baterPonto = async (usuario_id, tipo) => {
  const res = await fetch(`${API_URL}/registro-ponto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id, tipo }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const buscarHistorico = async (usuario_id) => {
  const res = await fetch(`${API_URL}/registro-ponto/${usuario_id}`);
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
};

export const buscarColaboradores = async (empresa) => {
  const res = await fetch(`${API_URL}/registro-ponto/admin/${empresa}`);
  if (!res.ok) throw new Error("Erro ao buscar colaboradores");
  return res.json();
};
