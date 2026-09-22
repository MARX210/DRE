import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { AlunoComStatus, Aluno, SituacaoDoc, SexoTipo, TipoDocumento, StatusPDI } from '../types';
import { StatusBadge } from './StatusBadge';
import { AlunoSchema, CidValidator } from '../lib/validators';
import { imprimirHtml } from '../lib/documentos/imprimirDocumento';
import { gerarHtmlPDI } from '../lib/documentos/geradorHtmlPDI';
import { 
  X, 
  User, 
  HeartHandshake, 
  FileText, 
  Award, 
  Mail, 
  Check, 
  AlertCircle, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  Printer
} from 'lucide-react';

interface AlunoModalProps {
  aluno: AlunoComStatus | null;
  modoEdicao?: boolean;
  abaInicial?: 'dados' | 'atendimento' | 'documentos' | 'pdi' | 'oficios';
  onFechar: () => void;
}

export const AlunoModal: React.FC<AlunoModalProps> = ({
  aluno,
  modoEdicao = false,
  abaInicial = 'dados',
  onFechar,
}) => {
  const { 
    escolas, 
    turmas, 
    profissionais, 
    pdis, 
    documentos, 
    oficios, 
    salvarAluno, 
    salvarPDI, 
    salvarDocumento, 
    excluirDocumento, 
    ehNucleo, 
    minhaEscolaId, 
    currentUser 
  } = useAppStore();

  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'atendimento' | 'documentos' | 'pdi' | 'oficios'>(abaInicial);
  const [editando, setEditando] = useState(modoEdicao || !aluno);
  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Formulário do Aluno
  const [formData, setFormData] = useState<Partial<Aluno>>({
    id: aluno?.id,
    codigo: aluno?.codigo || `ALU-${Date.now().toString().slice(-4)}`,
    nome: aluno?.nome || '',
    data_nascimento: aluno?.data_nascimento || '',
    idade_informada: aluno?.idade_informada,
    sexo: aluno?.sexo || 'M',
    endereco: aluno?.endereco || '',
    escola_id: aluno?.escola_id || (ehNucleo ? (escolas[0]?.id || '') : (minhaEscolaId || '')),
    turma_id: aluno?.turma_id || '',
    ciclo: aluno?.ciclo || 1,
    serie: aluno?.serie || '',
    situacao_doc: aluno?.situacao_doc || 'com_laudo',
    cid: aluno?.cid || '',
    numero_processo: aluno?.numero_processo || '',
    contrato_acompanhante: aluno?.contrato_acompanhante ?? false,
    necessita_professor_aee: aluno?.necessita_professor_aee ?? true,
    necessita_acompanhante: aluno?.necessita_acompanhante ?? false,
    professor_aee_id: aluno?.professor_aee_id || '',
    acompanhante_id: aluno?.acompanhante_id || '',
    observacoes: aluno?.observacoes || '',
  });

  // Turmas e Profissionais da escola selecionada
  const turmasDisponiveis = turmas.filter(t => t.escola_id === formData.escola_id);
  const professoresDisponiveis = profissionais.filter(p => p.escola_id === formData.escola_id && p.tipo === 'professor_aee');
  const acompanhantesDisponiveis = profissionais.filter(p => p.escola_id === formData.escola_id && p.tipo === 'acompanhante');

  // PDIs do Aluno
  const pdisDoAluno = pdis.filter(p => p.aluno_id === aluno?.id);
  const pdiVigente = pdisDoAluno.find(p => p.status === 'vigente') || pdisDoAluno[0];

  // Documentos do Aluno
  const docsDoAluno = documentos.filter(d => d.aluno_id === aluno?.id);

  // Ofícios que citam este aluno
  const oficiosDoAluno = oficios.filter(o => o.alunos_ids?.includes(aluno?.id || ''));

  // Estado do Form de PDI
  const [editandoPdi, setEditandoPdi] = useState(false);
  const [pdiForm, setPdiForm] = useState({
    ano_letivo: pdiVigente?.ano_letivo || new Date().getFullYear(),
    status: (pdiVigente?.status || 'vigente') as StatusPDI,
    elaborado_por: pdiVigente?.elaborado_por || currentUser.nome,
    data_elaboracao: pdiVigente?.data_elaboracao || new Date().toISOString().split('T')[0],
    potencialidades: pdiVigente?.conteudo?.potencialidades || '',
    dificuldades: pdiVigente?.conteudo?.dificuldades || '',
    objetivos_gerais: pdiVigente?.conteudo?.objetivos_gerais || '',
    estrategias_pedagogicas: pdiVigente?.conteudo?.estrategias_pedagogicas || '',
    recursos_acessibilidade: pdiVigente?.conteudo?.recursos_acessibilidade || '',
    metas_bimestre_1: pdiVigente?.conteudo?.metas_bimestre_1 || '',
    metas_bimestre_2: pdiVigente?.conteudo?.metas_bimestre_2 || '',
    metas_bimestre_3: pdiVigente?.conteudo?.metas_bimestre_3 || '',
    metas_bimestre_4: pdiVigente?.conteudo?.metas_bimestre_4 || '',
    avaliacao: pdiVigente?.conteudo?.avaliacao || '',
  });

  // Estado de Upload de Documento
  const [docTitulo, setDocTitulo] = useState('');
  const [docTipo, setDocTipo] = useState<TipoDocumento>('laudo');

  // Manipulador de salvamento de Aluno
  const handleSalvarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg(null);
    setSucessoMsg(null);

    // Validação Zod
    const validacao = AlunoSchema.safeParse({
      ...formData,
      cid: formData.cid ? formData.cid.toUpperCase().trim() : '',
    });

    if (!validacao.success) {
      const err = validacao.error.issues[0]?.message || 'Dados inválidos no formulário';
      setErroMsg(err);
      return;
    }

    setSalvando(true);
    const res = await salvarAluno({
      ...formData,
      turma_id: formData.turma_id || null,
      professor_aee_id: formData.professor_aee_id || null,
      acompanhante_id: formData.acompanhante_id || null,
    });
    setSalvando(false);

    if (res.success) {
      setSucessoMsg('Dados do aluno gravados com sucesso!');
      setEditando(false);
      setTimeout(() => setSucessoMsg(null), 3000);
      if (!aluno) {
        onFechar();
      }
    } else {
      setErroMsg(res.error || 'Erro ao gravar dados');
    }
  };

  // Manipulador de salvamento de PDI
  const handleSalvarPDI = async () => {
    if (!aluno) return;
    setSalvando(true);
    const res = await salvarPDI({
      id: pdiVigente?.id,
      aluno_id: aluno.id,
      escola_id: aluno.escola_id,
      ano_letivo: pdiForm.ano_letivo,
      status: pdiForm.status,
      elaborado_por: pdiForm.elaborado_por,
      data_elaboracao: pdiForm.data_elaboracao,
      conteudo: {
        potencialidades: pdiForm.potencialidades,
        dificuldades: pdiForm.dificuldades,
        objetivos_gerais: pdiForm.objetivos_gerais,
        estrategias_pedagogicas: pdiForm.estrategias_pedagogicas,
        recursos_acessibilidade: pdiForm.recursos_acessibilidade,
        metas_bimestre_1: pdiForm.metas_bimestre_1,
        metas_bimestre_2: pdiForm.metas_bimestre_2,
        metas_bimestre_3: pdiForm.metas_bimestre_3,
        metas_bimestre_4: pdiForm.metas_bimestre_4,
        avaliacao: pdiForm.avaliacao,
      },
    });
    setSalvando(false);
    if (res.success) {
      setEditandoPdi(false);
      setSucessoMsg('PDI atualizado com sucesso!');
      setTimeout(() => setSucessoMsg(null), 3000);
    }
  };

  // Manipulador de Upload de Documento Simulado
  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!aluno || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Validação de tipo e tamanho (até 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo excede o limite máximo permitido de 10 MB.');
      return;
    }

    const res = await salvarDocumento({
      aluno_id: aluno.id,
      escola_id: aluno.escola_id,
      tipo: docTipo,
      titulo: docTitulo.trim() || file.name,
      file_name: file.name,
      storage_path: `${aluno.escola_id}/${aluno.id}/${file.name}`,
      mime_type: file.type || 'application/pdf',
      tamanho_bytes: file.size,
      enviado_por: currentUser.id,
    });

    if (res.success) {
      setDocTitulo('');
      setSucessoMsg('Documento anexado com segurança no storage!');
      setTimeout(() => setSucessoMsg(null), 3000);
    }
  };

  const imprimirPdiPDF = () => {
    if (!aluno) return;
    const html = gerarHtmlPDI(pdiForm, aluno);
    imprimirHtml(html, `PDI_${aluno.nome.replace(/\s+/g, '_')}`);
  };

  return (
    <div 
      id="aluno-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        id="aluno-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {aluno ? aluno.nome : 'Novo Aluno da Educação Especial'}
                </h2>
                {aluno && <StatusBadge status={aluno.status_atendimento} tamanho="sm" />}
              </div>
              <p className="text-xs text-slate-500">
                {aluno ? `${aluno.codigo} • ${aluno.escola_nome}` : 'Preencha os dados de matrícula e necessidades de AEE'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        {aluno && (
          <div className="flex border-b border-slate-200 bg-white px-5 gap-4 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              id="tab-dados"
              onClick={() => setAbaAtiva('dados')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                abaAtiva === 'dados' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Dados Cadastrais
            </button>
            <button
              type="button"
              id="tab-atendimento"
              onClick={() => setAbaAtiva('atendimento')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                abaAtiva === 'atendimento' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Atendimento & Semáforo
            </button>
            <button
              type="button"
              id="tab-documentos"
              onClick={() => setAbaAtiva('documentos')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                abaAtiva === 'documentos' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Laudo / Estudo de Caso ({docsDoAluno.length})
            </button>
            <button
              type="button"
              id="tab-pdi"
              onClick={() => setAbaAtiva('pdi')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                abaAtiva === 'pdi' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              PDI (Plano Individual)
            </button>
            {ehNucleo && (
              <button
                type="button"
                id="tab-oficios"
                onClick={() => setAbaAtiva('oficios')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  abaAtiva === 'oficios' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Ofícios Relacionados ({oficiosDoAluno.length})
              </button>
            )}
          </div>
        )}

        {/* Mensagens de Alerta */}
        {erroMsg && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{erroMsg}</span>
          </div>
        )}
        {sucessoMsg && (
          <div className="m-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Corpo do Modal com Conteúdo de cada Aba */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ================= ABA 1: DADOS CADASTRAIS ================= */}
          {abaAtiva === 'dados' && (
            <form onSubmit={handleSalvarAluno} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código do Aluno *</label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Estudante *</label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    disabled={!editando}
                    value={formData.data_nascimento || ''}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Idade Informada (anos)</label>
                  <input
                    type="number"
                    disabled={!editando}
                    value={formData.idade_informada || ''}
                    onChange={(e) => setFormData({ ...formData, idade_informada: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    placeholder="Se não tiver data"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo</label>
                  <select
                    disabled={!editando}
                    value={formData.sexo || ''}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as SexoTipo })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Feminino (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciclo de Aprendizagem</label>
                  <select
                    disabled={!editando}
                    value={formData.ciclo || 1}
                    onChange={(e) => setFormData({ ...formData, ciclo: parseInt(e.target.value, 10) as 1 | 2 | 3 })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="1">1º Ciclo (Fundamental)</option>
                    <option value="2">2º Ciclo (Médio)</option>
                    <option value="3">3º Ciclo (Médio Final)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Escola */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Escola *</label>
                  <select
                    disabled={!editando || !ehNucleo}
                    value={formData.escola_id}
                    onChange={(e) => setFormData({ ...formData, escola_id: e.target.value, turma_id: '' })}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    {escolas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Turma */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Turma</label>
                  <select
                    disabled={!editando}
                    value={formData.turma_id || ''}
                    onChange={(e) => setFormData({ ...formData, turma_id: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Sem Turma Cadastrada</option>
                    {turmasDisponiveis.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome} ({t.turno})</option>
                    ))}
                  </select>
                </div>

                {/* Série */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Série / Ano Escolar</label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.serie || ''}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    placeholder="Ex.: 1ª Série EM, 9º Ano"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Situação Documental, CID e Campos Condicionais (Regra 4.1) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Situação Documental e Laudo Médico (Regra 4.1)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Situação Documental *</label>
                    <select
                      disabled={!editando}
                      value={formData.situacao_doc}
                      onChange={(e) => setFormData({ ...formData, situacao_doc: e.target.value as SituacaoDoc })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:ring-2 focus:ring-sky-500 font-medium"
                    >
                      <option value="com_laudo">Com Laudo Homologado</option>
                      <option value="estudo_de_caso">Estudo de Caso Pedagógico</option>
                      <option value="sem_laudo">Sem Laudo / Em Triagem</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código CID (Opcional)
                    </label>
                    <input
                      type="text"
                      disabled={!editando}
                      value={formData.cid || ''}
                      onChange={(e) => setFormData({ ...formData, cid: e.target.value.toUpperCase() })}
                      placeholder="Ex.: F84.0, G80, F70"
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:ring-2 focus:ring-sky-500 uppercase font-bold text-slate-800"
                    />
                  </div>

                  {/* Campos Condicionais: aparecem para com_laudo e estudo_de_caso */}
                  {(formData.situacao_doc === 'com_laudo' || formData.situacao_doc === 'estudo_de_caso') && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nº do Processo Administrativo
                        </label>
                        <input
                          type="text"
                          disabled={!editando}
                          value={formData.numero_processo || ''}
                          onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
                          placeholder="Ex.: PROC-2026/0122-SEDUC"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {(formData.situacao_doc === 'com_laudo' || formData.situacao_doc === 'estudo_de_caso') && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="contrato_acompanhante"
                      disabled={!editando}
                      checked={Boolean(formData.contrato_acompanhante)}
                      onChange={(e) => setFormData({ ...formData, contrato_acompanhante: e.target.checked })}
                      className="w-4 h-4 rounded-sm text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <label htmlFor="contrato_acompanhante" className="text-xs font-semibold text-slate-800">
                      Contrato de Acompanhante Ativo e Regularizado na SEDUC
                    </label>
                  </div>
                )}
              </div>

              {/* Endereço e Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.endereco || ''}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Gerais</label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                {!editando ? (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Editar Dados
                  </button>
                ) : (
                  <>
                    {aluno && (
                      <button
                        type="button"
                        onClick={() => setEditando(false)}
                        className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={salvando}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {salvando ? 'Gravando...' : 'Salvar Alterações'}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {/* ================= ABA 2: ATENDIMENTO & SEMÁFORO ================= */}
          {abaAtiva === 'atendimento' && aluno && (
            <div className="space-y-6">
              {/* Card do Semáforo Calculado */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Status de Atendimento Atual:</div>
                  <div className="mt-1">
                    <StatusBadge status={aluno.status_atendimento} tamanho="lg" />
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  Calculado pela regra da view <strong>vw_alunos_status</strong>
                </div>
              </div>

              {/* Gestão de Necessidades e Vínculo de Profissionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Professor AEE */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-900">Professor de AEE</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.necessita_professor_aee}
                        onChange={(e) => setFormData({ ...formData, necessita_professor_aee: e.target.checked })}
                        className="w-4 h-4 rounded-sm text-sky-600"
                      />
                      Necessita
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Professor AEE Vinculado da Escola:
                    </label>
                    <select
                      value={formData.professor_aee_id || ''}
                      onChange={(e) => setFormData({ ...formData, professor_aee_id: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Nenhum professor vinculado</option>
                      {professoresDisponiveis.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.documento_ou_matricula || 'SEDUC'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {formData.necessita_professor_aee && !formData.professor_aee_id && (
                      <span className="text-purple-600 font-semibold">
                        Atenção: Aluno necessita de Professor AEE mas nenhum está alocado.
                      </span>
                    )}
                  </div>
                </div>

                {/* Acompanhante */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-900">Acompanhante / Cuidador</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.necessita_acompanhante}
                        onChange={(e) => setFormData({ ...formData, necessita_acompanhante: e.target.checked })}
                        className="w-4 h-4 rounded-sm text-sky-600"
                      />
                      Necessita
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Acompanhante Vinculado da Escola:
                    </label>
                    <select
                      value={formData.acompanhante_id || ''}
                      onChange={(e) => setFormData({ ...formData, acompanhante_id: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Nenhum acompanhante vinculado</option>
                      {acompanhantesDisponiveis.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.documento_ou_matricula || 'Contrato'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.contrato_acompanhante}
                        onChange={(e) => setFormData({ ...formData, contrato_acompanhante: e.target.checked })}
                        className="w-4 h-4 rounded-sm text-sky-600"
                      />
                      Contrato do acompanhante ativo e homologado
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSalvarAluno}
                  disabled={salvando}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Atualizar Vínculos de Atendimento
                </button>
              </div>
            </div>
          )}

          {/* ================= ABA 3: LAUDO / ESTUDO DE CASO (DOCUMENTOS) ================= */}
          {abaAtiva === 'documentos' && aluno && (
            <div className="space-y-5">
              {/* Painel de Upload */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Anexar Laudo Médico ou Estudo de Caso (PDF / Imagem até 10 MB)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Armazenamento privado e seguro em conformidade com as diretrizes da LGPD
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <select
                    value={docTipo}
                    onChange={(e) => setDocTipo(e.target.value as TipoDocumento)}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white font-medium text-slate-700"
                  >
                    <option value="laudo">Laudo Médico Homologado</option>
                    <option value="estudo_de_caso">Estudo de Caso Pedagógico</option>
                    <option value="pdi">PDI Escaneado / Assinado</option>
                    <option value="contrato">Contrato de Acompanhante</option>
                    <option value="outro">Outro Documento Comprobatório</option>
                  </select>

                  <input
                    type="text"
                    value={docTitulo}
                    onChange={(e) => setDocTitulo(e.target.value)}
                    placeholder="Título do documento..."
                    className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white w-52"
                  />

                  <label className="cursor-pointer px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Selecionar Arquivo
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.docx"
                      onChange={handleUploadDoc}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Lista de Documentos Anexados */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Documentos Anexados ({docsDoAluno.length})
                </h4>

                {docsDoAluno.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs border border-slate-200 rounded-xl bg-slate-50">
                    Nenhum laudo ou documento anexado ainda para este aluno.
                  </div>
                ) : (
                  docsDoAluno.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{doc.titulo}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span className="capitalize">{doc.tipo.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{doc.tamanho_bytes ? `${Math.round(doc.tamanho_bytes / 1024)} KB` : 'PDF'}</span>
                            <span>•</span>
                            <span>Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alert(`Simulação segura: Download de documento autenticado via URL assinada de curta duração:\n${doc.storage_path}`)}
                          className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Baixar
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirDocumento(doc.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 4: PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL) ================= */}
          {abaAtiva === 'pdi' && aluno && (
            <div className="space-y-5">
              {/* Header do PDI com Status Vigente / Rascunho / Encerrado */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Plano de Desenvolvimento Individual (PDI) — Ano {pdiForm.ano_letivo}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      pdiForm.status === 'vigente' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : pdiForm.status === 'rascunho'
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pdiForm.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Elaborado por: {pdiForm.elaborado_por || 'Professor de AEE'} em {pdiForm.data_elaboracao}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={imprimirPdiPDF}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Gerar PDF do PDI
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditandoPdi(!editandoPdi)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    {editandoPdi ? 'Visualizar' : 'Editar PDI'}
                  </button>
                </div>
              </div>

              {/* Formulário Estruturado do PDI */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ano Letivo</label>
                    <input
                      type="number"
                      disabled={!editandoPdi}
                      value={pdiForm.ano_letivo}
                      onChange={(e) => setPdiForm({ ...pdiForm, ano_letivo: parseInt(e.target.value, 10) })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status do PDI</label>
                    <select
                      disabled={!editandoPdi}
                      value={pdiForm.status}
                      onChange={(e) => setPdiForm({ ...pdiForm, status: e.target.value as StatusPDI })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 font-semibold"
                    >
                      <option value="vigente">Vigente (Plano Ativo)</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="encerrado">Encerrado / Histórico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data de Elaboração</label>
                    <input
                      type="date"
                      disabled={!editandoPdi}
                      value={pdiForm.data_elaboracao}
                      onChange={(e) => setPdiForm({ ...pdiForm, data_elaboracao: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">1. Potencialidades e Habilidades do Estudante</label>
                  <textarea
                    rows={2}
                    disabled={!editandoPdi}
                    value={pdiForm.potencialidades}
                    onChange={(e) => setPdiForm({ ...pdiForm, potencialidades: e.target.value })}
                    placeholder="Interesses, aptidões, recursos cognitivos e manifestações positivas..."
                    className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2. Dificuldades e Barreiras de Acesso</label>
                  <textarea
                    rows={2}
                    disabled={!editandoPdi}
                    value={pdiForm.dificuldades}
                    onChange={(e) => setPdiForm({ ...pdiForm, dificuldades: e.target.value })}
                    placeholder="Barreiras comunicacionais, pedagógicas, atitudinais ou sensoriais..."
                    className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3. Objetivos Gerais e Específicos do AEE</label>
                  <textarea
                    rows={2}
                    disabled={!editandoPdi}
                    value={pdiForm.objetivos_gerais}
                    onChange={(e) => setPdiForm({ ...pdiForm, objetivos_gerais: e.target.value })}
                    placeholder="Metas educacionais a serem alcançadas ao longo do ano letivo..."
                    className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4. Estratégias Pedagógicas e Recursos de Acessibilidade</label>
                  <textarea
                    rows={2}
                    disabled={!editandoPdi}
                    value={pdiForm.estrategias_pedagogicas}
                    onChange={(e) => setPdiForm({ ...pdiForm, estrategias_pedagogicas: e.target.value })}
                    placeholder="Tecnologias assistivas, adaptações curriculares, apoio de acompanhante..."
                    className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Metas para o 1º Bimestre</label>
                    <textarea
                      rows={2}
                      disabled={!editandoPdi}
                      value={pdiForm.metas_bimestre_1}
                      onChange={(e) => setPdiForm({ ...pdiForm, metas_bimestre_1: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Metas para o 2º Bimestre</label>
                    <textarea
                      rows={2}
                      disabled={!editandoPdi}
                      value={pdiForm.metas_bimestre_2}
                      onChange={(e) => setPdiForm({ ...pdiForm, metas_bimestre_2: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Avaliação e Parecer Descritivo do Processo</label>
                  <textarea
                    rows={2}
                    disabled={!editandoPdi}
                    value={pdiForm.avaliacao}
                    onChange={(e) => setPdiForm({ ...pdiForm, avaliacao: e.target.value })}
                    placeholder="Registro dos avanços, readequações do plano e parecer final..."
                    className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 disabled:bg-slate-100"
                  />
                </div>

                {editandoPdi && (
                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSalvarPDI}
                      disabled={salvando}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Gravar PDI
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 5: OFÍCIOS RELACIONADOS ================= */}
          {abaAtiva === 'oficios' && aluno && ehNucleo && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Ofícios Emitidos pelo Núcleo Referenciando este Estudante
              </h4>

              {oficiosDoAluno.length === 0 ? (
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                  Este estudante ainda não foi incluído em nenhum ofício emitido à SEDUC.
                </div>
              ) : (
                oficiosDoAluno.map((oficio) => (
                  <div key={oficio.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        Ofício nº {String(oficio.numero).padStart(3, '0')}/{oficio.ano} – NEE/DRE ALTAMIRA
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        oficio.status === 'respondido' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {oficio.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{oficio.assunto}</p>
                    {oficio.resposta_resumo && (
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 text-[11px]">
                        <strong>Resposta da SEDUC:</strong> {oficio.resposta_resumo}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
