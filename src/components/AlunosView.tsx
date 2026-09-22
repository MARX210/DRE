import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { AlunoComStatus, SituacaoDoc, SexoTipo, StatusAtendimento, MUNICIPIOS_DRE } from '../types';
import { StatusBadge } from './StatusBadge';
import { LegendaSemaforo } from './LegendaSemaforo';
import { AlunoModal } from './AlunoModal';
import { EstudoDeCasoModal } from './EstudoDeCasoModal';
import { PEIModal } from './PEIModal';
import { exportarAlunosExcel } from '../lib/import/excel';
import { 
  Search, 
  Plus, 
  Download, 
  Filter, 
  GraduationCap, 
  FileText, 
  FileSpreadsheet,
  CheckCircle2, 
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown
} from 'lucide-react';

interface AlunosViewProps {
  filtroStatusInicial?: StatusAtendimento | 'todos';
  onLimparFiltroInicial?: () => void;
}

export const AlunosView: React.FC<AlunosViewProps> = ({ 
  filtroStatusInicial = 'todos',
  onLimparFiltroInicial 
}) => {
  const { alunos, escolas, turmas, ehNucleo, minhaEscola, inativarAluno } = useAppStore();

  // Estados de Filtros e Busca
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusAtendimento | 'todos'>(filtroStatusInicial);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [filtroEscola, setFiltroEscola] = useState<string>('todas');
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todas');
  const [filtroCiclo, setFiltroCiclo] = useState<string>('todos');

  // Estado do Modal de Cadastro / Detalhes
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoComStatus | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [abaInicialModal, setAbaInicialModal] = useState<'dados' | 'atendimento' | 'documentos' | 'pdi'>('dados');

  // Estados dos Modais Oficiais COEES
  const [alunoParaEstudo, setAlunoParaEstudo] = useState<AlunoComStatus | null>(null);
  const [alunoParaPEI, setAlunoParaPEI] = useState<AlunoComStatus | null>(null);

  // Atualiza filtro se a prop mudar
  React.useEffect(() => {
    setFiltroStatus(filtroStatusInicial);
  }, [filtroStatusInicial]);

  // Escolas disponíveis conforme o município
  const escolasFiltradasDropdown = useMemo(() => {
    if (filtroMunicipio === 'todos') return escolas;
    return escolas.filter(e => e.municipio === filtroMunicipio);
  }, [escolas, filtroMunicipio]);

  // Filtragem dos Alunos
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) => {
      // Busca por texto (nome, código, CID, processo)
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = a.nome.toLowerCase().includes(termo);
        const matchCodigo = a.codigo.toLowerCase().includes(termo);
        const matchCid = a.cid ? a.cid.toLowerCase().includes(termo) : false;
        const matchProcesso = a.numero_processo ? a.numero_processo.toLowerCase().includes(termo) : false;
        if (!matchNome && !matchCodigo && !matchCid && !matchProcesso) return false;
      }

      // Filtro de Status Semáforo
      if (filtroStatus !== 'todos' && a.status_atendimento !== filtroStatus) {
        return false;
      }

      // Filtro de Município (para Núcleo)
      if (ehNucleo && filtroMunicipio !== 'todos') {
        const esc = escolas.find(e => e.id === a.escola_id);
        if (esc?.municipio !== filtroMunicipio) return false;
      }

      // Filtro de Escola (para Núcleo)
      if (ehNucleo && filtroEscola !== 'todas' && a.escola_id !== filtroEscola) {
        return false;
      }

      // Filtro de Situação Documental
      if (filtroSituacao !== 'todas' && a.situacao_doc !== filtroSituacao) {
        return false;
      }

      // Filtro de Ciclo
      if (filtroCiclo !== 'todos' && String(a.ciclo) !== filtroCiclo) {
        return false;
      }

      return true;
    });
  }, [alunos, busca, filtroStatus, filtroMunicipio, filtroEscola, filtroSituacao, filtroCiclo, ehNucleo, escolas]);

  const handleNovoAluno = () => {
    setAlunoSelecionado(null);
    setModoEdicao(true);
    setAbaInicialModal('dados');
    setModalAberto(true);
  };

  const handleVisualizar = (aluno: AlunoComStatus, aba: 'dados' | 'atendimento' | 'documentos' | 'pdi' = 'dados') => {
    setAlunoSelecionado(aluno);
    setModoEdicao(false);
    setAbaInicialModal(aba);
    setModalAberto(true);
  };

  const handleEditar = (aluno: AlunoComStatus) => {
    setAlunoSelecionado(aluno);
    setModoEdicao(true);
    setAbaInicialModal('dados');
    setModalAberto(true);
  };

  const handleExcluir = async (aluno: AlunoComStatus) => {
    if (confirm(`Tem certeza que deseja inativar a matrícula do aluno ${aluno.nome}? Esta ação será registrada no log de auditoria.`)) {
      await inativarAluno(aluno.id);
    }
  };

  return (
    <div id="alunos-view" className="space-y-5 pb-12">
      {/* Topo da Tela com Título e Ação de Novo Aluno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Alunos e Atendimento Especializado (AEE)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              {alunosFiltrados.length} {alunosFiltrados.length === 1 ? 'estudante' : 'estudantes'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {ehNucleo
              ? 'Acompanhamento regional de todos os alunos da Educação Especial cadastrados pelas escolas da DRE Altamira.'
              : `Cadastro e alimentação contínua dos alunos e profissionais da ${minhaEscola?.nome || 'sua escola'}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            id="btn-exportar-alunos-excel"
            onClick={() => exportarAlunosExcel(alunosFiltrados, 'Alunos_AEE_SEDUC_Altamira.xlsx')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </button>

          <button
            type="button"
            id="btn-novo-aluno"
            onClick={handleNovoAluno}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Aluno
          </button>
        </div>
      </div>

      {/* Legenda Fixa do Semáforo no Topo da Listagem */}
      <LegendaSemaforo
        filtroAtivo={filtroStatus}
        onSelecionarFiltro={(status) => {
          setFiltroStatus(status);
          if (status === 'todos' && onLimparFiltroInicial) onLimparFiltroInicial();
        }}
      />

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${ehNucleo ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-3`}>
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              id="input-busca-alunos"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, código, CID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Filtro Município (se Núcleo) */}
          {ehNucleo && (
            <div>
              <select
                id="filtro-municipio-select"
                value={filtroMunicipio}
                onChange={(e) => {
                  setFiltroMunicipio(e.target.value);
                  setFiltroEscola('todas');
                }}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
              >
                <option value="todos">Todos os Municípios</option>
                {MUNICIPIOS_DRE.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Escola (se Núcleo) */}
          {ehNucleo && (
            <div>
              <select
                id="filtro-escola-select"
                value={filtroEscola}
                onChange={(e) => setFiltroEscola(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
              >
                <option value="todas">Todas as Escolas ({escolasFiltradasDropdown.length})</option>
                {escolasFiltradasDropdown.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Situação Documental */}
          <div>
            <select
              id="filtro-situacao-select"
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="todas">Todas as Situações Doc.</option>
              <option value="com_laudo">Com Laudo Homologado</option>
              <option value="estudo_de_caso">Estudo de Caso Pedagógico</option>
              <option value="sem_laudo">Sem Laudo / Triagem</option>
            </select>
          </div>

          {/* Filtro de Ciclo */}
          <div>
            <select
              id="filtro-ciclo-select"
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os Ciclos</option>
              <option value="1">1º Ciclo (Fundamental)</option>
              <option value="2">2º Ciclo (Médio)</option>
              <option value="3">3º Ciclo (Médio Final)</option>
            </select>
          </div>
        </div>

        {/* Indicador de Filtros Ativos */}
        {(busca || filtroStatus !== 'todos' || filtroMunicipio !== 'todos' || filtroEscola !== 'todas' || filtroSituacao !== 'todas' || filtroCiclo !== 'todos') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Filtrando <strong>{alunosFiltrados.length}</strong> de {alunos.length} alunos
            </span>
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setFiltroStatus('todos');
                setFiltroMunicipio('todos');
                setFiltroEscola('todas');
                setFiltroSituacao('todas');
                setFiltroCiclo('todos');
                if (onLimparFiltroInicial) onLimparFiltroInicial();
              }}
              className="text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Alunos com Semáforo de Cores */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="tabela-alunos" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Status do Semáforo</th>
                <th className="py-3 px-3">Estudante</th>
                <th className="py-3 px-3">Escola / Turma</th>
                <th className="py-3 px-3">CID / Diagnóstico</th>
                <th className="py-3 px-3">Profissionais Vinculados</th>
                <th className="py-3 px-3 text-center">PDI</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Nenhum aluno encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                alunosFiltrados.map((aluno) => {
                  return (
                    <tr 
                      key={aluno.id}
                      id={`aluno-row-${aluno.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Status do Semáforo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={aluno.status_atendimento} tamanho="sm" />
                      </td>

                      {/* Nome, Código e Idade */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{aluno.nome}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{aluno.codigo}</span>
                          {aluno.idade_calculada !== undefined && (
                            <>
                              <span>•</span>
                              <span>{aluno.idade_calculada} anos</span>
                            </>
                          )}
                          {aluno.sexo && (
                            <>
                              <span>•</span>
                              <span>{aluno.sexo === 'M' ? 'Masc.' : 'Fem.'}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Escola e Turma */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 line-clamp-1">{aluno.escola_nome}</span>
                          {aluno.escola_municipio && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 shrink-0">
                              {aluno.escola_municipio}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {aluno.turma_nome} {aluno.serie && `(${aluno.serie})`}
                        </div>
                      </td>

                      {/* CID e Situação Documental */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {aluno.cid ? aluno.cid : <span className="text-slate-400 italic">Sem CID</span>}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm ${
                            aluno.situacao_doc === 'com_laudo'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : aluno.situacao_doc === 'estudo_de_caso'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {aluno.situacao_doc === 'com_laudo' ? 'Com Laudo' : aluno.situacao_doc === 'estudo_de_caso' ? 'Estudo de Caso' : 'Sem Laudo'}
                          </span>
                        </div>
                        {aluno.numero_processo && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            Proc.: {aluno.numero_processo}
                          </div>
                        )}
                      </td>

                      {/* Profissionais de Atendimento */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">AEE:</span>
                            <span className={aluno.professor_nome ? 'text-slate-900 font-semibold' : 'text-purple-600 font-bold'}>
                              {aluno.professor_nome || (aluno.necessita_professor_aee ? 'Falta Professor' : 'Não necessita')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">Acomp.:</span>
                            <span className={aluno.acompanhante_nome ? 'text-slate-900 font-semibold' : 'text-amber-600 font-bold'}>
                              {aluno.acompanhante_nome || (aluno.necessita_acompanhante ? 'Falta Acompanhante' : 'Não necessita')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Selo PDI */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {aluno.pdi_pendente ? (
                          <button
                            type="button"
                            onClick={() => handleVisualizar(aluno, 'pdi')}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pendente
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVisualizar(aluno, 'pdi')}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Vigente
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVisualizar(aluno)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-sky-600 transition-colors"
                            title="Visualizar ficha e documentos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditar(aluno)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                            title="Editar dados do aluno"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(aluno)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                            title="Inativar matrícula"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes / Edição / Cadastro do Aluno */}
      {modalAberto && (
        <AlunoModal
          aluno={alunoSelecionado}
          modoEdicao={modoEdicao}
          abaInicial={abaInicialModal}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
};
