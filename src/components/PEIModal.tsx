import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { AlunoComStatus, PEIOfficial, IndicadorPEI } from '../types';
import { gerarHtmlPEI } from '../lib/documentos/geradorHtmlPEI';
import { imprimirHtml, abrirEmNovaAbaParaImpressao } from '../lib/documentos/imprimirDocumento';
import { 
  FileText, 
  Save, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  User, 
  Target, 
  Brain, 
  BookOpen, 
  HeartHandshake, 
  PenTool,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

interface PEIModalProps {
  aluno: AlunoComStatus;
  isOpen: boolean;
  onClose: () => void;
}

type SecaoPEI = 
  | 'orientacoes'
  | 'identificacao' 
  | 'indicadores' 
  | 'familiar' 
  | 'cognitivas' 
  | 'ensino' 
  | 'assinaturas';

export const PEIModal: React.FC<PEIModalProps> = ({ aluno, isOpen, onClose }) => {
  const { 
    obterPEI, 
    salvarPEI, 
    escolas, 
    currentUser, 
    turmas 
  } = useAppStore();

  const [secaoAtiva, setSecaoAtiva] = useState<SecaoPEI>('identificacao');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [modoPrevia, setModoPrevia] = useState(false);

  const escolaAluno = escolas.find(e => e.id === aluno.escola_id);
  const turmaAluno = turmas.find(t => t.id === aluno.turma_id);

  // Inicializa com PEI existente ou template oficial da COEES
  const [formData, setFormData] = useState<PEIOfficial>(() => {
    const existente = obterPEI(aluno.id);
    if (existente) return existente;

    return {
      id: '',
      aluno_id: aluno.id,
      escola_id: aluno.escola_id,
      ano_letivo: new Date().getFullYear(),
      status: 'vigente',
      data_elaboracao: new Date().toISOString().split('T')[0],
      periodo_execucao: `Ano Letivo ${new Date().getFullYear()} (1º e 2º Semestres)`,
      identificacao: {
        nome: aluno.nome,
        idade: String(aluno.idade_calculada || aluno.idade_informada || ''),
        data_nascimento: aluno.data_nascimento || '',
        ano_etapa: aluno.serie || '',
        turma: turmaAluno?.nome || '',
        ano_ingresso: new Date().getFullYear(),
        atendido_aee: aluno.necessita_professor_aee || aluno.professor_nome ? 'sim' : 'nao',
        outras_necessidades: '',
        local_aee: escolaAluno?.possui_srm ? 'srm' : 'caee',
        caee_qual: '',
      },
      indicadores: [
        {
          id: 'ind-1',
          problema_central: 'Dificuldade de concentração e retenção em atividades expositivas puramente verbais.',
          causas: 'Necessidade de recursos visuais, pausas programadas e ancoragem em conteúdos concretos.',
          consequencias: 'Fadiga cognitiva e dispersão da atenção em avaliações e tarefas extensas.',
        }
      ],
      contexto_familiar: {
        dados_responsaveis: 'Responsáveis legais participativos com comunicação assídua com a escola.',
        historico_vida: 'Trajetória escolar acompanhada com suporte pedagógico e atendimentos em saúde.',
        expectativa_familiar: 'Curto prazo: desenvolvimento da autonomia e socialização. Médio e longo prazo: conclusão regular dos estudos com transição para o ensino superior/mundo do trabalho.',
      },
      areas_desenvolvimento: {
        percepcao: 'Boa percepção visual para imagens e mapas conceituais.',
        atencao_concentracao: 'Mantém atenção em atividades interativas; requer mediação em conteúdos puramente abstratos.',
        memoria: 'Memória visual preservada; assimilação por meio de rotinas e listas estruturadas.',
        linguagem: 'Comunicação verbal funcional na oralidade e escrita, com necessidade de enunciados diretos.',
        raciocinio_logico: 'Compreende operações com apoio de materiais e ferramentas computacionais.',
        aspectos_psicomotores: 'Adequados para a faixa etária.',
        atividade_vida_autonoma: 'Autonomia para locomoção, uso do banheiro e alimentação.',
        aspectos_interpessoais_sociais: 'Interage respeitosamente com colegas e professores; responde positivamente a elogios e incentivos pedagógicos.',
      },
      ensino_individualizado: {
        objetivos_aprendizagem: 'Apropriar-se dos objetos de conhecimento da turma de acordo com a BNCC e o currículo do Estado do Pará, com flexibilização de metas e ritmo de aprendizagem.',
        avaliacao_aprendizagem: 'Avaliação processual formativa; permissão de tempo ampliado (+1h) para provas; enunciados segmentados e instrumentos diversificados (seminários, produções visuais, trabalhos em duplas).',
        tipos_apoio: aluno.necessita_acompanhante ? 'Atendimento no AEE (SRM) no contraturno e mediação em sala regular por Acompanhante Especializado.' : 'Atendimento no AEE (SRM) em dias agendados no contraturno.',
        projeto_vida: aluno.ciclo === 2 || aluno.serie?.toLowerCase().includes('médio') ? 'Desenvolvimento de projetos interdisciplinares, vocação tecnológica e preparação para o ENEM acessível.' : '',
      },
      assinaturas: {
        local: escolaAluno?.municipio ? `${escolaAluno.municipio} - PA` : 'Altamira - PA',
        data: new Date().toISOString().split('T')[0],
        professor_saee: aluno.professor_nome || currentUser.nome,
        responsavel_pedagogico: currentUser.nome,
        professores_turma: ['Professor(a) Regente da Turma'],
      },
    };
  });

  useEffect(() => {
    const existente = obterPEI(aluno.id);
    if (existente) {
      setFormData(existente);
    }
  }, [aluno.id, obterPEI]);

  if (!isOpen) return null;

  const handleSalvar = async (statusFinal: 'vigente' | 'rascunho' | 'encerrado' = 'vigente') => {
    setSalvando(true);
    setMensagemSucesso('');
    try {
      const res = await salvarPEI({
        ...formData,
        status: statusFinal,
        aluno_id: aluno.id,
        escola_id: aluno.escola_id,
      });

      if (res.success) {
        setMensagemSucesso(statusFinal === 'vigente' ? 'PEI oficial validado e registrado como VIGENTE!' : 'Alterações do PEI salvas com sucesso!');
        setTimeout(() => setMensagemSucesso(''), 3500);
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleAdicionarIndicador = () => {
    const novo: IndicadorPEI = {
      id: `ind-${Date.now()}`,
      problema_central: '',
      causas: '',
      consequencias: '',
    };
    setFormData(p => ({
      ...p,
      indicadores: [...p.indicadores, novo]
    }));
  };

  const handleRemoverIndicador = (id: string) => {
    setFormData(p => ({
      ...p,
      indicadores: p.indicadores.filter(i => i.id !== id)
    }));
  };

  const handleImprimir = () => {
    const html = gerarHtmlPEI(formData);
    imprimirHtml(html, `PEI_${aluno.nome.replace(/\s+/g, '_')}`);
  };

  const handleAbrirAbaImpressao = () => {
    const html = gerarHtmlPEI(formData);
    abrirEmNovaAbaParaImpressao(html, `PEI_${aluno.nome.replace(/\s+/g, '_')}`);
  };

  const secoesMenu = [
    { id: 'orientacoes', label: 'Orientações PEI', icone: AlertCircle },
    { id: 'identificacao', label: '1. Identificação & AEE', icone: User },
    { id: 'indicadores', label: '2. Indicadores (Tabela)', icone: Target },
    { id: 'familiar', label: '3. Contexto Familiar', icone: HeartHandshake },
    { id: 'cognitivas', label: '4. Áreas de Desenvolvimento', icone: Brain },
    { id: 'ensino', label: '5. Ensino Individualizado', icone: BookOpen },
    { id: 'assinaturas', label: 'Assinaturas & Validação', icone: PenTool },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Cabeçalho Oficial do Modal */}
        <div className="bg-sky-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-sky-900 print:bg-white print:text-black print:border-b-2 print:border-black print:p-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 print:hidden">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 print:text-slate-700">
                Governo do Estado do Pará • SEDUC • COEES
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white print:text-black">
                Plano Educacional Individualizado — PEI
              </h2>
              <div className="text-xs text-sky-200 print:text-slate-600">
                Estudante: <strong className="text-white print:text-black">{aluno.nome}</strong> • Ano Letivo: {formData.ano_letivo}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {/* Alternador de Visualização Prévia / Edição */}
            <button
              type="button"
              onClick={() => setModoPrevia(!modoPrevia)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                modoPrevia
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-sky-900 hover:bg-sky-800 text-sky-100 border-sky-800'
              }`}
              title={modoPrevia ? "Voltar ao Formulário de Edição" : "Ver documento final formatado para impressão"}
            >
              {modoPrevia ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
              <span>{modoPrevia ? 'Editar Formulário' : 'Visualizar Documento'}</span>
            </button>

            {/* Imprimir Modelo Oficial */}
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
              title="Imprimir PEI Oficial formatado para prontuário escolar (SEDUC-PA)"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Modelo Oficial</span>
            </button>

            {/* Abrir em Nova Aba */}
            <button
              type="button"
              onClick={handleAbrirAbaImpressao}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-800 transition-colors"
              title="Abrir em nova aba para salvar como PDF ou imprimir em tela cheia"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nova Aba</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-900 transition-colors"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {mensagemSucesso && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{mensagemSucesso}</span>
            </div>
            <span className="text-[10px] text-emerald-600">Sincronizado</span>
          </div>
        )}

        {/* MODO PREVIEW: Exibe o Documento Oficial PEI Renderizado */}
        {modoPrevia ? (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-200/70 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden flex flex-col mb-4">
              <div className="bg-sky-950 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold">
                <span>Visualização Prévia — Plano Educacional Individualizado (PEI) • SEDUC-PA</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImprimir}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Agora</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAbrirAbaImpressao}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-900 hover:bg-sky-800 text-sky-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Aba</span>
                  </button>
                </div>
              </div>
              <iframe
                title="Pré-visualização do PEI"
                srcDoc={gerarHtmlPEI(formData)}
                className="w-full h-[70vh] border-0"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Abas de Navegação das Seções do PEI */}
            <div className="bg-slate-100 border-b border-slate-200 px-2 py-1.5 overflow-x-auto flex gap-1 print:hidden shrink-0">
              {secoesMenu.map((m) => {
                const Icone = m.icone;
                const ativo = secaoAtiva === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSecaoAtiva(m.id as SecaoPEI)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      ativo 
                        ? 'bg-sky-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/70'
                    }`}
                  >
                    <Icone className={`w-3.5 h-3.5 ${ativo ? 'text-white' : 'text-slate-500'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo do Formulário */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:overflow-visible print:p-0 print:space-y-4">

          {/* Cabeçalho Visual de Papel Timbrado SEDUC na Impressão */}
          <div className="hidden print:block text-center border-b-2 border-slate-800 pb-3 mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Governo do Estado do Pará • Secretaria de Estado de Educação (SEDUC)
            </div>
            <div className="text-[9px] uppercase text-slate-600">
              Secretaria Adjunta de Educação Básica • Diretoria de Diversidade e Inclusão
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 mt-1">
              Coordenadoria de Educação Especial — COEES
            </div>
            <h1 className="text-base font-black uppercase text-slate-900 mt-2 underline">
              Plano Educacional Individualizado — PEI
            </h1>
          </div>

          {/* ORIENTAÇÕES COEES */}
          {(secaoAtiva === 'orientacoes' || false) && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-950 space-y-2.5 text-xs leading-relaxed">
              <h3 className="font-black text-sky-900 uppercase flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-sky-600" />
                Orientações Oficiais da COEES / SEDUC-PA para o PEI
              </h3>
              <p>
                O Plano Educacional Individualizado (PEI) deve ser construído de forma <strong>colaborativa</strong> entre os professores da sala de aula comum, o(a) professor(a) do AEE e a equipe pedagógica.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sky-900/90 pl-1">
                <li>O PEI deve ser aplicado no dia a dia da sala de aula comum, com flexibilização de metas, tempos e metodologias.</li>
                <li>As metas e objetivos de aprendizagem devem estar alinhados ao planejamento da turma e à BNCC/Currículo Estadual.</li>
                <li>O plano deve ser reavaliado no mínimo ao final de cada semestre letivo para mensurar o desenvolvimento do estudante.</li>
              </ul>
            </div>
          )}

          {/* 1. IDENTIFICAÇÃO DO ESTUDANTE */}
          <div className={`${secaoAtiva === 'identificacao' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">1</span>
                Identificação do Estudante
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nome do Estudante:</label>
                <input
                  type="text"
                  value={formData.identificacao.nome}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, nome: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data de Nascimento / Idade:</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.identificacao.data_nascimento}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      identificacao: { ...p.identificacao, data_nascimento: e.target.value }
                    }))}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.identificacao.idade}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      identificacao: { ...p.identificacao, idade: e.target.value }
                    }))}
                    placeholder="Idade"
                    className="w-16 px-2 py-2 rounded-lg border border-slate-300 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ano / Etapa e Turma:</label>
                <input
                  type="text"
                  value={`${formData.identificacao.ano_etapa} - ${formData.identificacao.turma}`}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, turma: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ano de Ingresso na Escola:</label>
                <input
                  type="text"
                  value={formData.identificacao.ano_ingresso}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, ano_ingresso: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Período de Execução do Plano:</label>
                <input
                  type="text"
                  value={formData.periodo_execucao}
                  onChange={(e) => setFormData(p => ({ ...p, periodo_execucao: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-sky-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Estudante atendido no AEE?</label>
                <div className="flex gap-4 items-center mt-1">
                  {['sim', 'nao', 'outras'].map((op) => (
                    <label key={op} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="atendido_aee"
                        value={op}
                        checked={formData.identificacao.atendido_aee === op}
                        onChange={() => setFormData(p => ({
                          ...p,
                          identificacao: { ...p.identificacao, atendido_aee: op as any }
                        }))}
                        className="w-4 h-4 text-sky-600"
                      />
                      <span>{op === 'sim' ? 'Sim' : op === 'nao' ? 'Não' : 'Outras necessidades específicas'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Local do AEE:</label>
                <div className="flex gap-4 items-center mt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="local_aee"
                      value="srm"
                      checked={formData.identificacao.local_aee === 'srm'}
                      onChange={() => setFormData(p => ({
                        ...p,
                        identificacao: { ...p.identificacao, local_aee: 'srm' }
                      }))}
                      className="w-4 h-4 text-sky-600"
                    />
                    <span>Sala de Recursos Multifuncionais (SRM)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="local_aee"
                      value="caee"
                      checked={formData.identificacao.local_aee === 'caee'}
                      onChange={() => setFormData(p => ({
                        ...p,
                        identificacao: { ...p.identificacao, local_aee: 'caee' }
                      }))}
                      className="w-4 h-4 text-sky-600"
                    />
                    <span>CAEE</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 2. INDICADORES PARA O PLANO EDUCACIONAL INDIVIDUALIZADO (TABELA DINÂMICA) */}
          <div className={`${secaoAtiva === 'indicadores' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">2</span>
                  Indicadores para o Plano Educacional Individualizado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabela Oficial de Análise Causal: Mapeamento de problemas, causas pedagógicas/ambientais e consequências.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdicionarIndicador}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase text-[11px] font-black border-b border-slate-200">
                    <th className="p-3 w-1/3">Problema Central</th>
                    <th className="p-3 w-1/3">Causas</th>
                    <th className="p-3 w-1/3">Consequências</th>
                    <th className="p-3 w-10 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formData.indicadores.map((ind, idx) => (
                    <tr key={ind.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 align-top">
                        <textarea
                          rows={2}
                          value={ind.problema_central}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => ({
                              ...p,
                              indicadores: p.indicadores.map(i => i.id === ind.id ? { ...i, problema_central: val } : i)
                            }));
                          }}
                          placeholder="Ex: Fadiga e desatenção em atividades expositivas..."
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2.5 align-top">
                        <textarea
                          rows={2}
                          value={ind.causas}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => ({
                              ...p,
                              indicadores: p.indicadores.map(i => i.id === ind.id ? { ...i, causas: val } : i)
                            }));
                          }}
                          placeholder="Ex: Sobrecarga sensorial acústica..."
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2.5 align-top">
                        <textarea
                          rows={2}
                          value={ind.consequencias}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => ({
                              ...p,
                              indicadores: p.indicadores.map(i => i.id === ind.id ? { ...i, consequencias: val } : i)
                            }));
                          }}
                          placeholder="Ex: Queda no rendimento escolar..."
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2.5 align-middle text-center print:hidden">
                        {formData.indicadores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoverIndicador(ind.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Remover linha de indicador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. RELATO DO CONTEXTO FAMILIAR */}
          <div className={`${secaoAtiva === 'familiar' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">3</span>
                Relato do Contexto Familiar
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dados dos Responsáveis:</label>
                <input
                  type="text"
                  value={formData.contexto_familiar.dados_responsaveis}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    contexto_familiar: { ...p.contexto_familiar, dados_responsaveis: e.target.value }
                  }))}
                  placeholder="Nome dos responsáveis, vínculos e contatos prioritários..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Histórico de Vida do Estudante:</label>
                <textarea
                  rows={3}
                  value={formData.contexto_familiar.historico_vida}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    contexto_familiar: { ...p.contexto_familiar, historico_vida: e.target.value }
                  }))}
                  placeholder="Marcos do desenvolvimento, diagnósticos prévios, tratamentos e histórico formativo..."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expectativa Familiar (a curto, médio e longo prazo):</label>
                <textarea
                  rows={3}
                  value={formData.contexto_familiar.expectativa_familiar}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    contexto_familiar: { ...p.contexto_familiar, expectativa_familiar: e.target.value }
                  }))}
                  placeholder="Quais as expectativas da família em relação ao desenvolvimento, autonomia e futuro do estudante?"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* 4. ÁREAS DE DESENVOLVIMENTO (FUNÇÕES COGNITIVAS) */}
          <div className={`${secaoAtiva === 'cognitivas' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">4</span>
                Áreas de Desenvolvimento (Funções Cognitivas)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { key: 'percepcao', label: 'Percepção:', placeholder: 'Auditiva, visual, espacial, tátil...' },
                { key: 'atencao_concentracao', label: 'Atenção / Concentração:', placeholder: 'Sustentada, seletiva, alternada...' },
                { key: 'memoria', label: 'Memória:', placeholder: 'Curto e longo prazo, visual, auditiva...' },
                { key: 'linguagem', label: 'Linguagem (Oral / Escrita / Não verbal):', placeholder: 'Expressão, vocabulário, compreensão, Libras...' },
                { key: 'raciocinio_logico', label: 'Raciocínio Lógico-Matemático:', placeholder: 'Sequenciação, classificação, cálculo, resolução...' },
                { key: 'aspectos_psicomotores', label: 'Aspectos Psicomotores:', placeholder: 'Coordenação motora fina/ampla, lateralidade...' },
                { key: 'atividade_vida_autonoma', label: 'Atividade de Vida Autônoma (AVA):', placeholder: 'Alimentação, higiene, locomoção, independência...' },
                { key: 'aspectos_interpessoais_sociais', label: 'Aspectos Interpessoais / Afetivo e Sociais:', placeholder: 'Relação com colegas, professores, regulação emocional...' },
              ].map((area) => (
                <div key={area.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <label className="block font-bold text-slate-800 text-[11px] uppercase">{area.label}</label>
                  <textarea
                    rows={2}
                    value={(formData.areas_desenvolvimento as any)[area.key]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(p => ({
                        ...p,
                        areas_desenvolvimento: { ...p.areas_desenvolvimento, [area.key]: val }
                      }));
                    }}
                    placeholder={area.placeholder}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 5. ENSINO INDIVIDUALIZADO (BNCC / CURRÍCULO ESTADUAL) */}
          <div className={`${secaoAtiva === 'ensino' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">5</span>
                Ensino Individualizado (BNCC / Currículo Estadual)
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/30 space-y-1.5">
                <label className="block font-black text-sky-950 uppercase text-[11px]">
                  A — Objetivos de Aprendizagem / Desenvolvimento (Acadêmicos e Socioemocionais):
                </label>
                <textarea
                  rows={3}
                  value={formData.ensino_individualizado.objetivos_aprendizagem}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    ensino_individualizado: { ...p.ensino_individualizado, objetivos_aprendizagem: e.target.value }
                  }))}
                  placeholder="Quais as habilidades e conteúdos essenciais que o estudante desenvolverá ao longo do período letivo?"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1.5">
                <label className="block font-black text-emerald-950 uppercase text-[11px]">
                  B — Avaliação de Aprendizagem (Como o estudante será avaliado):
                </label>
                <textarea
                  rows={3}
                  value={formData.ensino_individualizado.avaliacao_aprendizagem}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    ensino_individualizado: { ...p.ensino_individualizado, avaliacao_aprendizagem: e.target.value }
                  }))}
                  placeholder="Critérios diferenciados, tempo ampliado, uso de recursos acessíveis e instrumentos formativos..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 space-y-1.5">
                <label className="block font-black text-purple-950 uppercase text-[11px]">
                  C — Tipos de Apoio:
                </label>
                <textarea
                  rows={2}
                  value={formData.ensino_individualizado.tipos_apoio}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    ensino_individualizado: { ...p.ensino_individualizado, tipos_apoio: e.target.value }
                  }))}
                  placeholder="Atendimento educacional na SRM, materiais adaptados, acompanhante especializado..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-1.5">
                <label className="block font-black text-amber-950 uppercase text-[11px]">
                  D — Projeto de Vida (Estudante do Ensino Médio):
                </label>
                <textarea
                  rows={2}
                  value={formData.ensino_individualizado.projeto_vida || ''}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    ensino_individualizado: { ...p.ensino_individualizado, projeto_vida: e.target.value }
                  }))}
                  placeholder="Expectativas e direcionamentos de formação profissional, itinerários e continuidade de estudos..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* ASSINATURAS E LOCALIZAÇÃO */}
          <div className={`${secaoAtiva === 'assinaturas' ? 'block' : 'hidden'} print:block space-y-5`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-900 text-white inline-flex items-center justify-center text-xs">✔</span>
                Validação e Assinaturas Oficiais
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Local:</label>
                <input
                  type="text"
                  value={formData.assinaturas.local}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    assinaturas: { ...p.assinaturas, local: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data:</label>
                <input
                  type="date"
                  value={formData.assinaturas.data}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    assinaturas: { ...p.assinaturas, data: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Linhas de Assinatura Oficiais */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Professor(a) do SAEE / AEE</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Equipe Pedagógica / Coord.</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Professor(a) da Turma (1)</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Professor(a) da Turma (2)</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>
            </div>
          </div>

        </div>
          </>
        )}

        {/* Rodapé de Ações */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
              formData.status === 'vigente'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {formData.status === 'vigente' ? 'PEI Vigente' : 'Rascunho'}
            </span>
            <span className="text-slate-500">Padrão COEES / SEDUC-PA</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors"
              title="Imprimir documento em papel timbrado oficial"
            >
              <Printer className="w-3.5 h-3.5 text-sky-700" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleSalvar('rascunho')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Salvar Rascunho</span>
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleSalvar('vigente')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validar PEI como Vigente</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
