import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/global.css";

export default function TelaAdministrador() {
  // Função para remover documento
  const handleRemoverDocumento = async (usuarioId, docId) => {
    if (!window.confirm("Tem certeza que deseja remover este documento?")) return;
    try {
      const res = await fetch(`http://localhost:3000/documentos/${docId}`, { method: "DELETE" });
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
  // Função para upload de documento
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadUsuarioId || !uploadFile) {
      alert("Selecione um usuário e um arquivo.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("arquivo", uploadFile);
    try {
      const res = await fetch(`http://localhost:3000/documentos/${uploadUsuarioId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao fazer upload");
      alert("Documento enviado com sucesso!");
      setUploadFile(null);
      // Atualiza lista de documentos do usuário
      buscarDocumentos(uploadUsuarioId);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  };

  const buscarUsuarios = async () => {
    try {
      const res = await fetch(`http://localhost:3000/usuario?nome=${nomeBusca}&empresa=${admin.empresa}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();

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

  const buscarDocumentos = async (usuario_id) => {
    try {
      // Se já está aberto para esse usuário, fecha
      if (usuarioSelecionado === usuario_id) {
        setUsuarioSelecionado(null);
        return;
      }
      const res = await fetch(`http://localhost:3000/documentos/${usuario_id}`);
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
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
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
          <table style={{ marginTop: 20, width: "100%", color: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px #0002" }}>
            <thead style={{ background: "#222c" }}>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Empresa</th>
                <th>Pontos Hoje</th>
                <th>Documentos</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <React.Fragment key={u.id}>
                  <tr style={{ background: usuarioSelecionado === u.id ? "#2226" : "#222a" }}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{u.empresa}</td>
                    <td>
                      {u.pontos.length > 0
                        ? u.pontos.map((p) => `${p.tipo} às ${new Date(p.data_hora).toLocaleTimeString()}`).join(", ")
                        : "Nenhum ponto"}
                    </td>
                    <td>
                      <button className="btn-gradient" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => buscarDocumentos(u.id)}>
                        Gerenciar Documentos
                      </button>
                    </td>
                  </tr>
                  {usuarioSelecionado === u.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, background: "#222c" }}>
                        <div style={{ padding: 16 }}>
                          {/* Botão adicionar documento */}
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                            <button
                              className="btn-gradient"
                              style={{ fontSize: 13, padding: "6px 18px" }}
                              onClick={() => {
                                setShowUpload((prev) => !prev);
                                setUploadFile(null);
                              }}
                            >
                              {showUpload ? "Cancelar" : "Adicionar Documento"}
                            </button>
                          </div>
                          {/* Mini janela de upload */}
                          {showUpload && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!uploadFile) {
                                  alert("Selecione um arquivo.");
                                  return;
                                }
                                // Aceitar apenas tipos permitidos
                                const allowed = ["pdf", "jpg", "jpeg", "png", "docx"];
                                const ext = uploadFile.name.split('.').pop().toLowerCase();
                                if (!allowed.includes(ext)) {
                                  alert("Apenas arquivos PDF, JPG, PNG ou DOCX são permitidos.");
                                  return;
                                }
                                setUploading(true);
                                // Normalizar nome do arquivo removendo acentos e trocando letras especiais
                                function normalizeFileName(name) {
                                  return name
                                    .normalize("NFD")
                                    .replace(/ç/g, "c")
                                    .replace(/ã/g, "a")
                                    .replace(/õ/g, "o")
                                    .replace(/á/g, "a")
                                    .replace(/é/g, "e")
                                    .replace(/í/g, "i")
                                    .replace(/ó/g, "o")
                                    .replace(/ú/g, "u")
                                    .replace(/â/g, "a")
                                    .replace(/ê/g, "e")
                                    .replace(/ô/g, "o")
                                    .replace(/Ç/g, "C")
                                    .replace(/Ã/g, "A")
                                    .replace(/Õ/g, "O")
                                    .replace(/Á/g, "A")
                                    .replace(/É/g, "E")
                                    .replace(/Í/g, "I")
                                    .replace(/Ó/g, "O")
                                    .replace(/Ú/g, "U")
                                    .replace(/Â/g, "A")
                                    .replace(/Ê/g, "E")
                                    .replace(/Ô/g, "O")
                                    .replace(/[\u0300-\u036f]/g, "");
                                }
                                const normalizedFile = new File([uploadFile], normalizeFileName(uploadFile.name), { type: uploadFile.type });
                                const formData = new FormData();
                                formData.append("arquivo", normalizedFile);
                                try {
                                  const res = await fetch(`http://localhost:3000/documentos/${u.id}`, {
                                    method: "POST",
                                    body: formData,
                                  });
                                  if (!res.ok) throw new Error("Erro ao fazer upload");
                                  alert("Documento enviado com sucesso!");
                                  setUploadFile(null);
                                  setShowUpload(false);
                                  buscarDocumentos(u.id);
                                } catch (err) {
                                  alert("Erro ao enviar documento.");
                                } finally {
                                  setUploading(false);
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                background: "#222a",
                                borderRadius: 8,
                                padding: 10,
                                marginBottom: 16,
                                boxShadow: "0 1px 4px #0002"
                              }}
                            >
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                                onChange={e => setUploadFile(e.target.files[0])}
                                style={{ color: "#fff" }}
                              />
                              {uploadFile && (
                                <span style={{ color: "#fff", fontSize: 13, marginLeft: 8, marginRight: 4, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                  <span style={{
                                    background: "#00c6ff",
                                    color: "#222",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    marginLeft: 2
                                  }}>
                                    {(() => {
                                      const ext = uploadFile.name.split('.').pop().toLowerCase();
                                      if (ext === "pdf") return "PDF";
                                      if (ext === "jpg" || ext === "jpeg") return "JPG";
                                      if (ext === "png") return "PNG";
                                      if (ext === "docx") return "DOCX";
                                      return ext.toUpperCase();
                                    })()}
                                  </span>
                                </span>
                              )}
                              <button
                                className="btn-gradient"
                                type="submit"
                                disabled={uploading}
                                style={{ minWidth: 120 }}
                              >
                                {uploading ? "Enviando..." : "Enviar Documento"}
                              </button>
                            </form>
                          )}
                          <h4 style={{ color: "#fff", margin: 0, marginBottom: 8 }}>Documentos</h4>
                          {documentosUsuario[u.id] && documentosUsuario[u.id].length > 0 ? (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {documentosUsuario[u.id].map((doc) => (
                                <li key={doc.id} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                                  <span style={{ flex: 1, color: "#fff", textAlign: "left" }}>{doc.nome_arquivo}</span>
                                  <button
                                    className="btn-gradient"
                                    style={{ marginLeft: 8, fontSize: 12, padding: "2px 10px" }}
                                    onClick={() => window.open(doc.url_arquivo, "_blank")}
                                  >
                                    abrir
                                  </button>
                                  <button
                                    className="btn-gradient"
                                    style={{ marginLeft: 8, fontSize: 12, padding: "2px 10px", background: "#c00", border: "none" }}
                                    onClick={() => handleRemoverDocumento(u.id, doc.id)}
                                  >
                                    remover
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: "#ccc" }}>Nenhum documento encontrado.</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        <button style={{ marginTop: 20 }} className="btn-gradient" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    </div>
  );
}

