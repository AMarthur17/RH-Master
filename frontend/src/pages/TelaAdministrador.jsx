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

  // Redireciona para login se admin não existir
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

  // Buscar usuários
  const buscarUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${admin.empresa}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Erro ao buscar usuários");

      const data = await res.json();

      const usuariosComPontos = await Promise.all(
        data.map(async (user) => {
          const pontosRes = await fetch(
            `http://localhost:3000/registro-ponto/${user.id}?hoje=true`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
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

  // Função para gerar folha de pagamento com todos os usuários da empresa, exceto o admin
  const gerarFolha = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/usuario?empresa=${admin.empresa}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Erro ao buscar usuários para folha");

      let usuariosTodos = await res.json();

      // Filtrar o administrador da lista
      usuariosTodos = usuariosTodos.filter(u => u.id !== admin.id);

      const usuariosComPontos = await Promise.all(
        usuariosTodos.map(async (user) => {
          const pontosRes = await fetch(
            `http://localhost:3000/registro-ponto/${user.id}?hoje=true`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const pontos = await pontosRes.json();
          return { ...user, pontos };
        })
      );

      navigate("/folha-pagamento", { state: { usuarios: usuariosComPontos } });
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar folha de pagamento.");
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Bem-vindo, Administrador!</h2>

        {/* Bloco de busca */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

          {/* Botão de gerar folha */}
          <button
            className="btn-gradient"
            onClick={gerarFolha}
            style={{
              marginTop: 8,
              backgroundColor: "#ff9800",
              color: "#fff",
              padding: "8px 16px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Gerar Folha de Pagamento
          </button>
        </div>

        {/* Tabela de usuários */}
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
                <th>Ações</th>
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
                          .map((p) => `${p.tipo} às ${new Date(p.data_hora).toLocaleTimeString()}`)
                          .join(", ")
                      : "Nenhum ponto"}
                  </td>
                  <td>
                    <button
                      className="btn-gradient"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => navigate("/gerenciar-documentos", { state: { usuario: u } })}
                    >
                      Gerenciar Documentos
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-gradient"
                      style={{ fontSize: 12, padding: "4px 10px", marginRight: 6 }}
                      onClick={() => navigate("/editar-perfil", { state: { usuario: u } })}
                    >
                      Editar Perfil
                    </button>
                    <button
                      className="btn-gradient"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => navigate("/historico-perfil", { state: { usuario: u } })}
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
