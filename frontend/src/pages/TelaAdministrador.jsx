import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/global.css";

export default function TelaAdministrador() {
  // Função para remover documento
  const handleRemoverDocumento = async (usuarioId, docId) => {
    if (!window.confirm("Tem certeza que deseja remover este documento?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/documentos/${docId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro ao remover documento");
      // Atualiza lista após remoção
      buscarDocumentos(usuarioId);
    } catch (err) {
      alert("Erro ao remover documento.");
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const admin = location.state?.usuario;

  const [nomeBusca, setNomeBusca] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [documentosUsuario, setDocumentosUsuario] = useState({});
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const buscarUsuarios = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${admin.empresa}`
      );
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();

      const usuariosComPontos = await Promise.all(
        data.map(async (user) => {
          const pontosRes = await fetch(
            `http://localhost:3000/registro-ponto/${user.id}?hoje=true`
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

  const buscarDocumentos = async (usuario_id) => {
    try {
      if (usuarioSelecionado === usuario_id) {
        setUsuarioSelecionado(null);
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/documentos/${usuario_id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Erro ao buscar documentos");
      const docs = await res.json();
      setDocumentosUsuario((prev) => ({ ...prev, [usuario_id]: docs }));
      setUsuarioSelecionado(usuario_id);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar documentos do usuário.");
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
                <React.Fragment key={u.id}>
                  <tr
                    style={{
                      background:
                        usuarioSelecionado === u.id ? "#2226" : "#222a",
                    }}
                  >
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
                        onClick={() => buscarDocumentos(u.id)}
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
                  {/* aqui mantém a parte de documentos que você já tinha */}
                </React.Fragment>
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
