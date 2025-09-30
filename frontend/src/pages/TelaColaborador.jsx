import React, { useState, useEffect } from "react";
import "../styles/index.css";
import "../styles/app.css";
import { useLocation, useNavigate } from "react-router-dom";

export default function TelaColaborador() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = location.state?.usuario;
  const usuarioId = usuario?.id;

  const [historico, setHistorico] = useState([]);
  const [status, setStatus] = useState("");

  // Estado para edição de perfil
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [senha, setSenha] = useState("");

  const buscarHistorico = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/registro-ponto/${usuarioId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
          navigate("/login");
          return;
        }
        throw new Error("Falha ao buscar histórico");
      }
      const data = await res.json();
      setHistorico(data);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao carregar histórico");
    }
  };

  useEffect(() => {
    if (!usuarioId) return navigate("/login");
    buscarHistorico();
  }, [usuarioId]);

  const baterPonto = async (tipo) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/registro-ponto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ usuario_id: usuarioId, tipo }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }

      const data = await res.json();
      alert(
        `Ponto registrado: ${data.registro.tipo} às ${data.registro.data_hora}`
      );
      setStatus(
        `Último ponto registrado: ${data.registro.tipo} às ${data.registro.data_hora}`
      );
      buscarHistorico();
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar ponto.");
    }
  };

  // Edição de perfil do colaborador
  const editarPerfil = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const updateData = { nome, email };

      // Só adiciona senha se foi preenchida
      if (senha.trim()) {
        updateData.senha = senha;
      }

      const res = await fetch(`http://localhost:3000/usuario/${usuarioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
          navigate("/login");
          return;
        }
        throw new Error("Erro ao atualizar perfil");
      }

      alert("Perfil atualizado com sucesso!");
      setEditando(false);
      setSenha(""); // Limpa o campo senha
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Bem-vindo, {usuario?.nome}!</h2>

        {/* Botões de ponto */}
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <button
            className="btn-gradient"
            onClick={() => baterPonto("entrada")}
          >
            Entrada
          </button>
          <button className="btn-gradient" onClick={() => baterPonto("saida")}>
            Saída
          </button>
        </div>

        {status && (
          <p style={{ marginTop: "20px", fontWeight: "bold" }}>{status}</p>
        )}

        {/* Histórico */}
        <h3 style={{ marginTop: "30px" }}>Histórico de Pontos:</h3>
        {historico.length === 0 ? (
          <p>Nenhum registro encontrado.</p>
        ) : (
          <table style={{ margin: "0 auto", marginTop: "10px", color: "#fff" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px" }}>Tipo</th>
                <th style={{ padding: "8px 12px" }}>Data e Hora</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "6px 12px" }}>{item.tipo}</td>
                  <td style={{ padding: "6px 12px" }}>
                    {new Date(item.data_hora).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Botão editar perfil */}
        <button
          style={{ marginTop: "20px", background: "#007bff" }}
          className="btn-gradient"
          onClick={() => setEditando(!editando)}
        >
          {editando ? "Cancelar Edição" : "Editar Perfil"}
        </button>

        {/* Form de edição de perfil */}
        {editando && (
          <form
            onSubmit={editarPerfil}
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
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
              type="password"
              placeholder="Nova senha (opcional)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button type="submit" className="btn-gradient">
              Salvar Alterações
            </button>
          </form>
        )}

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
