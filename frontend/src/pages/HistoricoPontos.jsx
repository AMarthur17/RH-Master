import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function HistoricoPontos() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = location.state?.usuario;

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form para adicionar ponto atrasado
  const [tipo, setTipo] = useState("entrada");
  const [dataHora, setDataHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (usuario) fetchHistorico();
  }, [usuario]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/registro-ponto/${usuario.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Erro ao buscar registros");
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar histórico de pontos.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPonto = async (e) => {
    e.preventDefault();
    if (!dataHora) {
      alert("Informe data e hora do ponto (formato ISO ou use o seletor).");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const body = { usuario_id: usuario.id, tipo, data_hora: dataHora, motivo };
      const res = await fetch(`http://localhost:3000/registro-ponto`, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao adicionar ponto");
      }
      alert("Ponto adicionado com sucesso");
      setTipo("entrada");
      setDataHora("");
      setMotivo("");
      fetchHistorico();
    } catch (err) {
      console.error(err);
      alert(err.message || "Erro ao adicionar ponto");
    } finally {
      setSubmitting(false);
    }
  };

  if (!usuario) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">
          <h2>Usuário não informado</h2>
          <button className="btn-gradient" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Histórico de Pontos - {usuario.nome}</h2>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <strong>Email:</strong> {usuario.email} &nbsp; <strong>Empresa:</strong> {usuario.empresa}
        </div>

        <div style={{ marginTop: 8 }}>
          <h3 style={{ color: '#fff' }}>Registros ({registros.length})</h3>
          {loading ? (
            <div style={{ padding: 20, color: '#ccc' }}>Carregando...</div>
          ) : (
            <table style={{ width: '100%', color: '#fff' }}>
              <thead style={{ background: '#222c' }}>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Data / Hora</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id} style={{ background: '#222a' }}>
                    <td>{r.id}</td>
                    <td>{r.tipo}</td>
                    <td>{new Date(r.data_hora).toLocaleString()}</td>
                    <td style={{ maxWidth: 300, whiteSpace: 'normal', textAlign: 'left', paddingLeft: 8 }}>{r.motivo || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: '#fff' }}>Adicionar ponto em atraso</h3>
          <form onSubmit={handleAddPonto} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ minWidth: 120 }}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
              <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} style={{ minWidth: 240 }} />
            </div>
            <div>
              <textarea
                placeholder="Motivo (opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 8, resize: 'vertical', background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none' }}
              />
            </div>
            <div>
              <button className="btn-gradient" type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Adicionar Ponto'}</button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn-gradient" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    </div>
  );
}
