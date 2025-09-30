import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import TelaColaborador from "./pages/TelaColaborador";
import TelaAdministrador from "./pages/TelaAdministrador";
import EditarPerfil from "./pages/EditarPerfil";
import HistoricoPerfil from "./pages/HistoricoPerfil"; // adicionada

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
        <Route path="/historico-perfil" element={<HistoricoPerfil />} /> {/* adicionada */}
      </Routes>
    </Router>
  );
}
