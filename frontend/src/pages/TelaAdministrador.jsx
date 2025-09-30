import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function TelaAdministrador() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.state?.usuario;

  const [nomeBusca, setNomeBusca] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  // Verificar se admin existe, se não, redirecionar para login
  if (!admin) {
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

  const buscarUsuarios = async () => {
    try {
      if (!admin) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${admin.empresa}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
          navigate("/login");
          return;
        }
        throw new Error("Erro ao buscar usuários");
      }
      const data = await res.json();

      const usuariosComPontos = await Promise.all(
        data.map(async (user) => {
          const pontosRes = await fetch(
            `http://localhost:3000/registro-ponto/${user.id}?hoje=true`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          const pontos = await pontosRes.json();
          return { ...user, pontos };
        })
      );

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

        {/* Busca de usuários */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <input
            type="text"
            placeholder="Buscar colaborador pelo nome"
            value={nomeBusca}
            onChange={(e) => setNomeBusca(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn-gradient" onClick={buscarUsuarios}>
            Buscar
          </button>
        </div>

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
                <th>Empresa</th>
                <th>Pontos Hoje</th>
                <th>Documentos</th>
                <th>Ações</th> {/* 🔥 Nova coluna */}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ background: "#222a" }}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.empresa}</td>
                  <td>
                    {u.pontos.length > 0
                      ? u.pontos
                          .map(
                            (p) =>
                              `${p.tipo} às ${new Date(
                                p.data_hora
                              ).toLocaleTimeString()}`
                          )
                          .join(", ")
                      : "Nenhum ponto"}
                  </td>
                  <td>
                    <button
                      className="btn-gradient"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() =>
                        navigate("/gerenciar-documentos", {
                          state: { usuario: u },
                        })
                      }
                    >
                      Gerenciar Documentos
                    </button>
                  </td>
                  <td>
                    {/* 🔥 Novos botões */}
                    <button
                      className="btn-gradient"
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        marginRight: 6,
                      }}
                      onClick={() =>
                        navigate("/editar-perfil", { state: { usuario: u } })
                      }
                    >
                      Editar Perfil
                    </button>
                    <button
                      className="btn-gradient"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() =>
                        navigate("/historico-perfil", {
                          state: { usuario: u },
                        })
                      }
                    >
                      Histórico
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
