// src/pages/Tarefas.jsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { PlusIcon, CheckIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { format, addDays, isToday, isPast, parseISO, getDay, nextDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prioridadesMap = {
  UI: { icon: '🔥', titulo: "Urgente e Importante", cor: "bg-red-100 border-red-500", textoCor: "text-red-800" },
  NUI: { icon: '📅', titulo: "Não Urgente e Importante", cor: "bg-blue-100 border-blue-500", textoCor: "text-blue-800" },
  UNI: { icon: '⚠️', titulo: "Urgente e Não Importante", cor: "bg-yellow-100 border-yellow-500", textoCor: "text-yellow-800" },
  NUNI: { icon: '🗑️', titulo: "Não Urgente e Não Importante", cor: "bg-gray-100 border-gray-400", textoCor: "text-gray-700" },
};
const diasDaSemana = [ { id: 1, label: 'S' }, { id: 2, label: 'T' }, { id: 3, label: 'Q' }, { id: 4, 'label': 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }];

function TarefaForm({ tarefaInicial, onSave, onCancel }) {
  const [tarefa, setTarefa] = useState({ nome: "", prioridade: "UI", due_date: "", recurrence_pattern: null, recurrence_end_date: null, ...tarefaInicial });
  const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState([]);

  useEffect(() => {
    if (tarefaInicial?.recurrence_pattern) {
      if (tarefaInicial.recurrence_pattern === 'daily') { setDiasSemanaSelecionados([1, 2, 3, 4, 5, 6, 0]); } 
      else if (tarefaInicial.recurrence_pattern.startsWith('weekly-')) {
        const dias = tarefaInicial.recurrence_pattern.split('-').slice(1).map(Number); setDiasSemanaSelecionados(dias);
      }
    }
  }, [tarefaInicial]);

  const handleDayToggle = (dayId) => { const novosDias = diasSemanaSelecionados.includes(dayId) ? diasSemanaSelecionados.filter(d => d !== dayId) : [...diasSemanaSelecionados, dayId]; setDiasSemanaSelecionados(novosDias.sort((a,b) => a - b)); };
  const handleSubmit = (e) => { e.preventDefault(); let pattern = null; if (diasSemanaSelecionados.length > 0) { pattern = diasSemanaSelecionados.length === 7 ? 'daily' : `weekly-${diasSemanaSelecionados.join('-')}`; } onSave({ ...tarefa, recurrence_pattern: pattern }); };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-semibold mb-4">{tarefa.id ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Nome da tarefa" defaultValue={tarefa.nome} onChange={(e) => setTarefa({ ...tarefa, nome: e.target.value })} className="w-full p-2 border rounded-md" autoFocus />
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={tarefa.prioridade} onChange={(e) => setTarefa({ ...tarefa, prioridade: e.target.value })} className="flex-1 p-2 border rounded-md bg-white">
            <option value="UI">🔥 Urgente e Importante</option><option value="NUI">📅 Não Urgente e Importante</option><option value="UNI">⚠️ Urgente e Não Importante</option><option value="NUNI">🗑️ Não Urgente e Não Importante</option>
          </select>
          <input type="date" defaultValue={tarefa.due_date} onChange={(e) => setTarefa({ ...tarefa, due_date: e.target.value })} className="w-full sm:w-48 p-2 border rounded-md" />
        </div>
        <div className="space-y-2 pt-2">
          <label className="block text-sm font-medium text-gray-700">Repetir nos dias:</label>
          <div className="flex justify-center gap-2 p-2 bg-gray-50 rounded-md">{diasDaSemana.map(dia => (<button type="button" key={dia.id} onClick={() => handleDayToggle(dia.id)} className={`w-8 h-8 rounded-full font-bold text-sm transition-colors ${diasSemanaSelecionados.includes(dia.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{dia.label}</button>))}</div>
          {diasSemanaSelecionados.length > 0 && (<div className="pt-2"><label className="block text-sm font-medium text-gray-700">Até a data (opcional):</label><input type="date" defaultValue={tarefa.recurrence_end_date} onChange={e => setTarefa({ ...tarefa, recurrence_end_date: e.target.value })} className="w-full sm:w-48 p-2 border rounded-md" title="Data final da recorrência" /></div>)}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Salvar</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [tarefasHoje, setTarefasHoje] = useState([]);
  const [tarefasFuturas, setTarefasFuturas] = useState({ UI: [], NUI: [], UNI: [], NUNI: [] });
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoExibicao, setModoExibicao] = useState('ativas');
  const location = useLocation();

  useEffect(() => { if (location.state?.abrirFormulario) { setEditando({}); } }, [location.state]);
  useEffect(() => { carregarTarefas(); }, [modoExibicao]);

  async function carregarTarefas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; };
    const isAtivo = modoExibicao === 'ativas';
    
    // ✅ ALTERADO: A query agora ordena por 'due_date' primeiro
    const { data, error } = await supabase.from("tarefas").select("*").eq('user_id', user.id).eq('ativo', isAtivo)
      .order("due_date", { ascending: true, nullsLast: true })
      .order("created_at", { ascending: true });

    if (error) { console.error("Erro ao carregar tarefas:", error.message); } else {
      const hoje = new Date();
      setTarefas(data || []);
      if(isAtivo) {
        const paraHoje = (data || []).filter(t => t.due_date && (isToday(parseISO(t.due_date)) || isPast(parseISO(t.due_date))));
        const futuras = (data || []).filter(t => !t.due_date || (!isToday(parseISO(t.due_date)) && !isPast(parseISO(t.due_date))));
        setTarefasHoje(paraHoje);
        setTarefasFuturas(futuras.reduce((acc, tarefa) => { acc[tarefa.prioridade] = [...(acc[tarefa.prioridade] || []), tarefa]; return acc; }, { UI: [], NUI: [], UNI: [], NUNI: [] }));
      }
    }
    setLoading(false);
  }

  async function handleSave(tarefa) {
    const { data: { user } } = await supabase.auth.getUser();
    const tarefaParaSalvar = { ...tarefa, due_date: tarefa.due_date || format(new Date(), 'yyyy-MM-dd'), recurrence_end_date: tarefa.recurrence_end_date || null, user_id: user.id };
    if (!tarefaParaSalvar.id) delete tarefaParaSalvar.id;
    if (tarefa.id) { await supabase.from("tarefas").update(tarefaParaSalvar).eq("id", tarefa.id); } 
    else { await supabase.from("tarefas").insert(tarefaParaSalvar); }
    setEditando(null); carregarTarefas();
  }

  async function handleConcluirTarefa(tarefa) {
    if (tarefa.recurrence_pattern && tarefa.recurrence_pattern !== 'none') {
        const dias = tarefa.recurrence_pattern === 'daily' ? [0,1,2,3,4,5,6] : tarefa.recurrence_pattern.split('-').slice(1).map(Number);
        let proximoVencimento = parseISO(tarefa.due_date);
        let encontrouProximo = false;
        for (let i = 1; i <= 7; i++) {
            let proximoDia = addDays(proximoVencimento, i);
            if (dias.includes(getDay(proximoDia))) { proximoVencimento = proximoDia; encontrouProximo = true; break; }
        }
        if (!encontrouProximo && dias.length > 0) {
          let diaParaProcurar = dias[0];
          proximoVencimento = nextDay(proximoVencimento, diaParaProcurar);
        }
        if (tarefa.recurrence_end_date && proximoVencimento > parseISO(tarefa.recurrence_end_date)) {
            await supabase.from("tarefas").update({ concluida: true, ativo: false }).eq("id", tarefa.id);
        } else {
            await supabase.from("tarefas").update({ due_date: format(proximoVencimento, 'yyyy-MM-dd') }).eq("id", tarefa.id);
        }
    } else {
      await supabase.from("tarefas").update({ concluida: true, ativo: false }).eq("id", tarefa.id);
    }
    carregarTarefas();
  }

  async function handleArquivarTarefa(tarefaId) { await supabase.from("tarefas").update({ ativo: false }).eq("id", tarefaId); carregarTarefas(); }
  async function handleRestaurarTarefa(tarefaId) { await supabase.from("tarefas").update({ ativo: true }).eq("id", tarefaId); carregarTarefas(); }
  async function handleExcluirPermanentemente(tarefaId) { if (window.confirm("EXCLUIR PERMANENTEMENTE?")) { await supabase.from("tarefas").delete().eq("id", tarefaId); carregarTarefas(); } }
  
  if (loading) return <div>Carregando tarefas...</div>;
  
  const tarefasAgrupadas = (modoExibicao === 'ativas' ? tarefasFuturas : tarefas.reduce((acc, t) => { acc[t.prioridade] = [...(acc[t.prioridade] || []), t]; return acc; }, { UI: [], NUI: [], UNI: [], NUNI: [] }));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{modoExibicao === 'ativas' ? 'Minhas Tarefas' : 'Tarefas Arquivadas'}</h1>
        <div className="flex p-1 bg-gray-200 rounded-lg">
          <button onClick={() => setModoExibicao('ativas')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'ativas' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Ativas</button>
          <button onClick={() => setModoExibicao('arquivadas')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'arquivadas' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Arquivadas</button>
        </div>
      </div>
      
      {modoExibicao === 'ativas' && (editando !== null ? <TarefaForm tarefaInicial={editando} onSave={handleSave} onCancel={() => setEditando(null)} /> : <div className="mb-8"><button onClick={() => setEditando({})} className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"><PlusIcon className="h-5 w-5" /> Adicionar Tarefa</button></div>)}

      {modoExibicao === 'ativas' && <div className="mb-10"><h2 className="text-xl font-bold mb-4 text-gray-700">🎯 Para Hoje</h2><div className="bg-white p-4 rounded-lg shadow-md space-y-3">{tarefasHoje.length > 0 ? tarefasHoje.map(tarefa => (<div key={tarefa.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50"><div className="flex items-center gap-3"><span className="text-xl" title={prioridadesMap[tarefa.prioridade]?.titulo}>{prioridadesMap[tarefa.prioridade]?.icon}</span><p className="font-medium text-gray-800">{tarefa.nome}</p></div><div className="flex gap-1"><button onClick={() => handleConcluirTarefa(tarefa)} className="p-1.5 text-green-500 hover:bg-green-100 rounded-full" title="Concluir"><CheckIcon className="h-5 w-5"/></button><button onClick={() => setEditando(tarefa)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full" title="Editar"><PencilIcon className="h-5 w-5"/></button></div></div>)) : <p className="text-sm text-gray-400 italic p-2">Nenhuma tarefa para hoje.</p>}</div></div>}

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-700">{modoExibicao === 'ativas' ? '🗓️ Planejamento Futuro' : 'Tarefas Arquivadas'}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(prioridadesMap).map(key => (
            <div key={key} className={`border-t-4 p-4 rounded-lg shadow-md ${prioridadesMap[key].cor}`}>
              {/* ✅ ALTERADO: Removido o título de texto, deixando a interface mais limpa */}
              <div className="space-y-3">
                {(tarefasAgrupadas[key] || []).map(tarefa => (
                  <div key={tarefa.id} className="bg-white p-3 rounded-md shadow-sm">
                    {modoExibicao === 'ativas' ? (
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800 break-all pr-2">{tarefa.nome}</p>
                        <button onClick={() => setEditando(tarefa)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full flex-shrink-0" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className={`italic ${tarefa.concluida ? 'line-through text-gray-500' : 'text-gray-700'}`}>{tarefa.nome}</p>
                        <div className="flex gap-1">
                          <button onClick={() => handleRestaurarTarefa(tarefa.id)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-full" title="Restaurar"><ArrowUturnLeftIcon className="h-5 w-5"/></button>
                          <button onClick={() => handleExcluirPermanentemente(tarefa.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full" title="Excluir"><XMarkIcon className="h-5 w-5"/></button>
                        </div>
                      </div>
                    )}
                    {tarefa.due_date && (<div className="mt-2"><span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{format(parseISO(tarefa.due_date), 'dd/MM/yy', { locale: ptBR })}</span></div>)}
                  </div>
                ))}
                {(tarefasAgrupadas[key] || []).length === 0 && (<p className="text-sm text-gray-400 italic">Nenhuma tarefa aqui.</p>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}