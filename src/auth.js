// src/auth.js

import { supabase } from './supabaseClient';

// Função de Cadastro
export async function cadastrar(email, senha, nome) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        // As informações aqui são salvas no 'user_metadata' do usuário
        full_name: nome,
      },
    },
  });
  return { data, error };
}

// Função de Login
export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  return { data, error };
}

// Função de Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { error };
}