import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { 
  parseExcelFile, 
  detectarMapeamentoAutomatico, 
  validarLinha, 
  baixarPlanilhaModelo, 
  ColumnMapping, 
  ParsedRow 
} from '../lib/import/excel';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

export const ImportarView: React.FC = () => {
  const { escolas, turmas, importarAlunosEmLote } = useAppStore();

  const [passo, setPasso] = useState<1 | 2 | 3 | 4>(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [linhasBrutas, setLinhasBrutas] = useState<Record<string, any>[]>([]);
  const [mapeamento, setMapeamento] = useState<ColumnMapping>({
    codigo: '',
    nome: '',
    escola_nome: '',
    data_nascimento: '',
    idade: '',
    sexo: '',
    turma: '',
    ciclo: '',
    serie: '',
    situacao_doc: '',
    cid: '',
    numero_processo: '',
    contrato_acompanhante: '',
    necessita_professor: '',
    necessita_acompanhante: '',
    professor_aee: '',
    acompanhante: '',
    observacoes: '',
  });

  const [linhasValidadas, setLinhasValidadas] = useState<ParsedRow[]>([]);
  const [importando, setImportando] = useState(false);
  const [importadoSucesso, setImportadoSucesso] = useState(false);
  const [totalImportados, setTotalImportados] = useState(0);

  // Upload do Arquivo
  const handleFileChange = async (file: File) => {
    try {
      setArquivo(file);
      const { rows } = await parseExcelFile(file);
      if (rows.length === 0) {
        alert('A planilha selecionada está vazia.');
        return;
      }
      const headers = Object.keys(rows[0] || {});
      setCabecalhos(headers);
      setLinhasBrutas(rows);

      // Auto detecção de colunas
      const autoMap = detectarMapeamentoAutomatico(headers);
      setMapeamento(autoMap);
      setPasso(2);
    } catch (err: any) {
      alert(`Erro ao ler arquivo: ${err?.message || err}`);
    }
  };

  // Processar Validação Linha por Linha
  const handleAvancarParaValidacao = () => {
    if (!mapeamento.nome) {
      alert('A coluna "Nome do Aluno" é obrigatória para prosseguir.');
      return;
    }

    const validadas = linhasBrutas.map(row => validarLinha(row, mapeamento, escolas));
    setLinhasValidadas(validadas);
    setPasso(3);
  };

  // Baixar relatório de erros em Excel
  const handleBaixarRelatorioErros = () => {
    const invalidas = linhasValidadas.filter(r => !r.valida || r.warnings.length > 0);
    const dados = invalidas.map((r, idx) => ({
      Linha: idx + 2,
      Nome: r.normalized.nome || '',
      Escola: r.normalized.escola_nome || '',
      Status: r.valida ? 'Aviso' : 'Erro',
      Erros: r.errors.join('; '),
      Avisos: r.warnings.join('; '),
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inconsistencias');
    XLSX.writeFile(wb, 'Relatorio_Inconsistencias_Importacao.xlsx');
  };

  // Efetivar Importação
  const handleConfirmarImportacao = async () => {
    const validas = linhasValidadas.filter(r => r.valida);
    if (validas.length === 0) {
      alert('Não há linhas válidas para importar.');
      return;
    }

    setImportando(true);
    const resultado = await importarAlunosEmLote(validas);
    setImportando(false);

    if (resultado.success) {
      setTotalImportados(resultado.totalImportados);
      setImportadoSucesso(true);
      setPasso(4);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      alert(`Erro durante importação: ${resultado.error}`);
    }
  };

  const totalValidas = linhasValidadas.filter(r => r.valida).length;
  const totalErros = linhasValidadas.filter(r => !r.valida).length;
  const totalAvisos = linhasValidadas.filter(r => r.warnings.length > 0).length;

  return (
    <div id="importar-view" className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Importação de Planilha de Alunos
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Exclusivo do Núcleo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assistente passo a passo para carregar planilhas de matrículas com validação de dados em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={baixarPlanilhaModelo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Baixar Planilha Modelo (.xlsx)
        </button>
      </div>

      {/* Indicador de Passos */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <div className={`py-2 px-1 rounded-lg border ${passo === 1 ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 text-slate-400'}`}>
            1. Enviar Arquivo
          </div>
          <div className={`py-2 px-1 rounded-lg border ${passo === 2 ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 text-slate-400'}`}>
            2. Mapear Colunas
          </div>
          <div className={`py-2 px-1 rounded-lg border ${passo === 3 ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 text-slate-400'}`}>
            3. Prévia & Validação
          </div>
          <div className={`py-2 px-1 rounded-lg border ${passo === 4 ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-100 text-slate-400'}`}>
            4. Conclusão
          </div>
        </div>
      </div>

      {/* PASSO 1: UPLOAD DO ARQUIVO */}
      {passo === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Selecione ou Arraste sua Planilha</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou Valores Separados por Vírgula (.csv).
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            Localizar Arquivo no Computador
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </label>

          <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 max-w-lg mx-auto flex items-start gap-2 text-left bg-slate-50 p-3 rounded-lg">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Dica:</strong> O assistente reconhece automaticamente cabeçalhos comuns (ex.: "Nome do Aluno", "Escola", "CID", "Data Nasc"). Você poderá revisar todas as colunas no próximo passo.
            </div>
          </div>
        </div>
      )}

      {/* PASSO 2: MAPEAMENTO DE COLUNAS */}
      {passo === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Mapeamento de Colunas</h2>
              <p className="text-xs text-slate-500">
                Arquivo: <strong>{arquivo?.name}</strong> ({linhasBrutas.length} linhas detectadas)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPasso(1)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Trocar Arquivo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              { key: 'nome', label: 'Nome do Aluno *', obrigatorio: true },
              { key: 'codigo', label: 'Código / Matrícula' },
              { key: 'escola_nome', label: 'Escola / Unidade Escolar *', obrigatorio: true },
              { key: 'data_nascimento', label: 'Data de Nascimento' },
              { key: 'idade', label: 'Idade Informada' },
              { key: 'sexo', label: 'Sexo (M/F)' },
              { key: 'turma', label: 'Turma' },
              { key: 'ciclo', label: 'Ciclo (1º, 2º ou 3º)' },
              { key: 'serie', label: 'Série / Ano' },
              { key: 'situacao_doc', label: 'Situação Documental (Laudo/Estudo)' },
              { key: 'cid', label: 'CID / Diagnóstico' },
              { key: 'numero_processo', label: 'Nº do Processo SEDUC' },
              { key: 'contrato_acompanhante', label: 'Contrato Acompanhante' },
              { key: 'necessita_professor', label: 'Necessita Professor AEE' },
              { key: 'necessita_acompanhante', label: 'Necessita Acompanhante' },
              { key: 'professor_aee', label: 'Nome do Professor de AEE' },
              { key: 'acompanhante', label: 'Nome do Acompanhante' },
              { key: 'observacoes', label: 'Observações' },
            ].map(col => (
              <div key={col.key} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <label className="block font-bold text-slate-700 mb-1">
                  {col.label}
                </label>
                <select
                  value={(mapeamento as any)[col.key] || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, [col.key]: e.target.value })}
                  className="w-full rounded-md border border-slate-200 p-2 bg-white text-xs font-medium"
                >
                  <option value="">-- Não Mapear / Ignorar --</option>
                  {cabecalhos.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>

            <button
              type="button"
              onClick={handleAvancarParaValidacao}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              Avançar para Prévia & Validação
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* PASSO 3: PRÉVIA E VALIDAÇÃO */}
      {passo === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Relatório de Consistência e Prévia</h2>
              <p className="text-xs text-slate-500">
                Linhas verificadas com as regras do sistema antes da gravação definitiva.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleBaixarRelatorioErros}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Inconsistências
              </button>
            </div>
          </div>

          {/* Cards de Resumo da Validação */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <div className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Linhas Válidas
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{totalValidas}</div>
              <div className="text-[11px] text-emerald-600">Prontas para inclusão</div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="text-xs text-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Avisos / Alertas
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{totalAvisos}</div>
              <div className="text-[11px] text-amber-600">Serão importadas com ajuste</div>
            </div>

            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
              <div className="text-xs text-red-800 font-bold flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" />
                Erros Impeditivos
              </div>
              <div className="text-2xl font-black text-red-700 mt-1">{totalErros}</div>
              <div className="text-[11px] text-red-600">Não serão gravadas</div>
            </div>
          </div>

          {/* Tabela de Prévia Linha a Linha */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-2.5">Linha</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Estudante</th>
                  <th className="p-2.5">Escola</th>
                  <th className="p-2.5">CID</th>
                  <th className="p-2.5">Erros / Inconsistências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhasValidadas.slice(0, 50).map((r, i) => (
                  <tr key={i} className={!r.valida ? 'bg-red-50/30' : r.warnings.length > 0 ? 'bg-amber-50/20' : ''}>
                    <td className="p-2.5 font-mono text-slate-500">{i + 1}</td>
                    <td className="p-2.5">
                      {r.valida ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          Erro
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">{r.normalized.nome || '-'}</td>
                    <td className="p-2.5 text-slate-700">{r.normalized.escola_nome || '-'}</td>
                    <td className="p-2.5 font-mono">{r.normalized.cid || '-'}</td>
                    <td className="p-2.5 text-[11px]">
                      {r.errors.length > 0 && (
                        <div className="text-red-700 font-semibold">{r.errors.join('; ')}</div>
                      )}
                      {r.warnings.length > 0 && (
                        <div className="text-amber-700">{r.warnings.join('; ')}</div>
                      )}
                      {r.errors.length === 0 && r.warnings.length === 0 && (
                        <span className="text-emerald-600">Nenhuma restrição</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPasso(2)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ajustar Mapeamento
            </button>

            <button
              type="button"
              disabled={totalValidas === 0 || importando}
              onClick={handleConfirmarImportacao}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              {importando ? 'Gravando no Sistema...' : `Efetivar Importação de ${totalValidas} Estudantes`}
            </button>
          </div>
        </div>
      )}

      {/* PASSO 4: CONCLUSÃO */}
      {passo === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">Importação Concluída com Sucesso!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Foram cadastrados e atualizados <strong>{totalImportados} estudantes</strong> da Educação Especial na base de dados da DRE Altamira.
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPasso(1);
                setArquivo(null);
                setLinhasBrutas([]);
                setLinhasValidadas([]);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Nova Importação
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
