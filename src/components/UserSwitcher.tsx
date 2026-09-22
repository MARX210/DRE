import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { 
  Shield, 
  School, 
  Check, 
  ChevronDown, 
  RefreshCw, 
  LogOut, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const { 
    currentUser, 
    usuarios, 
    todasEscolas, 
    trocarPerfil, 
    ehNucleo, 
    minhaEscola, 
    logout, 
    restaurarDadosIniciais 
  } = useAppStore();

  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'nucleo' | 'escola'>('todos');

  // Mapear dinamicamente todos os usuários cadastrados no store
  const perfisDinamicos = usuarios.map(u => {
    const escolaU = todasEscolas.find(e => e.id === u.escola_id);
    let escopo = 'Regional Completa (8 Municípios da DRE)';
    if (!u.papel.startsWith('nucleo')) {
      escopo = escolaU ? `${escolaU.nome} (${escolaU.municipio})` : 'Escola Vinculada';
    }

    return {
      ...u,
      escopo,
      escolaNome: escolaU?.nome || 'DRE Altamira',
      municipio: escolaU?.municipio || 'Altamira',
    };
  });

  const perfisFiltrados = perfisDinamicos.filter(p => {
    if (filtro === 'nucleo') return p.papel.startsWith('nucleo');
    if (filtro === 'escola') return !p.papel.startsWith('nucleo');
    return true;
  });

  return (
    <div className="relative inline-block text-left">
      <button
        id="btn-perfil-usuario"
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs text-left"
        aria-expanded={aberto}
        aria-haspopup="true"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
          ehNucleo ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {ehNucleo ? <Shield className="w-4 h-4" /> : <School className="w-4 h-4" />}
        </div>

        <div className="hidden md:block leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{currentUser.nome}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase ${
              ehNucleo ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentUser.papel.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
            {ehNucleo ? 'DRE Altamira (Acesso Total)' : (minhaEscola?.nome || 'Escola Vinculada')}
          </p>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {aberto && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setAberto(false)} 
          />
          <div 
            id="dropdown-troca-perfil"
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="pb-2.5 mb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  Alternar Usuário e Perfil RLS
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {perfisDinamicos.length} usuários
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Selecione qualquer usuário abaixo (incluindo usuários recém-criados) para simular o acesso com sua escola e permissões correspondentes.
              </p>

              {/* Filtro Rápido */}
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setFiltro('todos')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    filtro === 'todos' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({perfisDinamicos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltro('nucleo')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    filtro === 'nucleo' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Núcleo
                </button>
                <button
                  type="button"
                  onClick={() => setFiltro('escola')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    filtro === 'escola' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Escolas
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {perfisFiltrados.map((p) => {
                const isSelected = currentUser.id === p.id;
                const isInativo = !p.ativo;

                return (
                  <button
                    key={p.id}
                    id={`btn-selecionar-perfil-${p.id}`}
                    type="button"
                    disabled={isInativo}
                    onClick={() => {
                      if (isInativo) {
                        alert(`O usuário "${p.nome}" está inativo no sistema.`);
                        return;
                      }
                      trocarPerfil(p.id);
                      setAberto(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-400' 
                        : isInativo
                        ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{p.nome}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        {isInativo && (
                          <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-sm font-bold">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600">{p.cargo}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        <span className="font-semibold text-slate-700">Escopo:</span> {p.escopo}
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${
                      p.papel.startsWith('nucleo') ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.papel.startsWith('nucleo') ? 'Núcleo' : 'Escola'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rodapé com Logout e Restauração */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja restaurar os dados para a carga inicial com todas as escolas e alunos de demonstração?')) {
                      restaurarDadosIniciais();
                      setAberto(false);
                    }
                  }}
                  className="text-slate-500 hover:text-red-600 flex items-center gap-1 text-[11px] font-medium transition-colors"
                  title="Restaura os dados iniciais do banco"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restaurar dados de teste
                </button>

                <span className="text-[10px] text-slate-400">SEDUC · DRE Altamira</span>
              </div>

              {/* Botão de Logout */}
              <button
                id="btn-logout-usuario"
                type="button"
                onClick={() => {
                  setAberto(false);
                  logout();
                }}
                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da Conta (Ir para Tela de Login)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
