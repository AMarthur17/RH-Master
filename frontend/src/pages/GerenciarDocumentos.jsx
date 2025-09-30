import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";

export default function GerenciarDocumentos() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = location.state?.usuario;

  const [documentos, setDocumentos] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função para normalizar nome do arquivo
  const normalizeFileName = (name) => {
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
  };

  // Função para buscar documentos do usuário
  const buscarDocumentos = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/documentos/${usuario.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error("Erro ao buscar documentos");

      const docs = await res.json();
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar documentos do usuário.");
    } finally {
      setLoading(false);
    }
  };

  // Função para upload de documento
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      alert("Selecione um arquivo.");
      return;
    }

    // Validar tipos permitidos
    const allowed = ["pdf", "jpg", "jpeg", "png", "docx"];
    const ext = uploadFile.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      alert("Apenas arquivos PDF, JPG, PNG ou DOCX são permitidos.");
      return;
    }

    setUploading(true);

    try {
      // Normalizar nome do arquivo
      const normalizedFile = new File(
        [uploadFile],
        normalizeFileName(uploadFile.name),
        {
          type: uploadFile.type,
        }
      );

      const formData = new FormData();
      formData.append("arquivo", normalizedFile);

      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/documentos/${usuario.id}`,
        {
          method: "POST",
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error("Erro ao fazer upload");

      alert("Documento enviado com sucesso!");
      setUploadFile(null);
      setShowUpload(false);
      buscarDocumentos(); // Atualizar lista
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  };

  // Função para remover documento
  const handleRemoverDocumento = async (docId) => {
    if (!window.confirm("Tem certeza que deseja remover este documento?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/documentos/${docId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Erro ao remover documento");

      alert("Documento removido com sucesso!");
      buscarDocumentos(); // Atualizar lista
    } catch (err) {
      console.error(err);
      alert("Erro ao remover documento.");
    }
  };

  // Função para obter o tipo do arquivo baseado na extensão
  const getFileTypeLabel = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "jpg" || ext === "jpeg") return "JPG";
    if (ext === "png") return "PNG";
    if (ext === "docx") return "DOCX";
    return ext.toUpperCase();
  };

  // Carregar documentos ao montar o componente
  useEffect(() => {
    if (usuario) {
      buscarDocumentos();
    }
  }, [usuario]);

  // Redirecionar se não tiver usuário
  if (!usuario) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">
          <h2>Erro: Usuário não encontrado</h2>
          <button
            className="btn-gradient"
            onClick={() => navigate("/administrador")}
          >
            Voltar para Administração
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        {/* Header com informações do usuário */}
        <div
          style={{
            marginBottom: 32,
            padding: 20,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 12,
            color: "#fff",
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: 28 }}>
            Gerenciar Documentos
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ minWidth: 100, textAlign: "left" }}>
                Nome:
              </strong>
              <span style={{ fontSize: 18, marginLeft: 20 }}>
                {usuario.nome}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ minWidth: 100, textAlign: "left" }}>
                Empresa:
              </strong>
              <span style={{ marginLeft: 20 }}>{usuario.empresa}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ minWidth: 100, textAlign: "left" }}>
                Cargo:
              </strong>
              <span style={{ marginLeft: 20 }}>{usuario.cargo}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ minWidth: 100, textAlign: "left" }}>
                Email:
              </strong>
              <span style={{ marginLeft: 20 }}>{usuario.email}</span>
            </div>
          </div>
        </div>

        {/* Seção de Upload */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#fff",
                textAlign: "left",
                flex: "0 0 auto",
              }}
            >
              Adicionar Documento
            </h3>
            <button
              className="btn-gradient"
              style={{ flex: "0 0 auto" }}
              onClick={() => {
                setShowUpload(!showUpload);
                setUploadFile(null);
              }}
            >
              {showUpload ? "Cancelar" : "Novo Documento"}
            </button>
          </div>

          {showUpload && (
            <form
              onSubmit={handleUpload}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                background: "#222a",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 2px 8px #0002",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{
                    color: "#fff",
                    flex: 1,
                    minWidth: 250,
                  }}
                />

                {uploadFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#fff",
                    }}
                  >
                    <span
                      style={{
                        background: "#00c6ff",
                        color: "#222",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {getFileTypeLabel(uploadFile.name)}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {uploadFile.name}
                    </span>
                  </div>
                )}

                <button
                  className="btn-gradient"
                  type="submit"
                  disabled={uploading || !uploadFile}
                  style={{
                    minWidth: 140,
                    opacity: !uploadFile || uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? "Enviando..." : "Enviar Documento"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Lista de Documentos */}
        <div>
          <h3 style={{ marginBottom: 16, color: "#fff" }}>
            Documentos ({documentos.length})
          </h3>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#ccc",
              }}
            >
              Carregando documentos...
            </div>
          ) : documentos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#222a",
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: "0 1px 4px #0002",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        background: "#00c6ff",
                        color: "#222",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontWeight: 600,
                        fontSize: 11,
                        minWidth: 50,
                        textAlign: "center",
                      }}
                    >
                      {getFileTypeLabel(doc.nome_arquivo)}
                    </span>
                    <span
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        wordBreak: "break-all",
                      }}
                    >
                      {doc.nome_arquivo}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-gradient"
                      style={{
                        fontSize: 14,
                        padding: "8px 16px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                      onClick={() => window.open(doc.url_arquivo, "_blank")}
                    >
                      Abrir
                    </button>
                    <button
                      className="btn-gradient"
                      style={{
                        fontSize: 14,
                        padding: "8px 16px",
                        background:
                          "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                      }}
                      onClick={() => handleRemoverDocumento(doc.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#ccc",
                background: "#222a",
                borderRadius: 8,
                fontStyle: "italic",
              }}
            >
              Nenhum documento encontrado para este usuário.
            </div>
          )}
        </div>

        {/* Botão Voltar */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button
            className="btn-gradient"
            style={{ minWidth: 200 }}
            onClick={() => navigate(-1)}
          >
            Voltar para Administração
          </button>
        </div>
      </div>
    </div>
  );
}
