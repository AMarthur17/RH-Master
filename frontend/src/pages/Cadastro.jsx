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
  const [cargo, setCargo] = useState("Colaborador");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cpf, empresa, idade, email, senha, cargo }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
        return;
      }

      alert("Cadastro realizado com sucesso!");
      navigate("/login");
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
        <form onSubmit={handleSubmit} className="cadastro-form">
          <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
          <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
          <input type="number" placeholder="Idade" value={idade} onChange={(e) => setIdade(e.target.value)} required />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />

          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
            <button type="button" className={cargo === "Administrador" ? "btn-selected" : "btn-unselected"} onClick={() => setCargo("Administrador")}>
              Administrador
            </button>
            <button type="button" className={cargo === "Colaborador" ? "btn-selected" : "btn-unselected"} onClick={() => setCargo("Colaborador")}>
              Colaborador
            </button>
          </div>

          <button type="submit" className="btn-gradient">Cadastrar</button>
          <button type="button" className="btn-gradient" style={{ marginTop: "10px" }} onClick={() => navigate(-1)}>
            Voltar
          </button>
        </form>
      </div>
    </div>
  );
}
