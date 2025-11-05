import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function SolicitacoesPendentesAdministrador() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = location.state?.usuario;
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [decidindoId, setDecidindoId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!admin) return navigate("/login");
    buscarSolicitacoesPendentes();
  }, [admin]);

  const buscarSolicitacoesPendentes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/solicitacoes?empresa=${encodeURIComponent(admin.empresa)}&pendentes=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao buscar solicitações pendentes");
      const data = await res.json();
      setSolicitacoesPendentes(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar solicitações pendentes.");
    }
  };

  const decidirSolicitacao = async (id, acao) => {
    try {
      setDecidindoId(id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/solicitacoes/${id}/decidir`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ acao }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "Erro ao decidir solicitação");
        return;
      }
      // atualizar lista
      buscarSolicitacoesPendentes();
    } catch (err) {
      console.error(err);
      alert("Erro ao processar decisão");
    } finally {
      setDecidindoId(null);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Solicitações Pendentes</h2>

        <div style={{ marginTop: 12 }}>
          <button className="btn-gradient" onClick={buscarSolicitacoesPendentes}>Recarregar Pendentes</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {solicitacoesPendentes.length === 0 ? (
            <p>Nenhuma solicitação pendente.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {solicitacoesPendentes.map((s) => (
                <li key={s.id} style={{ background: "#222a", padding: 10, borderRadius: 6, marginBottom: 8, color: "#fff" }}>
                  <div><strong>{s.nome}</strong> ({s.email})</div>
                  <div>{s.tipo} — {s.data_inicio} a {s.data_fim}</div>
                  {s.motivo && <div>Motivo: {s.motivo}</div>}
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button className="btn-gradient" onClick={() => decidirSolicitacao(s.id, 'aprovar')} disabled={decidindoId === s.id} style={{ background: '#4caf50' }}>{decidindoId === s.id ? 'Processando...' : 'Aprovar'}</button>
                    <button className="btn-gradient" onClick={() => decidirSolicitacao(s.id, 'recusar')} disabled={decidindoId === s.id} style={{ background: '#c62828' }}>{decidindoId === s.id ? 'Processando...' : 'Recusar'}</button>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Enviado: {new Date(s.criado_em).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button style={{ marginTop: 20 }} className="btn-gradient" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    </div>
  );
}
