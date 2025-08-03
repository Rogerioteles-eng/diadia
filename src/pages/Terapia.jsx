// src/pages/Terapia.jsx

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PlusIcon, MinusIcon, XMarkIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const opcoesHumor = [ { valor: 'ótimo', label: '😊 Ótimo' }, { valor: 'bem', label: '🙂 Bem' }, { valor: 'normal', label: '😐 Normal' }, { valor: 'mal', label: '😕 Mal' }, { valor: 'péssimo', label: '😔 Péssimo' }];
const opcoesFoco = [ { valor: 'alto', label: '🎯 Alto' }, { valor: 'médio', label: '🚶‍♂️ Médio' }, { valor: 'baixo', label: '🌫️ Baixo' }];
const getLabel = (options, value) => options.find(o => o.valor === value)?.label || value;

function RegistroModal({ registro, onClose, onSave, onDelete }) {
    const [editando, setEditando] = useState(false);
    const [dadosEditados, setDadosEditados] = useState(registro);
    const handleSave = () => { onSave(dadosEditados); setEditando(false); };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Registro de {format(parseISO(registro.created_at), 'dd/MM/yyyy')}</h3><button onClick={onClose}><XMarkIcon className="h-6 w-6"/></button></div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">{editando ? ( <div className="flex flex-wrap gap-2">{opcoesHumor.map(({ valor, label }) => ( <button type="button" key={valor} onClick={() => setDadosEditados({...dadosEditados, humor: valor})} className={`px-3 py-1 text-xs rounded-full ${dadosEditados.humor === valor ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{label}</button>))}</div> ) : ( dadosEditados.humor && <span className="text-sm font-semibold">{getLabel(opcoesHumor, dadosEditados.humor)}</span> )}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">{editando ? ( <div className="flex flex-wrap gap-2">{opcoesFoco.map(({ valor, label }) => ( <button type="button" key={valor} onClick={() => setDadosEditados({...dadosEditados, foco: valor})} className={`px-3 py-1 text-xs rounded-full ${dadosEditados.foco === valor ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{label}</button>))}</div> ) : ( dadosEditados.foco && <span className="text-sm font-semibold">{getLabel(opcoesFoco, dadosEditados.foco)}</span> )}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-500">Sono</label>{editando ? <input type="number" step="0.5" value={dadosEditados.horas_sono || ''} onChange={e => setDadosEditados({...dadosEditados, horas_sono: e.target.value})} className="w-full p-2 border rounded-md"/> : <span className="text-lg font-semibold">😴 {dadosEditados.horas_sono || 0}h</span>}</div>
                    <div><label className="block text-sm font-medium text-gray-500">Água</label>{editando ? <input type="number" step="1" value={dadosEditados.copos_agua || ''} onChange={e => setDadosEditados({...dadosEditados, copos_agua: e.target.value})} className="w-full p-2 border rounded-md"/> : <span className="text-lg font-semibold">💧 {dadosEditados.copos_agua || 0} copos</span>}</div>
                </div>
                <div><label className="block text-sm font-medium text-gray-500">Anotações</label>{editando ? <textarea value={dadosEditados.anotacoes || ''} onChange={e => setDadosEditados({...dadosEditados, anotacoes: e.target.value})} className="w-full p-2 border rounded-md h-24"/> : <p className="text-gray-700 whitespace-pre-wrap">{dadosEditados.anotacoes || "Nenhuma anotação."}</p>}</div>
                <div className="flex gap-2 justify-end pt-4 border-t">{editando ? ( <> <button onClick={() => setEditando(false)} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button><button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md">Salvar</button> </> ) : ( <> <button onClick={() => onDelete(registro.id)} className="p-2 text-red-500"><TrashIcon className="h-5 w-5"/></button><button onClick={() => setEditando(true)} className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center gap-2"><PencilIcon className="h-5 w-5"/> Editar</button> </> )}</div>
            </div>
        </div>
    );
}

export default function Terapia() {
  const [registros, setRegistros] = useState([]);
  const [registroDeHoje, setRegistroDeHoje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesVisivel, setMesVisivel] = useState(new Date());
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [metaAgua] = useState(8);

  async function carregarRegistros() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const primeiroDia = format(startOfMonth(mesVisivel), 'yyyy-MM-dd');
    const ultimoDia = format(endOfMonth(mesVisivel), 'yyyy-MM-dd');
    const { data, error } = await supabase.from("registros_diarios").select("*").eq('user_id', user.id).gte('created_at', primeiroDia).lte('created_at', ultimoDia);
    
    if (error) { console.error("Erro ao carregar registros:", error); } 
    else {
      setRegistros(data || []);
      const hoje = new Date();
      // ✅ CORREÇÃO: Usa isSameDay para encontrar o registro de hoje de forma segura
      const registroDoDia = (data || []).find(r => isSameDay(parseISO(r.created_at), hoje));
      if (registroDoDia) {
        setRegistroDeHoje(registroDoDia);
      } else {
        setRegistroDeHoje({ id: null, humor: null, foco: null, anotacoes: "", horas_sono: "", copos_agua: 0 });
      }
    }
    setLoading(false);
  }

  useEffect(() => { carregarRegistros(); }, [mesVisivel]);
  
  // ✅ LÓGICA DE SALVAR SIMPLES E SEGURA
  async function handleSaveRegistro(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dadosParaSalvar = {
        humor: registroDeHoje.humor,
        foco: registroDeHoje.foco,
        horas_sono: registroDeHoje.horas_sono,
        copos_agua: registroDeHoje.copos_agua,
        anotacoes: registroDeHoje.anotacoes,
    };

    if (registroDeHoje.id) {
      // Se já existe um registro, ATUALIZA
      const { error } = await supabase.from("registros_diarios").update(dadosParaSalvar).eq('id', registroDeHoje.id);
      if (error) { alert("Erro ao atualizar o registro."); console.error(error); } 
      else { alert("Registro atualizado com sucesso!"); }
    } else {
      // Se não existe, CRIA um novo com a data de hoje
      const hojeFormatado = new Date().toISOString();
      const { error } = await supabase.from("registros_diarios").insert({ ...dadosParaSalvar, user_id: user.id, created_at: hojeFormatado });
      if (error) { alert("Erro ao salvar o registro."); console.error(error); } 
      else { alert("Registro salvo com sucesso!"); }
    }
    carregarRegistros();
  }

  async function handleUpdateRegistro(registroAtualizado) {
    const { id, ...dadosParaAtualizar } = registroAtualizado;
    await supabase.from("registros_diarios").update(dadosParaAtualizar).eq('id', id);
    setRegistroSelecionado(null);
    carregarRegistros();
  }

  async function handleDeleteRegistro(registroId) {
    if(window.confirm("Tem certeza que deseja excluir este registro?")){
        await supabase.from("registros_diarios").delete().eq('id', registroId);
        setRegistroSelecionado(null);
        carregarRegistros();
    }
  }
  
  if (loading || !registroDeHoje) return <div>Carregando...</div>;

  const progressoAgua = registroDeHoje.copos_agua > 0 ? (registroDeHoje.copos_agua / metaAgua) * 100 : 0;
  
  const primeiroDiaDoMes = startOfMonth(mesVisivel);
  const diasDoMes = eachDayOfInterval({ start: primeiroDiaDoMes, end: endOfMonth(mesVisivel) });
  const diasParaPreencher = getDay(primeiroDiaDoMes);
  const podeAvancarMes = endOfMonth(mesVisivel) < startOfDay(new Date());

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Diário de Bordo Emocional</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Registro de Hoje</h2>
        <form onSubmit={handleSaveRegistro} className="space-y-6">
            <div><label className="block font-medium text-gray-700 mb-2">Como você se sentiu hoje?</label><div className="flex flex-wrap gap-2">{opcoesHumor.map(({ valor, label }) => ( <button type="button" key={valor} onClick={() => setRegistroDeHoje({...registroDeHoje, humor: valor})} className={`px-4 py-2 text-sm rounded-full font-semibold transition-all duration-200 ${registroDeHoje.humor === valor ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{label}</button>))}</div></div>
            <div><label className="block font-medium text-gray-700 mb-2">Qual foi seu nível de foco?</label><div className="flex flex-wrap gap-2">{opcoesFoco.map(({ valor, label }) => ( <button type="button" key={valor} onClick={() => setRegistroDeHoje({...registroDeHoje, foco: valor})} className={`px-4 py-2 text-sm rounded-full font-semibold transition-all duration-200 ${registroDeHoje.foco === valor ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{label}</button>))}</div></div>
            <div className="pt-4"><label className="block font-medium text-gray-700 mb-2">😴 Horas de Sono (noite anterior)</label><input type="number" step="0.5" placeholder="Ex: 7.5" value={registroDeHoje.horas_sono || ''} onChange={(e) => setRegistroDeHoje({...registroDeHoje, horas_sono: e.target.value})} className="w-full sm:w-40 p-2 border rounded-md" /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><label className="font-medium text-gray-700">💧 Copos de Água (250ml)</label><span className="font-bold text-lg text-blue-600">{registroDeHoje.copos_agua} / {metaAgua}</span></div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4"><div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progressoAgua}%` }}></div></div>
              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => setRegistroDeHoje({...registroDeHoje, copos_agua: Math.max(0, registroDeHoje.copos_agua - 1)})} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><MinusIcon className="h-6 w-6"/></button>
                <button type="button" onClick={() => setRegistroDeHoje({...registroDeHoje, copos_agua: registroDeHoje.copos_agua + 1})} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"><PlusIcon className="h-6 w-6"/></button>
              </div>
            </div>
            <textarea placeholder="Anotações livres sobre o seu dia..." value={registroDeHoje.anotacoes || ''} onChange={(e) => setRegistroDeHoje({...registroDeHoje, anotacoes: e.target.value})} className="w-full p-2 border rounded-md h-24"/>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">Salvar Registro de Hoje</button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Seu Histórico</h2>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setMesVisivel(m => addMonths(m, -1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon className="h-5 w-5"/></button>
          <p className="text-center font-semibold">{format(mesVisivel, 'MMMM yyyy', { locale: ptBR })}</p>
          <button onClick={() => setMesVisivel(m => addMonths(m, 1))} disabled={!podeAvancarMes} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-25"><ChevronRightIcon className="h-5 w-5"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-bold border-b pb-2">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => <div key={dia}>{dia}</div>)}</div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {Array.from({ length: diasParaPreencher }).map((_, i) => <div key={`empty-${i}`}></div>)}
          {diasDoMes.map(dia => {
            const registroDoDia = registros.find(r => isSameDay(parseISO(r.created_at), dia));
            return (<div key={dia.toString()} className="flex justify-center items-center h-10"><button onClick={() => registroDoDia && setRegistroSelecionado(registroDoDia)} disabled={!registroDoDia} className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isToday(dia) ? 'ring-2 ring-blue-500' : ''} ${registroDoDia ? 'bg-green-200 text-green-800 hover:bg-green-300' : 'text-gray-400'}`}>{format(dia, 'd')}</button></div>)
          })}
        </div>
      </div>
      {registroSelecionado && ( <RegistroModal registro={registroSelecionado} onClose={() => setRegistroSelecionado(null)} onSave={handleUpdateRegistro} onDelete={handleDeleteRegistro} /> )}
    </>
  );
}