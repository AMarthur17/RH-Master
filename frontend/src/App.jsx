import { useEffect, useState } from "react";
import { getUsuarios, createUsuario } from "./services/api";

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: "", email: "", cargo: "" });
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getUsuarios();
        setUsuarios(data);
      } catch {
        setErro("Não consegui falar com a API");
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const novo = await createUsuario(form);
      setUsuarios((prev) => [...prev, novo]);
      setForm({ nome: "", email: "", cargo: "" });
    } catch {
      setErro("Erro ao salvar. Verifique se o email já existe.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>RH Master</h1>
      <p>Front falando com o Back ✅</p>

      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, marginBottom: 24 }}
      >
        <input
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Cargo"
          value={form.cargo}
          onChange={(e) => setForm({ ...form, cargo: e.target.value })}
        />
        <button type="submit">Adicionar usuário</button>
      </form>

      {erro && <div style={{ color: "red", marginBottom: 12 }}>{erro}</div>}

      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>
            {u.nome} — {u.email} {u.cargo ? `(${u.cargo})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
