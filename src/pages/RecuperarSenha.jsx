// src/pages/RecuperarSenha.jsx

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecuperacao = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/atualizar-senha', // ⚠️ Mude para a URL do seu site em produção!
    });

    setLoading(false);
    if (error) {
      setErro("Não foi possível enviar o e-mail de recuperação. Verifique o endereço digitado.");
    } else {
      setMensagem("Se uma conta com este e-mail existir, um link de recuperação foi enviado.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleRecuperacao} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Recuperar Senha</h2>
        
        {mensagem && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-4">{mensagem}</p>}
        {erro && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{erro}</p>}

        <p className="text-gray-600 mb-4 text-sm">Digite seu e-mail e enviaremos um link para você voltar a acessar sua conta.</p>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md" required />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400">
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
        <p className="mt-4 text-sm text-center">
          Lembrou a senha? <Link to="/login" className="text-blue-500 hover:underline">Voltar para o Login</Link>
        </p>
      </form>
    </div>
  );
}