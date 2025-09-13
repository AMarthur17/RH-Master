import React, { useState } from "react";
import "../styles/global.css";
import logo from "../assets/logo_rh_master.png";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/usuario/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
        return;
      }

      const data = await response.json();

      // Redireciona baseado no cargo
      if (data.cargo === "Administrador") {
        navigate("/administrador", { state: { usuario: data } });
      } else {
        navigate("/colaborador", { state: { usuario: data } });
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <img src={logo} alt="RH Master" className="cadastro-logo" />
        <h2>Login</h2>
        <p className="subtitle">Informe seu e-mail e senha</p>

        <form onSubmit={handleLogin} className="cadastro-form">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <button type="submit" className="btn-gradient">
            Entrar
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
