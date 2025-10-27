import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function FolhaPagamento() {
  const location = useLocation();
  const navigate = useNavigate();
  const usuarios = location.state?.usuarios || [];

  const [gerando, setGerando] = useState(false);
  const [folhaGerada, setFolhaGerada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [pagamentoEnviado, setPagamentoEnviado] = useState(false);

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:3000";

  // Busca benefícios reais de um colaborador
  const getBeneficiosUsuario = async (usuarioId) => {
    try {
      const res = await fetch(`${API_URL}/beneficios/${usuarioId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Erro ao buscar benefícios");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Calcula folha sem adicionais
  const calcularFolha = (usuario, beneficiosUsuario) => {
    const salarioBase = 2000;
    const beneficios = beneficiosUsuario.reduce(
      (total, b) => total + (b.valor || 0),
      0
    );
    const inss = salarioBase * 0.11;
    const irrf = salarioBase * 0.075;
    const faltas = usuario.faltas ? usuario.faltas * 50 : 0;
    const descontos = inss + irrf + faltas;
    const liquido = salarioBase + beneficios - descontos;

    return { salarioBase, beneficios, descontos, liquido };
  };

  // Gera folha puxando benefícios de cada usuário
  const gerarFolha = async () => {
    if (usuarios.length === 0) return;
    const start = performance.now(); // início da medição
    setGerando(true);

    try {
      const usuariosComBeneficios = await Promise.all(
        usuarios.map(async (u) => {
          const beneficios = await getBeneficiosUsuario(u.id);
          return { ...u, beneficios };
        })
      );

      const folha = usuariosComBeneficios.map((u) => {
        const f = calcularFolha(u, u.beneficios);
        return { usuario: u, ...f };
      });

      setFolhaGerada(folha);
      alert("Folha de pagamento gerada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar folha de pagamento.");
    } finally {
      setGerando(false);

      // Envia log de performance
      const end = performance.now();
      const tempo = end - start;
      fetch(`${API_URL}/logs/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tela: "FolhaPagamento",
          acao: "gerarFolha",
          tempoRespostaMs: tempo,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  };

  // Função para validar senha
  const validarSenha = async () => {
    try {
      const res = await fetch(`${API_URL}/usuario/validar-senha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) throw new Error("Erro ao validar senha");
      const data = await res.json();
      return data.valido;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Função para gerar CSV
  const gerarCSV = (folha) => {
    if (!folha || folha.length === 0) return "";

    const headers = [
      "Nome",
      "Email",
      "Pontos",
      "Salário Base",
      "Benefícios",
      "Descontos",
      "Valor Líquido",
    ];

    const linhas = folha.map((f) => [
      f.usuario.nome,
      f.usuario.email,
      f.usuario.pontos?.length || 0,
      f.salarioBase,
      f.beneficios,
      f.descontos,
      f.liquido,
    ]);

    return [headers, ...linhas].map((e) => e.join(",")).join("\n");
  };

  // Função para baixar CSV
  const downloadCSV = (csv, filename = "folha_pagamento.csv") => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Envio de pagamentos
  const enviarPagamentos = async () => {
    const start = performance.now(); // início da medição

    if (pagamentoEnviado) {
      alert("Pagamentos já foram enviados!");
      return;
    }
    if (!senha) {
      alert("Digite sua senha para confirmar o envio.");
      return;
    }
    const senhaValida = await validarSenha();
    if (!senhaValida) {
      alert("Senha incorreta! Tente novamente.");
      return;
    }

    try {
      const csv = gerarCSV(folhaGerada);
      downloadCSV(csv);

      alert("Pagamentos enviados com sucesso!");
      setPagamentoEnviado(true);
      setModalAberto(false);
      setSenha("");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar pagamentos.");
    } finally {
      // Envia log de performance
      const end = performance.now();
      const tempo = end - start;
      fetch(`${API_URL}/logs/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tela: "FolhaPagamento",
          acao: "enviarPagamentos",
          tempoRespostaMs: tempo,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  };

  return (
    <div
      className="cadastro-container"
      style={{ display: "flex", justifyContent: "center", padding: 20 }}
    >
      <div
        className="cadastro-card"
        style={{
          width: "95%",
          maxWidth: 1200,
          padding: 30,
          borderRadius: 12,
          background: "#222",
          color: "#fff",
          boxShadow: "0 4px 12px #0004",
        }}
      >
        <h2>Relatório de Folha de Pagamento</h2>

        {usuarios.length === 0 ? (
          <p>Nenhum usuário encontrado para gerar a folha.</p>
        ) : (
          <>
            <button
              style={{ marginBottom: 15 }}
              className="btn-gradient"
              onClick={gerarFolha}
              disabled={gerando}
            >
              {gerando ? "Gerando..." : "Gerar Folha de Pagamento"}
            </button>

            {folhaGerada && (
              <div
                style={{
                  marginTop: 20,
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px #0002",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    color: "#000",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    background: "#fff",
                  }}
                >
                  <thead style={{ background: "#ddd" }}>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Salário Base</th>
                      <th>Benefícios</th>
                      <th>Descontos</th>
                      <th>Valor Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folhaGerada.map((f) => (
                      <tr key={f.usuario.id} style={{ background: "#eee" }}>
                        <td>{f.usuario.nome}</td>
                        <td>{f.usuario.email}</td>
                        <td>R$ {f.salarioBase}</td>
                        <td>R$ {f.beneficios}</td>
                        <td>R$ {f.descontos}</td>
                        <td>R$ {f.liquido}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              style={{ marginTop: 20 }}
              className="btn-gradient"
              onClick={() => setModalAberto(true)}
              disabled={pagamentoEnviado || !folhaGerada}
            >
              {pagamentoEnviado ? "CSV gerado" : "Gerar CSV dos pagamentos"}
            </button>
          </>
        )}

        <button
          style={{ marginTop: 10 }}
          className="btn-gradient"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>

        {modalAberto && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 8,
                width: 300,
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#222" }}>Confirmar Envio de Pagamentos</h3>
              <p>Digite sua senha para confirmar:</p>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="btn-gradient" onClick={enviarPagamentos}>
                  Confirmar
                </button>
                <button
                  className="btn-gradient"
                  style={{ background: "#ccc", color: "#000" }}
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
