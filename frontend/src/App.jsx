import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Páginas
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import TelaColaborador from "./pages/TelaColaborador";
import TelaAdministrador from "./pages/TelaAdministrador";
import EditarPerfil from "./pages/EditarPerfil";
import GerenciarDocumentos from "./pages/GerenciarDocumentos";
import FolhaPagamento from "./pages/FolhaPagamento"; // 🔥 nova página
import HistoricoPontos from "./pages/HistoricoPontos"; // nova página de histórico de pontos

// CSS global e específico
import "./styles/index.css";
import "./styles/app.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/colaborador" element={<TelaColaborador />} />
        <Route path="/administrador" element={<TelaAdministrador />} />
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/gerenciar-documentos" element={<GerenciarDocumentos />} />
        <Route path="/folha-pagamento" element={<FolhaPagamento />} /> {/* 🔥 rota nova */}
        <Route path="/historico-pontos" element={<HistoricoPontos />} />
      </Routes>
    </Router>
  );
}
