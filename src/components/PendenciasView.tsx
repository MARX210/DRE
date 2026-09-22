import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { AlunoComStatus, StatusAtendimento } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  AlertTriangle, 
  UserX, 
  UserMinus, 
  FileWarning, 
  Award, 
  Mail, 
  CheckSquare, 
  Square, 
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface PendenciasViewProps {
  onGerarOficioComAlunos?: (alunosIds: string[], tipoDemanda: string) => void;
}

export const PendenciasView: React.FC<PendenciasViewProps> = ({ onGerarOficioComAlunos }) => {
  const { alunos, ehNucleo, minhaEscola } = useAppStore();

  const [abaDemanda, setAbaDemanda] = useState<'sem_professor' | 'sem_acompanhante' | 'contrato_pendente' | 'pdi_pendente'>('sem_professor');
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Alunos filtrados por aba de demanda
  const alunosDaDemanda = useMemo(() => {
    switch (abaDemanda) {
      case 'sem_professor':
        return alunos.filter(a => a.status_atendimento === 'sem_professor' || a.status_atendimento === 'sem_nenhum');
      case 'sem_acompanhante':
        return alunos.filter(a => a.status_atendimento === 'sem_acompanhante' || a.status_atendimento === 'sem_nenhum');
      case 'contrato_pendente':
        return alunos.filter(a => a.status_atendimento === 'contrato_pendente');
      case 'pdi_pendente':
        return alunos.filter(a => a.pdi_pendente);
      default:
        return [];
    }
  }, [alunos, abaDemanda]);

  // Contagens para badges das abas
  const countSemProf = alunos.filter(a => a.status_atendimento === 'sem_professor' || a.status_atendimento === 'sem_nenhum').length;
  const countSemAcomp = alunos.filter(a => a.status_atendimento === 'sem_acompanhante' || a.status_atendimento === 'sem_nenhum').length;
  const countContrato = alunos.filter(a => a.status_atendimento === 'contrato_pendente').length;
  const countPdi = alunos.filter(a => a.pdi_pendente).length;

  const handleToggleSelect = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectTodos = () => {
    if (selecionados.length === alunosDaDemanda.length) {
      setSelecionados([]);
    } else {
      setSelecionados(alunosDaDemanda.map(a => a.id));
    }
  };

  const handleGerarOficio = () => {
    if (selecionados.length === 0) {
      alert('Selecione ao menos um aluno na listagem para gerar o ofício.');
      return;
    }
    if (onGerarOficioComAlunos) {
      onGerarOficioComAlunos(selecionados, abaDemanda);
    }
  };

  return (
    <div id="pendencias-view" className="space-y-6 pb-12">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Demandas e Pendências de Atendimento
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {ehNucleo ? 'DRE Altamira' : (minhaEscola?.nome || 'Escola')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {ehNucleo
              ? 'Painel operacional do Núcleo: identifique déficits de recursos humanos e gere ofícios formais à SEDUC.'
              : 'Lista de pendências de professores, acompanhantes e PDIs da sua unidade escolar.'}
          </p>
        </div>

        {ehNucleo && (
          <button
            type="button"
            onClick={handleGerarOficio}
            disabled={selecionados.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4" />
            Gerar Ofício à SEDUC ({selecionados.length} selecionados)
          </button>
        )}
      </div>

      {/* Abas de Tipos de Demanda */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Aba 1: Sem Professor AEE */}
        <button
          type="button"
          onClick={() => { setAbaDemanda('sem_professor'); setSelecionados([]); }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            abaDemanda === 'sem_professor'
              ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/40 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <UserX className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {countSemProf}
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900">Sem Professor AEE</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Falta de docente de AEE</div>
        </button>

        {/* Aba 2: Sem Acompanhante */}
        <button
          type="button"
          onClick={() => { setAbaDemanda('sem_acompanhante'); setSelecionados([]); }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            abaDemanda === 'sem_acompanhante'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/40 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <UserMinus className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {countSemAcomp}
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900">Sem Acompanhante</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Falta de cuidador escolar</div>
        </button>

        {/* Aba 3: Contrato Pendente */}
        <button
          type="button"
          onClick={() => { setAbaDemanda('contrato_pendente'); setSelecionados([]); }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            abaDemanda === 'contrato_pendente'
              ? 'border-yellow-500 bg-yellow-50/60 ring-2 ring-yellow-400/40 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <FileWarning className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
              {countContrato}
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900">Contrato Pendente</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Acomp. sem homologação</div>
        </button>

        {/* Aba 4: PDI Pendente */}
        <button
          type="button"
          onClick={() => { setAbaDemanda('pdi_pendente'); setSelecionados([]); }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            abaDemanda === 'pdi_pendente'
              ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400/40 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Award className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-800">
              {countPdi}
            </span>
          </div>
          <div className="font-bold text-xs text-slate-900">PDI Pendente</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sem plano individual 2026</div>
        </button>
      </div>

      {/* Tabela de Alunos com Checkboxes de Seleção */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {ehNucleo && (
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectTodos}
              className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900"
            >
              {selecionados.length === alunosDaDemanda.length && alunosDaDemanda.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-sky-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Selecionar Todos ({alunosDaDemanda.length})</span>
            </button>

            <span className="text-slate-500">
              {selecionados.length} selecionados para o próximo ofício
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                {ehNucleo && <th className="py-2.5 px-3 w-10">Sel.</th>}
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Estudante</th>
                <th className="py-2.5 px-3">Escola / Turma</th>
                <th className="py-2.5 px-3">CID / Situação Doc.</th>
                <th className="py-2.5 px-3">Nº Processo SEDUC</th>
                <th className="py-2.5 px-3">Déficit Identificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunosDaDemanda.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    Parabéns! Nenhuma pendência encontrada nesta categoria.
                  </td>
                </tr>
              ) : (
                alunosDaDemanda.map((aluno) => {
                  const isChecked = selecionados.includes(aluno.id);

                  return (
                    <tr
                      key={aluno.id}
                      onClick={() => ehNucleo && handleToggleSelect(aluno.id)}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-sky-50/40' : ''
                      } ${ehNucleo ? 'cursor-pointer' : ''}`}
                    >
                      {ehNucleo && (
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(aluno.id)}
                            className="w-4 h-4 rounded-sm text-sky-600 focus:ring-sky-500 border-slate-300"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={aluno.status_atendimento} tamanho="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{aluno.nome}</div>
                        <div className="text-[11px] text-slate-500">{aluno.codigo}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{aluno.escola_nome}</div>
                        <div className="text-[11px] text-slate-500">{aluno.turma_nome || 'Sem turma'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{aluno.cid || 'Sem CID'}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{aluno.situacao_doc.replace('_', ' ')}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {aluno.numero_processo || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-red-600">
                        {abaDemanda === 'sem_professor' && 'Necessita lotação de Professor de AEE'}
                        {abaDemanda === 'sem_acompanhante' && 'Necessita designação de Acompanhante'}
                        {abaDemanda === 'contrato_pendente' && 'Regularização contratual pendente'}
                        {abaDemanda === 'pdi_pendente' && 'Elaboração do PDI 2026 pendente'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
