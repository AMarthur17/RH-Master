import React, { useState } from "react";
import "../styles/global.css";
import logo from "../assets/logo_rh_master.png";
import { useNavigate } from "react-router-dom";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [idade, setIdade] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState("Administrador");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cpf,
          empresa,
          idade,
          email,
          senha,
          cargo,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
        return;
      }

      const data = await response.json();
      alert("Cadastro realizado com sucesso!");

      // Redireciona conforme cargo
      if (cargo === "Administrador") {
        navigate("/admin");
      } else {
        navigate("/colaborador");
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
        <h2>Cadastro</h2>
        <p className="subtitle">Preencha as informações para criar sua conta</p>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <input
            type="text"
            placeholder="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Idade"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
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
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {/* Botões de Cargo */}
          <div
            className="cargo-buttons"
            style={{
              gridColumn: "1 / span 2",
              display: "flex",
              gap: "10px",
              margin: "10px 0",
            }}
          >
            <button
              type="button"
              className={
                cargo === "Administrador" ? "btn-selected" : "btn-unselected"
              }
              onClick={() => setCargo("Administrador")}
            >
              Administrador
            </button>
            <button
              type="button"
              className={
                cargo === "Colaborador" ? "btn-selected" : "btn-unselected"
              }
              onClick={() => setCargo("Colaborador")}
            >
              Colaborador
            </button>
          </div>

          <button
            type="submit"
            className="btn-gradient"
            style={{ gridColumn: "1 / span 2" }}
          >
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}
