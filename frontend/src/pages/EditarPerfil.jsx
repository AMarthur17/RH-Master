import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function EditarPerfil() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = location.state?.usuario;

  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [cargo, setCargo] = useState(usuario?.cargo || "");
  const [empresa, setEmpresa] = useState(usuario?.empresa || "");

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/usuario/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nome, email, cargo, empresa }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar usuário");
      alert("Perfil atualizado com sucesso!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card" style={{ maxWidth: 500 }}>
        <h2>Editar Perfil: {usuario.nome}</h2>

        <form onSubmit={handleSalvar} className="cadastro-form">
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
          />

          <button type="submit" className="btn-gradient">
            Salvar
          </button>
        </form>

        <button
          style={{ marginTop: "20px" }}
          className="btn-gradient"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
