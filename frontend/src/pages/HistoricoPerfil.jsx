import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function HistoricoPerfil() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = location.state?.usuario;

  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:3000/usuario/${usuario.id}/historico`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) throw new Error("Erro ao buscar histórico");
        const data = await res.json();
        setHistorico(data);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar histórico do usuário.");
      }
    };

    if (usuario?.id) fetchHistorico();
  }, [usuario]);

  return (
    <div className="cadastro-container">
      <div className="cadastro-card" style={{ maxWidth: 900 }}>
        <h2>Histórico de Alterações: {usuario.nome}</h2>

        {historico.length === 0 ? (
          <p>Nenhuma alteração encontrada.</p>
        ) : (
          <div className="historico-table-wrapper">
            <table className="historico-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Valor Antigo</th>
                  <th>Valor Novo</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.campo_alterado}</td>
                    <td>{item.valor_antigo}</td>
                    <td>{item.valor_novo}</td>
                    <td>{new Date(item.data_hora).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
