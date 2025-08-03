// src/pages/AtualizarSenha.jsx

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AtualizarSenha() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setErro("");
    
    const { error } = await supabase.auth.updateUser({ password: senha });
    
    setLoading(false);
    if (error) {
      setErro("Não foi possível atualizar a senha. O link pode ter expirado. Tente novamente.");
    } else {
      setMensagem("Senha atualizada com sucesso! Você já pode fazer o login.");
      setTimeout(() => navigate('/login'), 3000); // Redireciona para o login após 3 segundos
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleAtualizarSenha} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Defina sua Nova Senha</h2>
        
        {mensagem && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{mensagem}</p>}
        {erro && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{erro}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="senha">Nova Senha</label>
          <input id="senha" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full p-2 border rounded-md" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmarSenha">Confirmar Nova Senha</label>
          <input id="confirmarSenha" type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full p-2 border rounded-md" required />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400">
          {loading ? "Atualizando..." : "Atualizar Senha"}
        </button>
      </form>
    </div>
  );
}
