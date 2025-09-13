import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/global.css";

export default function TelaAdministrador() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.state?.usuario;

  const [nomeBusca, setNomeBusca] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  const buscarUsuarios = async () => {
    try {
      const res = await fetch(`http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${admin.empresa}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();

      // Buscar pontos do dia para cada colaborador
      const usuariosComPontos = await Promise.all(data.map(async (user) => {
        const pontosRes = await fetch(`http://localhost:3000/registro-ponto/${user.id}?hoje=true`);
        const pontos = await pontosRes.json();
        return { ...user, pontos };
      }));

      setUsuarios(usuariosComPontos);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar usuários.");
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Bem-vindo, Administrador!</h2>

        <input
          type="text"
          placeholder="Buscar colaborador pelo nome"
          value={nomeBusca}
          onChange={(e) => setNomeBusca(e.target.value)}
        />
        <button className="btn-gradient" style={{ marginTop: "10px" }} onClick={buscarUsuarios}>
          Buscar
        </button>

        {usuarios.length > 0 && (
          <table style={{ marginTop: "20px", width: "100%", color: "#fff" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Empresa</th>
                <th>Pontos Hoje</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.empresa}</td>
                  <td>
                    {u.pontos.length > 0
                      ? u.pontos.map((p) => `${p.tipo} às ${new Date(p.data_hora).toLocaleTimeString()}`).join(", ")
                      : "Nenhum ponto"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button style={{ marginTop: "20px" }} className="btn-gradient" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    </div>
  );
}
