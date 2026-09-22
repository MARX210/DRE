import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { AlunoComStatus, EstudoDeCaso, IndicadorAvaliacao } from '../types';
import { gerarHtmlEstudoDeCaso } from '../lib/documentos/geradorHtmlEstudoDeCaso';
import { imprimirHtml, abrirEmNovaAbaParaImpressao } from '../lib/documentos/imprimirDocumento';
import { 
  FileSpreadsheet, 
  Save, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Users, 
  School, 
  History, 
  Activity, 
  HeartHandshake, 
  Award, 
  Send,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

interface EstudoDeCasoModalProps {
  aluno: AlunoComStatus;
  isOpen: boolean;
  onClose: () => void;
}

type SecaoAtiva = 
  | 'orientacoes'
  | 'identificacao' 
  | 'familia' 
  | 'escolas' 
  | 'historico' 
  | 'avaliacao_inicial' 
  | 'pedagogicos' 
  | 'apoios_saee' 
  | 'plano_atendimento' 
  | 'consideracoes';

export const EstudoDeCasoModal: React.FC<EstudoDeCasoModalProps> = ({ aluno, isOpen, onClose }) => {
  const { 
    obterEstudoDeCaso, 
    salvarEstudoDeCaso, 
    escolas, 
    currentUser, 
    turmas 
  } = useAppStore();

  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>('identificacao');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [modoPrevia, setModoPrevia] = useState(false);

  // Escola do aluno
  const escolaAluno = escolas.find(e => e.id === aluno.escola_id);
  const turmaAluno = turmas.find(t => t.id === aluno.turma_id);

  // Inicializa formulário com dados existentes ou template preenchido
  const [formData, setFormData] = useState<EstudoDeCaso>(() => {
    const existente = obterEstudoDeCaso(aluno.id);
    if (existente) return existente;

    return {
      id: '',
      aluno_id: aluno.id,
      escola_id: aluno.escola_id,
      data_preenchimento: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      identificacao: {
        nome: aluno.nome,
        data_nascimento: aluno.data_nascimento || '',
        idade: String(aluno.idade_calculada || aluno.idade_informada || ''),
        responsavel: '',
        telefone: '',
        endereco: aluno.endereco || '',
        numero: '',
        bairro: '',
        complemento: '',
        cep: '',
        cidade: escolaAluno?.municipio || 'Altamira',
        estado: 'PA',
      },
      familia: {
        genitor: { nome: '', profissao: '', telefone: '', escolaridade: '' },
        genitora: { nome: '', profissao: '', telefone: '', escolaridade: '' },
        outros_responsaveis: {
          nome: '',
          profissao: '',
          telefone: '',
          parentesco: '',
          escolaridade: '',
          endereco_residencial: '',
          bairro: '',
          municipio: escolaAluno?.municipio || 'Altamira',
        },
      },
      escola_1_matricula: {
        nome_escola: escolaAluno?.nome || '',
        endereco: escolaAluno?.endereco || '',
        telefone_escola: escolaAluno?.telefone || '',
        dre: 'DRE Altamira (Transamazônica)',
        diretor: escolaAluno?.diretor_nome || '',
        telefone_diretor: escolaAluno?.telefone || '',
        ano_etapa: aluno.serie || '',
        turma: turmaAluno?.nome || '',
        turno: turmaAluno?.turno === 'M' ? 'Matutino' : turmaAluno?.turno === 'V' ? 'Vespertino' : turmaAluno?.turno === 'N' ? 'Noturno' : 'Integral',
        quantitativo_estudantes: 30,
      },
      escola_2_aee: {
        nome: escolaAluno?.possui_srm ? `${escolaAluno.nome} - Sala de Recursos Multifuncionais` : '',
        telefone: escolaAluno?.telefone || '',
        endereco: escolaAluno?.endereco || '',
        ure_use: 'DRE Altamira',
        bairro: '',
        municipio: escolaAluno?.municipio || 'Altamira',
        ano_ingresso: new Date().getFullYear(),
        idade: String(aluno.idade_calculada || aluno.idade_informada || ''),
        turma: 'Atendimento Educacional Especializado (AEE)',
        turno: turmaAluno?.turno === 'M' ? 'Vespertino' : 'Matutino',
        quantitativo_turma: 10,
      },
      historico_escolar: {
        antecedentes_relevantes: '',
      },
      avaliacao_inicial: {
        deficiencia_intelectual: aluno.cid?.startsWith('F7') || false,
        deficiencia_auditiva: '',
        surdez: aluno.cid?.startsWith('H90') || false,
        surdez_faz_uso_libras: '',
        deficiencia_visual: aluno.cid?.startsWith('H54') ? 'baixa_visao' : '',
        surdocegueira: false,
        deficiencia_fisica: aluno.cid?.startsWith('G80') || false,
        deficiencia_multipla: false,
        deficiencia_multipla_especifique: '',
        tea: aluno.cid?.startsWith('F84') || false,
        altas_habilidades_superdotacao: false,
        dislexia: false,
        discalculia: false,
        disgrafia: false,
        tdah: aluno.cid?.startsWith('F90') || false,
        tpac: false,
        tda: false,
        outros_transtornos: '',
        laudo_medico: aluno.situacao_doc === 'com_laudo' ? 'sim' : 'nao',
        cid_laudo: aluno.cid || '',
        processos_avaliativos_medicos: aluno.numero_processo || '',
        possui_problema_saude: 'nao',
        qual_problema_saude: '',
        necessita_atencao_horario_escolar: aluno.necessita_acompanhante ? 'sim' : 'nao',
        qual_atencao_necessita: '',
        faz_uso_medicacao: 'nao',
        qual_medicacao: '',
        horarios_medicacao: '',
        tem_restricao_alimentar: 'nao',
        restricao_alimentar_orientacao: '',
      },
      aspectos_pedagogicos: {
        psicomotores: {
          praxia_global: 'sim',
          preensao_lapis: 'sim',
          dominancia_lateral: 'sim',
          dominancia_lateral_qual: 'Destro',
          lateralidade_dir_esq: 'sim',
          esquema_corporal: 'sim',
          coordenacao_visomotora: 'sim',
          complementares: '',
        },
        linguagem_oral: {
          expressa_pela_fala: 'sim',
          fala_sem_omissao: 'sim',
          articula_palavras: 'sim',
          discriminacao_fonematica: 'sim',
          vocabulario_adequado: 'sim',
          compreensao_comandos: 'sim',
          expressa_pensamento_organizado: 'sim',
          faz_leitura: 'ED',
          nomeia_objetos_corretamente: 'sim',
          interpretacao_texto: 'ED',
          cria_historias: 'ED',
          uso_sinais: 'nao',
          complementares: '',
        },
        linguagem_escrita: {
          escrita_palavras_textos: 'ED',
          distincao_letras_numeros: 'sim',
          producao_textual_espontanea: 'ED',
          caligrafia_compreensivel: 'sim',
          escrita_espelhada: 'nao',
          pontuacao_acentuacao: 'ED',
          trocas: 'nao',
          inversoes: 'nao',
          omissoes: 'nao',
          aglutinacoes: 'nao',
          repeticao: 'nao',
          substituicao: 'nao',
          acrescimo: 'nao',
          organizacao_sintatica_semantica: 'ED',
          complementares: '',
        },
        raciocinio_matematico: {
          reconhecimento_numeros: 'sim',
          contagem: 'sim',
          calculos_sem_concreto: 'ED',
          formas_geometricas: 'sim',
          sequencia_fatos: 'sim',
          correlaciona_objetos_funcao: 'sim',
          complementares: '',
        },
        atencao_concentracao: {
          mantem_atencao: 'ED',
          distrai_se_nao_finaliza: 'ED',
          necessita_acompanhamento_continuo: aluno.necessita_acompanhante ? 'sim' : 'nao',
          permanece_em_sala: 'sim',
          complementares: '',
        },
        sociabilidade_afetividade: {
          descricao: '',
        },
        vida_autonoma: {
          alimentacao_banheiro_autonomia: 'sim',
          identifica_perigo: 'sim',
          complementares: '',
        },
      },
      apoios_saee: {
        professor_aee_contraturno: aluno.necessita_professor_aee,
        professor_bilingue: false,
        professor_libras: false,
        professor_portugues_surdos: false,
        tradutor_interprete_libras: aluno.cid?.startsWith('H90') || false,
        guia_interprete: false,
        braillista: aluno.cid?.startsWith('H54') || false,
        acompanhante_especializado: aluno.necessita_acompanhante,
      },
      plano_atendimento: {
        plano_aee: true,
        plano_aee_objetivo: 'Atendimento no contraturno na Sala de Recursos Multifuncionais (SRM).',
        plano_pei: true,
        plano_pei_objetivo: 'Elaboração e execução do PEI conjunto com os professores da sala comum.',
        outros_encaminhamentos: false,
        outros_encaminhamentos_objetivo: '',
      },
      consideracoes_finais: {
        texto: '',
        local: 'Altamira - PA',
        data: new Date().toISOString().split('T')[0],
        responsavel_nome: currentUser.nome,
        responsavel_cargo: currentUser.cargo || (currentUser.papel.startsWith('nucleo') ? 'Coordenação Pedagógica / Núcleo DRE' : 'Gestão / Coordenação Escolar'),
        responsavel_matricula: 'SEDUC-PA',
      },
    };
  });

  // Atualiza quando o aluno muda
  useEffect(() => {
    const existente = obterEstudoDeCaso(aluno.id);
    if (existente) {
      setFormData(existente);
    }
  }, [aluno.id, obterEstudoDeCaso]);

  if (!isOpen) return null;

  const handleSalvar = async (statusFinal: 'rascunho' | 'concluido' = 'rascunho') => {
    setSalvando(true);
    setMensagemSucesso('');
    try {
      const res = await salvarEstudoDeCaso({
        ...formData,
        status: statusFinal,
        aluno_id: aluno.id,
        escola_id: aluno.escola_id,
      });

      if (res.success) {
        setMensagemSucesso(statusFinal === 'concluido' ? 'Estudo de Caso concluído com sucesso!' : 'Rascunho salvo com sucesso!');
        setTimeout(() => setMensagemSucesso(''), 3500);
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleImprimir = () => {
    const html = gerarHtmlEstudoDeCaso(formData);
    imprimirHtml(html, `Estudo_de_Caso_${aluno.nome.replace(/\s+/g, '_')}`);
  };

  const handleAbrirAbaImpressao = () => {
    const html = gerarHtmlEstudoDeCaso(formData);
    abrirEmNovaAbaParaImpressao(html, `Estudo_de_Caso_${aluno.nome.replace(/\s+/g, '_')}`);
  };

  const secoesMenu = [
    { id: 'orientacoes', label: 'Orientações COEES', icone: AlertCircle },
    { id: 'identificacao', label: '1. Identificação', icone: User },
    { id: 'familia', label: '2. Família', icone: Users },
    { id: 'escolas', label: '3 e 4. Escolas & AEE', icone: School },
    { id: 'historico', label: '5. Histórico Escolar', icone: History },
    { id: 'avaliacao_inicial', label: '6. Avaliação Inicial & Saúde', icone: Activity },
    { id: 'pedagogicos', label: '7. Aspectos Pedagógicos', icone: FileSpreadsheet },
    { id: 'apoios_saee', label: '8. Apoios do SAEE', icone: HeartHandshake },
    { id: 'plano_atendimento', label: '9. Plano de Atendimento', icone: Award },
    { id: 'consideracoes', label: '10. Considerações & Assinaturas', icone: Send },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Cabeçalho Oficial do Documento - Padrão COEES / SEDUC-PA */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 print:bg-white print:text-black print:border-b-2 print:border-black print:p-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 print:hidden">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 print:text-slate-700">
                Governo do Estado do Pará • SEDUC • COEES
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white print:text-black">
                Estudo de Caso — Avaliação e Encaminhamento
              </h2>
              <div className="text-xs text-slate-400 print:text-slate-600">
                Estudante: <strong className="text-white print:text-black">{aluno.nome}</strong> ({aluno.codigo})
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
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={modoPrevia ? "Voltar ao Formulário de Edição" : "Ver documento final formatado para impressão"}
            >
              {modoPrevia ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
              <span>{modoPrevia ? 'Editar Formulário' : 'Visualizar Documento'}</span>
            </button>

            {/* Botão de Impressão Direta Oficial */}
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
              title="Imprimir documento oficial em formato papel timbrado (SEDUC-PA)"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Modelo Oficial</span>
            </button>

            {/* Abrir em Nova Aba */}
            <button
              type="button"
              onClick={handleAbrirAbaImpressao}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Abrir em nova aba para salvar como PDF ou imprimir em tela cheia"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nova Aba</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem Flutuante de Sucesso */}
        {mensagemSucesso && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{mensagemSucesso}</span>
            </div>
            <span className="text-[10px] text-emerald-600">Salvo no sistema regional</span>
          </div>
        )}

        {/* MODO PREVIEW: Exibe o Documento Oficial Renderizado */}
        {modoPrevia ? (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-200/70 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden flex flex-col mb-4">
              <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold">
                <span>Visualização Prévia — Modelo Oficial COEES / SEDUC-PA</span>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Aba</span>
                  </button>
                </div>
              </div>
              <iframe
                title="Pré-visualização do Estudo de Caso"
                srcDoc={gerarHtmlEstudoDeCaso(formData)}
                className="w-full h-[70vh] border-0"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Barra de Navegação das 10 Seções Oficiais */}
            <div className="bg-slate-100 border-b border-slate-200 px-2 py-1.5 overflow-x-auto flex gap-1 print:hidden shrink-0">
              {secoesMenu.map((m) => {
                const Icone = m.icone;
                const ativo = secaoAtiva === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSecaoAtiva(m.id as SecaoAtiva)}
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

            {/* Conteúdo das Seções (com suporte total a impressão em folha contínua) */}
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
              Estudo de Caso — Instrumento Oficial de Avaliação Inicial
            </h1>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 0: ORIENTAÇÕES PARA O PREENCHIMENTO (COEES / SEDUC)         */}
          {/* ================================================================ */}
          {(secaoAtiva === 'orientacoes' || false) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-900 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-amber-950 uppercase">
                  Orientações Oficiais COEES / SEDUC-PA para o Preenchimento
                </h3>
              </div>
              <ol className="list-decimal list-inside text-xs space-y-1.5 text-amber-900/90 leading-relaxed">
                <li>O Estudo de Caso é o instrumento orientador para avaliação inicial de estudantes que demandam apoios da Educação Especial.</li>
                <li>Público-alvo da Educação Especial: estudantes com Deficiência, Transtorno do Espectro Autista (TEA) e Altas Habilidades/Superdotação.</li>
                <li>Estudantes com Transtornos de Aprendizagem (TDAH, Dislexia, etc.) sem deficiência associada devem ser acolhidos pela equipe pedagógica escolar em reforço/recuperação paralela.</li>
                <li>O Acompanhante Especializado só deve ser indicado após criteriosa análise das Atividades de Vida Autônoma (alimentação, higiene, locomoção) e regulação de condutas severas, não substituindo o papel docente.</li>
                <li>O preenchimento deve ser colaborativo entre o(a) Professor(a) do AEE, Coordenação Pedagógica da Unidade Escolar e Família.</li>
              </ol>
            </div>
          )}

          {/* ================================================================ */}
          {/* SEÇÃO 1: IDENTIFICAÇÃO DO ESTUDANTE                              */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'identificacao' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">1</span>
                Identificação do Estudante
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nome Completo do Estudante:</label>
                <input
                  type="text"
                  value={formData.identificacao.nome}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, nome: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data de Nascimento:</label>
                <input
                  type="date"
                  value={formData.identificacao.data_nascimento}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, data_nascimento: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Idade:</label>
                <input
                  type="text"
                  value={formData.identificacao.idade}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, idade: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsável Legal:</label>
                <input
                  type="text"
                  value={formData.identificacao.responsavel}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, responsavel: e.target.value }
                  }))}
                  placeholder="Nome do responsável"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / Contato:</label>
                <input
                  type="text"
                  value={formData.identificacao.telefone}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, telefone: e.target.value }
                  }))}
                  placeholder="(93) 90000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Endereço Residencial:</label>
                <input
                  type="text"
                  value={formData.identificacao.endereco}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, endereco: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nº:</label>
                <input
                  type="text"
                  value={formData.identificacao.numero}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, numero: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro:</label>
                <input
                  type="text"
                  value={formData.identificacao.bairro}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, bairro: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade / Estado:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.identificacao.cidade}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      identificacao: { ...p.identificacao, cidade: e.target.value }
                    }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={formData.identificacao.estado}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      identificacao: { ...p.identificacao, estado: e.target.value }
                    }))}
                    className="w-16 px-2 py-2 rounded-lg border border-slate-300 text-slate-900 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CEP:</label>
                <input
                  type="text"
                  value={formData.identificacao.cep}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    identificacao: { ...p.identificacao, cep: e.target.value }
                  }))}
                  placeholder="68370-000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 2: INFORMAÇÕES FAMILIARES                                  */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'familia' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">2</span>
                Informações Familiares
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Genitor */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 print:bg-white print:border-slate-300">
                <h4 className="font-black text-slate-800 uppercase text-[11px]">Genitor (Pai):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-0.5">Nome:</label>
                    <input
                      type="text"
                      value={formData.familia.genitor.nome}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitor: { ...p.familia.genitor, nome: e.target.value } }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">Profissão:</label>
                    <input
                      type="text"
                      value={formData.familia.genitor.profissao}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitor: { ...p.familia.genitor, profissao: e.target.value } }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">Escolaridade / Telefone:</label>
                    <input
                      type="text"
                      value={formData.familia.genitor.telefone}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitor: { ...p.familia.genitor, telefone: e.target.value } }
                      }))}
                      placeholder="Tel. e Escolaridade"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Genitora */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 print:bg-white print:border-slate-300">
                <h4 className="font-black text-slate-800 uppercase text-[11px]">Genitora (Mãe):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-0.5">Nome:</label>
                    <input
                      type="text"
                      value={formData.familia.genitora.nome}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitora: { ...p.familia.genitora, nome: e.target.value } }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">Profissão:</label>
                    <input
                      type="text"
                      value={formData.familia.genitora.profissao}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitora: { ...p.familia.genitora, profissao: e.target.value } }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-0.5">Escolaridade / Telefone:</label>
                    <input
                      type="text"
                      value={formData.familia.genitora.telefone}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        familia: { ...p.familia, genitora: { ...p.familia.genitora, telefone: e.target.value } }
                      }))}
                      placeholder="Tel. e Escolaridade"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 3 e 4: ESCOLA ATUAL (1ª MATRÍCULA) E UNIDADE AEE (2ª MATRÍCULA) */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'escolas' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">3 & 4</span>
                Escola Atual (1ª Matrícula) e Unidade AEE (2ª Matrícula)
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Seção 3: Escola Regular */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-black text-sky-900 uppercase text-xs">3. Escola Atual (1ª Matrícula - Escolarização Regular)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Nome da Escola:</label>
                    <input
                      type="text"
                      value={formData.escola_1_matricula.nome_escola}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_1_matricula: { ...p.escola_1_matricula, nome_escola: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">DRE Regional:</label>
                    <input
                      type="text"
                      value={formData.escola_1_matricula.dre}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_1_matricula: { ...p.escola_1_matricula, dre: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Diretor(a):</label>
                    <input
                      type="text"
                      value={formData.escola_1_matricula.diretor}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_1_matricula: { ...p.escola_1_matricula, diretor: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ano / Etapa / Turma:</label>
                    <input
                      type="text"
                      value={`${formData.escola_1_matricula.ano_etapa} - ${formData.escola_1_matricula.turma}`}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_1_matricula: { ...p.escola_1_matricula, turma: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Turno e Quantitativo Turma:</label>
                    <input
                      type="text"
                      value={`${formData.escola_1_matricula.turno} (${formData.escola_1_matricula.quantitativo_estudantes} estudantes)`}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_1_matricula: { ...p.escola_1_matricula, turno: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Unidade AEE */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 print:bg-white print:border-slate-300">
                <h4 className="font-black text-purple-900 uppercase text-xs">4. Unidade Escolar Atual (2ª Matrícula - Atendimento Educacional Especializado)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Unidade Escolar / SRM:</label>
                    <input
                      type="text"
                      value={formData.escola_2_aee.nome}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_2_aee: { ...p.escola_2_aee, nome: e.target.value }
                      }))}
                      placeholder="Ex: SRM da Escola Polivalente ou CAEE"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Turno AEE (Contraturno):</label>
                    <input
                      type="text"
                      value={formData.escola_2_aee.turno}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        escola_2_aee: { ...p.escola_2_aee, turno: e.target.value }
                      }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 5: HISTÓRICO ESCOLAR                                       */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'historico' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">5</span>
                Informação Escolar — Histórico Escolar
              </h3>
            </div>

            <div className="text-xs space-y-2">
              <label className="block font-bold text-slate-700">Antecedentes Relevantes (Escolas de 1ª e 2ª Matrícula):</label>
              <p className="text-[11px] text-slate-500">
                Descreva o percurso escolar do estudante, retenções, avanços, atendimentos anteriores, adaptações que funcionaram ou dificuldades prévias.
              </p>
              <textarea
                rows={5}
                value={formData.historico_escolar.antecedentes_relevantes}
                onChange={(e) => setFormData(p => ({
                  ...p,
                  historico_escolar: { antecedentes_relevantes: e.target.value }
                }))}
                placeholder="Informe o percurso formativo do estudante..."
                className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 6: AVALIAÇÃO INICIAL & SAÚDE                               */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'avaliacao_inicial' ? 'block' : 'hidden'} print:block space-y-5`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">6</span>
                Informações dos Procedimentos Referentes à Avaliação Inicial
              </h3>
            </div>

            {/* 6.1 Necessidades Específicas do Estudante */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 print:bg-white">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                6.1 Necessidade Específica do Estudante (Público da Educação Especial)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.deficiencia_intelectual}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, deficiencia_intelectual: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Deficiência Intelectual</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.tea}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, tea: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Transtorno do Espectro Autista (TEA)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.deficiencia_fisica}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, deficiencia_fisica: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Deficiência Física</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.surdez}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, surdez: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Surdez / Deficiência Auditiva</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.deficiencia_visual !== ''}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, deficiencia_visual: e.target.checked ? 'baixa_visao' : '' }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Deficiência Visual (Baixa Visão / Cegueira)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.surdocegueira}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, surdocegueira: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Surdocegueira</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.deficiencia_multipla}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, deficiencia_multipla: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Deficiência Múltipla</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.avaliacao_inicial.altas_habilidades_superdotacao}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, altas_habilidades_superdotacao: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Altas Habilidades / Superdotação</span>
                </label>
              </div>
            </div>

            {/* 6.2 Transtornos de Aprendizagem */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 print:bg-white">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                6.2 Transtornos Funcionais Específicos / de Aprendizagem
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {['dislexia', 'discalculia', 'disgrafia', 'tdah', 'tpac', 'tda'].map((t) => (
                  <label key={t} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean((formData.avaliacao_inicial as any)[t])}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        avaliacao_inicial: { ...p.avaliacao_inicial, [t]: e.target.checked }
                      }))}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="font-bold uppercase text-[11px] text-slate-800">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 6.3 Área da Saúde */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 print:bg-white print:border-slate-300 text-xs">
              <h4 className="font-black text-blue-950 text-xs uppercase tracking-tight">
                6.3 Área da Saúde e Laudo Médico
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Possui Laudo Médico?</label>
                  <select
                    value={formData.avaliacao_inicial.laudo_medico}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, laudo_medico: e.target.value as 'sim' | 'nao' }
                    }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="sim">Sim, possui laudo</option>
                    <option value="nao">Não possui laudo (Processo avaliativo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CID do Laudo:</label>
                  <input
                    type="text"
                    value={formData.avaliacao_inicial.cid_laudo}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, cid_laudo: e.target.value }
                    }))}
                    placeholder="Ex: F84.0, F70, G80..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Processos Avaliativos / Protocolos:</label>
                  <input
                    type="text"
                    value={formData.avaliacao_inicial.processos_avaliativos_medicos}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      avaliacao_inicial: { ...p.avaliacao_inicial, processos_avaliativos_medicos: e.target.value }
                    }))}
                    placeholder="Processo nº / Clínico..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Faz uso de medicação contínua?</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.avaliacao_inicial.faz_uso_medicacao}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        avaliacao_inicial: { ...p.avaliacao_inicial, faz_uso_medicacao: e.target.value as 'sim' | 'nao' }
                      }))}
                      className="w-28 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                    {formData.avaliacao_inicial.faz_uso_medicacao === 'sim' && (
                      <input
                        type="text"
                        value={formData.avaliacao_inicial.qual_medicacao}
                        onChange={(e) => setFormData(p => ({
                          ...p,
                          avaliacao_inicial: { ...p.avaliacao_inicial, qual_medicacao: e.target.value }
                        }))}
                        placeholder="Nome do fármaco e posologia / horários"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Possui Restrição Alimentar?</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.avaliacao_inicial.tem_restricao_alimentar}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        avaliacao_inicial: { ...p.avaliacao_inicial, tem_restricao_alimentar: e.target.value as 'sim' | 'nao' }
                      }))}
                      className="w-28 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                    {formData.avaliacao_inicial.tem_restricao_alimentar === 'sim' && (
                      <input
                        type="text"
                        value={formData.avaliacao_inicial.restricao_alimentar_orientacao}
                        onChange={(e) => setFormData(p => ({
                          ...p,
                          avaliacao_inicial: { ...p.avaliacao_inicial, restricao_alimentar_orientacao: e.target.value }
                        }))}
                        placeholder="Qual restrição?"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 7: ASPECTOS PEDAGÓGICOS (TABELAS SIM / NÃO / ED / NA)      */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'pedagogicos' ? 'block' : 'hidden'} print:block space-y-6`}>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">7</span>
                Aspectos Pedagógicos — Avaliação Diagnóstica
              </h3>
              <div className="text-[10px] font-bold text-slate-500 print:text-black">
                Legenda: <span className="text-emerald-700 font-bold">Sim</span> | <span className="text-rose-700 font-bold">Não</span> | <span className="text-amber-700 font-bold">ED (Em Desenv.)</span> | <span className="text-slate-600 font-bold">NA (Não Avaliado)</span>
              </div>
            </div>

            {/* 7.1 Aspectos Psicomotores */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-black text-slate-800 uppercase text-[11px] flex justify-between items-center">
                <span>7.1 Aspectos Psicomotores</span>
                <span className="text-[10px] font-normal text-slate-500">Desenvolvimento motor e corporal</span>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { key: 'praxia_global', label: 'Apresenta praxia global de acordo com a faixa etária' },
                  { key: 'preensao_lapis', label: 'Faz preensão regular do lápis ou caneta' },
                  { key: 'lateralidade_dir_esq', label: 'Desenvolveu noção de direita e esquerda (Lateralidade)' },
                  { key: 'esquema_corporal', label: 'Desenvolveu noção de esquema corporal' },
                  { key: 'coordenacao_visomotora', label: 'Tem coordenação visomotora de acordo com a faixa etária' },
                ].map((item) => (
                  <div key={item.key} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <div className="flex gap-1">
                      {(['sim', 'nao', 'ED', 'NA'] as IndicadorAvaliacao[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({
                            ...p,
                            aspectos_pedagogicos: {
                              ...p.aspectos_pedagogicos,
                              psicomotores: {
                                ...p.aspectos_pedagogicos.psicomotores,
                                [item.key]: val,
                              }
                            }
                          }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            (formData.aspectos_pedagogicos.psicomotores as any)[item.key] === val
                              ? val === 'sim' ? 'bg-emerald-600 text-white shadow-xs' :
                                val === 'nao' ? 'bg-rose-600 text-white shadow-xs' :
                                val === 'ED' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7.2 Linguagem Oral / Comunicação */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-black text-slate-800 uppercase text-[11px] flex justify-between items-center">
                <span>7.2 Linguagem Oral / Comunicação</span>
                <span className="text-[10px] font-normal text-slate-500">Expressão, vocabulário e compreensão</span>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { key: 'expressa_pela_fala', label: 'Se expressa através da fala' },
                  { key: 'fala_sem_omissao', label: 'Fala sem omissão ou trocas' },
                  { key: 'articula_palavras', label: 'Articula as palavras adequadamente' },
                  { key: 'vocabulario_adequado', label: 'Tem vocabulário adequado para faixa etária' },
                  { key: 'compreensao_comandos', label: 'Tem compreensão de comandos' },
                  { key: 'expressa_pensamento_organizado', label: 'Expressa seu pensamento de forma organizada' },
                  { key: 'faz_leitura', label: 'Faz leitura' },
                  { key: 'interpretacao_texto', label: 'Consegue fazer interpretação de texto' },
                  { key: 'uso_sinais', label: 'Faz uso de sinais (Libras)' },
                ].map((item) => (
                  <div key={item.key} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <div className="flex gap-1">
                      {(['sim', 'nao', 'ED', 'NA'] as IndicadorAvaliacao[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({
                            ...p,
                            aspectos_pedagogicos: {
                              ...p.aspectos_pedagogicos,
                              linguagem_oral: {
                                ...p.aspectos_pedagogicos.linguagem_oral,
                                [item.key]: val,
                              }
                            }
                          }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            (formData.aspectos_pedagogicos.linguagem_oral as any)[item.key] === val
                              ? val === 'sim' ? 'bg-emerald-600 text-white shadow-xs' :
                                val === 'nao' ? 'bg-rose-600 text-white shadow-xs' :
                                val === 'ED' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7.4 Raciocínio Lógico-Matemático */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-black text-slate-800 uppercase text-[11px] flex justify-between items-center">
                <span>7.4 Raciocínio Lógico-Matemático</span>
                <span className="text-[10px] font-normal text-slate-500">Números, contagem e resolução</span>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { key: 'reconhecimento_numeros', label: 'Faz reconhecimento de números' },
                  { key: 'contagem', label: 'Faz contagem' },
                  { key: 'calculos_sem_concreto', label: 'Faz cálculos simples sem material concreto' },
                  { key: 'formas_geometricas', label: 'Faz reconhecimento de formas geométricas' },
                  { key: 'correlaciona_objetos_funcao', label: 'Correlaciona objetos de acordo com a sua função' },
                ].map((item) => (
                  <div key={item.key} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <div className="flex gap-1">
                      {(['sim', 'nao', 'ED', 'NA'] as IndicadorAvaliacao[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({
                            ...p,
                            aspectos_pedagogicos: {
                              ...p.aspectos_pedagogicos,
                              raciocinio_matematico: {
                                ...p.aspectos_pedagogicos.raciocinio_matematico,
                                [item.key]: val,
                              }
                            }
                          }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            (formData.aspectos_pedagogicos.raciocinio_matematico as any)[item.key] === val
                              ? val === 'sim' ? 'bg-emerald-600 text-white shadow-xs' :
                                val === 'nao' ? 'bg-rose-600 text-white shadow-xs' :
                                val === 'ED' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7.5 e 7.7 Atenção, Sociabilidade e Vida Autônoma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">7.6 Sociabilidade e Afetividade:</h4>
                <textarea
                  rows={3}
                  value={formData.aspectos_pedagogicos.sociabilidade_afetividade.descricao}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    aspectos_pedagogicos: {
                      ...p.aspectos_pedagogicos,
                      sociabilidade_afetividade: { descricao: e.target.value }
                    }
                  }))}
                  placeholder="Mostra-se calmo ou agitado com colegas e professores? Demonstra afetividade? Descreva o comportamento..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">7.7 Atividades de Vida Autônoma (AVA):</h4>
                <textarea
                  rows={3}
                  value={formData.aspectos_pedagogicos.vida_autonoma.complementares || ''}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    aspectos_pedagogicos: {
                      ...p.aspectos_pedagogicos,
                      vida_autonoma: { ...p.aspectos_pedagogicos.vida_autonoma, complementares: e.target.value }
                    }
                  }))}
                  placeholder="Consegue alimentar-se, ir ao banheiro, beber água com autonomia? Identifica situações de perigo?"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 8: LEVANTAMENTO DAS NECESSIDADES DE APOIOS DO SAEE          */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'apoios_saee' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">8</span>
                Levantamento das Necessidades de Apoios do SAEE
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Conforme os critérios oficiais da COEES/SEDUC-PA para solicitação de profissionais especializados.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-200 bg-white">
              {[
                { key: 'professor_aee_contraturno', titulo: 'Professor(a) de AEE (Contraturno)', desc: 'Atendimento Educacional Especializado na Sala de Recursos Multifuncionais (SRM).' },
                { key: 'acompanhante_especializado', titulo: 'Acompanhante Especializado (Cuidador)', desc: 'Apoio nas atividades de locomoção, higiene, alimentação e mediação em comportamentos graves.' },
                { key: 'tradutor_interprete_libras', titulo: 'Tradutor(a) Intérprete de Libras', desc: 'Para estudantes surdos que fazem uso da Língua Brasileira de Sinais.' },
                { key: 'professor_bilingue', titulo: 'Professor(a) Bilíngue', desc: 'Atuação na modalidade de educação bilíngue para surdos.' },
                { key: 'professor_portugues_surdos', titulo: 'Professor de Língua Portuguesa para Surdos', desc: 'Ensino da Língua Portuguesa como segunda língua escrita.' },
                { key: 'braillista', titulo: 'Braillista', desc: 'Transcrição, adaptação e produção de materiais táteis e em Braille.' },
                { key: 'guia_interprete', titulo: 'Guia-intérprete', desc: 'Mediação especializada para estudantes com surdocegueira.' },
              ].map((apoio) => (
                <label key={apoio.key} className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean((formData.apoios_saee as any)[apoio.key])}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      apoios_saee: { ...p.apoios_saee, [apoio.key]: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{apoio.titulo}</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">{apoio.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 9: DEFINIÇÃO DO PLANO DE ATENDIMENTO                       */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'plano_atendimento' ? 'block' : 'hidden'} print:block space-y-4`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">9</span>
                Definição do Plano de Atendimento do Estudante
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.plano_atendimento.plano_aee}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      plano_atendimento: { ...p.plano_atendimento, plano_aee: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Plano de AEE (SRM)</span>
                </label>
                {formData.plano_atendimento.plano_aee && (
                  <input
                    type="text"
                    value={formData.plano_atendimento.plano_aee_objetivo || ''}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      plano_atendimento: { ...p.plano_atendimento, plano_aee_objetivo: e.target.value }
                    }))}
                    placeholder="Objetivo principal do Plano de AEE..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.plano_atendimento.plano_pei}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      plano_atendimento: { ...p.plano_atendimento, plano_pei: e.target.checked }
                    }))}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Plano Educacional Individualizado — PEI (Sala Regular)</span>
                </label>
                {formData.plano_atendimento.plano_pei && (
                  <input
                    type="text"
                    value={formData.plano_atendimento.plano_pei_objetivo || ''}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      plano_atendimento: { ...p.plano_atendimento, plano_pei_objetivo: e.target.value }
                    }))}
                    placeholder="Objetivo principal do PEI em articulação com a sala comum..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* SEÇÃO 10: CONSIDERAÇÕES FINAIS E ASSINATURAS                     */}
          {/* ================================================================ */}
          <div className={`${secaoAtiva === 'consideracoes' ? 'block' : 'hidden'} print:block space-y-5`}>
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">10</span>
                Considerações Finais e Assinaturas Oficiais
              </h3>
            </div>

            <div className="text-xs space-y-2">
              <label className="block font-bold text-slate-700">Síntese e Encaminhamentos Mais Pertinentes:</label>
              <textarea
                rows={4}
                value={formData.consideracoes_finais.texto}
                onChange={(e) => setFormData(p => ({
                  ...p,
                  consideracoes_finais: { ...p.consideracoes_finais, texto: e.target.value }
                }))}
                placeholder="Fatos mais relevantes da Avaliação Inicial, direcionando os encaminhamentos mais pertinentes..."
                className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Local:</label>
                <input
                  type="text"
                  value={formData.consideracoes_finais.local}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    consideracoes_finais: { ...p.consideracoes_finais, local: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data:</label>
                <input
                  type="date"
                  value={formData.consideracoes_finais.data}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    consideracoes_finais: { ...p.consideracoes_finais, data: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsável pelo Preenchimento:</label>
                <input
                  type="text"
                  value={formData.consideracoes_finais.responsavel_nome}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    consideracoes_finais: { ...p.consideracoes_finais, responsavel_nome: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>
            </div>

            {/* Blocos Oficiais de Assinatura (Físicas / Digitais) */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Pais ou Responsáveis</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Professor(a) do AEE</div>
                <div className="text-[9px] text-slate-500">Assinatura / Matrícula</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Direção da Unidade Escolar</div>
                <div className="text-[9px] text-slate-500">Assinatura / Carimbo</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 print:border-black"></div>
                <div className="text-[10px] font-bold text-slate-800">Equipe Pedagógica / DRE</div>
                <div className="text-[9px] text-slate-500">Assinatura</div>
              </div>
            </div>
          </div>

        </div>
          </>
        )}

        {/* Rodapé de Ações do Modal */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
              formData.status === 'concluido'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {formData.status === 'concluido' ? 'Concluído' : 'Em Elaboração (Rascunho)'}
            </span>
            <span className="text-slate-500">Modelo Oficial COEES / SEDUC-PA</span>
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
              onClick={() => handleSalvar('concluido')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir Estudo de Caso</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
