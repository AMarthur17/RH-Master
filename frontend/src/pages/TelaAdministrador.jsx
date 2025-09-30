import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/global.css";

export default function TelaAdministrador() {
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

  // Estados da folha de pagamento
  const [folha, setFolha] = useState([]);
  const [loadingFolha, setLoadingFolha] = useState(false);
  const [mostrarFolha, setMostrarFolha] = useState(false);

  // Função para buscar usuários
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

  // Função para buscar documentos de um usuário
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
      buscarDocumentos(usuarioId);
    } catch (err) {
      alert("Erro ao remover documento.");
    }
  };

  // Função para gerar folha de pagamento
  const gerarFolha = async () => {
    if (!window.confirm("Gerar folha de pagamento deste mês?")) return;
    try {
      setLoadingFolha(true);
      const res = await fetch(`http://localhost:3000/folha/${admin.empresa}`);
      if (!res.ok) throw new Error("Erro ao gerar folha");
      const data = await res.json();
      setFolha(data);
      setMostrarFolha(true);
    } catch (err) {
      alert("Falha ao gerar folha.");
    } finally {
      setLoadingFolha(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Bem-vindo, Administrador!</h2>

        {/* Botão gerar folha */}
        <button
          className="btn-gradient"
          onClick={gerarFolha}
          style={{ marginBottom: 20 }}
        >
          {loadingFolha ? "Calculando..." : "Gerar Folha de Pagamento"}
        </button>

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
                          navigate("/historico-perfil", { state: { usuario: u } })
                        }
                      >
                        Histórico
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* Tabela da Folha de Pagamento */}
        {mostrarFolha && (
          <div style={{ marginTop: 20 }}>
            <h3>Folha de Pagamento</h3>
            <table style={{ width: "100%", color: "#fff" }}>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Salário Bruto</th>
                  <th>INSS</th>
                  <th>Vale Transporte</th>
                  <th>Salário Líquido</th>
                </tr>
              </thead>
              <tbody>
                {folha.map((f) => (
                  <tr key={f.usuarioId}>
                    <td>{f.nome}</td>
                    <td>R$ {f.salarioBruto.toFixed(2)}</td>
                    <td>R$ {f.descontos.inss.toFixed(2)}</td>
                    <td>R$ {f.descontos.valeTransporte.toFixed(2)}</td>
                    <td>R$ {f.salarioLiquido.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button
                className="btn-gradient"
                onClick={async () => {
                  if (!window.confirm("Confirmar pagamento e salvar histórico?"))
                    return;
                  try {
                    const res = await fetch(
                      "http://localhost:3000/folha/confirmar",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          empresaId: admin.empresa,
                          folha,
                        }),
                      }
                    );
                    if (!res.ok) throw new Error("Erro ao confirmar folha");
                    alert("Folha confirmada com sucesso!");
                    setMostrarFolha(false);
                  } catch (err) {
                    alert("Falha ao confirmar folha.");
                  }
                }}
              >
                Confirmar Pagamento
              </button>
              <button
                className="btn-gradient"
                onClick={() => setMostrarFolha(false)}
              >
                Fechar
              </button>
            </div>
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
