import React, { useMemo, useState } from 'react';
import { useAppStore } from '../lib/store';
import { StatusAtendimento, MUNICIPIOS_DRE } from '../types';
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
  ChevronRight,
  BarChart2,
  PieChart as PieChartIcon,
  Brain,
  HeartHandshake,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  Activity,
  Check
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
  Legend,
  CartesianGrid
} from 'recharts';
import { exportarAlunosExcel } from '../lib/import/excel';

interface DashboardProps {
  onNavegarAlunosComFiltro: (filtro: StatusAtendimento | 'todos') => void;
  onNavegarEscola?: (escolaId: string) => void;
}

type AbaGrafico = 'todos' | 'semaforo' | 'diagnosticos' | 'municipios' | 'profissionais' | 'documentos' | 'ciclos';

export const DashboardView: React.FC<DashboardProps> = ({ 
  onNavegarAlunosComFiltro,
  onNavegarEscola
}) => {
  const { 
    ehNucleo, 
    currentUser, 
    minhaEscola, 
    escolas, 
    turmas, 
    alunos, 
    pdis, 
    profissionais, 
    todasEscolas 
  } = useAppStore();

  const [municipioFiltro, setMunicipioFiltro] = useState<string>('todos');
  const [escolaFiltro, setEscolaFiltro] = useState<string>('todas');
  const [cicloFiltro, setCicloFiltro] = useState<string>('todos');
  const [abaGrafico, setAbaGrafico] = useState<AbaGrafico>('todos');

  // Escolas filtradas conforme o município selecionado
  const escolasDoMunicipio = useMemo(() => {
    if (municipioFiltro === 'todos') return todasEscolas;
    return todasEscolas.filter(e => e.municipio === municipioFiltro);
  }, [todasEscolas, municipioFiltro]);

  // Mapeamento de turmas para consulta rápida
  const turmaMap = useMemo(() => {
    return new Map(turmas.map(t => [t.id, t]));
  }, [turmas]);

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

  // 1. Contadores do Semáforo Completo
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
  const totalNaoSeAplica = contagemStatus.nao_se_aplica;
  const totalCriticos = totalSemNenhum + totalSemProfessor + totalSemAcompanhante;
  const totalPdiPendente = alunosFiltrados.filter(a => a.pdi_pendente).length;
  const percentualAtendimento = totalAlunos > 0 ? Math.round((totalOk / totalAlunos) * 100) : 100;

  // 2. Gráfico do Semáforo Completo (Todos os 6 Status)
  const dadosGraficoSemaforo = useMemo(() => {
    return [
      { name: 'Regular (OK)', value: contagemStatus.ok, color: '#10b981', desc: 'Professores e cuidadores alocados' },
      { name: 'Sem Nenhum', value: contagemStatus.sem_nenhum, color: '#ef4444', desc: 'Falta professor e acompanhante' },
      { name: 'Falta Prof. AEE', value: contagemStatus.sem_professor, color: '#a855f7', desc: 'Necessita professor especialista' },
      { name: 'Falta Apoio', value: contagemStatus.sem_acompanhante, color: '#f97316', desc: 'Necessita cuidador/acompanhante' },
      { name: 'Contrato Pendente', value: contagemStatus.contrato_pendente, color: '#eab308', desc: 'Vencimento ou contrato pendente' },
      { name: 'Sem Demanda Direta', value: contagemStatus.nao_se_aplica, color: '#64748b', desc: 'Não requer atendimento contínuo' },
    ].filter(d => d.value > 0);
  }, [contagemStatus]);

  // 3. Gráfico de Diagnósticos & CIDs
  const dadosGraficoDiagnosticos = useMemo(() => {
    const agrupado: Record<string, { total: number; ok: number; pendente: number; cor: string }> = {
      'TEA (Autismo)': { total: 0, ok: 0, pendente: 0, cor: '#0ea5e9' },
      'Deficiência Intelectual': { total: 0, ok: 0, pendente: 0, cor: '#8b5cf6' },
      'Deficiência Física / Paralisia': { total: 0, ok: 0, pendente: 0, cor: '#f59e0b' },
      'Deficiência Visual / Baixa Visão': { total: 0, ok: 0, pendente: 0, cor: '#10b981' },
      'Deficiência Auditiva / Surdez': { total: 0, ok: 0, pendente: 0, cor: '#ec4899' },
      'Síndrome de Down': { total: 0, ok: 0, pendente: 0, cor: '#06b6d4' },
      'TDAH / Neurodesenvolvimento': { total: 0, ok: 0, pendente: 0, cor: '#6366f1' },
      'Deficiências Múltiplas': { total: 0, ok: 0, pendente: 0, cor: '#ef4444' },
      'Outros / Em Investigação': { total: 0, ok: 0, pendente: 0, cor: '#94a3b8' },
    };

    alunosFiltrados.forEach(a => {
      const c = (a.cid || '').toUpperCase();
      const o = (a.observacoes || '').toUpperCase();
      const isOk = a.status_atendimento === 'ok';

      let chave = 'Outros / Em Investigação';
      if (c.includes('F84') || c.includes('11.602') || o.includes('TEA') || o.includes('AUTISMO') || o.includes('ASPERGER')) {
        chave = 'TEA (Autismo)';
      } else if (c.includes('F7') || c.includes('F70') || c.includes('F71') || c.includes('F72') || c.includes('F79') || o.includes('INTELECTUAL') || o.includes('DI ')) {
        chave = 'Deficiência Intelectual';
      } else if (c.includes('G80') || c.includes('G81') || c.includes('G82') || o.includes('PARALISIA') || o.includes('FÍSICA') || o.includes('MOTORA') || o.includes('CADEIRANTE')) {
        chave = 'Deficiência Física / Paralisia';
      } else if (c.includes('H54') || c.includes('H52') || o.includes('VISUAL') || o.includes('CEGUEIRA') || o.includes('BAIXA VISÃO') || o.includes('MIOPIA')) {
        chave = 'Deficiência Visual / Baixa Visão';
      } else if (c.includes('H90') || c.includes('H91') || o.includes('AUDITIV') || o.includes('SURDEZ') || o.includes('SURDO')) {
        chave = 'Deficiência Auditiva / Surdez';
      } else if (c.includes('Q90') || o.includes('DOWN')) {
        chave = 'Síndrome de Down';
      } else if (c.includes('F90') || o.includes('TDAH') || o.includes('HIPERATIVIDADE')) {
        chave = 'TDAH / Neurodesenvolvimento';
      } else if (o.includes('MÚLTIPLA') || o.includes('MULTIPLA')) {
        chave = 'Deficiências Múltiplas';
      }

      agrupado[chave].total++;
      if (isOk) agrupado[chave].ok++;
      else agrupado[chave].pendente++;
    });

    return Object.entries(agrupado)
      .map(([nome, dados]) => ({
        nome,
        total: dados.total,
        atendidoOk: dados.ok,
        pendente: dados.pendente,
        percentualOk: dados.total > 0 ? Math.round((dados.ok / dados.total) * 100) : 0,
        cor: dados.cor,
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [alunosFiltrados]);

  // 4. Gráfico Comparativo dos 8 Municípios da DRE
  const estatisticasMunicipios = useMemo(() => {
    return MUNICIPIOS_DRE.map(muni => {
      const escolasMuni = todasEscolas.filter(e => e.municipio === muni);
      const idsEscolas = new Set(escolasMuni.map(e => e.id));
      const alunosMuni = alunos.filter(a => idsEscolas.has(a.escola_id));
      const okMuni = alunosMuni.filter(a => a.status_atendimento === 'ok').length;
      const pendentesMuni = alunosMuni.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
      const criticosMuni = alunosMuni.filter(a => a.status_atendimento === 'sem_nenhum').length;
      const srmAtivaCount = escolasMuni.filter(e => e.srm_status === 'ativa').length;

      return {
        municipio: muni,
        totalEscolas: escolasMuni.length,
        srmAtivas: srmAtivaCount,
        totalAlunos: alunosMuni.length,
        atendimentoOk: okMuni,
        pendencias: pendentesMuni,
        criticos: criticosMuni,
        taxaRegular: alunosMuni.length > 0 ? Math.round((okMuni / alunosMuni.length) * 100) : 100,
      };
    });
  }, [todasEscolas, alunos]);

  // 5. Gráfico de Recursos Humanos (Professores AEE vs Acompanhantes)
  const dadosGraficoRH = useMemo(() => {
    // Alunos demandando cada tipo
    const requeremProf = alunosFiltrados.filter(a => a.necessita_professor_aee).length;
    const atendidosProf = alunosFiltrados.filter(a => a.necessita_professor_aee && a.professor_aee_id).length;
    const deficitProf = requeremProf - atendidosProf;

    const requeremApoio = alunosFiltrados.filter(a => a.necessita_acompanhante).length;
    const atendidosApoio = alunosFiltrados.filter(a => a.necessita_acompanhante && a.acompanhante_id).length;
    const deficitApoio = requeremApoio - atendidosApoio;

    const contratosValidos = alunosFiltrados.filter(a => a.acompanhante_id && a.contrato_acompanhante).length;
    const contratosPendentes = alunosFiltrados.filter(a => a.acompanhante_id && !a.contrato_acompanhante).length;

    // Total de profissionais cadastrados nas escolas em escopo
    const idsEscolasFiltro = new Set(alunosFiltrados.map(a => a.escola_id));
    const profsEscopo = profissionais.filter(p => p.ativo && (idsEscolasFiltro.size === 0 || idsEscolasFiltro.has(p.escola_id)));
    const totalProfAEE = profsEscopo.filter(p => p.tipo === 'professor_aee').length;
    const totalAcompanhantes = profsEscopo.filter(p => p.tipo === 'acompanhante').length;

    return {
      quadroDocente: [
        { categoria: 'Professores AEE', demandado: requeremProf, atendido: atendidosProf, deficit: deficitProf, profCadastrados: totalProfAEE },
        { categoria: 'Acompanhantes / Apoio', demandado: requeremApoio, atendido: atendidosApoio, deficit: deficitApoio, profCadastrados: totalAcompanhantes },
      ],
      contratosApoio: [
        { name: 'Contrato Regular', value: contratosValidos, color: '#10b981' },
        { name: 'Contrato Pendente / Vencendo', value: contratosPendentes, color: '#eab308' },
        { name: 'Vaga Descoberta (Falta Cuidador)', value: deficitApoio, color: '#ef4444' },
      ].filter(d => d.value > 0),
      taxaCoberturaProf: requeremProf > 0 ? Math.round((atendidosProf / requeremProf) * 100) : 100,
      taxaCoberturaApoio: requeremApoio > 0 ? Math.round((atendidosApoio / requeremApoio) * 100) : 100,
      totalProfAEE,
      totalAcompanhantes,
    };
  }, [alunosFiltrados, profissionais]);

  // 6. Distribuição por Situação Documental & PDI
  const dadosGraficoDocumental = useMemo(() => {
    let comLaudo = 0;
    let estudoCaso = 0;
    let semLaudo = 0;

    alunosFiltrados.forEach(a => {
      if (a.situacao_doc === 'com_laudo') comLaudo++;
      else if (a.situacao_doc === 'estudo_de_caso') estudoCaso++;
      else semLaudo++;
    });

    const pdiVigente = alunosFiltrados.filter(a => !a.pdi_pendente).length;
    const pdiPendente = alunosFiltrados.filter(a => a.pdi_pendente).length;

    return {
      laudos: [
        { name: 'Com Laudo Médico', value: comLaudo, color: '#10b981' },
        { name: 'Estudo de Caso em Curso', value: estudoCaso, color: '#f59e0b' },
        { name: 'Sem Laudo / Triagem', value: semLaudo, color: '#ef4444' },
      ].filter(d => d.value > 0),
      pdis: [
        { name: 'PDI 2026 Vigente', value: pdiVigente, color: '#0ea5e9' },
        { name: 'PDI Pendente', value: pdiPendente, color: '#f97316' },
      ].filter(d => d.value > 0),
      comLaudo,
      estudoCaso,
      semLaudo,
      pdiVigente,
      pdiPendente,
    };
  }, [alunosFiltrados]);

  // 7. Distribuição por Ciclos, Turnos e Faixas Etárias
  const dadosGraficoCiclosTurnos = useMemo(() => {
    const ciclosCount: Record<string, { total: number; ok: number }> = {
      '1º Ciclo (Fundamental)': { total: 0, ok: 0 },
      '2º Ciclo (Ensino Médio)': { total: 0, ok: 0 },
      '3º Ciclo (EJA / Noturno)': { total: 0, ok: 0 },
    };

    const turnosCount: Record<string, number> = {
      'Manhã': 0,
      'Tarde': 0,
      'Noite': 0,
      'Integral': 0,
    };

    const faixasEtariasCount: Record<string, number> = {
      'Até 10 anos': 0,
      '11 a 14 anos': 0,
      '15 a 17 anos': 0,
      '18 anos ou mais': 0,
    };

    const generoCount = {
      'Masculino': 0,
      'Feminino': 0,
    };

    alunosFiltrados.forEach(a => {
      // Ciclo
      const cicloKey = a.ciclo === 1 
        ? '1º Ciclo (Fundamental)' 
        : a.ciclo === 3 
          ? '3º Ciclo (EJA / Noturno)' 
          : '2º Ciclo (Ensino Médio)';
      ciclosCount[cicloKey].total++;
      if (a.status_atendimento === 'ok') ciclosCount[cicloKey].ok++;

      // Turno
      const turma = a.turma_id ? turmaMap.get(a.turma_id) : null;
      const turnoNome = turma?.turno || 'Tarde';
      const turnoPadrao = (turnoNome.includes('Manhã') || turnoNome.includes('Matutino'))
        ? 'Manhã'
        : (turnoNome.includes('Noite') || turnoNome.includes('Noturno'))
          ? 'Noite'
          : turnoNome.includes('Integral')
            ? 'Integral'
            : 'Tarde';
      turnosCount[turnoPadrao] = (turnosCount[turnoPadrao] || 0) + 1;

      // Idade
      const idade = a.idade_informada || (a.data_nascimento ? new Date().getFullYear() - new Date(a.data_nascimento).getFullYear() : 15);
      if (idade <= 10) faixasEtariasCount['Até 10 anos']++;
      else if (idade <= 14) faixasEtariasCount['11 a 14 anos']++;
      else if (idade <= 17) faixasEtariasCount['15 a 17 anos']++;
      else faixasEtariasCount['18 anos ou mais']++;

      // Gênero
      if (a.sexo === 'F') generoCount['Feminino']++;
      else generoCount['Masculino']++;
    });

    const ciclosData = Object.entries(ciclosCount).map(([etapa, c]) => ({
      etapa,
      total: c.total,
      atendidos: c.ok,
      pendentes: c.total - c.ok,
      taxa: c.total > 0 ? Math.round((c.ok / c.total) * 100) : 0,
    }));

    const turnosData = Object.entries(turnosCount).map(([turno, valor]) => ({
      turno,
      valor,
    })).filter(t => t.valor > 0);

    const faixasData = Object.entries(faixasEtariasCount).map(([faixa, total]) => ({
      faixa,
      total,
    }));

    const generoData = [
      { name: 'Masculino', value: generoCount['Masculino'], color: '#0ea5e9' },
      { name: 'Feminino', value: generoCount['Feminino'], color: '#ec4899' },
    ].filter(d => d.value > 0);

    return {
      ciclosData,
      turnosData,
      faixasData,
      generoData,
    };
  }, [alunosFiltrados, turmaMap]);

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
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalAlunos} Estudantes de AEE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {ehNucleo ? 'Painel Geral de Gráficos & Estatísticas de AEE' : `Painel de Atendimento & Gráficos — ${minhaEscola?.nome || 'Escola'}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {ehNucleo 
              ? 'Métricas completas de atendimento: semáforo, laudos e diagnósticos, recursos humanos, polos regionais, turnos e ciclos.' 
              : 'Indicadores completos de conformidade e perfil dos estudantes matriculados nesta unidade escolar.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => exportarAlunosExcel(alunosFiltrados, `Estatisticas_AEE_DRE_${municipioFiltro}.xlsx`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Relatório Excel</span>
          </button>
        </div>
      </div>

      {/* Filtros rápidos com Seleção de Município e Escola */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Filtrar Escopo dos Gráficos:</span>
          </div>
          {(municipioFiltro !== 'todos' || escolaFiltro !== 'todas' || cicloFiltro !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setMunicipioFiltro('todos');
                setEscolaFiltro('todas');
                setCicloFiltro('todos');
              }}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 underline cursor-pointer"
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

      {/* Cards de Métricas Principais com Semáforo Clicável */}
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

      {/* SELETOR DE ABAS DE GRÁFICOS */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setAbaGrafico('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'todos' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Todos os Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaGrafico('semaforo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'semaforo' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Semáforo de Atendimento</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaGrafico('diagnosticos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'diagnosticos' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Diagnósticos & CIDs</span>
          </button>

          {ehNucleo && (
            <button
              type="button"
              onClick={() => setAbaGrafico('municipios')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                abaGrafico === 'municipios' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Polos Regionais (8 Municípios)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAbaGrafico('profissionais')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'profissionais' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Recursos Humanos (AEE)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaGrafico('documentos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'documentos' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laudos & PDI 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaGrafico('ciclos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              abaGrafico === 'ciclos' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Ciclos, Turnos & Idades</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: GRÁFICO DO SEMÁFORO DE ATENDIMENTO COMPLETO */}
      {(abaGrafico === 'todos' || abaGrafico === 'semaforo') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico de Rosca do Semáforo */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Distribuição pelo Semáforo de Atendimento
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {percentualAtendimento}% Atendimento Regular
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Conformidade com a legislação estadual e presença de professores de AEE e acompanhantes
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoSemaforo}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosGraficoSemaforo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val} estudantes (${totalAlunos > 0 ? Math.round((Number(val) / totalAlunos) * 100) : 0}%)`, 'Quantidade']}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-900">
                <span className="font-bold text-sm block">{totalOk}</span>
                <span className="text-[10px] text-emerald-700">Regulares ({percentualAtendimento}%)</span>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl text-rose-900">
                <span className="font-bold text-sm block">{totalSemNenhum}</span>
                <span className="text-[10px] text-rose-700">Sem Nenhum Profissional</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl text-amber-900">
                <span className="font-bold text-sm block">{totalCriticos}</span>
                <span className="text-[10px] text-amber-700">Déficits Totais</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras: Quantitativo por Status */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-sky-600" />
                Quantitativo Absoluto por Status do Semáforo
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Volume exato de alunos em cada condição para alocação prioritária
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoSemaforo} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip formatter={(val: any) => [`${val} estudantes`, 'Total']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {dadosGraficoSemaforo.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Metodologia: SEDUC-PA / DRE Altamira</span>
              <span className="font-semibold text-slate-700">{totalAlunos} alunos avaliados</span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: GRÁFICO DE DIAGNÓSTICOS & CIDs */}
      {(abaGrafico === 'todos' || abaGrafico === 'diagnosticos') && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Gráfico de Diagnósticos & Classificação Internacional de Doenças (CID)
              </h2>
              <p className="text-xs text-slate-500">
                Distribuição de estudantes por tipo de deficiência e taxa de atendimento regularizado
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              {dadosGraficoDiagnosticos.length} Categorias Clínicas
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Gráfico de Barras Horizontais / Verticais */}
            <div className="lg:col-span-8 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoDiagnosticos} margin={{ top: 10, right: 15, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 9, fill: '#475569' }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip 
                    formatter={(val: any, name: any) => [
                      `${val} estudantes`,
                      name === 'atendidoOk' ? 'Atendimento Regular (OK)' : name === 'pendente' ? 'Com Pendência' : 'Total'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="atendidoOk" name="Atendimento OK" stackId="a" fill="#10b981" />
                  <Bar dataKey="pendente" name="Com Pendência" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela Resumo dos Diagnósticos */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Top Necessidades Especiais:
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {dadosGraficoDiagnosticos.map((diag) => (
                  <div key={diag.nome} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <strong className="text-slate-800 font-bold block truncate">{diag.nome}</strong>
                      <span className="text-[10px] text-slate-500">{diag.total} alunos ({totalAlunos > 0 ? Math.round((diag.total / totalAlunos) * 100) : 0}%)</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        diag.percentualOk >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {diag.percentualOk}% OK
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 3: GRÁFICO COMPARATIVO POR MUNICÍPIO (8 POLOS DRE) */}
      {ehNucleo && (abaGrafico === 'todos' || abaGrafico === 'municipios') && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                Gráfico Comparativo Regional — 8 Polos da Transamazônica
              </h2>
              <p className="text-xs text-slate-500">
                Alunos matriculados, cobertura de atendimento regular e salas de recursos multifuncionais
              </p>
            </div>
          </div>

          <div className="h-72 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticasMunicipios} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="municipio" 
                  tick={{ fontSize: 10, fill: '#334155' }} 
                  interval={0}
                  angle={-10}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="totalAlunos" name="Total Alunos" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atendimentoOk" name="Atendidos (OK)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendencias" name="Com Déficit" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards dos Polos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-slate-100">
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
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-400/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 truncate block">
                    {m.municipio}
                  </span>
                  <div className="text-sm font-black text-slate-800 mt-1">
                    {m.totalAlunos} <span className="text-[10px] font-normal text-slate-500">alunos</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                    m.taxaRegular >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {m.taxaRegular}% OK
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 4: GRÁFICO DE RECURSOS HUMANOS (AEE & CUIDADORES) */}
      {(abaGrafico === 'todos' || abaGrafico === 'profissionais') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alocação de Docentes e Apoio */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-amber-600" />
                  Demanda vs Atendimento de Profissionais Especializados
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Cobertura real de professores de AEE e acompanhantes/cuidadores
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoRH.quadroDocente} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: '#334155' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="demandado" name="Estudantes que Necessitam" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atendido" name="Atendidos com Profissional" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deficit" name="Déficit / Vagas em Aberto" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-900">
                <span className="text-[10px] text-purple-700 block">Professores AEE Ativos</span>
                <span className="font-bold text-sm">{dadosGraficoRH.totalProfAEE} docentes</span>
                <span className="text-[10px] text-purple-600 block mt-0.5">Cobertura: {dadosGraficoRH.taxaCoberturaProf}%</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-900">
                <span className="text-[10px] text-amber-700 block">Acompanhantes Ativos</span>
                <span className="font-bold text-sm">{dadosGraficoRH.totalAcompanhantes} cuidadores</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Cobertura: {dadosGraficoRH.taxaCoberturaApoio}%</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Regularidade Contratual do Apoio */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <FileWarning className="w-4 h-4 text-yellow-600" />
                Situação Contratual dos Cuidadores / Apoiadores
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Monitoramento de contratos ativos, renovações pendentes e vagas descobertas
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoRH.contratosApoio}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosGraficoRH.contratosApoio.map((entry, index) => (
                        <Cell key={`cell-rh-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Controle de Contratos da DRE</span>
              <span className="font-semibold text-slate-700">{totalContratoPendente} com contratos pendentes</span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 5: GRÁFICO DE SITUAÇÃO DOCUMENTAL & PDI */}
      {(abaGrafico === 'todos' || abaGrafico === 'documentos') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Situação Documental / Laudo Médico */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-emerald-600" />
                Homologação de Laudos Médicos
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Comprovação documental do diagnóstico para fins do Censo Escolar e apoio
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoDocumental.laudos}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosGraficoDocumental.laudos.map((entry, index) => (
                        <Cell key={`cell-doc-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} alunos`, 'Total']} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900">
                <span className="font-bold block">{dadosGraficoDocumental.comLaudo}</span>
                <span className="text-[10px]">Com Laudo</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900">
                <span className="font-bold block">{dadosGraficoDocumental.estudoCaso}</span>
                <span className="text-[10px]">Estudo Caso</span>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-900">
                <span className="font-bold block">{dadosGraficoDocumental.semLaudo}</span>
                <span className="text-[10px]">Sem Laudo</span>
              </div>
            </div>
          </div>

          {/* Gráfico do PDI 2026 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-sky-600" />
                Elaboração do PDI (Plano de Desenvolvimento Individual) 2026
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Cumprimento do plano pedagógico individualizado obrigatório
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoDocumental.pdis}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosGraficoDocumental.pdis.map((entry, index) => (
                        <Cell key={`cell-pdi-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} estudantes`, 'Total']} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">PDI Vigente:</span>
              <span className="font-bold text-sky-700">
                {dadosGraficoDocumental.pdiVigente} de {totalAlunos} ({totalAlunos > 0 ? Math.round((dadosGraficoDocumental.pdiVigente / totalAlunos) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 6: GRÁFICO DE CICLOS, TURNOS E FAIXAS ETÁRIAS */}
      {(abaGrafico === 'todos' || abaGrafico === 'ciclos') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Por Etapa / Ciclo */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                Por Etapa de Ensino (Ciclos)
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                Fundamental, Médio e EJA
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoCiclosTurnos.ciclosData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: '#334155' }} interval={0} angle={-10} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total Alunos" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atendidos" name="Atendimento OK" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Maior concentração no 2º Ciclo (Ensino Médio).
            </div>
          </div>

          {/* Por Turno */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-sky-600" />
                Distribuição por Turno
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                Manhã, Tarde, Noite e Integral
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoCiclosTurnos.turnosData} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="turno" tick={{ fontSize: 10, fill: '#334155' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="valor" name="Alunos" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Turno da Tarde e Manhã concentram o maior volume de SRM.
            </div>
          </div>

          {/* Por Faixa Etária */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-600" />
                Faixas Etárias dos Estudantes
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                Crianças, Adolescentes e Jovens/Adultos
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoCiclosTurnos.faixasData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="faixa" tick={{ fontSize: 9, fill: '#334155' }} interval={0} angle={-15} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Alunos" fill="#9333ea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Faixa de 15 a 17 anos é a mais representativa no Ensino Médio.
            </div>
          </div>
        </div>
      )}

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
                            className="text-sky-600 hover:text-sky-800 font-semibold underline text-[11px] cursor-pointer"
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
