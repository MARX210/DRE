import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Escola, Turma, Profissional, MunicipioDRE, MUNICIPIOS_DRE } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Plus, 
  Edit2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Filter,
  Building2,
  X,
  FileText,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface EscolasViewProps {
  escolaIdSelecionada?: string;
  onVerAluno?: (alunoId: string) => void;
}

export const EscolasView: React.FC<EscolasViewProps> = ({ 
  escolaIdSelecionada,
  onVerAluno 
}) => {
  const { 
    escolas, 
    turmas, 
    profissionais, 
    alunos, 
    ehNucleo, 
    minhaEscola, 
    salvarEscola, 
    currentUser 
  } = useAppStore();

  // Escola selecionada ativa
  const [escolaAtivaId, setEscolaAtivaId] = useState<string>(() => {
    if (escolaIdSelecionada) return escolaIdSelecionada;
    if (!ehNucleo && minhaEscola?.id) return minhaEscola.id;
    return escolas[0]?.id || '';
  });

  // Filtros de Lista de Escolas
  const [municipioFiltro, setMunicipioFiltro] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroSrm, setFiltroSrm] = useState<'todos' | 'ativa' | 'inativa' | 'nao_possui'>('todos');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('todos');

  // Aba ativa nos detalhes da escola
  const [abaDetalhe, setAbaDetalhe] = useState<'alunos' | 'profissionais' | 'diagnostico'>('alunos');
  const [buscaAlunoEscola, setBuscaAlunoEscola] = useState('');

  // Modais de Cadastro e Edição
  const [modalNovaEscola, setModalNovaEscola] = useState(false);
  const [modalEditarEscola, setModalEditarEscola] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Form State para Nova / Edição de Escola
  const [formData, setFormData] = useState<Partial<Escola>>({
    nome: '',
    codigo: '',
    municipio: 'Altamira',
    modalidade: 'REGULAR',
    srm_status: 'ativa',
    diretor_nome: '',
    cargo_responsavel: 'Diretor(a) Escolar',
    telefone: '',
    email: '',
    endereco: '',
    dificuldades_docentes: '',
    observacoes_regionais: '',
  });

  // Identifica a escola em exibição
  const escolaAtual = useMemo(() => {
    return escolas.find(e => e.id === escolaAtivaId) || escolas[0];
  }, [escolas, escolaAtivaId]);

  // Contagem por Município
  const contagemPorMunicipio = useMemo(() => {
    const contagens: Record<string, number> = {};
    MUNICIPIOS_DRE.forEach(m => { contagens[m] = 0; });
    escolas.forEach(e => {
      const muni = e.municipio || 'Altamira';
      contagens[muni] = (contagens[muni] || 0) + 1;
    });
    return contagens;
  }, [escolas]);

  // Escolas Filtradas
  const escolasFiltradas = useMemo(() => {
    return escolas.filter(esc => {
      // Se não for núcleo, só vê a própria escola
      if (!ehNucleo && minhaEscola && esc.id !== minhaEscola.id) {
        return false;
      }

      // Filtro por Município
      if (municipioFiltro !== 'todos' && esc.municipio !== municipioFiltro) {
        return false;
      }

      // Filtro por SRM
      if (filtroSrm !== 'todos') {
        if (filtroSrm === 'ativa' && esc.srm_status !== 'ativa') return false;
        if (filtroSrm === 'inativa' && esc.srm_status !== 'inativa') return false;
        if (filtroSrm === 'nao_possui' && esc.srm_status !== 'nao_possui') return false;
      }

      // Filtro por Modalidade
      if (filtroModalidade !== 'todos' && esc.modalidade !== filtroModalidade) {
        return false;
      }

      // Busca textual
      if (termoBusca.trim()) {
        const termo = termoBusca.toLowerCase();
        const nomeMatch = esc.nome.toLowerCase().includes(termo);
        const codMatch = esc.codigo.toLowerCase().includes(termo);
        const muniMatch = esc.municipio.toLowerCase().includes(termo);
        const respMatch = (esc.diretor_nome || '').toLowerCase().includes(termo);
        if (!nomeMatch && !codMatch && !muniMatch && !respMatch) return false;
      }

      return true;
    });
  }, [escolas, ehNucleo, minhaEscola, municipioFiltro, filtroSrm, filtroModalidade, termoBusca]);

  // Dados da escola atual
  const turmasDaEscola = useMemo(() => {
    return turmas.filter(t => t.escola_id === escolaAtual?.id);
  }, [turmas, escolaAtual?.id]);

  const profissionaisDaEscola = useMemo(() => {
    return profissionais.filter(p => p.escola_id === escolaAtual?.id);
  }, [profissionais, escolaAtual?.id]);

  const alunosDaEscola = useMemo(() => {
    return alunos.filter(a => a.escola_id === escolaAtual?.id);
  }, [alunos, escolaAtual?.id]);

  const alunosDaEscolaFiltrados = useMemo(() => {
    if (!buscaAlunoEscola.trim()) return alunosDaEscola;
    const t = buscaAlunoEscola.toLowerCase();
    return alunosDaEscola.filter(a => 
      a.nome.toLowerCase().includes(t) || 
      a.codigo.toLowerCase().includes(t) || 
      (a.cid || '').toLowerCase().includes(t)
    );
  }, [alunosDaEscola, buscaAlunoEscola]);

  // Estatísticas da escola atual
  const totalAlunos = alunosDaEscola.length;
  const alunosOk = alunosDaEscola.filter(a => a.status_atendimento === 'ok').length;
  const alunosPendentes = alunosDaEscola.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
  const pdiPendentes = alunosDaEscola.filter(a => a.pdi_pendente).length;

  // Abrir Modal de Nova Escola
  const handleAbrirNovaEscola = () => {
    const siglaMuni = municipioFiltro !== 'todos' ? municipioFiltro.substring(0, 3).toUpperCase() : 'DRE';
    const proximoNumero = (escolas.length + 1).toString().padStart(3, '0');
    setFormData({
      nome: '',
      codigo: `ESC-${siglaMuni}-${proximoNumero}`,
      municipio: (municipioFiltro !== 'todos' ? municipioFiltro : 'Altamira') as MunicipioDRE,
      modalidade: 'REGULAR',
      srm_status: 'ativa',
      diretor_nome: '',
      cargo_responsavel: 'Diretor(a) Escolar',
      telefone: '',
      email: '',
      endereco: '',
      dificuldades_docentes: '',
      observacoes_regionais: '',
    });
    setErroForm(null);
    setModalNovaEscola(true);
  };

  // Abrir Modal de Editar Escola
  const handleAbrirEditarEscola = () => {
    if (!escolaAtual) return;
    setFormData({
      id: escolaAtual.id,
      nome: escolaAtual.nome,
      codigo: escolaAtual.codigo,
      municipio: escolaAtual.municipio,
      modalidade: escolaAtual.modalidade || 'REGULAR',
      srm_status: escolaAtual.srm_status || (escolaAtual.possui_srm ? 'ativa' : 'nao_possui'),
      diretor_nome: escolaAtual.diretor_nome || '',
      cargo_responsavel: escolaAtual.cargo_responsavel || 'Diretor(a) Escolar',
      telefone: escolaAtual.telefone || '',
      email: escolaAtual.email || '',
      endereco: escolaAtual.endereco || '',
      dificuldades_docentes: escolaAtual.dificuldades_docentes || '',
      observacoes_regionais: escolaAtual.observacoes_regionais || '',
      qtd_alunos_laudo: escolaAtual.qtd_alunos_laudo || 0,
      qtd_alunos_sem_laudo: escolaAtual.qtd_alunos_sem_laudo || 0,
      detalhe_diagnosticos: escolaAtual.detalhe_diagnosticos || '',
    });
    setErroForm(null);
    setModalEditarEscola(true);
  };

  // Salvar Escola (Criação ou Edição)
  const handleSalvarEscolaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) {
      setErroForm('O nome da escola é obrigatório.');
      return;
    }
    if (!formData.municipio) {
      setErroForm('O município é obrigatório.');
      return;
    }

    setSalvando(true);
    setErroForm(null);

    try {
      const res = await salvarEscola(formData);
      if (res.success && res.id) {
        setEscolaAtivaId(res.id);
        setModalNovaEscola(false);
        setModalEditarEscola(false);
        setMensagemSucesso(
          formData.id 
            ? `Escola "${formData.nome}" atualizada com sucesso!` 
            : `Escola "${formData.nome}" cadastrada com sucesso na DRE!`
        );
        setTimeout(() => setMensagemSucesso(null), 5000);
      } else {
        setErroForm(res.error || 'Não foi possível salvar a escola.');
      }
    } catch (err) {
      setErroForm('Ocorreu um erro ao salvar a unidade escolar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div id="escolas-view" className="space-y-5 pb-16">
      {/* Toast de Notificação de Sucesso */}
      {mensagemSucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setMensagemSucesso(null)} 
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topo Institucional da Regional com Ação de Cadastro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              {ehNucleo ? 'Circunscrição Regional — 8 Municípios' : 'Gestão da Unidade Escolar'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {ehNucleo ? 'Escolas da Regional DRE' : 'Minha Unidade Escolar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {ehNucleo 
              ? 'Mapeamento oficial das 23 unidades estaduais, salas de recursos (SRM), corpo docente de AEE e carência de cuidadores em Altamira, Brasil Novo, Vitória do Xingu, Porto de Moz, Senador José Porfírio, Medicilândia, Anapu e Uruará.' 
              : 'Gerenciamento cadastral, salas de recursos, turmas e quadro profissional de apoio da sua unidade escolar.'}
          </p>
        </div>

        {ehNucleo && (
          <button
            id="btn-cadastrar-escola"
            type="button"
            onClick={handleAbrirNovaEscola}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Escola
          </button>
        )}
      </div>

      {/* Seletor & Filtros Multi-Município (Exclusivo Núcleo ou Visualização Ampliada) */}
      {ehNucleo && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          {/* Barra de Filtro de Município (Pílulas Horizontais com Rolagem Suave no Mobile) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Filtrar por Município da Regional ({MUNICIPIOS_DRE.length} polos)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {escolasFiltradas.length} de {escolas.length} escolas
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setMunicipioFiltro('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                  municipioFiltro === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Todos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  municipioFiltro === 'todos' ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {escolas.length}
                </span>
              </button>

              {MUNICIPIOS_DRE.map((muni) => {
                const count = contagemPorMunicipio[muni] || 0;
                const isSelected = municipioFiltro === muni;
                return (
                  <button
                    key={muni}
                    type="button"
                    onClick={() => setMunicipioFiltro(muni)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{muni}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-sky-800 text-sky-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segunda linha de filtros: Busca, SRM e Modalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
            {/* Campo de Busca Textual */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por nome, código ou responsável..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all min-h-[40px]"
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro SRM */}
            <select
              value={filtroSrm}
              onChange={(e) => setFiltroSrm(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            >
              <option value="todos">Todas as Salas de Recursos (SRM)</option>
              <option value="ativa">Com SRM em Pleno Funcionamento</option>
              <option value="inativa">Com SRM Inativa / Sem Atendimento</option>
              <option value="nao_possui">Não Possui SRM (Carência Física)</option>
            </select>

            {/* Filtro Modalidade */}
            <select
              value={filtroModalidade}
              onChange={(e) => setFiltroModalidade(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            >
              <option value="todos">Todas as Modalidades</option>
              <option value="REGULAR">Ensino Regular</option>
              <option value="INTEGRAL">Tempo Integral</option>
              <option value="SOME">SOME (Campo / Rural)</option>
              <option value="CEMEP">CEMEP</option>
              <option value="SOME/CEMEP">SOME / CEMEP</option>
            </select>
          </div>
        </div>
      )}

      {/* Grade de Escolas (Mobile First: 1 col no mobile, 2 em tablets, 3 ou 4 em desktop) */}
      {ehNucleo && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Selecione uma Escola para Visualizar a Ficha Completa ({escolasFiltradas.length})
            </span>
          </div>

          {escolasFiltradas.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma escola encontrada com os filtros atuais.</p>
              <p className="text-xs text-slate-400 mt-1">Tente remover os filtros ou cadastrar uma nova escola na regional.</p>
              <button
                type="button"
                onClick={() => {
                  setMunicipioFiltro('todos');
                  setFiltroSrm('todos');
                  setFiltroModalidade('todos');
                  setTermoBusca('');
                }}
                className="mt-3 text-xs font-bold text-sky-600 hover:text-sky-800 underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {escolasFiltradas.map((esc) => {
                const isAtiva = esc.id === escolaAtual?.id;
                const alunsEsc = alunos.filter(a => a.escola_id === esc.id);
                const pend = alunsEsc.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
                const semProf = alunsEsc.filter(a => a.status_atendimento === 'sem_professor').length;
                const semCuidador = alunsEsc.filter(a => a.status_atendimento === 'sem_acompanhante').length;

                return (
                  <button
                    key={esc.id}
                    type="button"
                    onClick={() => setEscolaAtivaId(esc.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                      isAtiva
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/30 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Linha 1: Código e Município */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {esc.codigo}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                          {esc.municipio}
                        </span>
                      </div>

                      {/* Nome da Escola */}
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                        {esc.nome}
                      </h3>

                      {/* Modalidade e Status da SRM */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {esc.modalidade && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-100">
                            {esc.modalidade}
                          </span>
                        )}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                          esc.srm_status === 'ativa' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : esc.srm_status === 'inativa'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {esc.srm_status === 'ativa' ? 'SRM Ativa' : esc.srm_status === 'inativa' ? 'SRM Inativa' : 'Sem SRM'}
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">
                        {esc.qtd_alunos_laudo ? `${esc.qtd_alunos_laudo} laudos` : `${alunsEsc.length} alunos AEE`}
                      </span>

                      {pend > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {pend} pendência{pend > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Regular
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ficha Detalhada da Escola Selecionada */}
      {escolaAtual && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header da Ficha com Ação de Editar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  <School className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
                      {escolaAtual.nome}
                    </h2>
                    <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                      {escolaAtual.codigo}
                    </span>
                    <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-700" />
                      {escolaAtual.municipio}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {escolaAtual.endereco || `${escolaAtual.municipio} - PA`}
                    </span>
                    {escolaAtual.telefone && (
                      <a 
                        href={`tel:${escolaAtual.telefone.replace(/\D/g, '')}`} 
                        className="flex items-center gap-1 text-slate-600 hover:text-sky-600"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {escolaAtual.telefone}
                      </a>
                    )}
                    {escolaAtual.email && (
                      <a 
                        href={`mailto:${escolaAtual.email}`} 
                        className="flex items-center gap-1 text-slate-600 hover:text-sky-600"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {escolaAtual.email}
                      </a>
                    )}
                    {escolaAtual.diretor_nome && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {escolaAtual.cargo_responsavel || 'Responsável'}: {escolaAtual.diretor_nome}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de Edição */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAbrirEditarEscola}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Editar Unidade
                </button>
              </div>
            </div>

            {/* Painel de Indicadores Rápidos da Escola */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Alunos com Laudo
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 block">
                  {escolaAtual.qtd_alunos_laudo || alunosDaEscola.filter(a => a.situacao_doc === 'com_laudo').length}
                </span>
                <span className="text-[10px] text-slate-400">Público da Ed. Especial</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Em Investigação
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 block">
                  {escolaAtual.qtd_alunos_sem_laudo || alunosDaEscola.filter(a => a.situacao_doc !== 'com_laudo').length}
                </span>
                <span className="text-[10px] text-slate-400">Sem laudo / Estudo caso</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Sala de Recursos
                </span>
                <span className={`text-xs sm:text-sm font-black mt-1.5 block ${
                  escolaAtual.srm_status === 'ativa' 
                    ? 'text-emerald-700' 
                    : escolaAtual.srm_status === 'inativa' 
                    ? 'text-amber-700' 
                    : 'text-rose-700'
                }`}>
                  {escolaAtual.srm_status === 'ativa' && 'Pleno Funcionamento'}
                  {escolaAtual.srm_status === 'inativa' && 'SRM Não Funciona'}
                  {escolaAtual.srm_status === 'nao_possui' && 'Não Possui SRM'}
                </span>
                <span className="text-[10px] text-slate-400">{escolaAtual.modalidade || 'Regular'}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Corpo de Apoio
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 block">
                  {profissionaisDaEscola.length}
                </span>
                <span className="text-[10px] text-slate-400">
                  {profissionaisDaEscola.filter(p => p.tipo === 'professor_aee').length} AEE • {profissionaisDaEscola.filter(p => p.tipo === 'acompanhante').length} cuidadores
                </span>
              </div>
            </div>
          </div>

          {/* Navegação por Abas da Ficha (Mobile friendly) */}
          <div className="border-b border-slate-200 px-4 sm:px-6 bg-white flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAbaDetalhe('alunos')}
              className={`py-3 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
                abaDetalhe === 'alunos'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Estudantes AEE Cadastrados ({alunosDaEscola.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaDetalhe('profissionais')}
              className={`py-3 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
                abaDetalhe === 'profissionais'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Corpo Profissional & Cuidadores ({profissionaisDaEscola.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaDetalhe('diagnostico')}
              className={`py-3 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
                abaDetalhe === 'diagnostico'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Diagnóstico DRE & Dificuldades
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div className="p-4 sm:p-6">
            {/* 1. ABA ALUNOS */}
            {abaDetalhe === 'alunos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buscaAlunoEscola}
                      onChange={(e) => setBuscaAlunoEscola(e.target.value)}
                      placeholder="Filtrar alunos desta escola por nome, CID ou código..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
                    />
                  </div>
                  {onVerAluno && (
                    <button
                      type="button"
                      onClick={() => onVerAluno('')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap min-h-[40px] flex items-center justify-center gap-1.5"
                    >
                      <span>Ver no Módulo Alunos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {alunosDaEscolaFiltrados.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">
                      Nenhum estudante AEE individual cadastrado diretamente nesta unidade no momento.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {escolaAtual.detalhe_diagnosticos 
                        ? `Diagnósticos informados no levantamento oficial: ${escolaAtual.detalhe_diagnosticos}`
                        : 'Utilize o módulo "Importar Planilha" ou adicione alunos na aba Alunos & AEE.'}
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Estudante</th>
                            <th className="py-2.5 px-3">Turma / Série</th>
                            <th className="py-2.5 px-3">CID</th>
                            <th className="py-2.5 px-3">Prof. AEE</th>
                            <th className="py-2.5 px-3">Acompanhante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {alunosDaEscolaFiltrados.map((aluno) => (
                            <tr key={aluno.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <StatusBadge status={aluno.status_atendimento} tamanho="sm" />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{aluno.nome}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{aluno.codigo}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {aluno.turma_nome || aluno.serie || 'Sem turma'}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {aluno.cid ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                    {aluno.cid}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Sem CID</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {aluno.professor_nome ? (
                                  <span className="text-purple-700 font-semibold">{aluno.professor_nome}</span>
                                ) : aluno.necessita_professor_aee ? (
                                  <span className="text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">Falta Prof.</span>
                                ) : (
                                  <span className="text-slate-400">Não requer</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {aluno.acompanhante_nome ? (
                                  <span className="text-amber-700 font-semibold">{aluno.acompanhante_nome}</span>
                                ) : aluno.necessita_acompanhante ? (
                                  <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Falta Apoio</span>
                                ) : (
                                  <span className="text-slate-400">Não requer</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ABA PROFISSIONAIS */}
            {abaDetalhe === 'profissionais' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Profissionais Lotados nesta Unidade ({profissionaisDaEscola.length})
                  </h3>
                </div>

                {profissionaisDaEscola.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">
                      Nenhum professor de AEE ou acompanhante registrado para esta unidade escolar.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Você pode cadastrar e alocar profissionais utilizando o módulo de turmas ou importar em lote.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profissionaisDaEscola.map((prof) => (
                      <div key={prof.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              prof.tipo === 'professor_aee' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prof.tipo === 'professor_aee' ? 'Professor(a) de AEE' : 'Acompanhante / Cuidador'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                              Ativo
                            </span>
                          </div>

                          <div className="font-bold text-xs sm:text-sm text-slate-900 mt-1">
                            {prof.nome}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1">
                            Matrícula: <strong className="text-slate-700">{prof.documento_ou_matricula || 'SEDUC'}</strong>
                          </div>

                          {prof.vinculo_contratual && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Vínculo: <span className="text-slate-700">{prof.vinculo_contratual}</span>
                            </div>
                          )}

                          {prof.telefone && (
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{prof.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. ABA DIAGNÓSTICO INSTITUCIONAL */}
            {abaDetalhe === 'diagnostico' && (
              <div className="space-y-4">
                <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl text-sky-950">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-sky-900">
                        Levantamento da Educação Especial — DRE Regional
                      </h4>
                      <p className="text-xs text-sky-800 mt-0.5">
                        Dados oficiais reportados pela equipe gestora e coordenação pedagógica da unidade.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diagnósticos Declarados */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Diagnósticos e CIDs Atendidos
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {escolaAtual.detalhe_diagnosticos || 'Sem descrição específica cadastrada para esta unidade.'}
                    </p>
                  </div>

                  {/* Dificuldades Relatadas pela Equipe */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Dificuldades da Equipe Docente
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {escolaAtual.dificuldades_docentes || 'Nenhuma dificuldade reportada até o momento.'}
                    </p>
                  </div>

                  {/* Observações da Regional e Carência */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Carências de Pessoal & Observações da Unidade
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {escolaAtual.observacoes_regionais || 'Nenhuma carência prioritária registrada na ficha da unidade.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Cadastrar Nova Escola */}
      {modalNovaEscola && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalNovaEscola(false);
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-nova-escola"
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 id="titulo-modal-nova-escola" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  Cadastrar Nova Escola na Regional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados cadastrais da unidade escolar para a DRE
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaEscola(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEscolaSubmit} className="p-4 sm:p-6 space-y-4">
              {erroForm && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* Nome da Escola */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Escola <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: EEE. M. Rui Barbosa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Linha: Município e Código */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Município da DRE <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.municipio}
                    onChange={(e) => {
                      const m = e.target.value as MunicipioDRE;
                      const sigla = m.substring(0, 3).toUpperCase();
                      const novoCod = formData.codigo?.startsWith('ESC-') 
                        ? `ESC-${sigla}-${formData.codigo.split('-')[2] || '001'}` 
                        : formData.codigo;
                      setFormData({ ...formData, municipio: m, codigo: novoCod });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {MUNICIPIOS_DRE.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código SEDUC / INEP
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: ESC-ALT-008"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Linha: Modalidade e SRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Modalidade de Ensino
                  </label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="REGULAR">Ensino Regular</option>
                    <option value="INTEGRAL">Tempo Integral</option>
                    <option value="SOME">SOME (Campo / Rural)</option>
                    <option value="CEMEP">CEMEP</option>
                    <option value="SOME/CEMEP">SOME / CEMEP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sala de Recursos Multifuncionais (SRM)
                  </label>
                  <select
                    value={formData.srm_status}
                    onChange={(e) => setFormData({ ...formData, srm_status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="ativa">Sim, em pleno funcionamento</option>
                    <option value="inativa">Sim, mas está inativa / sem professor</option>
                    <option value="nao_possui">Não possui SRM</option>
                  </select>
                </div>
              </div>

              {/* Diretor / Responsável e Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diretor(a) ou Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.diretor_nome}
                    onChange={(e) => setFormData({ ...formData, diretor_nome: e.target.value })}
                    placeholder="Nome completo do responsável"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo_responsavel}
                    onChange={(e) => setFormData({ ...formData, cargo_responsavel: e.target.value })}
                    placeholder="Ex: Diretor(a) Escolar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Contatos: Telefone e Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(93) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="escola@escola.seduc.pa.gov.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço / Localidade
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Ex: Av. Principal, 120 - Centro, Comunidade Sol Nascente"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Observações Regionais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observações e Carências Prioritárias
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes_regionais}
                  onChange={(e) => setFormData({ ...formData, observacoes_regionais: e.target.value })}
                  placeholder="Relato de carência de cuidadores, intérprete de LIBRAS ou condições físicas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Rodapé com Ações */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalNovaEscola(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {salvando ? 'Salvando...' : 'Salvar Escola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Escola */}
      {modalEditarEscola && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEditarEscola(false);
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-editar-escola"
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 id="titulo-modal-editar-escola" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-600" />
                  Editar Unidade Escolar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize as informações cadastrais e dados da unidade
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarEscola(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEscolaSubmit} className="p-4 sm:p-6 space-y-4">
              {erroForm && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* Nome da Escola */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Escola <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Linha: Município e Código */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Município da DRE <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value as MunicipioDRE })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {MUNICIPIOS_DRE.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código SEDUC / INEP
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Linha: Modalidade e SRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Modalidade de Ensino
                  </label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="REGULAR">Ensino Regular</option>
                    <option value="INTEGRAL">Tempo Integral</option>
                    <option value="SOME">SOME (Campo / Rural)</option>
                    <option value="CEMEP">CEMEP</option>
                    <option value="SOME/CEMEP">SOME / CEMEP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sala de Recursos Multifuncionais (SRM)
                  </label>
                  <select
                    value={formData.srm_status}
                    onChange={(e) => setFormData({ ...formData, srm_status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="ativa">Sim, em pleno funcionamento</option>
                    <option value="inativa">Sim, mas está inativa / sem atendimento</option>
                    <option value="nao_possui">Não possui SRM</option>
                  </select>
                </div>
              </div>

              {/* Diretor / Responsável e Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diretor(a) ou Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.diretor_nome}
                    onChange={(e) => setFormData({ ...formData, diretor_nome: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo_responsavel}
                    onChange={(e) => setFormData({ ...formData, cargo_responsavel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Contatos: Telefone e Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço / Localidade
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Dificuldades Docentes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dificuldades Relatadas da Equipe Docente
                </label>
                <textarea
                  rows={2}
                  value={formData.dificuldades_docentes}
                  onChange={(e) => setFormData({ ...formData, dificuldades_docentes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Observações Regionais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observações e Carências Prioritárias
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes_regionais}
                  onChange={(e) => setFormData({ ...formData, observacoes_regionais: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Rodapé com Ações */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalEditarEscola(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
