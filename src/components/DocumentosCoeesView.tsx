import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { EstudoDeCasoModal } from './EstudoDeCasoModal';
import { PEIModal } from './PEIModal';
import { AlunoComStatus } from '../types';
import { gerarHtmlEstudoDeCaso } from '../lib/documentos/geradorHtmlEstudoDeCaso';
import { gerarHtmlPEI } from '../lib/documentos/geradorHtmlPEI';
import { imprimirHtml } from '../lib/documentos/imprimirDocumento';
import { 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  GraduationCap,
  School,
  Calendar,
  Eye,
  BookOpen
} from 'lucide-react';

export const DocumentosCoeesView: React.FC = () => {
  const { alunos, escolas, estudosDeCaso, peis, currentUser, ehNucleo } = useAppStore();

  const [abaAtiva, setAbaAtiva] = useState<'estudos' | 'peis' | 'orientacoes'>('estudos');
  const [busca, setBusca] = useState('');
  
  // Modais
  const [alunoSelecionadoEstudo, setAlunoSelecionadoEstudo] = useState<AlunoComStatus | null>(null);
  const [modalEstudoAberto, setModalEstudoAberto] = useState(false);

  const [alunoSelecionadoPEI, setAlunoSelecionadoPEI] = useState<AlunoComStatus | null>(null);
  const [modalPEIAberto, setModalPEIAberto] = useState(false);

  // Lista de alunos para novo documento
  const [alunoParaNovoDocId, setAlunoParaNovoDocId] = useState<string>('');

  // Filtra Estudos de Caso
  const estudosFiltrados = estudosDeCaso.filter(e => {
    const aluno = alunos.find(a => a.id === e.aluno_id);
    const termo = busca.toLowerCase();
    const nomeAluno = (aluno?.nome || e.identificacao?.nome || '').toLowerCase();
    const escola = escolas.find(esc => esc.id === e.escola_id)?.nome.toLowerCase() || '';
    return nomeAluno.includes(termo) || escola.includes(termo);
  });

  // Filtra PEIs
  const peisFiltrados = peis.filter(p => {
    const aluno = alunos.find(a => a.id === p.aluno_id);
    const termo = busca.toLowerCase();
    const nomeAluno = (aluno?.nome || p.identificacao?.nome || '').toLowerCase();
    const escola = escolas.find(esc => esc.id === p.escola_id)?.nome.toLowerCase() || '';
    return nomeAluno.includes(termo) || escola.includes(termo);
  });

  const handleAbrirEstudo = (alunoId: string) => {
    const al = alunos.find(a => a.id === alunoId);
    if (al) {
      setAlunoSelecionadoEstudo(al);
      setModalEstudoAberto(true);
    }
  };

  const handleAbrirPEI = (alunoId: string) => {
    const al = alunos.find(a => a.id === alunoId);
    if (al) {
      setAlunoSelecionadoPEI(al);
      setModalPEIAberto(true);
    }
  };

  const handleNovoEstudo = () => {
    if (!alunoParaNovoDocId) return;
    handleAbrirEstudo(alunoParaNovoDocId);
    setAlunoParaNovoDocId('');
  };

  const handleNovoPEI = () => {
    if (!alunoParaNovoDocId) return;
    handleAbrirPEI(alunoParaNovoDocId);
    setAlunoParaNovoDocId('');
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header com Identidade Institucional COEES / SEDUC-PA */}
      <div 
        id="header-documentos-coees"
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full"
      >
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Coordenadoria de Educação Especial — COEES • SEDUC-PA
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Estudo de Caso & Plano Educacional Individualizado (PEI)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Instrumentos oficiais padronizados para avaliação inicial, levantamento de apoios do SAEE e flexibilização curricular em sala comum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full xl:w-auto">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              id="btn-aba-estudos-de-caso"
              type="button"
              onClick={() => setAbaAtiva('estudos')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                abaAtiva === 'estudos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Estudos de Caso ({estudosDeCaso.length})</span>
            </button>
            <button
              id="btn-aba-peis-oficiais"
              type="button"
              onClick={() => setAbaAtiva('peis')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                abaAtiva === 'peis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>PEIs Oficiais ({peis.length})</span>
            </button>
            <button
              id="btn-aba-orientacoes-coees"
              type="button"
              onClick={() => setAbaAtiva('orientacoes')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial whitespace-nowrap ${
                abaAtiva === 'orientacoes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Orientações COEES</span>
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: ESTUDOS DE CASO */}
      {abaAtiva === 'estudos' && (
        <div className="space-y-4">
          {/* Barra de Filtro e Criação */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por estudante ou escola..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={alunoParaNovoDocId}
                onChange={(e) => setAlunoParaNovoDocId(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 font-medium w-full sm:w-64"
              >
                <option value="">Selecione um estudante...</option>
                {alunos.map(al => (
                  <option key={al.id} value={al.id}>{al.nome} ({al.codigo})</option>
                ))}
              </select>

              <button
                type="button"
                disabled={!alunoParaNovoDocId}
                onClick={handleNovoEstudo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar Estudo de Caso</span>
              </button>
            </div>
          </div>

          {/* Tabela de Estudos de Caso */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600">
                  <th className="p-3.5">Estudante</th>
                  <th className="p-3.5">Unidade Escolar</th>
                  <th className="p-3.5">Data Preenchimento</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Apoios Identificados</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum estudo de caso cadastrado ainda. Selecione um estudante acima para iniciar.
                    </td>
                  </tr>
                ) : (
                  estudosFiltrados.map((estudo) => {
                    const aluno = alunos.find(a => a.id === estudo.aluno_id);
                    const escola = escolas.find(e => e.id === estudo.escola_id);
                    return (
                      <tr key={estudo.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{aluno?.nome || estudo.identificacao.nome}</div>
                          <div className="text-[10px] text-slate-500">{aluno?.codigo || 'Código'} • {estudo.identificacao.data_nascimento || 'N/I'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{escola?.nome || estudo.escola_1_matricula.nome_escola}</div>
                          <div className="text-[10px] text-slate-500">{escola?.municipio || 'Altamira'} • {estudo.escola_1_matricula.ano_etapa || 'Turma'}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-700">
                          {estudo.data_preenchimento || 'Em andamento'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            estudo.status === 'concluido'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {estudo.status === 'concluido' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Concluído
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                Rascunho
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">
                          <div className="flex flex-wrap gap-1">
                            {estudo.apoios_saee.professor_aee_contraturno && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-200">
                                Professor AEE
                              </span>
                            )}
                            {estudo.apoios_saee.acompanhante_especializado && (
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                                Acompanhante
                              </span>
                            )}
                            {estudo.apoios_saee.tradutor_interprete_libras && (
                              <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-sky-200">
                                Intérprete Libras
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const html = gerarHtmlEstudoDeCaso(estudo);
                                const nomeAluno = aluno?.nome || estudo.identificacao.nome;
                                imprimirHtml(html, `Estudo_de_Caso_${nomeAluno.replace(/\s+/g, '_')}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition-colors border border-sky-200"
                              title="Imprimir Modelo Oficial (SEDUC-PA)"
                            >
                              <Printer className="w-3.5 h-3.5 text-sky-600" />
                              <span>Imprimir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirEstudo(estudo.aluno_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Editar</span>
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
      )}

      {/* ABA 2: PEIs OFICIAIS */}
      {abaAtiva === 'peis' && (
        <div className="space-y-4">
          {/* Barra de Filtro e Criação */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por estudante ou escola..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={alunoParaNovoDocId}
                onChange={(e) => setAlunoParaNovoDocId(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 font-medium w-full sm:w-64"
              >
                <option value="">Selecione um estudante...</option>
                {alunos.map(al => (
                  <option key={al.id} value={al.id}>{al.nome} ({al.codigo})</option>
                ))}
              </select>

              <button
                type="button"
                disabled={!alunoParaNovoDocId}
                onClick={handleNovoPEI}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Novo PEI Oficial</span>
              </button>
            </div>
          </div>

          {/* Tabela de PEIs */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600">
                  <th className="p-3.5">Estudante</th>
                  <th className="p-3.5">Ano Letivo / Período</th>
                  <th className="p-3.5">Atendimento AEE</th>
                  <th className="p-3.5">Indicadores Mapeados</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {peisFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum PEI oficial cadastrado ainda. Selecione um estudante acima para iniciar.
                    </td>
                  </tr>
                ) : (
                  peisFiltrados.map((pei) => {
                    const aluno = alunos.find(a => a.id === pei.aluno_id);
                    return (
                      <tr key={pei.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{aluno?.nome || pei.identificacao.nome}</div>
                          <div className="text-[10px] text-slate-500">{pei.identificacao.ano_etapa} • {pei.identificacao.turma}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">Ano {pei.ano_letivo}</div>
                          <div className="text-[10px] text-slate-500">{pei.periodo_execucao}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {pei.identificacao.atendido_aee === 'sim' ? (
                            <span className="text-emerald-700 font-semibold">Sim ({pei.identificacao.local_aee.toUpperCase()})</span>
                          ) : (
                            <span className="text-slate-500">Não atendido</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                            {pei.indicadores.length} indicador(es)
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            pei.status === 'vigente'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {pei.status === 'vigente' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Vigente
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                Rascunho
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const html = gerarHtmlPEI(pei);
                                const nomeAluno = aluno?.nome || pei.identificacao.nome;
                                imprimirHtml(html, `PEI_${nomeAluno.replace(/\s+/g, '_')}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition-colors border border-sky-200"
                              title="Imprimir PEI Oficial (SEDUC-PA)"
                            >
                              <Printer className="w-3.5 h-3.5 text-sky-600" />
                              <span>Imprimir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirPEI(pei.aluno_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Editar</span>
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
      )}

      {/* ABA 3: ORIENTAÇÕES INSTITUCIONAIS COEES */}
      {abaAtiva === 'orientacoes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase">
              Diretrizes Oficiais da Coordenadoria de Educação Especial (COEES / SEDUC-PA)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Orientações para as Unidades Escolares da Rede Estadual de Ensino do Pará e equipes pedagógicas da DRE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <h3 className="font-bold text-amber-950 uppercase text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                Estudo de Caso
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Instrumento orientador e avaliativo para identificação das necessidades específicas e apoios da Educação Especial. Deve ser preenchido de forma colaborativa entre a escola regular, professor do AEE e a família.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                <li>Obrigatório para subsidiar pedidos de profissionais de apoio e SRM.</li>
                <li>Identifica aspectos psicomotores, de linguagem e de autonomia (AVA).</li>
                <li>Define o plano de encaminhamento (SRM, PEI, Saúde).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
              <h3 className="font-bold text-sky-950 uppercase text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-700" />
                Plano Educacional Individualizado (PEI)
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Instrumento de planejamento pedagógico individualizado a ser aplicado no dia a dia da sala de aula comum, flexibilizando objetivos curriculares, tempos e avaliações formativas.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1">
                <li>Construído pelo professor da turma com assessoria do professor de AEE.</li>
                <li>Mapeia problema central, causas e consequências pedagógicas.</li>
                <li>Reavaliação obrigatória no mínimo ao final de cada semestre letivo.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Exibição / Edição / Impressão */}
      {alunoSelecionadoEstudo && (
        <EstudoDeCasoModal
          aluno={alunoSelecionadoEstudo}
          isOpen={modalEstudoAberto}
          onClose={() => setModalEstudoAberto(false)}
        />
      )}

      {alunoSelecionadoPEI && (
        <PEIModal
          aluno={alunoSelecionadoPEI}
          isOpen={modalPEIAberto}
          onClose={() => setModalPEIAberto(false)}
        />
      )}

    </div>
  );
};
