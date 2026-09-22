import React, { useState } from 'react';
import { STATUS_SEMAFORO_CONFIG } from '../lib/status';
import { StatusAtendimento } from '../types';
import { ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';

interface LegendaProps {
  filtroAtivo?: StatusAtendimento | 'todos';
  onSelecionarFiltro?: (status: StatusAtendimento | 'todos') => void;
  mostrarContadores?: Record<StatusAtendimento, number>;
  className?: string;
}

export const LegendaSemaforo: React.FC<LegendaProps> = ({
  filtroAtivo = 'todos',
  onSelecionarFiltro,
  mostrarContadores,
  className = '',
}) => {
  const [expandido, setExpandido] = useState(false);
  const statusKeys: StatusAtendimento[] = ['ok', 'sem_nenhum', 'sem_professor', 'sem_acompanhante', 'contrato_pendente', 'nao_se_aplica'];

  return (
    <div 
      id="legenda-semaforo-atendimento" 
      className={`bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-sm bg-sky-50 text-sky-700">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Semáforo de Atendimento Educacional Especializado (AEE)
            </h3>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Identificação visual da situação de atendimento de cada estudante conforme necessidade e profissionais alocados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="text-xs text-slate-500 hover:text-slate-700 sm:hidden flex items-center gap-1 font-medium"
        >
          {expandido ? 'Ocultar' : 'Detalhes'}
          {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {statusKeys.map((key) => {
          const config = STATUS_SEMAFORO_CONFIG[key];
          const Icon = config.icon;
          const isAtivo = filtroAtivo === key;
          const count = mostrarContadores ? mostrarContadores[key] : undefined;

          return (
            <button
              key={key}
              type="button"
              id={`filtro-legenda-${key}`}
              onClick={() => onSelecionarFiltro && onSelecionarFiltro(isAtivo ? 'todos' : key)}
              disabled={!onSelecionarFiltro}
              className={`flex flex-col text-left p-2 rounded-md border transition-all ${
                isAtivo 
                  ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50/40 shadow-xs' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              } ${onSelecionarFiltro ? 'cursor-pointer' : 'cursor-default'}`}
              title={config.descricao}
            >
              <div className="flex items-center justify-between gap-1 w-full mb-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.badgeText}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{config.label}</span>
                </span>
                {count !== undefined && (
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] text-slate-500 leading-tight line-clamp-2 ${expandido ? 'block' : 'hidden sm:block'}`}>
                {config.descricao}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <FileText className="w-3 h-3" />
            Selo "PDI Pendente"
          </span>
          <span>Indica aluno com laudo ou estudo de caso sem Plano de Desenvolvimento Individual vigente em 2026.</span>
        </div>

        {filtroAtivo !== 'todos' && onSelecionarFiltro && (
          <button
            type="button"
            onClick={() => onSelecionarFiltro('todos')}
            className="text-sky-700 hover:text-sky-800 font-semibold underline underline-offset-2 ml-auto"
          >
            Limpar filtro do semáforo
          </button>
        )}
      </div>
    </div>
  );
};
