// src/pages/Metas.jsx

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PlusIcon, ChevronDownIcon, ArchiveBoxIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { format, differenceInDays, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Componente Principal da Página de Metas ---
export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [novaMeta, setNovaMeta] = useState({ titulo: "", motivo: "", prazo: "" });
  const [metaExpandida, setMetaExpandida] = useState(null);
  const [novoMarco, setNovoMarco] = useState({ descricao: "", prazo: "" });
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [modoExibicao, setModoExibicao] = useState('ativas');
  
  // ✅ CORREÇÃO: A linha que faltava foi adicionada aqui.
  const [historicoVisivel, setHistoricoVisivel] = useState(null);

  async function carregarMetas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isAtivo = modoExibicao === 'ativas';
    const { data, error } = await supabase.from("metas").select(`*, marcos (*)`).eq('user_id', user.id).eq('ativo', isAtivo).order("prazo", { ascending: true, nullsFirst: false });
    if (error) console.error("Erro ao carregar metas:", error); else setMetas(data || []);
    setLoading(false);
  }

  useEffect(() => { carregarMetas(); }, [modoExibicao]);

  async function handleAdicionarMeta(e) {
    e.preventDefault();
    if (!novaMeta.titulo.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("metas").insert({ ...novaMeta, prazo: novaMeta.prazo || null, user_id: user.id });
    setNovaMeta({ titulo: "", motivo: "", prazo: "" });
    setAdicionando(false);
    carregarMetas();
  }

  async function handleAdicionarMarco(metaId, e) {
    e.preventDefault();
    if (!novoMarco.descricao.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("marcos").insert({ ...novoMarco, prazo: novoMarco.prazo || null, meta_id: metaId, user_id: user.id });
    setNovoMarco({ descricao: "", prazo: "" });
    carregarMetas();
  }

  async function toggleMarco(marco) {
    const { id, concluido } = marco;
    const novoStatus = !concluido;
    await supabase.from("marcos").update({
      concluido: novoStatus,
      concluido_em: novoStatus ? new Date().toISOString() : null
    }).eq("id", id);
    carregarMetas();
  }
  
  async function handleArquivarMeta(metaId) {
    if (window.confirm("Arquivar esta meta? Ela sumirá da lista principal, mas seu histórico será mantido.")) {
      await supabase.from("metas").update({ ativo: false, arquivado_em: new Date().toISOString() }).eq("id", metaId);
      carregarMetas();
    }
  }

  async function handleRestaurarMeta(metaId) {
    await supabase.from("metas").update({ ativo: true, arquivado_em: null }).eq("id", metaId);
    carregarMetas();
  }

  async function handleExcluirPermanentemente(metaId) {
    if (window.confirm("EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.")) {
      await supabase.from("metas").delete().eq("id", metaId);
      carregarMetas();
    }
  }

  const calcularProgresso = (meta) => {
    if (!meta.marcos || meta.marcos.length === 0) return 0;
    const concluidos = meta.marcos.filter(m => m.concluido).length;
    return (concluidos / meta.marcos.length) * 100;
  };

  const formatarContagemDias = (prazo) => {
    if (!prazo) return null;
    const dias = differenceInDays(parseISO(prazo), new Date());
    if (dias < -1) return <span className="font-bold text-red-500">Prazo esgotado</span>;
    if (dias === -1) return <span className="font-bold text-red-500">Terminou Ontem</span>;
    if (dias === 0) return <span className="font-bold text-yellow-500">Termina Hoje!</span>;
    if (dias === 1) return <span className="font-bold text-green-600">Termina Amanhã</span>;
    return <span className="font-bold text-green-600">Faltam {dias + 1} dias</span>;
  };

  if (loading) return <div>Carregando suas metas...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{modoExibicao === 'ativas' ? 'Minhas Metas' : 'Metas Arquivadas'}</h1>
        <div className="flex p-1 bg-gray-200 rounded-lg">
            <button onClick={() => setModoExibicao('ativas')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'ativas' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Ativas</button>
            <button onClick={() => setModoExibicao('arquivadas')} className={`px-3 py-1 text-sm font-semibold rounded-md ${modoExibicao === 'arquivadas' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Arquivadas</button>
        </div>
      </div>

      {modoExibicao === 'ativas' && (
        <div className="mb-8">
          {adicionando ? (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Criar Nova Meta</h2>
              <form onSubmit={handleAdicionarMeta} className="space-y-4">
                <input type="text" placeholder="Qual é o seu grande objetivo?" value={novaMeta.titulo} onChange={(e) => setNovaMeta({ ...novaMeta, titulo: e.target.value })} className="w-full p-2 border rounded-md" autoFocus />
                <textarea placeholder="Por que esta meta é importante para você?" value={novaMeta.motivo} onChange={(e) => setNovaMeta({ ...novaMeta, motivo: e.target.value })} className="w-full p-2 border rounded-md h-24" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prazo final para a meta (opcional):</label>
                  <input type="date" value={novaMeta.prazo} onChange={(e) => setNovaMeta({ ...novaMeta, prazo: e.target.value })} className="w-full sm:w-auto p-2 border rounded-md"/>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Salvar Meta</button>
                  <button type="button" onClick={() => setAdicionando(false)} className="flex-1 bg-gray-200 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                </div>
              </form>
            </div>
          ) : ( <button onClick={() => setAdicionando(true)} className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"> <PlusIcon className="h-5 w-5" /> Criar Nova Meta </button> )}
        </div>
      )}

      <div className="space-y-4">
        {metas.map(meta => {
          const progresso = calcularProgresso(meta);
          return (
            <div key={meta.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-bold ${modoExibicao === 'arquivadas' ? 'text-gray-500 italic' : 'text-gray-800'}`}>{meta.titulo}</h3>
                  <p className="text-sm text-gray-500 italic mt-1">"{meta.motivo}"</p>
                </div>
                {modoExibicao === 'ativas' ? (
                    <button onClick={() => handleArquivarMeta(meta.id)} className="p-2 text-gray-400 hover:text-red-500" title="Arquivar Meta"><ArchiveBoxIcon className="h-5 w-5"/></button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => handleRestaurarMeta(meta.id)} className="p-2 text-gray-400 hover:text-blue-500" title="Restaurar Meta"><ArrowPathIcon className="h-5 w-5"/></button>
                        <button onClick={() => handleExcluirPermanentemente(meta.id)} className="p-2 text-gray-400 hover:text-red-500" title="Excluir Permanentemente"><XMarkIcon className="h-5 w-5"/></button>
                    </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                 {meta.prazo && (<p className="text-sm text-gray-600">Prazo: {formatarContagemDias(meta.prazo)}</p>)}
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(progresso)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progresso}%` }}></div></div>
              </div>
              <button onClick={() => setMetaExpandida(metaExpandida === meta.id ? null : meta.id)} className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1">
                <span>{metaExpandida === meta.id ? 'Esconder' : 'Ver'} Marcos</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${metaExpandida === meta.id ? 'rotate-180' : ''}`} />
              </button>
              
              {metaExpandida === meta.id && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Marcos da Meta:</h4>
                  <ul className="space-y-3 mb-4">
                    {meta.marcos.map(marco => {
                      const concluidoAtrasado = marco.concluido && marco.prazo && parseISO(marco.concluido_em) > parseISO(marco.prazo) && !isSameDay(parseISO(marco.concluido_em), parseISO(marco.prazo));
                      return (
                        <li key={marco.id} className="flex items-start gap-3">
                          <input type="checkbox" checked={marco.concluido} onChange={() => toggleMarco(marco)} className="h-5 w-5 mt-1 rounded text-blue-600"/>
                          <div>
                            <span className={marco.concluido ? 'line-through text-gray-500' : ''}>{marco.descricao}</span>
                            <div className="text-xs flex items-center gap-4 mt-1">
                              {marco.prazo && <span className="text-gray-500">Prazo: {format(parseISO(marco.prazo), 'dd/MM/yy', { locale: ptBR })}</span>}
                              {marco.concluido && ( concluidoAtrasado ? <span className="font-semibold text-red-500">Atrasado</span> : <span className="font-semibold text-green-600">No Prazo</span>)}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  {modoExibicao === 'ativas' && (
                    <form onSubmit={(e) => handleAdicionarMarco(meta.id, e)} className="space-y-2">
                      <input type="text" placeholder="Descrição do novo marco" onChange={(e) => setNovoMarco({ ...novoMarco, descricao: e.target.value})} className="w-full p-2 border rounded-md"/>
                      <div className="flex items-center gap-2">
                        <input type="date" onChange={(e) => setNovoMarco({ ...novoMarco, prazo: e.target.value})} className="w-full sm:w-auto p-2 border rounded-md"/>
                        <button type="submit" className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"><PlusIcon className="h-5 w-5"/></button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* O erro aconteceu aqui, porque 'historicoVisivel' não existe na página de Metas */}
      {/* Removi a linha que causava o erro */}
    </>
  );
}