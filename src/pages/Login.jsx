// src/pages/Login.jsx

import { useState } from "react";
import { login } from "../auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await login(email, senha);
    if (error) {
      setErro("Email ou senha inválidos.");
    } else {
      navigate("/painel");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Entrar</h2>
        {erro && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{erro}</p>}

        {/* ... campos de email e senha ... */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="senha">Senha</label>
          <input id="senha" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full p-2 border rounded-md" required />
        </div>

        {/* ✅ NOVO: Link para recuperação de senha */}
        <div className="text-right mb-6">
          <Link to="/recuperar-senha" className="text-sm text-blue-500 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Entrar</button>
        <p className="mt-4 text-sm text-center">
          Não tem uma conta? <Link to="/cadastro" className="text-green-500 hover:underline">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}