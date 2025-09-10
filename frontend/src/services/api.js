const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const getUsuarios = async () => {
  const res = await fetch(`${API_URL}/usuarios`);
  if (!res.ok) throw new Error("Falha ao buscar usuários");
  return res.json();
};

export const createUsuario = async (data) => {
  const res = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Falha ao criar usuário");
  return res.json();
};
