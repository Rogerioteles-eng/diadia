// src/components/PrivateRoute.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Navigate } from 'react-router-dom';

// Um componente simples de "spinner" para a tela de carregamento
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
    </div>
  );
}

export default function PrivateRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pega a sessão atual do usuário
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    // Fica "ouvindo" por mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, []);

  // ✅ LÓGICA APRIMORADA:
  // Se estiver carregando, mostra o spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Se não estiver carregando e não houver sessão, redireciona para o login
  if (!session) {
    return <Navigate to="/login" />;
  }

  // Se não estiver carregando e houver sessão, mostra a página solicitada
  return children;
}