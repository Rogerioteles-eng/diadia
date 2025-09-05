// src/pages/Tarefas.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { PlusIcon } from "@heroicons/react/24/solid";
import { toast } from 'react-toastify';
import { parseISO, isBefore, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

// Componente para um único item de tarefa
function TarefaItem({ tarefa, onToggle, onArchive }) {
  const [estaAtrasada, setEstaAtrasada] = useState(false);
  const [tempoAtraso, setTempoAtraso] = useState("");

  useEffect(() => {
    if (tarefa.data_conclusao && !tarefa.concluida) {
      const dataConclusao = parseISO(tarefa.data_conclusao);
      const hoje = new Date();
      
      // Zera as horas para comparar apenas as datas
      hoje.setHours(0, 0, 0, 0);

      if (isBefore(dataConclusao, hoje)) {
        setEstaAtrasada(true);
        setTempoAtraso(formatDistanceToNowStrict(dataConclusao, { 
          addSuffix: true, 
          locale: ptBR 
        }));
      } else {
        setEstaAtrasada(false);
      }
    } else {
      setEstaAtrasada(false);
    }
  }, [tarefa.data_conclusao, tarefa.concluida]);

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={tarefa.concluida}
          onChange={() => onToggle(tarefa.id, tarefa.concluida)}
          className="h-6 w-6 rounded-full text-teal-600 focus:ring-teal-500 border-gray-300"
        />
        <div>
          <p className={clsx("font-semibold text-lg", { 'text-gray-800': !estaAtrasada, 'text-red-600': estaAtrasada })}>
            {tarefa.nome}
          </p>
          {estaAtrasada && (
             <p className="text-sm text-red-500">
               Atrasada {tempoAtraso}
             </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onArchive(tarefa.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Arquivar tarefa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </button>
    </div>
  );
}


// Componente principal da página de Tarefas
export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState("");
  const [dataConclusao, setDataConclusao] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    fetchSession();
  }, []);

  const fetchTarefas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tarefas")
        .select("*")
        .eq("user_id", userId)
        .eq("arquivada", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTarefas(data);
    } catch (error) {
      toast.error("Erro ao buscar tarefas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);


  const adicionarTarefa = async (e) => {
    e.preventDefault();
    if (novaTarefa.trim() === "" || !dataConclusao) {
      toast.warn("Por favor, preencha o nome da tarefa e a data de conclusão.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tarefas")
        .insert([{ 
            nome: novaTarefa, 
            data_conclusao: dataConclusao,
            user_id: userId 
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setTarefas(prev => [...prev, data]);
      setNovaTarefa("");
      setDataConclusao("");
      toast.success("Tarefa adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar tarefa: " + error.message);
    }
  };

  const toggleConcluida = async (id, estadoAtual) => {
    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ concluida: !estadoAtual })
        .eq("id", id);
      
      if (error) throw error;

      setTarefas(prevTarefas =>
        prevTarefas.map(t =>
          t.id === id ? { ...t, concluida: !estadoAtual } : t
        )
      );
      toast.info(`Tarefa marcada como ${!estadoAtual ? 'concluída' : 'pendente'}.`);
    } catch (error) {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    }
  };

  const arquivarTarefa = async (id) => {
     if (!window.confirm("Tem certeza que deseja arquivar esta tarefa?")) {
        return;
    }
    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ arquivada: true })
        .eq("id", id);

      if (error) throw error;
      
      setTarefas(prev => prev.filter(t => t.id !== id));
      toast.success("Tarefa arquivada com sucesso.");
    } catch (error) {
      toast.error("Erro ao arquivar tarefa: " + error.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tarefas</h1>

      <form onSubmit={adicionarTarefa} className="mb-8 p-6 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="Adicionar nova tarefa..."
          value={novaTarefa}
          onChange={(e) => setNovaTarefa(e.target.value)}
          className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="date"
          value={dataConclusao}
          onChange={(e) => setDataConclusao(e.target.value)}
          className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button type="submit" className="w-full sm:w-auto bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
          <PlusIcon className="h-5 w-5" />
          <span>Adicionar</span>
        </button>
      </form>
      
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Carregando tarefas...</p>
        ) : (
          tarefas.map(tarefa => (
            <TarefaItem 
              key={tarefa.id} 
              tarefa={tarefa} 
              onToggle={toggleConcluida} 
              onArchive={arquivarTarefa} 
            />
          ))
        )}
        {!loading && tarefas.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhuma tarefa pendente. Adicione uma acima!</p>
        )}
      </div>
    </div>
  );
}