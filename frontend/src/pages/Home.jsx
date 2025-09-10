// src/pages/Home.jsx
import React from "react";
import "../styles/global.css";
import logo from "../assets/logo_rh_master.png";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleIrParaCadastro = () => {
    navigate("/cadastro");
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card" style={{ maxWidth: "700px" }}>
        <img src={logo} alt="RH Master" className="cadastro-logo" />
        <h1>Bem-vindo ao RH Master</h1>
        <p
          className="subtitle"
          style={{ fontSize: "16px", marginBottom: "30px" }}
        >
          O RH Master é um sistema completo para gestão de colaboradores e
          empresas. Administre cargos, empresas e colaboradores de forma fácil e
          eficiente.
        </p>

        <button
          className="btn-gradient"
          style={{ padding: "16px 24px", fontSize: "16px" }}
          onClick={handleIrParaCadastro}
        >
          Criar Conta / Cadastrar
        </button>
      </div>
    </div>
  );
}
