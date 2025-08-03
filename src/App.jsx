// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Logout from "./pages/Logout";
import Painel from "./pages/Painel";
import Habitos from "./pages/Habitos";
import Tarefas from "./pages/Tarefas";
import Metas from "./pages/Metas";
import Terapia from "./pages/Terapia";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
// ✅ NOVO: Importa as novas páginas
import RecuperarSenha from "./pages/RecuperarSenha";
import AtualizarSenha from "./pages/AtualizarSenha";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/logout" element={<Logout />} />
        {/* ✅ NOVO: Adiciona as rotas de recuperação */}
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/atualizar-senha" element={<AtualizarSenha />} />

        {/* Rotas Privadas com Layout Consistente */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/painel" replace />} />
          <Route path="painel" element={<Painel />} />
          <Route path="habitos" element={<Habitos />} />
          <Route path="tarefas" element={<Tarefas />} />
          <Route path="metas" element={<Metas />} />
          <Route path="terapia" element={<Terapia />} />
        </Route>

        {/* Rota para qualquer outro caminho não encontrado */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}