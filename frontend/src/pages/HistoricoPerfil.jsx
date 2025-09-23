import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/global.css";

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
          `http://localhost:3000/historico-perfil/${usuario.id}`,
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
      <div className="cadastro-card" style={{ maxWidth: 700 }}>
        <h2>Histórico de Alterações: {usuario.nome}</h2>

        {historico.length === 0 ? (
          <p>Nenhuma alteração encontrada.</p>
        ) : (
          <table style={{ width: "100%", marginTop: 16, color: "#fff" }}>
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
                  <td>{item.campo}</td>
                  <td>{item.valor_antigo}</td>
                  <td>{item.valor_novo}</td>
                  <td>{new Date(item.data_hora).toLocaleString("pt-BR")}</td>
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
