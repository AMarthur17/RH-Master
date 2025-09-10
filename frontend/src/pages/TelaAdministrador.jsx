import React from "react";
import "../styles/global.css";
import logo from "../assets/logo_rh_master.png";
import { useNavigate } from "react-router-dom";

export default function TelaAdministrador() {
  const navigate = useNavigate(); // usado quando for redirecionar

  const handleAdministrarEmpresa = () => {
    // Redirecionar para a tela de administração da empresa
    // navigate("/admin/empresa");
    alert("Você escolheu Administrar Empresa!");
  };

  const handleAdministrarColaboradores = () => {
    // Redirecionar para a tela de administração de colaboradores
    // navigate("/admin/colaboradores");
    alert("Você escolheu Administrar Colaboradores!");
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <img src={logo} alt="RH Master" className="cadastro-logo" />
        <h2>Bem-vindo, Administrador!</h2>
        <p className="subtitle">Escolha o que deseja administrar:</p>

        <div
          className="admin-buttons"
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
            width: "100%",
          }}
        >
          <button
            className="btn-gradient"
            style={{ flex: 1 }}
            onClick={handleAdministrarEmpresa}
          >
            Administrar Empresa
          </button>
          <button
            className="btn-gradient"
            style={{ flex: 1 }}
            onClick={handleAdministrarColaboradores}
          >
            Administrar Colaboradores
          </button>
        </div>
      </div>
    </div>
  );
}
