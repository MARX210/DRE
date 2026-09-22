import React, { useMemo, useState } from 'react';
import { useAppStore } from '../lib/store';
import { StatusAtendimento, MUNICIPIOS_DRE, MunicipioDRE } from '../types';
import { STATUS_SEMAFORO_CONFIG } from '../lib/status';
import { LegendaSemaforo } from './LegendaSemaforo';
import { 
  Users, 
  School, 
  CheckCircle2, 
  AlertOctagon, 
  UserX, 
  UserMinus, 
  FileWarning, 
  FileText,
  TrendingUp,
  Award,
  AlertCircle,
  Download,
  Filter,
  MapPin,
  Building2,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { exportarAlunosExcel } from '../lib/import/excel';

interface DashboardProps {
  onNavegarAlunosComFiltro: (filtro: StatusAtendimento | 'todos') => void;
  onNavegarEscola?: (escolaId: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ 
  onNavegarAlunosComFiltro,
  onNavegarEscola
}) => {
  const { ehNucleo, currentUser, minhaEscola, escolas, turmas, alunos, pdis, todasEscolas } = useAppStore();

  const [municipioFiltro, setMunicipioFiltro] = useState<string>('todos');
  const [escolaFiltro, setEscolaFiltro] = useState<string>('todas');
  const [cicloFiltro, setCicloFiltro] = useState<string>('todos');

  // Escolas filtradas conforme o município selecionado
  const escolasDoMunicipio = useMemo(() => {
    if (municipioFiltro === 'todos') return todasEscolas;
    return todasEscolas.filter(e => e.municipio === municipioFiltro);
  }, [todasEscolas, municipioFiltro]);

  // Filtragem local dos alunos conforme os seletores do dashboard
  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      const esc = todasEscolas.find(e => e.id === a.escola_id);
      if (municipioFiltro !== 'todos' && esc?.municipio !== municipioFiltro) return false;
      if (escolaFiltro !== 'todas' && a.escola_id !== escolaFiltro) return false;
      if (cicloFiltro !== 'todos' && String(a.ciclo) !== cicloFiltro) return false;
      return true;
    });
  }, [alunos, todasEscolas, municipioFiltro, escolaFiltro, cicloFiltro]);

  // Contadores por Status do Semáforo
  const contagemStatus = useMemo(() => {
    const counts: Record<StatusAtendimento, number> = {
      ok: 0,
      sem_nenhum: 0,
      sem_professor: 0,
      sem_acompanhante: 0,
      contrato_pendente: 0,
      nao_se_aplica: 0,
    };
    for (const a of alunosFiltrados) {
      counts[a.status_atendimento] = (counts[a.status_atendimento] || 0) + 1;
    }
    return counts;
  }, [alunosFiltrados]);

  // Estatísticas Gerais
  const totalAlunos = alunosFiltrados.length;
  const totalOk = contagemStatus.ok;
  const totalSemNenhum = contagemStatus.sem_nenhum;
  const totalSemProfessor = contagemStatus.sem_professor;
  const totalSemAcompanhante = contagemStatus.sem_acompanhante;
  const totalContratoPendente = contagemStatus.contrato_pendente;
  const totalCriticos = totalSemNenhum + totalSemProfessor + totalSemAcompanhante;
  const totalPdiPendente = alunosFiltrados.filter(a => a.pdi_pendente).length;
  const percentualAtendimento = totalAlunos > 0 ? Math.round((totalOk / totalAlunos) * 100) : 100;

  // Distribuição Documental
  const situacaoDocCounts = useMemo(() => {
    const c = { com_laudo: 0, estudo_de_caso: 0, sem_laudo: 0 };
    alunosFiltrados.forEach(a => {
      c[a.situacao_doc] = (c[a.situacao_doc] || 0) + 1;
    });
    return c;
  }, [alunosFiltrados]);

  // Estatísticas dos 8 Municípios da Regional
  const estatisticasMunicipios = useMemo(() => {
    return MUNICIPIOS_DRE.map(muni => {
      const escolasMuni = todasEscolas.filter(e => e.municipio === muni);
      const idsEscolas = new Set(escolasMuni.map(e => e.id));
      const alunosMuni = alunos.filter(a => idsEscolas.has(a.escola_id));
      const okMuni = alunosMuni.filter(a => a.status_atendimento === 'ok').length;
      const pendentesMuni = alunosMuni.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
      const srmAtivaCount = escolasMuni.filter(e => e.srm_status === 'ativa').length;

      return {
        municipio: muni,
        totalEscolas: escolasMuni.length,
        srmAtivas: srmAtivaCount,
        totalAlunos: alunosMuni.length,
        atendimentoOk: okMuni,
        pendencias: pendentesMuni,
        taxaRegular: alunosMuni.length > 0 ? Math.round((okMuni / alunosMuni.length) * 100) : 100,
      };
    });
  }, [todasEscolas, alunos]);

  // Dados para Gráfico de Rosca do Semáforo
  const dadosGraficoSemaforo = useMemo(() => {
    return [
      { name: 'Regular (OK)', value: contagemStatus.ok, color: '#10b981' },
      { name: 'Sem Nenhum', value: contagemStatus.sem_nenhum, color: '#ef4444' },
      { name: 'Falta Professor', value: contagemStatus.sem_professor, color: '#a855f7' },
      { name: 'Falta Acompanhante', value: contagemStatus.sem_acompanhante, color: '#f97316' },
      { name: 'Contrato Pendente', value: contagemStatus.contrato_pendente, color: '#eab308' },
    ].filter(d => d.value > 0);
  }, [contagemStatus]);

  // Ranking de Escolas com mais Pendências (Somente Núcleo)
  const rankingEscolasPendencias = useMemo(() => {
    if (!ehNucleo) return [];
    return todasEscolas.filter(esc => {
      if (municipioFiltro !== 'todos' && esc.municipio !== municipioFiltro) return false;
      return true;
    }).map(esc => {
      const alunosEsc = alunos.filter(a => a.escola_id === esc.id);
      const pendencias = alunosEsc.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
      const semNenhum = alunosEsc.filter(a => a.status_atendimento === 'sem_nenhum').length;
      const pdiPendente = alunosEsc.filter(a => a.pdi_pendente).length;
      return {
        id: esc.id,
        nome: esc.nome,
        codigo: esc.codigo,
        municipio: esc.municipio || 'Altamira',
        totalAlunos: alunosEsc.length,
        pendencias,
        semNenhum,
        pdiPendente,
      };
    }).sort((a, b) => b.pendencias - a.pendencias);
  }, [ehNucleo, todasEscolas, alunos, municipioFiltro]);

  // Painel de Qualidade do Cadastro
  const qualidadeCadastro = useMemo(() => {
    const semCidComLaudo = alunosFiltrados.filter(a => a.situacao_doc === 'com_laudo' && !a.cid).length;
    const semTurma = alunosFiltrados.filter(a => !a.turma_id).length;
    const semProcesso = alunosFiltrados.filter(a => (a.situacao_doc === 'com_laudo' || a.situacao_doc === 'estudo_de_caso') && !a.numero_processo).length;
    return {
      semCidComLaudo,
      semTurma,
      semProcesso,
      pdiPendente: totalPdiPendente,
    };
  }, [alunosFiltrados, totalPdiPendente]);

  return (
    <div id="dashboard-view" className="space-y-5 pb-16">
      {/* Barra superior de boas-vindas e escopo regional */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              ehNucleo ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {ehNucleo ? 'Regional DRE — 8 Municípios' : `Polo: ${minhaEscola?.municipio || 'Escola'}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {ehNucleo ? 'Painel Regional de Educação Especial (AEE)' : `Painel de Atendimento — ${minhaEscola?.nome || 'Escola'}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {ehNucleo 
              ? 'Acompanhamento consolidado das 23 escolas estaduais em Altamira, Brasil Novo, Vitória do Xingu, Porto de Moz, Senador José Porfírio, Medicilândia, Anapu e Uruará.' 
              : 'Indicadores exclusivos dos alunos matriculados nesta unidade escolar.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => exportarAlunosExcel(alunosFiltrados, `Estatisticas_AEE_DRE_${municipioFiltro}.xlsx`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* Filtros rápidos com Seleção de Município e Escola */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Filtrar Escopo do Dashboard:</span>
          </div>
          {(municipioFiltro !== 'todos' || escolaFiltro !== 'todas' || cicloFiltro !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setMunicipioFiltro('todos');
                setEscolaFiltro('todas');
                setCicloFiltro('todos');
              }}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 underline"
            >
              Resetar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Filtro Município (Somente Núcleo) */}
          {ehNucleo && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Município da DRE
              </label>
              <select
                id="select-filtro-municipio"
                value={municipioFiltro}
                onChange={(e) => {
                  setMunicipioFiltro(e.target.value);
                  setEscolaFiltro('todas');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
              >
                <option value="todos">Todos os Municípios da DRE ({MUNICIPIOS_DRE.length} polos)</option>
                {MUNICIPIOS_DRE.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Escola */}
          {ehNucleo && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Unidade Escolar
              </label>
              <select
                id="select-filtro-escola"
                value={escolaFiltro}
                onChange={(e) => setEscolaFiltro(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
              >
                <option value="todas">Todas as Escolas ({escolasDoMunicipio.length})</option>
                {escolasDoMunicipio.map(e => (
                  <option key={e.id} value={e.id}>{e.nome} ({e.municipio})</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Ciclo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Etapa / Ciclo
            </label>
            <select
              id="select-filtro-ciclo"
              value={cicloFiltro}
              onChange={(e) => setCicloFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            >
              <option value="todos">Todos os Ciclos</option>
              <option value="1">1º Ciclo (Ensino Fundamental)</option>
              <option value="2">2º Ciclo (Ensino Médio)</option>
              <option value="3">3º Ciclo (Médio Final / EJA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais com Semáforo Clicável (Mobile First: 2 colunas no mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Total Alunos */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('todos')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 active:bg-slate-50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold">Total Alunos</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalAlunos}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Regularidade:</span>
            <span className="font-bold text-emerald-600">{percentualAtendimento}%</span>
          </div>
        </div>

        {/* Regular (OK - Verde) */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('ok')}
          className="bg-emerald-50/40 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-300 active:bg-emerald-100/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] sm:text-xs font-bold">Atendimento OK</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{totalOk}</div>
          <div className="text-[10px] sm:text-[11px] text-emerald-700/80 mt-1">Profissionais regulares</div>
        </div>

        {/* Sem Nenhum (Vermelho) */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('sem_nenhum')}
          className="bg-rose-50/40 p-3.5 sm:p-4 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-300 active:bg-rose-100/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-[11px] sm:text-xs font-bold">Sem Nenhum</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700">{totalSemNenhum}</div>
          <div className="text-[10px] sm:text-[11px] text-rose-700/80 mt-1">Sem AEE nem cuidador</div>
        </div>

        {/* Falta Professor AEE (Roxo) */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('sem_professor')}
          className="bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-200 shadow-xs hover:border-purple-300 active:bg-purple-100/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-purple-800 mb-1">
            <span className="text-[11px] sm:text-xs font-bold">Falta Prof. AEE</span>
            <UserMinus className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700">{totalSemProfessor}</div>
          <div className="text-[10px] sm:text-[11px] text-purple-700/80 mt-1">Requer docente AEE</div>
        </div>

        {/* Falta Acompanhante (Laranja) */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('sem_acompanhante')}
          className="bg-amber-50/40 p-3.5 sm:p-4 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-300 active:bg-amber-100/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] sm:text-xs font-bold">Falta Apoio</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">{totalSemAcompanhante}</div>
          <div className="text-[10px] sm:text-[11px] text-amber-700/80 mt-1">Requer cuidador</div>
        </div>

        {/* Contrato Pendente (Amarelo) */}
        <div 
          onClick={() => onNavegarAlunosComFiltro('contrato_pendente')}
          className="bg-yellow-50/40 p-3.5 sm:p-4 rounded-2xl border border-yellow-200 shadow-xs hover:border-yellow-300 active:bg-yellow-100/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-yellow-800 mb-1">
            <span className="text-[11px] sm:text-xs font-bold">Contrato</span>
            <FileWarning className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-yellow-700">{totalContratoPendente}</div>
          <div className="text-[10px] sm:text-[11px] text-yellow-700/80 mt-1">Vencimento próximo</div>
        </div>
      </div>

      {/* Se Núcleo: Panorama Regional pelos 8 Municípios da DRE */}
      {ehNucleo && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                Panorama Regional por Município (8 Polos DRE)
              </h2>
              <p className="text-xs text-slate-500">
                Distribuição de unidades escolares, estudantes de AEE e salas de recursos multifuncionais
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Clique em um polo para filtrar o painel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
            {estatisticasMunicipios.map((m) => {
              const isSelected = municipioFiltro === m.municipio;
              return (
                <button
                  key={m.municipio}
                  type="button"
                  onClick={() => {
                    setMunicipioFiltro(isSelected ? 'todos' : m.municipio);
                    setEscolaFiltro('todas');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-400/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {m.municipio}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {m.totalEscolas} esc.
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <span className="text-base sm:text-lg font-black text-slate-800">
                        {m.totalAlunos}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">alunos</span>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      m.pendencias > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {m.taxaRegular}% OK
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{m.srmAtivas} SRM ativas</span>
                    {m.pendencias > 0 && <span className="text-rose-600 font-semibold">{m.pendencias} déficits</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos de Apoio: Semáforo & Top CIDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição Semáforo (Rosca) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
            Distribuição dos Estudantes pelo Semáforo
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Conformidade do quadro de profissionais especializados alocados
          </p>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoSemaforo}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dadosGraficoSemaforo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Situação Documental & PDI */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
              Situação Documental & PDI 2026
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Homologação médica e cumprimento dos planos de desenvolvimento individual
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Com Laudo Médico Homologado</span>
                  <span>{situacaoDocCounts.com_laudo} ({totalAlunos > 0 ? Math.round((situacaoDocCounts.com_laudo / totalAlunos) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalAlunos > 0 ? (situacaoDocCounts.com_laudo / totalAlunos) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Estudo de Caso Pedagógico em Curso</span>
                  <span>{situacaoDocCounts.estudo_de_caso} ({totalAlunos > 0 ? Math.round((situacaoDocCounts.estudo_de_caso / totalAlunos) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalAlunos > 0 ? (situacaoDocCounts.estudo_de_caso / totalAlunos) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Sem Laudo / Triagem Inicial</span>
                  <span>{situacaoDocCounts.sem_laudo} ({totalAlunos > 0 ? Math.round((situacaoDocCounts.sem_laudo / totalAlunos) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalAlunos > 0 ? (situacaoDocCounts.sem_laudo / totalAlunos) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">PDI Vigente 2026:</span>
            <span className="font-bold text-slate-800">
              {totalAlunos - totalPdiPendente} de {totalAlunos} alunos elaborados ({totalAlunos > 0 ? Math.round(((totalAlunos - totalPdiPendente) / totalAlunos) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Ranking de Demandas por Escola da Regional (Visível SOMENTE para o Núcleo) */}
      {ehNucleo && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                Ranking de Demandas por Escola da Regional ({rankingEscolasPendencias.length} unidades)
              </h2>
              <p className="text-xs text-slate-500">
                Priorização de alocação de docentes e cuidadores por volume de pendências
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Escola</th>
                    <th className="py-2.5 px-3">Município</th>
                    <th className="py-2.5 px-3 text-center">Total Alunos</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">Sem Nenhum</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">Pendências</th>
                    <th className="py-2.5 px-3 text-center">PDI Pendente</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankingEscolasPendencias.map((esc) => (
                    <tr key={esc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {esc.nome}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {esc.municipio}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                        {esc.totalAlunos}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                        {esc.semNenhum}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          esc.pendencias > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {esc.pendencias}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                        {esc.pdiPendente}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {onNavegarEscola && (
                          <button
                            type="button"
                            onClick={() => onNavegarEscola(esc.id)}
                            className="text-sky-600 hover:text-sky-800 font-semibold underline text-[11px]"
                          >
                            Ver Ficha
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
