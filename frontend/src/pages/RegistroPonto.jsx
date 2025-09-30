// src/pages/RegistroPonto.jsx
import React, { useState } from "react";
import "../styles/index.css";
import "../styles/app.css";
import logo from "../assets/logo_rh_master.png";

export default function RegistroPonto() {
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [mensagem, setMensagem] = useState("");

  const registrarEntrada = () => {
    const now = new Date().toLocaleTimeString();
    setEntrada(now);
    setMensagem(`Entrada registrada às ${now}`);
  };

  const registrarSaida = () => {
    const now = new Date().toLocaleTimeString();
    setSaida(now);
    setMensagem(`Saída registrada às ${now}`);
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <img src={logo} alt="RH Master" className="cadastro-logo" />
        <h2>Registro de Ponto</h2>
        <p className="subtitle">
          Registre sua entrada e saída e acompanhe seu histórico
        </p>

        <div className="registro-buttons" style={{ marginTop: "20px" }}>
          <button className="btn-gradient" onClick={registrarEntrada}>
            Registrar Entrada
          </button>
          <button
            className="btn-gradient"
            onClick={registrarSaida}
            style={{ marginLeft: "10px" }}
          >
            Registrar Saída
          </button>
        </div>

        <div style={{ marginTop: "20px", color: "#00c6ff" }}>
          {mensagem && <p>{mensagem}</p>}
          {entrada && <p>Entrada: {entrada}</p>}
          {saida && <p>Saída: {saida}</p>}
        </div>
      </div>
    </div>
  );
}
