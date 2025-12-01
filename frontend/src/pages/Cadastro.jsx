import React, { useState } from "react";
import "../styles/index.css";
import "../styles/app.css";
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
  const [senhaErros, setSenhaErros] = useState([]);

  const navigate = useNavigate();

  const validarSenha = (senha) => {
    const erros = [];
    if (senha.length < 8) {
      erros.push("Mínimo de 8 caracteres");
    }
    if (!/[A-Z]/.test(senha)) {
      erros.push("Pelo menos 1 letra maiúscula");
    }
    if (!/[a-z]/.test(senha)) {
      erros.push("Pelo menos 1 letra minúscula");
    }
    if (!/[0-9]/.test(senha)) {
      erros.push("Pelo menos 1 número");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
      erros.push("Pelo menos 1 caractere especial (!@#$%^&*...)");
    }
    return erros;
  };

  const handleSenhaChange = (e) => {
    const novaSenha = e.target.value;
    setSenha(novaSenha);
    setSenhaErros(validarSenha(novaSenha));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar senha antes de enviar
    const erros = validarSenha(senha);
    if (erros.length > 0) {
      alert("Senha não atende aos requisitos mínimos:\n" + erros.join("\n"));
      return;
    }
    
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
            onChange={handleSenhaChange}
            required
          />
          {senha && senhaErros.length > 0 && (
            <div style={{
              fontSize: "12px",
              color: "#ff4444",
              marginTop: "-5px",
              marginBottom: "10px",
              textAlign: "left"
            }}>
              <strong>Requisitos da senha:</strong>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                {senhaErros.map((erro, idx) => (
                  <li key={idx}>{erro}</li>
                ))}
              </ul>
            </div>
          )}
          {senha && senhaErros.length === 0 && (
            <div style={{
              fontSize: "12px",
              color: "#44ff44",
              marginTop: "-5px",
              marginBottom: "10px"
            }}>
              ✓ Senha atende aos requisitos
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
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

          <button type="submit" className="btn-gradient">
            Cadastrar
          </button>
          <button
            type="button"
            className="btn-gradient"
            style={{ marginTop: "10px" }}
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </form>
      </div>
    </div>
  );
}
