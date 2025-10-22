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

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [senha, setSenha] = useState("");

  // Lista de documentos compartilhados
  const [documentosCompartilhados, setDocumentosCompartilhados] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Função para buscar histórico de pontos
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

  // Função para buscar documentos compartilhados
  const buscarDocumentosCompartilhados = async () => {
    if (!usuarioId) return;
    try {
      setLoadingDocs(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/documentos/compartilhados/${usuarioId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Erro ao buscar documentos compartilhados");
      const data = await res.json();
      setDocumentosCompartilhados(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar documentos compartilhados.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (!usuarioId) return navigate("/login");
    buscarHistorico();
    buscarDocumentosCompartilhados();
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

  const editarPerfil = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const updateData = { nome, email };

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
      setSenha("");
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

        {/* Histórico de pontos */}
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

        {/* Documentos compartilhados */}
        <h3 style={{ marginTop: "30px" }}>Documentos Compartilhados:</h3>
        {loadingDocs ? (
          <p>Carregando documentos...</p>
        ) : documentosCompartilhados.length === 0 ? (
          <p>Nenhum documento compartilhado.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documentosCompartilhados.map((doc) => (
              <li
                key={doc.id}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  background: "#222a",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#fff" }}>
                  {doc.nome_arquivo} (de {doc.dono})
                </span>
                <a
                  href={doc.url_arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  Abrir
                </a>
              </li>
            ))}
          </ul>
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
