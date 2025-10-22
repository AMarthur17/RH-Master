import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function DocumentosCompartilhados() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = location.state?.usuario;

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarDocumentos = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/documentos/compartilhados/${usuario.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error("Erro ao buscar documentos compartilhados.");

      const docs = await res.json();
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar documentos compartilhados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuario) buscarDocumentos();
  }, [usuario]);

  if (!usuario) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">
          <h2>Erro: Usuário não encontrado</h2>
          <button
            className="btn-gradient"
            onClick={() => navigate("/colaborador")}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2
          style={{
            marginBottom: 32,
            color: "#fff",
            background: "linear-gradient(135deg, #00c6ff, #0072ff)",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          Documentos Compartilhados
        </h2>

        {loading ? (
          <div style={{ color: "#ccc", textAlign: "center", padding: 40 }}>
            Carregando documentos...
          </div>
        ) : documentos.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {documentos.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#222a",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #0002",
                }}
              >
                <span style={{ color: "#fff", fontSize: 16 }}>
                  {doc.nome_arquivo}
                </span>
                <button
                  className="btn-gradient"
                  onClick={() => window.open(doc.url_arquivo, "_blank")}
                >
                  Abrir
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#ccc",
              padding: 40,
              background: "#222a",
              borderRadius: 8,
              fontStyle: "italic",
            }}
          >
            Nenhum documento disponível no momento.
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button
            className="btn-gradient"
            style={{ minWidth: 200 }}
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
