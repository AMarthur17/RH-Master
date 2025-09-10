import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cadastro from "./pages/cadastro";
import TelaAdministrador from "./pages/TelaAdministrador";
import TelaColaborador from "./pages/TelaColaborador";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* Tela inicial */}
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/admin" element={<TelaAdministrador />} />
        <Route path="/colaborador" element={<TelaColaborador />} />
      </Routes>
    </Router>
  );
}
