import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";
import { getUsuarios } from "../services/api.js";

export default function ConsultaUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await getUsuarios();
        setUsuarios(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsuarios();
  }, []);

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Usuários</h2>
        <table style={{ margin: "0 auto", color: "#fff" }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Email</th>
              <th>Cargo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.cpf}</td>
                <td>{u.email}</td>
                <td>{u.cargo}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
