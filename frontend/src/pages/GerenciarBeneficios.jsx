import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/index.css";
import "../styles/app.css";
import { API_URL, getAuthHeaders } from "../services/api";

const initialForm = { tipo: "", valor: "", descricao: "" };

export default function GerenciarBeneficios() {
	const navigate = useNavigate();
	const location = useLocation();
	const usuario = location.state?.usuario;

	const [beneficios, setBeneficios] = useState([]);
	const [relatorio, setRelatorio] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loadingRelatorio, setLoadingRelatorio] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState(initialForm);
	const [salvando, setSalvando] = useState(false);
	const [editandoId, setEditandoId] = useState(null);

	const formatCurrency = (valor) => {
		const numero = Number(valor || 0);
		return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
	};

	const formatDate = (dataIso) => {
		if (!dataIso) return "-";
		return new Date(dataIso).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const resetForm = () => {
		setFormData(initialForm);
		setEditandoId(null);
	};

	const carregarRelatorio = async (usuarioId) => {
		try {
			setLoadingRelatorio(true);
							const response = await fetch(`${API_URL}/beneficios/${usuarioId}/relatorio`, {
								headers: getAuthHeaders(),
			});

			if (!response.ok) throw new Error("Erro ao carregar relatório");

			const data = await response.json();
			setRelatorio(data);
		} catch (error) {
			console.error(error);
			setRelatorio(null);
		} finally {
			setLoadingRelatorio(false);
		}
	};

	const carregarBeneficios = async () => {
		if (!usuario) return;

		try {
			setLoading(true);
							const response = await fetch(`${API_URL}/beneficios/${usuario.id}`, {
								headers: getAuthHeaders(),
			});

			if (!response.ok) throw new Error("Erro ao carregar benefícios");

			const data = await response.json();
			setBeneficios(data);
		} catch (error) {
			console.error(error);
			alert("Erro ao carregar benefícios do colaborador.");
		} finally {
			setLoading(false);
		}

			await carregarRelatorio(usuario.id);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!formData.tipo.trim()) {
			alert("Informe o tipo do benefício.");
			return;
		}

		const valorNumerico = formData.valor === "" ? 0 : Number(formData.valor);
		if (Number.isNaN(valorNumerico)) {
			alert("Valor inválido.");
			return;
		}

		const payload = {
			tipo: formData.tipo.trim(),
			valor: valorNumerico,
			descricao:
				formData.descricao && formData.descricao.trim() !== ""
					? formData.descricao.trim()
					: null,
		};

		const url = editandoId
			? `${API_URL}/beneficios/${editandoId}`
			: `${API_URL}/beneficios/${usuario.id}`;

		const method = editandoId ? "PUT" : "POST";

		try {
			setSalvando(true);
			const response = await fetch(url, {
				method,
				headers: {
					  "Content-Type": "application/json",
					  ...getAuthHeaders(),
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Erro ao salvar benefício");
			}

			alert(editandoId ? "Benefício atualizado com sucesso!" : "Benefício adicionado com sucesso!");
			resetForm();
			setShowForm(false);
			carregarBeneficios();
		} catch (error) {
			console.error(error);
			alert(error.message || "Erro ao salvar benefício.");
		} finally {
			setSalvando(false);
		}
	};

	const handleEditar = (beneficio) => {
		setShowForm(true);
		setEditandoId(beneficio.id);
		setFormData({
			tipo: beneficio.tipo,
			valor: beneficio.valor?.toString() ?? "",
			descricao: beneficio.descricao ?? "",
		});
	};

	const handleRemover = async (beneficioId) => {
		if (!window.confirm("Deseja realmente remover este benefício?")) return;

		try {
							const response = await fetch(`${API_URL}/beneficios/${beneficioId}`, {
								method: "DELETE",
								headers: getAuthHeaders(),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Erro ao remover benefício");
			}

			alert("Benefício removido com sucesso!");
			carregarBeneficios();
		} catch (error) {
			console.error(error);
			alert(error.message || "Erro ao remover benefício.");
		}
	};

	useEffect(() => {
		if (usuario) {
			carregarBeneficios();
		}
	}, [usuario]);

	if (!usuario) {
		return (
			<div className="cadastro-container">
				<div className="cadastro-card">
					<h2>Erro: Usuário não encontrado</h2>
					<button className="btn-gradient" onClick={() => navigate("/administrador")}>
						Voltar para Administração
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="cadastro-container page-beneficios-container">
			<div className="cadastro-card page-beneficios-card">
				<header style={{ marginBottom: 28 }}>
					<h1 style={{ margin: 0, fontSize: 32, color: "#fff" }}>Benefícios</h1>
					<p style={{ marginTop: 12, marginBottom: 0, fontSize: 18, color: "#ccc" }}>
						<strong style={{ color: "#00c6ff", letterSpacing: 0.4 }}>Nome:</strong>{" "}
						<span style={{ color: "#fff", fontWeight: 600 }}>{usuario.nome}</span>
					</p>
				</header>

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
						<h3 style={{ margin: 0, color: "#fff", textAlign: "left", flex: "0 0 auto" }}>
							{editandoId ? "Editar Benefício" : "Adicionar Benefício"}
						</h3>
						<button
							className="btn-gradient"
							style={{ flex: "0 0 auto" }}
							onClick={() => {
								if (showForm) {
									resetForm();
								}
								setShowForm(!showForm);
							}}
						>
							{showForm ? "Cancelar" : editandoId ? "Cancelar Edição" : "Novo Benefício"}
						</button>
					</div>

					{showForm && (
						<form
							onSubmit={handleSubmit}
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
							<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
								<div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 6 }}>
									<label style={{ color: "#fff" }} htmlFor="tipo">
										Tipo do Benefício
									</label>
									<input
										id="tipo"
										type="text"
										value={formData.tipo}
										onChange={(event) => setFormData((prev) => ({ ...prev, tipo: event.target.value }))}
										placeholder="Ex: Vale Refeição"
										required
									/>
								</div>

								<div style={{ flex: "0 0 160px", display: "flex", flexDirection: "column", gap: 6 }}>
									<label style={{ color: "#fff" }} htmlFor="valor">
										Valor (R$)
									</label>
									<input
										id="valor"
										type="number"
										step="0.01"
										value={formData.valor}
										onChange={(event) =>
											setFormData((prev) => ({ ...prev, valor: event.target.value }))
										}
										placeholder="0,00"
										min="0"
									/>
								</div>
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
								<label style={{ color: "#fff" }} htmlFor="descricao">
									Descrição
								</label>
								<textarea
									id="descricao"
									rows={3}
									value={formData.descricao}
									onChange={(event) =>
										setFormData((prev) => ({ ...prev, descricao: event.target.value }))
									}
									placeholder="Observações adicionais"
									style={{ resize: "vertical" }}
								/>
							</div>

							<div style={{ display: "flex", justifyContent: "flex-end" }}>
								<button
									className="btn-gradient"
									type="submit"
									disabled={salvando}
									style={{ minWidth: 160, opacity: salvando ? 0.6 : 1 }}
								>
									{salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Adicionar Benefício"}
								</button>
							</div>
						</form>
					)}
				</div>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 24,
						alignItems: "stretch",
						marginBottom: 24,
					}}
				>
					<section style={{ flex: "1 1 320px", minWidth: 280 }}>
						<h3 style={{ marginBottom: 16, color: "#fff" }}>Relatório de Benefícios</h3>
						{loadingRelatorio ? (
							<div style={{ textAlign: "center", color: "#ccc", padding: 24, background: "#222a", borderRadius: 12 }}>
								Gerando relatório...
							</div>
						) : relatorio ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 16,
									background: "#222a",
									borderRadius: 12,
									padding: 20,
									boxShadow: "0 1px 6px #0002",
								}}
							>
								<div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
									<div style={{ flex: "1 1 200px" }}>
										<strong style={{ color: "#00c6ff" }}>Total de Benefícios</strong>
										<p style={{ margin: "6px 0", color: "#fff", fontSize: 18 }}>
											{relatorio.total.quantidade}
										</p>
									</div>
									<div style={{ flex: "1 1 200px" }}>
										<strong style={{ color: "#00c6ff" }}>Valor Total</strong>
										<p style={{ margin: "6px 0", color: "#fff", fontSize: 18 }}>
											{formatCurrency(relatorio.total.valor)}
										</p>
									</div>
								</div>

								{relatorio.porTipo.length > 0 ? (
									<div style={{ overflowX: "auto" }}>
										<table style={{ width: "100%", color: "#fff", borderCollapse: "collapse" }}>
											<thead style={{ background: "#222c" }}>
												<tr>
													<th style={{ textAlign: "left", padding: "8px 12px" }}>Tipo</th>
													<th style={{ textAlign: "right", padding: "8px 12px" }}>Quantidade</th>
													<th style={{ textAlign: "right", padding: "8px 12px" }}>Valor Total</th>
												</tr>
											</thead>
											<tbody>
												{relatorio.porTipo.map((item) => (
													<tr key={item.tipo} style={{ background: "#2228" }}>
														<td style={{ padding: "8px 12px" }}>{item.tipo}</td>
														<td style={{ padding: "8px 12px", textAlign: "right" }}>{item.quantidade}</td>
														<td style={{ padding: "8px 12px", textAlign: "right" }}>{formatCurrency(item.valor)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<p style={{ color: "#ccc" }}>Nenhum benefício cadastrado para relatório.</p>
								)}
							</div>
						) : (
							<div style={{ textAlign: "center", color: "#ccc", padding: 24, background: "#222a", borderRadius: 12 }}>
								Não foi possível gerar o relatório.
							</div>
						)}
					</section>

					<section style={{ flex: "1 1 360px", minWidth: 320 }}>
						<h3 style={{ marginBottom: 16, color: "#fff" }}>
							Benefícios ({beneficios.length})
						</h3>

						{loading ? (
							<div
								style={{
									textAlign: "center",
									padding: 40,
									color: "#ccc",
									background: "#222a",
									borderRadius: 12,
								}}
							>
							Carregando benefícios...
						</div>
					) : beneficios.length > 0 ? (
							<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							{beneficios.map((beneficio) => (
								<div
									key={beneficio.id}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 12,
										background: "#222a",
										borderRadius: 8,
										padding: 16,
										boxShadow: "0 1px 4px #0002",
									}}
								>
									<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
										<div style={{ flex: "1 1 200px" }}>
											<strong style={{ color: "#00c6ff" }}>Tipo</strong>
											<p style={{ margin: "4px 0", color: "#fff" }}>{beneficio.tipo}</p>
										</div>
										<div style={{ flex: "0 0 160px" }}>
											<strong style={{ color: "#00c6ff" }}>Valor</strong>
											<p style={{ margin: "4px 0", color: "#fff" }}>
												{formatCurrency(beneficio.valor)}
											</p>
										</div>
										<div style={{ flex: "1 1 200px" }}>
											<strong style={{ color: "#00c6ff" }}>Criado em</strong>
											<p style={{ margin: "4px 0", color: "#fff" }}>{formatDate(beneficio.criado_em)}</p>
										</div>
									</div>

									{beneficio.descricao && (
										<div>
											<strong style={{ color: "#00c6ff" }}>Descrição</strong>
											<p style={{ margin: "4px 0", color: "#fff" }}>{beneficio.descricao}</p>
										</div>
									)}

									<div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
										<button
											className="btn-gradient"
											style={{ minWidth: 140 }}
											onClick={() => handleEditar(beneficio)}
										>
											Editar
										</button>
										<button
											className="btn-gradient"
											style={{ minWidth: 140, background: "#ff6b6b" }}
											onClick={() => handleRemover(beneficio.id)}
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
							}}
						>
							Nenhum benefício cadastrado para este colaborador.
						</div>
					)}
					</section>
				</div>

				<button
					style={{ marginTop: 32 }}
					className="btn-gradient"
					onClick={() => navigate(-1)}
				>
					Voltar
				</button>
			</div>
		</div>
	);
}
