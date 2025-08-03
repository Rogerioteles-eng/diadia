// src/pages/Painel.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { CheckCircleIcon, ClipboardDocumentIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function Painel() {
  const [stats, setStats] = useState({ concluidos: 0, total: 0, tarefas: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuário");
  const [frase, setFrase] = useState({ texto: "Carregando frase...", autor: "" });

  const hojeFormatado = new Date().toISOString().slice(0, 10);
  const fraseFallback = { texto: "A jornada de mil milhas começa com um único passo.", autor: "Lao Tsé" };

  async function carregarPainel() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name;
        if (fullName) setUserName(fullName.split(' ')[0]);
        else if (user.email) setUserName(user.email.split('@')[0]);
      }
      
      const [habitosRes, checksRes, tarefasRes, fraseRes] = await Promise.allSettled([
        supabase.from("habitos").select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('ativo', true),
        supabase.from("habitos_check").select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq("data", hojeFormatado),
        supabase.from("tarefas").select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq("ativo", true).eq("concluida", false),
        supabase.functions.invoke('frase-do-dia'),
      ]);

      if (fraseRes.status === 'fulfilled' && !fraseRes.value.error) {
        setFrase({ texto: fraseRes.value.data[0].q, autor: fraseRes.value.data[0].a });
      } else { setFrase(fraseFallback); }

      setStats({
        concluidos: checksRes.status === 'fulfilled' ? (checksRes.value.count || 0) : 0,
        total: habitosRes.status === 'fulfilled' ? (habitosRes.value.count || 0) : 0,
        tarefas: tarefasRes.status === 'fulfilled' ? (tarefasRes.value.count || 0) : 0,
      });

    } catch (error) {
      console.error("Erro ao carregar o painel:", error);
      setFrase(fraseFallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarPainel(); }, []);

  if (loading) return <div>Carregando seu painel...</div>;
  const progressoHabitos = stats.total > 0 ? (stats.concluidos / stats.total) * 100 : 0;

  return (
    <>
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Bom dia, {userName}!</h1>
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-8 shadow-sm">
        <p className="italic">"{frase.texto}"</p>
        <p className="text-right font-semibold mt-2">- {frase.autor}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/habitos" className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className="bg-green-100 p-3 rounded-full"><CheckCircleIcon className="h-8 w-8 text-green-600" /></div>
          <div><p className="text-gray-500 text-sm">Hábitos Concluídos</p><p className="text-2xl font-bold">{stats.concluidos} de {stats.total}</p><div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressoHabitos}%` }}></div></div></div>
        </Link>
        <Link to="/tarefas" className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className="bg-yellow-100 p-3 rounded-full"><ClipboardDocumentIcon className="h-8 w-8 text-yellow-600" /></div>
          <div><p className="text-gray-500 text-sm">Tarefas Pendentes</p><p className="text-2xl font-bold">{stats.tarefas}</p></div>
        </Link>
        <Link to="/tarefas" state={{ abrirFormulario: true }} className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 p-3 rounded-full"><PlusIcon className="h-8 w-8 text-blue-600" /></div>
            <div><p className="text-gray-500 text-sm">Ação Rápida</p><p className="text-xl font-bold text-blue-600">Adicionar Tarefa</p></div>
        </Link>
      </div>
    </>
  );
}