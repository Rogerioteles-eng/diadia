// src/pages/Habitos.jsx

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PlusIcon, PencilIcon, ArchiveBoxIcon, XMarkIcon, CalendarDaysIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../components/Button'; // ✅ Importamos o Button

// ... (O componente HistoricoModal continua o mesmo)
function HistoricoModal({ habito, onClose }) {
  const [checks, setChecks] = useState([]);
  const [mesVisivel, setMesVisivel] = useState(new Date());

  useEffect(() => {
    async function carregarChecks() {
      const primeiroDiaDoMes = startOfMonth(mesVisivel);
      const ultimoDiaDoMes = endOfMonth(mesVisivel);
      const { data } = await supabase.from('habitos_check').select('data').eq('habito_id', habito.id)
        .gte('data', format(primeiroDiaDoMes, 'yyyy-MM-dd'))
        .lte('data', format(ultimoDiaDoMes, 'yyyy-MM-dd'));
      setChecks((data || []).map(c => c.data));
    }
    carregarChecks();
  }, [habito.id, mesVisivel]);

  const primeiroDiaDoMes = startOfMonth(mesVisivel);
  const ultimoDiaDoMes = endOfMonth(mesVisivel);
  const diasDoMes = eachDayOfInterval({ start: primeiroDiaDoMes, end: ultimoDiaDoMes });
  const diasParaPreencher = getDay(primeiroDiaDoMes);
  const podeAvancarMes = endOfMonth(mesVisivel) < startOfMonth(new Date());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{habito.nome}</h3>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6"/></button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setMesVisivel(m => addMonths(m, -1))}><ChevronLeftIcon className="h-5 w-5"/></button>
          <p className="text-center font-semibold">{format(mesVisivel, 'MMMM yyyy', { locale: ptBR })}</p>
          <button onClick={() => setMesVisivel(m => addMonths(m, 1))} disabled={!podeAvancarMes} className="disabled:opacity-25"><ChevronRightIcon className="h-5 w-5"/></button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => <div key={dia}>{dia}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {Array.from({ length: diasParaPreencher }).map((_, i) => <div key={`empty-${i}`}></div>)}
          {diasDoMes.map(dia => {
            const isCompleto = checks.some(check => isSameDay(new Date(check), dia));
            return (
              <div key={dia.toString()} className={`h-8 w-8 rounded-full flex items-center justify-center ${isCompleto ? 'bg-green-500 text-white' : 'bg-gray-200'} ${isToday(dia) ? 'ring-2 ring-blue-500' : ''}`}>
                {format(dia, 'd')}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}


export default function Habitos() {
  const [habitos, setHabitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [historicoVisivel, setHistoricoVisivel] = useState(null);
  const [modoExibicao, setModoExibicao] = useState('ativos');
  const [statsArquivados, setStatsArquivados] = useState({});

  const hoje = new Date();
  const hojeFormatado = format(hoje, 'yyyy-MM-dd');
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });

  // ... (Todas as funções lógicas continuam as mesmas)
  async function carregarHabitos() { setLoading(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setLoading(false); return; }; const isAtivo = modoExibicao === 'ativos'; let query = supabase.from("habitos").select(`*, habitos_check ( data, habito_id )`).eq('user_id', user.id).eq('ativo', isAtivo); if (isAtivo) { query = query.gte('habitos_check.data', format(inicioSemana, 'yyyy-MM-dd')).lte('habitos_check.data', format(endOfWeek(hoje), 'yyyy-MM-dd')); } const { data, error } = await query.order("created_at", { ascending: true }); if (error) console.error("Erro ao carregar hábitos:", error.message); else setHabitos(data || []); if (!isAtivo && data) { const statsPromises = data.map(async (habito) => { const { count } = await supabase.from('habitos_check').select('id', { count: 'exact', head: true }).eq('habito_id', habito.id); return { habitoId: habito.id, count }; }); const statsResults = await Promise.all(statsPromises); const statsMap = statsResults.reduce((acc, curr) => { acc[curr.habitoId] = curr.count; return acc; }, {}); setStatsArquivados(statsMap); } setLoading(false); }
  useEffect(() => { carregarHabitos(); }, [modoExibicao]);
  async function handleSaveHabito(nome) { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; if (editando) { await supabase.from("habitos").update({ nome }).match({ id: editando.id, user_id: user.id }); } else { await supabase.from("habitos").insert({ nome, user_id: user.id }); } setEditando(null); setAdicionando(false); carregarHabitos(); }
  async function toggleCheckHoje(habito) { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const isFeitoHoje = habito.habitos_check.some(c => c.data === hojeFormatado); if (isFeitoHoje) { await supabase.from("habitos_check").delete().match({ habito_id: habito.id, data: hojeFormatado, user_id: user.id }); } else { await supabase.from("habitos_check").insert({ habito_id: habito.id, data: hojeFormatado, user_id: user.id }); } carregarHabitos(); }
  async function handleArquivarHabito(habitoId) { if (window.confirm("Arquivar este hábito? Ele sumirá da lista principal, mas seu histórico será mantido.")) { await supabase.from("habitos").update({ ativo: false, arquivado_em: new Date().toISOString() }).eq("id", habitoId); carregarHabitos(); } }
  async function handleRestaurarHabito(habitoId) { await supabase.from("habitos").update({ ativo: true, arquivado_em: null }).eq("id", habitoId); carregarHabitos(); }
  async function handleExcluirPermanentemente(habitoId) { if (window.confirm("EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.")) { await supabase.from("habitos").delete().eq("id", habitoId); carregarHabitos(); } }
  const calcularProgressoSemanal = (habito) => { const diasPassadosNaSemana = differenceInDays(hoje, inicioSemana) + 1; const checksDaSemana = habito.habitos_check.length; return `${checksDaSemana}/${diasPassadosNaSemana}`; };
  if (loading) return <div>Carregando hábitos...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{modoExibicao === 'ativos' ? 'Meus Hábitos Diários' : 'Hábitos Arquivados'}</h1>
        <div className="flex p-1 bg-gray-200 rounded-lg">
          <button onClick={() => setModoExibicao('ativos')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'ativos' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Ativos</button>
          <button onClick={() => setModoExibicao('arquivados')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'arquivados' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Arquivados</button>
        </div>
      </div>

      {modoExibicao === 'ativos' && (
        <div className="mb-8">
          {adicionando || editando ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveHabito(e.target.nome.value); }} className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">{editando ? 'Editar Hábito' : 'Adicionar Novo Hábito'}</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input name="nome" type="text" placeholder="Ex: Meditar por 5 minutos" defaultValue={editando?.nome || ''} className="flex-1 p-2 border rounded-md" autoFocus />
                <div className="flex gap-2">
                  {/* ✅ Botões substituídos */}
                  <Button type="submit" variant="confirm">Salvar</Button>
                  <Button type="button" variant="secondary" onClick={() => { setAdicionando(false); setEditando(null); }}>Cancelar</Button>
                </div>
              </div>
            </form>
          ) : (
            // ✅ Botão substituído
            <Button onClick={() => setAdicionando(true)} variant="primary">
              <PlusIcon className="h-5 w-5" /> Adicionar Hábito
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* ... (O resto do JSX continua o mesmo, pois os outros botões são de ícone e já são componentes) ... */}
        {habitos.map(habito => {
          const isFeitoHoje = modoExibicao === 'ativos' && habito.habitos_check.some(c => c.data === hojeFormatado);
          return (
            <div key={habito.id} className="bg-white p-5 rounded-lg shadow-md">
              {modoExibicao === 'ativos' ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 sm:mb-0">{habito.nome}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCheckHoje(habito)} className={`w-32 text-center py-2 text-sm font-semibold rounded-md transition-colors ${isFeitoHoje ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {isFeitoHoje ? 'Feito Hoje!' : 'Marcar Hoje'}
                      </button>
                      <button onClick={() => setEditando(habito)} className="p-2 text-gray-500 hover:text-blue-600" title="Editar"><PencilIcon className="h-5 w-5"/></button>
                      <button onClick={() => handleArquivarHabito(habito.id)} className="p-2 text-gray-500 hover:text-red-600" title="Arquivar"><ArchiveBoxIcon className="h-5 w-5"/></button>
                      <button onClick={() => setHistoricoVisivel(habito)} className="p-2 text-gray-500 hover:text-green-600" title="Ver Histórico"><CalendarDaysIcon className="h-5 w-5"/></button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600">Progresso Semanal: <span className="font-bold text-blue-600">{calcularProgressoSemanal(habito)}</span></p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 italic">{habito.nome}</span>
                    {habito.arquivado_em && habito.created_at && statsArquivados[habito.id] !== undefined && (
                      <p className="text-xs text-gray-400">
                        {`Concluído em ${statsArquivados[habito.id]} de ${differenceInDays(new Date(habito.arquivado_em), new Date(habito.created_at)) + 1} dias ativos.`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHistoricoVisivel(habito)} className="p-2 text-gray-500 hover:text-green-600" title="Ver Histórico"><CalendarDaysIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleRestaurarHabito(habito.id)} className="p-2 text-gray-500 hover:text-blue-600" title="Restaurar"><ArrowPathIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleExcluirPermanentemente(habito.id)} className="p-2 text-gray-500 hover:text-red-600" title="Excluir Permanentemente"><XMarkIcon className="h-5 w-5"/></button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {habitos.length === 0 && !adicionando && !editando && ( <div className="text-center py-10 bg-gray-50 rounded-lg"> <p className="text-gray-500">Nenhum hábito encontrado nesta visualização.</p> </div> )}
      {historicoVisivel && <HistoricoModal habito={historicoVisivel} onClose={() => setHistoricoVisivel(null)} />}
    </>
  );
}