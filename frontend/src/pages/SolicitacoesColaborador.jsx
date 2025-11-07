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
  const [calculoFerias, setCalculoFerias] = useState(null);
  const [calculandoFerias, setCalculandoFerias] = useState(false);

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

  const calcularFerias = async () => {
    if (!dataInicio || !dataFim) return;
    
    try {
      setCalculandoFerias(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/ferias/calcular`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          funcionarioId: usuarioId,
          mesesTrabalhados: 12 // Por padrão, considera período completo
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Erro ao calcular férias:", err);
        return;
      }

      const dados = await res.json();
      setCalculoFerias(dados);
    } catch (err) {
      console.error("Erro ao calcular férias:", err);
    } finally {
      setCalculandoFerias(false);
    }
  };

  // Calcular férias quando as datas são alteradas
  useEffect(() => {
    if (tipoSolicitacao === "ferias") {
      calcularFerias();
    } else {
      setCalculoFerias(null);
    }
  }, [dataInicio, dataFim, tipoSolicitacao]);

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
            
            {tipoSolicitacao === "ferias" && calculoFerias && (
              <div style={{ 
                background: "#1a1a1a", 
                padding: "12px", 
                borderRadius: "6px",
                marginBottom: "12px" 
              }}>
                <h4 style={{ marginBottom: "8px" }}>Cálculo de Férias:</h4>
                <div>Dias de Férias: {calculoFerias.diasFerias}</div>
                <div>Valor das Férias: R$ {calculoFerias.valorFerias.toFixed(2)}</div>
                <div>1/3 de Férias: R$ {calculoFerias.umTercoFerias.toFixed(2)}</div>
                <div style={{ 
                  marginTop: "8px", 
                  fontWeight: "bold" 
                }}>
                  Valor Total: R$ {calculoFerias.valorTotal.toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <button 
                className="btn-gradient" 
                type="submit" 
                disabled={enviandoSolicitacao || (tipoSolicitacao === "ferias" && calculandoFerias)}
              >
                {enviandoSolicitacao ? 'Enviando...' : 
                 (calculandoFerias ? 'Calculando Férias...' : 'Enviar Solicitação')}
              </button>
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
