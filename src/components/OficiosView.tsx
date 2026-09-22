import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Oficio, StatusOficio, AlunoComStatus } from '../types';
import { formatarNumeroOficio, formatarDataExtenso, gerarTextoPadraoOficio, gerarOficioDOCX } from '../lib/oficio/gerador';
import { imprimirHtml } from '../lib/documentos/imprimirDocumento';
import { CabecalhoInstitucional } from './CabecalhoInstitucional';
import { 
  FileText, 
  Plus, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Search, 
  X, 
  Eye, 
  Check, 
  Users, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface OficiosViewProps {
  alunosPreSelecionados?: string[];
  demandaPreSelecionada?: string;
  onLimparPreSelecao?: () => void;
}

export const OficiosView: React.FC<OficiosViewProps> = ({
  alunosPreSelecionados = [],
  demandaPreSelecionada = 'sem_professor',
  onLimparPreSelecao,
}) => {
  const { oficios, alunos, escolas, salvarOficio, registrarRespostaOficio, currentUser } = useAppStore();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modais
  const [modalNovo, setModalNovo] = useState(alunosPreSelecionados.length > 0);
  const [oficioVisualizando, setOficioVisualizando] = useState<Oficio | null>(null);
  const [modalResposta, setModalResposta] = useState<Oficio | null>(null);

  // Form de Novo Ofício
  const [destinatario, setDestinatario] = useState('Secretaria de Estado de Educação — SEDUC / Diretoria de Educação Especial — Belém - PA');
  const [assunto, setAssunto] = useState(
    demandaPreSelecionada === 'sem_professor'
      ? 'Solicitação de Lotação de Professor(a) de AEE para Escolas da Regional de Altamira'
      : demandaPreSelecionada === 'sem_acompanhante'
      ? 'Solicitação Urgente de Designação de Acompanhante / Apoio Escolar Especializado'
      : 'Demanda de Regularização de Atendimento Educacional Especializado — DRE Altamira'
  );
  const [corpo, setCorpo] = useState(gerarTextoPadraoOficio(demandaPreSelecionada));
  const [alunosSelecionadosIds, setAlunosSelecionadosIds] = useState<string[]>(alunosPreSelecionados);
  const [salvando, setSalvando] = useState(false);

  // Form de Registro de Resposta
  const [respData, setRespData] = useState(new Date().toISOString().split('T')[0]);
  const [respProtocolo, setRespProtocolo] = useState('');
  const [respResumo, setRespResumo] = useState('');

  // Próximo número do ano
  const anoAtual = new Date().getFullYear();
  const proximoNumero = useMemo(() => {
    const oficiosDoAno = oficios.filter(o => o.ano === anoAtual);
    return oficiosDoAno.length > 0 ? Math.max(...oficiosDoAno.map(o => o.numero)) + 1 : 1;
  }, [oficios, anoAtual]);

  // Alunos vinculados ao novo ofício
  const alunosDoNovoOficio = useMemo(() => {
    return alunos.filter(a => alunosSelecionadosIds.includes(a.id));
  }, [alunos, alunosSelecionadosIds]);

  // Filtragem da listagem
  const oficiosFiltrados = useMemo(() => {
    return oficios.filter(o => {
      if (filtroStatus !== 'todos' && o.status !== filtroStatus) return false;
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const numFormatado = formatarNumeroOficio(o.numero, o.ano).toLowerCase();
        const matchAssunto = o.assunto.toLowerCase().includes(termo);
        const matchDest = o.destinatario.toLowerCase().includes(termo);
        if (!numFormatado.includes(termo) && !matchAssunto && !matchDest) return false;
      }
      return true;
    });
  }, [oficios, filtroStatus, busca]);

  const handleSalvarNovoOficio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const res = await salvarOficio({
      numero: proximoNumero,
      ano: anoAtual,
      destinatario,
      assunto,
      corpo,
      alunos_ids: alunosSelecionadosIds,
      status: 'emitido',
      criado_por: currentUser.id,
      criado_por_nome: currentUser.nome,
    });
    setSalvando(false);
    if (res.success) {
      setModalNovo(false);
      if (onLimparPreSelecao) onLimparPreSelecao();
    }
  };

  const handleBaixarDOCX = async (oficio: Oficio) => {
    const alunosAfetados = alunos.filter(a => oficio.alunos_ids?.includes(a.id));
    const blob = await gerarOficioDOCX(oficio, alunosAfetados);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Oficio_${String(oficio.numero).padStart(3, '0')}_${oficio.ano}_DRE_Altamira.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSalvarResposta = async () => {
    if (!modalResposta) return;
    await registrarRespostaOficio(modalResposta.id, respData, respProtocolo, respResumo);
    setModalResposta(null);
    setRespProtocolo('');
    setRespResumo('');
  };

  const handleImprimirOficio = (oficio: Oficio) => {
    const alunosVinculados = alunos.filter(a => oficio.alunos_ids?.includes(a.id));
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Ofício ${formatarNumeroOficio(oficio.numero, oficio.ano)}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm 25mm 25mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; padding: 20px; }
          .cabecalho { text-align: center; margin-bottom: 25px; border-bottom: 1.5px solid #000; padding-bottom: 12px; font-family: Arial, sans-serif; }
          .cabecalho h1 { font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase; }
          .cabecalho h2 { font-size: 10pt; font-weight: bold; margin: 2px 0; }
          .cabecalho h3 { font-size: 9pt; font-weight: normal; margin: 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 25px; font-family: Arial, sans-serif; font-size: 10pt; }
          .destinatario { margin-bottom: 25px; font-family: Arial, sans-serif; font-size: 11pt; }
          .assunto { font-weight: bold; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 11pt; }
          .corpo p { text-align: justify; text-indent: 2.5cm; margin-bottom: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; font-size: 10pt; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #333; padding: 6px; text-align: left; }
          th { background: #f0f0f0; }
          .assinatura { text-align: center; margin-top: 50px; page-break-inside: avoid; font-family: Arial, sans-serif; }
          .linha-assinatura { width: 260px; border-top: 1px solid #000; margin: 0 auto 6px auto; }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <h1>Governo do Estado do Pará</h1>
          <h2>Secretaria de Estado de Educação — SEDUC</h2>
          <h3>Diretoria Regional de Ensino — DRE Altamira • Núcleo de Educação Especial (NEE)</h3>
        </div>
        <div class="meta">
          <strong>${formatarNumeroOficio(oficio.numero, oficio.ano)}</strong>
          <span>${formatarDataExtenso(oficio.emitido_em)}</span>
        </div>
        <div class="destinatario">
          A Sua Senhoria<br>
          <strong>${oficio.destinatario}</strong><br>
          Belém - PA
        </div>
        <div class="assunto">Assunto: ${oficio.assunto}</div>
        <div class="corpo">
          ${oficio.corpo.split('\n\n').map(p => `<p>${p}</p>`).join('')}
        </div>
        ${alunosVinculados.length > 0 ? `
          <div style="font-weight: bold; margin-top: 15px; font-family: Arial, sans-serif;">Relação de Alunos Vinculados à Solicitação:</div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudante</th>
                <th>Escola</th>
                <th>CID</th>
                <th>Processo SEDUC</th>
              </tr>
            </thead>
            <tbody>
              ${alunosVinculados.map(a => `
                <tr>
                  <td>${a.codigo}</td>
                  <td><strong>${a.nome}</strong></td>
                  <td>${a.escola_nome}</td>
                  <td>${a.cid || 'Sem CID'}</td>
                  <td>${a.numero_processo || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        <div class="assinatura">
          <div class="linha-assinatura"></div>
          <strong>${oficio.criado_por_nome || 'Diretor do Núcleo'}</strong><br>
          Diretoria Regional de Ensino — DRE Altamira<br>
          <span style="font-size: 9pt; color: #555;">SEDUC — Secretaria de Estado de Educação do Pará</span>
        </div>
      </body>
      </html>
    `;
    imprimirHtml(html, `Oficio_${oficio.numero}_${oficio.ano}`);
  };

  return (
    <div id="oficios-view" className="space-y-6 pb-12">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ofícios Formais à SEDUC
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Exclusivo do Núcleo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Geração de expedientes oficiais numerados para solicitação de professores de AEE e acompanhantes junto à Secretaria Central.
          </p>
        </div>

        <button
          type="button"
          id="btn-novo-oficio"
          onClick={() => {
            setModalNovo(true);
            setAlunosSelecionadosIds(alunosPreSelecionados);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Emitir Novo Ofício
        </button>
      </div>

      {/* Barra de Busca e Filtro de Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, ano ou assunto..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-600">Status:</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 bg-slate-50 font-medium text-slate-700"
          >
            <option value="todos">Todos os Status</option>
            <option value="emitido">Emitido</option>
            <option value="enviado">Enviado</option>
            <option value="respondido">Respondido</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Ofícios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Número / Ano</th>
                <th className="py-3 px-4">Emissão</th>
                <th className="py-3 px-4">Assunto</th>
                <th className="py-3 px-4">Alunos Citados</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {oficiosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Nenhum ofício encontrado.
                  </td>
                </tr>
              ) : (
                oficiosFiltrados.map((oficio) => (
                  <tr key={oficio.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-black text-slate-900 font-mono">
                      {formatarNumeroOficio(oficio.numero, oficio.ano)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {oficio.emitido_em ? new Date(oficio.emitido_em).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                      {oficio.assunto}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {oficio.alunos_ids?.length || 0} alunos
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        oficio.status === 'respondido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : oficio.status === 'enviado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {oficio.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleImprimirOficio(oficio)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition-colors border border-sky-200"
                          title="Imprimir Ofício Oficial (SEDUC-PA)"
                        >
                          <Printer className="w-3.5 h-3.5 text-sky-600" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOficioVisualizando(oficio)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-sky-600 transition-colors"
                          title="Visualizar documento formatado"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBaixarDOCX(oficio)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                          title="Baixar em formato Word (.docx)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalResposta(oficio)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-purple-600 transition-colors"
                          title="Registrar resposta / protocolo SEDUC"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Emissão de Novo Ofício */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Emitir {formatarNumeroOficio(proximoNumero, anoAtual)}
                </h3>
                <p className="text-xs text-slate-500">Expediente formal com timbre institucional da SEDUC-PA</p>
              </div>
              <button onClick={() => setModalNovo(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoOficio} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destinatário *</label>
                <input
                  type="text"
                  required
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assunto do Ofício *</label>
                <input
                  type="text"
                  required
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corpo do Ofício (Texto Institucional) *</label>
                <textarea
                  rows={6}
                  required
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-normal leading-relaxed text-slate-800"
                />
              </div>

              {/* Relação de Alunos Anexados */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Alunos Abrangidos ({alunosDoNovoOficio.length})
                  </span>
                  <span className="text-[10px] text-slate-500">Tabela incluída automaticamente no ofício</span>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 text-[11px]">
                  {alunosDoNovoOficio.map(a => (
                    <div key={a.id} className="py-1.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{a.nome} ({a.escola_nome})</span>
                      <span className="font-mono text-slate-500">{a.cid || 'Sem CID'} • {a.numero_processo || 'S/ Proc.'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  {salvando ? 'Emitindo...' : 'Emitir e Salvar Ofício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização Formatada / Impressão do Ofício */}
      {oficioVisualizando && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700 font-mono">
                {formatarNumeroOficio(oficioVisualizando.numero, oficioVisualizando.ano)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBaixarDOCX(oficioVisualizando)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar DOCX
                </button>
                <button
                  type="button"
                  onClick={() => handleImprimirOficio(oficioVisualizando)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / PDF
                </button>
                <button onClick={() => setOficioVisualizando(null)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento Formatado Institucional com Cabeçalho */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-6 text-slate-900 font-serif leading-relaxed text-sm bg-white">
              {/* Cabeçalho */}
              <div className="text-center space-y-1 pb-6 border-b border-slate-300 font-sans">
                <div className="font-black text-sm uppercase tracking-wide">Governo do Estado do Pará</div>
                <div className="font-bold text-xs uppercase">Secretaria de Estado de Educação — SEDUC</div>
                <div className="font-semibold text-xs text-slate-700 uppercase">Diretoria Regional de Ensino — DRE Altamira</div>
                <div className="font-black text-xs text-sky-800 uppercase">Núcleo de Educação Especial (NEE)</div>
              </div>

              {/* Número e Data */}
              <div className="flex justify-between items-center font-sans text-xs">
                <span className="font-bold font-mono">
                  {formatarNumeroOficio(oficioVisualizando.numero, oficioVisualizando.ano)}
                </span>
                <span className="italic">{formatarDataExtenso(oficioVisualizando.emitido_em)}</span>
              </div>

              {/* Destinatário */}
              <div className="space-y-1 text-xs font-sans">
                <div>A Sua Senhoria</div>
                <div className="font-bold">{oficioVisualizando.destinatario}</div>
                <div>Belém - PA</div>
              </div>

              {/* Assunto */}
              <div className="font-sans text-xs pt-2">
                <strong>Assunto:</strong> {oficioVisualizando.assunto}
              </div>

              {/* Corpo do texto */}
              <div className="space-y-4 text-justify font-sans text-xs leading-relaxed">
                {oficioVisualizando.corpo.split('\n\n').map((p, i) => (
                  <p key={i} className="indent-8">{p}</p>
                ))}
              </div>

              {/* Tabela de Alunos */}
              {oficioVisualizando.alunos_ids && oficioVisualizando.alunos_ids.length > 0 && (
                <div className="pt-4 font-sans text-xs">
                  <div className="font-bold mb-2">Relação de Alunos Vinculados à Solicitação:</div>
                  <table className="w-full border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-left">
                        <th className="p-2 border-r border-slate-300">Código</th>
                        <th className="p-2 border-r border-slate-300">Estudante</th>
                        <th className="p-2 border-r border-slate-300">Escola</th>
                        <th className="p-2 border-r border-slate-300">CID</th>
                        <th className="p-2">Processo SEDUC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunos.filter(a => oficioVisualizando.alunos_ids?.includes(a.id)).map(a => (
                        <tr key={a.id} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 font-mono">{a.codigo}</td>
                          <td className="p-2 border-r border-slate-200 font-bold">{a.nome}</td>
                          <td className="p-2 border-r border-slate-200">{a.escola_nome}</td>
                          <td className="p-2 border-r border-slate-200">{a.cid || 'Sem CID'}</td>
                          <td className="p-2">{a.numero_processo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Assinatura */}
              <div className="pt-10 text-center font-sans space-y-1">
                <div className="w-64 h-0.5 bg-slate-400 mx-auto mb-2" />
                <div className="font-bold text-xs">{oficioVisualizando.criado_por_nome || 'Diretor do Núcleo'}</div>
                <div className="text-[11px] text-slate-600">Diretoria Regional de Ensino — DRE Altamira</div>
                <div className="text-[10px] text-slate-500 italic">SEDUC — Secretaria de Estado de Educação do Pará</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Resposta */}
      {modalResposta && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Resposta da SEDUC
              </h3>
              <button onClick={() => setModalResposta(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data da Resposta</label>
                <input
                  type="date"
                  value={respData}
                  onChange={(e) => setRespData(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nº do Protocolo / Despacho SEDUC</label>
                <input
                  type="text"
                  placeholder="Ex.: PROT-SEDUC-2026/9944"
                  value={respProtocolo}
                  onChange={(e) => setRespProtocolo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resumo da Providência / Despacho</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o retorno: professor designado, aditivo autorizado, etc..."
                  value={respResumo}
                  onChange={(e) => setRespResumo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalResposta(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarResposta}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Salvar Resposta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
