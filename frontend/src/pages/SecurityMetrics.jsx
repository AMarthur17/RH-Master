import { useState, useEffect } from "react";
import "../styles/SecurityMetrics.css";

/**
 * Página de Métricas de Segurança
 * Exibe a Taxa de Incidentes de Vazamento de Dados
 */
function SecurityMetrics() {
  const [metrica, setMetrica] = useState(null);
  const [incidentes, setIncidentes] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
  });

  // Buscar dados ao carregar a página
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Construir query params
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio);
      if (filtros.dataFim) params.append("dataFim", filtros.dataFim);

      // Buscar métrica
      const resMetrica = await fetch(
        `http://localhost:5000/api/security-metrics/taxa-vazamento?${params}`,
        { headers }
      );
      if (!resMetrica.ok) throw new Error("Erro ao buscar métrica");
      const dadosMetrica = await resMetrica.json();
      setMetrica(dadosMetrica);

      // Buscar incidentes
      const resIncidentes = await fetch(
        `http://localhost:5000/api/security-metrics/incidentes?${params}&limit=10`,
        { headers }
      );
      if (!resIncidentes.ok) throw new Error("Erro ao buscar incidentes");
      const dadosIncidentes = await resIncidentes.json();
      setIncidentes(dadosIncidentes.incidentes || []);

      // Buscar estatísticas
      const resEstatisticas = await fetch(
        `http://localhost:5000/api/security-metrics/estatisticas?${params}`,
        { headers }
      );
      if (!resEstatisticas.ok) throw new Error("Erro ao buscar estatísticas");
      const dadosEstatisticas = await resEstatisticas.json();
      setEstatisticas(dadosEstatisticas);

      // Detectar vazamentos
      const resAlertas = await fetch(
        `http://localhost:5000/api/security-metrics/detectar-vazamentos?${params}`,
        { headers }
      );
      if (!resAlertas.ok) throw new Error("Erro ao detectar vazamentos");
      const dadosAlertas = await resAlertas.json();
      setAlertas(dadosAlertas);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const aplicarFiltros = () => {
    carregarDados();
  };

  const limparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "" });
    setTimeout(carregarDados, 100);
  };

  const resolverIncidente = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const acaoCorretiva = prompt(
        "Descreva a ação corretiva tomada para resolver este incidente:"
      );

      if (!acaoCorretiva) return;

      const response = await fetch(
        `http://localhost:5000/api/security-metrics/incidentes/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "RESOLVIDO",
            acaoCorretiva,
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao resolver incidente");

      alert("Incidente resolvido com sucesso!");
      carregarDados();
    } catch (err) {
      console.error("Erro ao resolver incidente:", err);
      alert("Erro ao resolver incidente: " + err.message);
    }
  };

  const getSeveridadeClass = (severidade) => {
    const classes = {
      BAIXA: "severidade-baixa",
      MEDIA: "severidade-media",
      ALTA: "severidade-alta",
      CRITICA: "severidade-critica",
    };
    return classes[severidade] || "";
  };

  const getStatusClass = (status) => {
    const classes = {
      ABERTO: "status-aberto",
      EM_INVESTIGACAO: "status-investigacao",
      RESOLVIDO: "status-resolvido",
      FALSO_POSITIVO: "status-falso",
    };
    return classes[status] || "";
  };

  const getTaxaClass = (taxa) => {
    if (taxa >= 99) return "taxa-excelente";
    if (taxa >= 95) return "taxa-bom";
    if (taxa >= 90) return "taxa-aceitavel";
    if (taxa >= 80) return "taxa-preocupante";
    return "taxa-critico";
  };

  if (loading) {
    return (
      <div className="security-metrics-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando métricas de segurança...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-metrics-container">
        <div className="error-message">
          <h3>❌ Erro</h3>
          <p>{error}</p>
          <button onClick={carregarDados}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="security-metrics-container">
      <header className="page-header">
        <h1>🔐 Métricas de Segurança</h1>
        <p>Taxa de Incidentes de Vazamento de Dados</p>
      </header>

      {/* Filtros */}
      <section className="filtros-section">
        <div className="filtros-container">
          <div className="filtro-item">
            <label>Data Início:</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="filtro-item">
            <label>Data Fim:</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="filtro-acoes">
            <button onClick={aplicarFiltros} className="btn-primary">
              Aplicar
            </button>
            <button onClick={limparFiltros} className="btn-secondary">
              Limpar
            </button>
          </div>
        </div>
      </section>

      {/* Métrica Principal */}
      {metrica && (
        <section className="metrica-principal">
          <div className={`metrica-card ${getTaxaClass(metrica.dados.taxaProtecao)}`}>
            <h2>Taxa de Proteção</h2>
            <div className="taxa-valor">{metrica.dados.taxaProtecao}%</div>
            <p className="interpretacao">{metrica.interpretacao}</p>
            <div className="metrica-detalhes">
              <div className="detalhe-item">
                <span className="label">Total de Transações:</span>
                <span className="valor">{metrica.dados.totalTransacoes.toLocaleString()}</span>
              </div>
              <div className="detalhe-item">
                <span className="label">Total de Incidentes:</span>
                <span className="valor">{metrica.dados.totalIncidentes}</span>
              </div>
              <div className="detalhe-item">
                <span className="label">Proporção:</span>
                <span className="valor">{metrica.dados.proporcaoIncidentes}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Alertas Automáticos */}
      {alertas && alertas.totalAlertas > 0 && (
        <section className="alertas-section">
          <h2>🚨 Alertas Detectados</h2>
          <div className="alertas-grid">
            {alertas.alertas.map((alerta, index) => (
              <div key={index} className={`alerta-card ${getSeveridadeClass(alerta.severidade)}`}>
                <h3>{alerta.descricao}</h3>
                <p className="alerta-tipo">{alerta.tipo}</p>
                <p className="alerta-severidade">Severidade: {alerta.severidade}</p>
                <div className="alerta-detalhes">
                  <small>
                    {alerta.detalhes.length} ocorrência(s) detectada(s)
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estatísticas */}
      {estatisticas && (
        <section className="estatisticas-section">
          <h2>📊 Estatísticas</h2>
          <div className="estatisticas-grid">
            <div className="estatistica-card">
              <h3>Por Severidade</h3>
              <ul>
                {estatisticas.porSeveridade.map((item) => (
                  <li key={item.severidade} className={getSeveridadeClass(item.severidade)}>
                    <span>{item.severidade}:</span>
                    <strong>{item.quantidade}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="estatistica-card">
              <h3>Por Status</h3>
              <ul>
                {estatisticas.porStatus.map((item) => (
                  <li key={item.status} className={getStatusClass(item.status)}>
                    <span>{item.status}:</span>
                    <strong>{item.quantidade}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="estatistica-card">
              <h3>Por Tipo</h3>
              <ul>
                {estatisticas.porTipo.map((item) => (
                  <li key={item.tipo}>
                    <span>{item.tipo}:</span>
                    <strong>{item.quantidade}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="estatistica-card">
              <h3>Geral</h3>
              <ul>
                <li>
                  <span>Registros Afetados:</span>
                  <strong>{estatisticas.totalRegistrosAfetados}</strong>
                </li>
                <li>
                  <span>Tempo Médio de Resolução:</span>
                  <strong>{estatisticas.tempoMedioResolucaoHoras}h</strong>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Lista de Incidentes */}
      <section className="incidentes-section">
        <h2>📋 Incidentes Recentes</h2>
        {incidentes.length === 0 ? (
          <p className="sem-incidentes">✅ Nenhum incidente registrado no período</p>
        ) : (
          <div className="incidentes-lista">
            {incidentes.map((incidente) => (
              <div key={incidente.id} className="incidente-card">
                <div className="incidente-header">
                  <span className={`badge ${getSeveridadeClass(incidente.severidade)}`}>
                    {incidente.severidade}
                  </span>
                  <span className={`badge ${getStatusClass(incidente.status)}`}>
                    {incidente.status}
                  </span>
                </div>
                <h3>{incidente.descricao}</h3>
                <div className="incidente-info">
                  <p>
                    <strong>Tipo:</strong> {incidente.tipo}
                  </p>
                  <p>
                    <strong>Origem:</strong> {incidente.origem}
                  </p>
                  <p>
                    <strong>Detectado em:</strong>{" "}
                    {new Date(incidente.data_deteccao).toLocaleString("pt-BR")}
                  </p>
                  {incidente.dados_afetados && (
                    <p>
                      <strong>Dados Afetados:</strong> {incidente.dados_afetados}
                    </p>
                  )}
                  {incidente.quantidade_registros > 0 && (
                    <p>
                      <strong>Registros Afetados:</strong> {incidente.quantidade_registros}
                    </p>
                  )}
                  {incidente.acao_corretiva && (
                    <p>
                      <strong>Ação Corretiva:</strong> {incidente.acao_corretiva}
                    </p>
                  )}
                </div>
                {incidente.status === "ABERTO" && (
                  <button
                    onClick={() => resolverIncidente(incidente.id)}
                    className="btn-resolver"
                  >
                    Resolver Incidente
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SecurityMetrics;
