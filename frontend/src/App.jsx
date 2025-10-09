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
import GerenciarBeneficios from "./pages/GerenciarBeneficios";
import FolhaPagamento from "./pages/FolhaPagamento"; 
import HistoricoPontos from "./pages/HistoricoPontos"; 
import HistoricoPerfil from "./pages/HistoricoPerfil";

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
  <Route path="/gerenciar-beneficios" element={<GerenciarBeneficios />} />
        <Route path="/folha-pagamento" element={<FolhaPagamento />} />
        <Route path="/historico-pontos" element={<HistoricoPontos />} />
        <Route path="/historico-perfil" element={<HistoricoPerfil />} />
      </Routes>
    </Router>
  );
}
