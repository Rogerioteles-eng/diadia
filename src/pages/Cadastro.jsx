// src/pages/Cadastro.jsx

import { useState } from "react";
import { cadastrar } from "../auth";
import { useNavigate, Link } from "react-router-dom";

export default function Cadastro() {
  const [nome, setNome] = useState(""); // ✅ NOVO: Estado para o nome
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Por favor, preencha seu nome.");
      return;
    }
    // ✅ ALTERADO: Passando o 'nome' para a função cadastrar
    const { error } = await cadastrar(email, senha, nome); 
    if (error) {
      setErro("Erro ao cadastrar. Verifique os dados ou tente outro email.");
    } else {
      navigate("/painel"); // Redireciona para o painel após o sucesso
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleCadastro} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Crie sua Conta</h2>
        {erro && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{erro}</p>}
        
        {/* ✅ NOVO: Campo de input para o Nome */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
          Cadastrar
        </button>
        <p className="mt-4 text-sm text-center">
          Já tem conta? <Link to="/login" className="text-blue-500 hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
}