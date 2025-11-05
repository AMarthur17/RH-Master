import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function SolicitacoesColaborador() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = location.state?.usuario;
  const usuarioId = usuario?.id;

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [tipoSolicitacao, setTipoSolicitacao] = useState("ferias");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivoSolicitacao, setMotivoSolicitacao] = useState("");
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!usuarioId) return navigate("/login");
    buscarSolicitacoes();
  }, [usuarioId]);

  const buscarSolicitacoes = async () => {
    if (!usuarioId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/solicitacoes/${usuarioId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao buscar solicitações");
      const data = await res.json();
      setSolicitacoes(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar solicitações.");
    }
  };

  const enviarSolicitacao = async (e) => {
    e && e.preventDefault();
    if (!dataInicio || !dataFim) {
      alert("Informe data de início e fim");
      return;
    }
    try {
      setEnviandoSolicitacao(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/solicitacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tipo: tipoSolicitacao, data_inicio: dataInicio, data_fim: dataFim, motivo: motivoSolicitacao }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao enviar solicitação");
        return;
      }

      alert("Solicitação enviada com sucesso.");
      setTipoSolicitacao("ferias");
      setDataInicio("");
      setDataFim("");
      setMotivoSolicitacao("");
      buscarSolicitacoes();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar solicitação");
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Solicitações — {usuario?.nome}</h2>

        <div style={{ marginTop: 16 }}>
          <h3>Solicitar Férias / Licença</h3>
          <form onSubmit={enviarSolicitacao} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={tipoSolicitacao} onChange={(e) => setTipoSolicitacao(e.target.value)}>
              <option value="ferias">Férias</option>
              <option value="licenca">Licença</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
            </div>
            <textarea placeholder="Motivo (opcional)" value={motivoSolicitacao} onChange={(e) => setMotivoSolicitacao(e.target.value)} />
            <div>
              <button className="btn-gradient" type="submit" disabled={enviandoSolicitacao}>{enviandoSolicitacao ? 'Enviando...' : 'Enviar Solicitação'}</button>
            </div>
          </form>

          <h4 style={{ marginTop: 16 }}>Histórico de Solicitações</h4>
          {solicitacoes.length === 0 ? (
            <p>Nenhuma solicitação enviada.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {solicitacoes.map((s) => (
                <li key={s.id} style={{ padding: 10, background: "#222a", borderRadius: 6, marginBottom: 8 }}>
                  <div><strong>{s.tipo}</strong> — {s.data_inicio} a {s.data_fim}</div>
                  <div>Status: <strong>{s.status}</strong>{s.aprovado_por ? ` — decidido por ${s.aprovado_por}` : ""}</div>
                  {s.motivo && <div>Motivo: {s.motivo}</div>}
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Enviado: {new Date(s.criado_em).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          style={{ marginTop: 20 }}
          className="btn-gradient"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
