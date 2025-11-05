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

  const [documentosCompartilhados, setDocumentosCompartilhados] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Solicitações de férias/licença
  // Solicitações are handled on a separate page now

  // Estados para o download seguro inline
  const [docSelecionado, setDocSelecionado] = useState(null);
  const [senhaDownload, setSenhaDownload] = useState("");
  const [baixando, setBaixando] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  console.log("API_URL:", API_URL);
  // ==========================
  // Funções de carregamento
  // ==========================
  const buscarHistorico = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/registro-ponto/${usuarioId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  const buscarDocumentosCompartilhados = async () => {
    if (!usuarioId) return;
    try {
      setLoadingDocs(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/documentos/compartilhados/${usuarioId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

  // solicitacoes logic moved to a dedicated page

  // ==========================
  // Funções principais
  // ==========================
  const baterPonto = async (tipo) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/registro-ponto`, {
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
      if (senha.trim()) updateData.senha = senha;

      const res = await fetch(`${API_URL}/usuario/${usuarioId}`, {
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

  // Solicitação handling moved to SolicitacoesColaborador.jsx

  // ==========================
  // Download Seguro Inline
  // ==========================
  const handleSecureDownload = async (doc) => {
    if (!senhaDownload.trim()) {
      alert("Digite sua senha para continuar.");
      return;
    }

    try {
      setBaixando(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/documentos/${doc.id}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senha: senhaDownload }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Erro ao baixar documento.");
        return;
      }

      // Baixar arquivo
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSenhaDownload("");
      setDocSelecionado(null);
    } catch (err) {
      console.error("Erro no download seguro:", err);
      alert("Erro no download seguro.");
    } finally {
      setBaixando(false);
    }
  };

  // ==========================
  // Render
  // ==========================
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

        {/* Documentos Compartilhados */}
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
                  marginBottom: "15px",
                  padding: "10px",
                  background: "#222a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              >
                {/* Nome do arquivo */}
                <div
                  style={{
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {doc.nome_arquivo}
                </div>

                {/* Botões */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-gradient"
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      background:
                        "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                    }}
                    onClick={() => window.open(doc.url_arquivo, "_blank")}
                  >
                    Abrir
                  </button>

                  <button
                    className="btn-gradient"
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      background:
                        "linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)",
                    }}
                    onClick={() =>
                      setDocSelecionado(
                        docSelecionado?.id === doc.id ? null : doc
                      )
                    }
                  >
                    Download Seguro
                  </button>
                </div>

                {/* Campo de senha inline */}
                {docSelecionado?.id === doc.id && (
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      value={senhaDownload}
                      onChange={(e) => setSenhaDownload(e.target.value)}
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #555",
                        background: "#111",
                        color: "#fff",
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-gradient"
                        onClick={() => handleSecureDownload(doc)}
                        disabled={baixando}
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        {baixando ? "Baixando..." : "Confirmar"}
                      </button>
                      <button
                        className="btn-gradient"
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          background: "#555",
                        }}
                        onClick={() => {
                          setDocSelecionado(null);
                          setSenhaDownload("");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Editar perfil */}
        <button
          style={{ marginTop: "20px", background: "#007bff" }}
          className="btn-gradient"
          onClick={() => setEditando(!editando)}
        >
          {editando ? "Cancelar Edição" : "Editar Perfil"}
        </button>

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

        {/* Button to go to the dedicated solicitations page */}
        <div style={{ marginTop: 30 }}>
          <h3>Férias e Licenças</h3>
          <button
            className="btn-gradient"
            onClick={() => navigate('/solicitacoes', { state: { usuario } })}
            style={{ marginTop: 8 }}
          >
            Ir para Solicitações
          </button>
        </div>

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
