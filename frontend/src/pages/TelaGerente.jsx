import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function TelaGerente() {
  const navigate = useNavigate();
  const location = useLocation();
  const gerente = location.state?.usuario;

  const [nomeBusca, setNomeBusca] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState('presenca');
  const [formatoRelatorio, setFormatoRelatorio] = useState('pdf');

  if (!gerente) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">
          <h2>Sessão Expirada</h2>
          <p>Por favor, faça login novamente.</p>
          <button className="btn-gradient" onClick={() => navigate("/login")}>
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  const buscarEquipe = async () => {
    const start = performance.now();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${gerente.empresa}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Erro ao buscar equipe");

      const data = await res.json();

      const usuariosComPontos = await Promise.all(
        data.map(async (user) => {
          const pontosRes = await fetch(
            `http://localhost:3000/registro-ponto/${user.id}?hoje=true`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const pontos = pontosRes.ok ? await pontosRes.json() : [];
          return { ...user, pontos };
        })
      );

      setUsuarios(usuariosComPontos);

      const end = performance.now();
      const tempo = end - start;
      fetch('http://localhost:3000/logs/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tela: 'TelaGerente',
          acao: 'buscarEquipe',
          tempoRespostaMs: tempo,
          usuario: gerente?.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar equipe.");
    }
  };

  const gerarRelatorio = async () => {
    const start = performance.now();
    try {
      setGerandoRelatorio(true);
      const token = localStorage.getItem("token");
      let endpoint = '';
      
      switch(tipoRelatorio) {
        case 'presenca':
          endpoint = `http://localhost:3000/relatorios/presenca`;
          break;
        case 'beneficios':
          endpoint = `http://localhost:3000/relatorios/beneficios`;
          break;
        default:
          throw new Error("Tipo de relatório inválido");
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${endpoint}?empresa=${gerente.empresa}&formato=${formatoRelatorio}`, { headers });

      if (!res.ok) {
        let errMsg = 'Erro ao gerar relatório.';
        try {
          const j = await res.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        if (res.status === 401) {
          alert('Sessão inválida. Faça login novamente.');
          navigate('/login');
          return;
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${tipoRelatorio}-${new Date().toISOString().split('T')[0]}.${formatoRelatorio}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const end = performance.now();
      const tempo = end - start;
      fetch('http://localhost:3000/logs/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tela: 'TelaGerente',
          acao: 'gerarRelatorio',
          tipoRelatorio,
          tempoRespostaMs: tempo,
          usuario: gerente?.id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar relatório.");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Bem-vindo, Gerente {gerente.nome}!</h2>
        <p style={{ color: '#ccc', marginBottom: 20 }}>Gerencie sua equipe e aprovações</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Buscar colaborador da equipe"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn-gradient" onClick={buscarEquipe}>Buscar</button>
          </div>

          {/* Seção de Gestão de Solicitações */}
          <div style={{ 
            marginTop: 20, 
            padding: 16, 
            backgroundColor: '#233', 
            borderRadius: 8 
          }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Gestão de Férias e Licenças</h3>
            <div style={{ marginTop: 12 }}>
              <button 
                className="btn-gradient" 
                onClick={() => navigate('/solicitacoes-pendentes', { state: { usuario: gerente } })}
              >
                Aprovar Solicitações Pendentes
              </button>
            </div>
          </div>

          {/* Seção de Relatórios */}
          <div style={{ 
            marginTop: 20, 
            padding: 16, 
            backgroundColor: '#333a', 
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Relatórios</h3>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select 
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: 4 }}
              >
                <option value="presenca">Registro de Presença</option>
                <option value="beneficios">Relatório de Benefícios</option>
              </select>

              <select 
                value={formatoRelatorio}
                onChange={(e) => setFormatoRelatorio(e.target.value)}
                style={{ width: '100px', padding: '8px', borderRadius: 4 }}
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
              </select>

              <button
                className="btn-gradient"
                onClick={gerarRelatorio}
                disabled={gerandoRelatorio}
                style={{
                  padding: '8px 16px',
                  minWidth: '150px'
                }}
              >
                {gerandoRelatorio ? 'Gerando...' : 'Gerar Relatório'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de equipe */}
        {usuarios.length > 0 && (
          <table
            style={{
              marginTop: 20,
              width: "100%",
              color: "#fff",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 2px 8px #0002",
            }}
          >
            <thead style={{ background: "#222c" }}>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Pontos Hoje</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ background: "#222a" }}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.cargo}</td>
                  <td>
                    {u.pontos.length > 0
                      ? u.pontos
                          .map((p) => `${p.tipo} às ${new Date(p.data_hora).toLocaleTimeString()}`)
                          .join(", ")
                      : "Nenhum ponto"}
                  </td>
                  <td style={{ padding: 0, display: "flex", flexDirection: "column" }}>
                    <button
                      className="btn-gradient"
                      style={{
                        flex: 1,
                        width: "100%",
                        borderRadius: 0,
                        fontSize: 14,
                        padding: "8px 0",
                        marginBottom: 2,
                      }}
                      onClick={() =>
                        navigate("/historico-pontos", { state: { usuario: u } })
                      }
                    >
                      Histórico de Pontos
                    </button>
                    <button
                      className="btn-gradient"
                      style={{
                        flex: 1,
                        width: "100%",
                        borderRadius: 0,
                        fontSize: 14,
                        padding: "8px 0",
                      }}
                      onClick={() =>
                        navigate("/historico-perfil", { state: { usuario: u } })
                      }
                    >
                      Histórico de Edições
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
