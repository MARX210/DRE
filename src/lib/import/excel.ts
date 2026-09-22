import * as XLSX from 'xlsx';
import { Aluno, Escola, Turma, Profissional, SituacaoDoc, SexoTipo } from '../../types';

export interface ColumnMapping {
  codigo: string;
  nome: string;
  escola_nome: string;
  data_nascimento: string;
  idade: string;
  sexo: string;
  turma: string;
  ciclo: string;
  serie: string;
  situacao_doc: string;
  cid: string;
  numero_processo: string;
  contrato_acompanhante: string;
  necessita_professor: string;
  necessita_acompanhante: string;
  professor_aee: string;
  acompanhante: string;
  observacoes: string;
}

export interface ParsedRow {
  raw: Record<string, any>;
  normalized: Partial<Aluno> & {
    escola_nome?: string;
    turma_nome?: string;
    professor_nome?: string;
    acompanhante_nome?: string;
  };
  errors: string[];
  warnings: string[];
  valida: boolean;
}

export function parseExcelFile(file: File): Promise<{ sheetNames: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        resolve({ sheetNames: workbook.SheetNames, rows: json });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Normalizadores
export function normalizarNome(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(p => {
      const prep = ['de', 'da', 'do', 'dos', 'das', 'e'];
      if (prep.includes(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

export function normalizarSexo(val: any): SexoTipo | undefined {
  if (!val) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s.startsWith('M') || s === 'MASCULINO') return 'M';
  if (s.startsWith('F') || s === 'FEMININO') return 'F';
  return undefined;
}

export function normalizarCiclo(val: any): 1 | 2 | 3 | undefined {
  if (!val) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s.includes('1') || s.includes('I') || s.includes('PRIMEIRO')) return 1;
  if (s.includes('2') || s.includes('II') || s.includes('SEGUNDO')) return 2;
  if (s.includes('3') || s.includes('III') || s.includes('TERCEIRO')) return 3;
  return undefined;
}

export function normalizarBoolean(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (['sim', 's', 'true', '1', 'positivo', 'yes', 'y'].includes(s)) return true;
  if (['não', 'nao', 'n', 'false', '0', 'negativo', 'no'].includes(s)) return false;
  return defaultVal;
}

export function normalizarData(val: any): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  // Formato DD/MM/AAAA
  const matchBR = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchBR) {
    const dia = matchBR[1].padStart(2, '0');
    const mes = matchBR[2].padStart(2, '0');
    const ano = matchBR[3];
    return `${ano}-${mes}-${dia}`;
  }
  // Formato AAAA-MM-DD
  const matchISO = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (matchISO) {
    const ano = matchISO[1];
    const mes = matchISO[2].padStart(2, '0');
    const dia = matchISO[3].padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  return undefined;
}

export function normalizarSituacaoDoc(val: any): SituacaoDoc {
  if (!val) return 'sem_laudo';
  const s = String(val).trim().toLowerCase();
  if (s.includes('estudo') || s.includes('caso')) return 'estudo_de_caso';
  if (s.includes('com laudo') || s.includes('laudo') || s === 'sim') return 'com_laudo';
  return 'sem_laudo';
}

export function normalizarCid(val: any): string {
  if (!val) return '';
  return String(val).trim().toUpperCase();
}

/**
 * Mapeamento inteligente de colunas a partir dos cabeçalhos encontrados na planilha
 */
export function detectarMapeamentoAutomatico(headers: string[]): ColumnMapping {
  const findMatch = (terms: string[]) => {
    const found = headers.find(h => {
      const lower = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return terms.some(t => lower.includes(t));
    });
    return found || '';
  };

  return {
    codigo: findMatch(['codigo', 'cod', 'matricula', 'id']),
    nome: findMatch(['nome', 'aluno', 'estudante']),
    escola_nome: findMatch(['escola', 'unidade', 'colegio']),
    data_nascimento: findMatch(['nascimento', 'data nasc', 'dt nasc', 'd.n']),
    idade: findMatch(['idade', 'anos']),
    sexo: findMatch(['sexo', 'genero']),
    turma: findMatch(['turma', 'classe']),
    ciclo: findMatch(['ciclo']),
    serie: findMatch(['serie', 'ano escolar']),
    situacao_doc: findMatch(['situacao', 'laudo', 'documental', 'condicao']),
    cid: findMatch(['cid', 'diagnostico']),
    numero_processo: findMatch(['processo', 'n processo', 'protocolo']),
    contrato_acompanhante: findMatch(['contrato', 'contrato acompanhante']),
    necessita_professor: findMatch(['precisa aee', 'necessita aee', 'precisa professor']),
    necessita_acompanhante: findMatch(['precisa acompanhante', 'necessita acompanhante', 'cuidador']),
    professor_aee: findMatch(['professor aee', 'prof aee', 'docente aee']),
    acompanhante: findMatch(['acompanhante', 'cuidador', 'mediador']),
    observacoes: findMatch(['observac', 'obs', 'detalhes']),
  };
}

/**
 * Validação linha a linha com mapeamento
 */
export function validarLinha(row: Record<string, any>, mapping: ColumnMapping, escolasExistentes: Escola[]): ParsedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const getVal = (key: keyof ColumnMapping) => {
    const colName = mapping[key];
    return colName ? row[colName] : undefined;
  };

  const nome = normalizarNome(getVal('nome'));
  if (!nome || nome.length < 3) {
    errors.push('Nome do aluno é obrigatório (mínimo 3 caracteres)');
  }

  const codigo = String(getVal('codigo') || '').trim() || `ALU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const escolaNome = String(getVal('escola_nome') || '').trim();
  let escolaId = '';
  if (escolaNome) {
    const match = escolasExistentes.find(e => 
      e.nome.toLowerCase().includes(escolaNome.toLowerCase()) ||
      escolaNome.toLowerCase().includes(e.nome.toLowerCase()) ||
      e.codigo.toLowerCase() === escolaNome.toLowerCase()
    );
    if (match) {
      escolaId = match.id;
    } else {
      warnings.push(`Escola "${escolaNome}" não encontrada no cadastro atual. Será criada automaticamente se confirmada.`);
    }
  } else {
    errors.push('Escola não informada');
  }

  const dataNascimento = normalizarData(getVal('data_nascimento'));
  const idadeInformada = getVal('idade') ? parseInt(String(getVal('idade')), 10) : undefined;

  const situacao_doc = normalizarSituacaoDoc(getVal('situacao_doc'));
  const cid = normalizarCid(getVal('cid'));
  const numeroProcesso = String(getVal('numero_processo') || '').trim();
  const contratoAcompanhante = normalizarBoolean(getVal('contrato_acompanhante'), false);

  const necessitaProfessor = normalizarBoolean(getVal('necessita_professor'), true);
  const necessitaAcompanhante = normalizarBoolean(getVal('necessita_acompanhante'), false);

  const professorNome = normalizarNome(getVal('professor_aee'));
  const acompanhanteNome = normalizarNome(getVal('acompanhante'));

  if (situacao_doc === 'com_laudo' && !cid) {
    warnings.push('Aluno marcado com laudo sem CID preenchido');
  }

  return {
    raw: row,
    normalized: {
      codigo,
      nome,
      escola_id: escolaId,
      escola_nome: escolaNome,
      data_nascimento: dataNascimento,
      idade_informada: isNaN(Number(idadeInformada)) ? undefined : idadeInformada,
      sexo: normalizarSexo(getVal('sexo')),
      turma_nome: String(getVal('turma') || '').trim(),
      ciclo: normalizarCiclo(getVal('ciclo')),
      serie: String(getVal('serie') || '').trim(),
      situacao_doc,
      cid,
      numero_processo: numeroProcesso,
      contrato_acompanhante: contratoAcompanhante,
      necessita_professor_aee: necessitaProfessor,
      necessita_acompanhante: necessitaAcompanhante,
      professor_nome: professorNome,
      acompanhante_nome: acompanhanteNome,
      observacoes: String(getVal('observacoes') || '').trim(),
    },
    errors,
    warnings,
    valida: errors.length === 0,
  };
}

/**
 * Gera e baixa uma planilha modelo do Excel preenchida para testes
 */
export function baixarPlanilhaModelo() {
  const dadosExemplo = [
    {
      'Código Aluno': 'ALU-ALT-101',
      'Nome do Aluno': 'Arthur Miguel dos Santos',
      'Escola': 'EEEM Polivalente de Altamira',
      'Data de Nascimento': '15/04/2010',
      'Idade': 16,
      'Sexo': 'M',
      'Turma': '101-M',
      'Ciclo': '2º Ciclo',
      'Série': '1ª Série EM',
      'Situação Documental': 'Com Laudo',
      'CID': 'F84.0',
      'Nº Processo': 'PROC-2026/0890',
      'Contrato Acompanhante': 'Sim',
      'Necessita Professor AEE': 'Sim',
      'Necessita Acompanhante': 'Sim',
      'Professor AEE': 'Profª. Lúcia dos Anjos Ribeiro',
      'Acompanhante': 'Carlos Eduardo da Silva',
      'Observações': 'Aluno com acompanhamento em SRM.',
    },
    {
      'Código Aluno': 'ALU-ALT-102',
      'Nome do Aluno': 'Maria Eduarda Ferreira Lima',
      'Escola': 'EEEM Profª. Maria de Lourdes Rocha',
      'Data de Nascimento': '22/09/2011',
      'Idade': 15,
      'Sexo': 'F',
      'Turma': '901-M',
      'Ciclo': '1º Ciclo',
      'Série': '9º Ano',
      'Situação Documental': 'Estudo de Caso',
      'CID': 'F70',
      'Nº Processo': 'PROC-2026/0912',
      'Contrato Acompanhante': 'Não',
      'Necessita Professor AEE': 'Sim',
      'Necessita Acompanhante': 'Não',
      'Professor AEE': '',
      'Acompanhante': '',
      'Observações': 'Necessita alocação de professor de AEE no contraturno.',
    },
    {
      'Código Aluno': 'ALU-ALT-103',
      'Nome do Aluno': 'Kauã Victor Bezerra',
      'Escola': 'EEEM Ducila Almeida do Nascimento',
      'Data de Nascimento': '03/01/2009',
      'Idade': 17,
      'Sexo': 'M',
      'Turma': '301-N',
      'Ciclo': '3º Ciclo',
      'Série': '3ª Série EM',
      'Situação Documental': 'Com Laudo',
      'CID': 'G80',
      'Nº Processo': 'PROC-2025/3310',
      'Contrato Acompanhante': 'Não',
      'Necessita Professor AEE': 'Sim',
      'Necessita Acompanhante': 'Sim',
      'Professor AEE': 'Profª. Elenice Pinheiro Farias',
      'Acompanhante': '',
      'Observações': 'Urgente: aluno sem acompanhante na unidade.',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(dadosExemplo);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos_AEE');
  XLSX.writeFile(wb, 'Modelo_Importacao_SEDUC_Altamira.xlsx');
}

/**
 * Exporta os alunos atuais para Excel
 */
export function exportarAlunosExcel(alunos: any[], nomeArquivo = 'Alunos_AEE_SEDUC_PA.xlsx') {
  const linhas = alunos.map(a => ({
    'Código': a.codigo,
    'Nome': a.nome,
    'Escola': a.escola_nome || '',
    'Turma': a.turma_nome || '',
    'Série': a.serie || '',
    'Ciclo': a.ciclo ? `${a.ciclo}º Ciclo` : '',
    'Data Nasc.': a.data_nascimento || '',
    'Idade': a.idade_calculada || a.idade_informada || '',
    'Sexo': a.sexo || '',
    'Situação Doc.': a.situacao_doc === 'com_laudo' ? 'Com Laudo' : a.situacao_doc === 'estudo_de_caso' ? 'Estudo de Caso' : 'Sem Laudo',
    'CID': a.cid || '',
    'Nº Processo': a.numero_processo || '',
    'Status Atendimento': a.status_atendimento,
    'Necessita Prof. AEE': a.necessita_professor_aee ? 'Sim' : 'Não',
    'Tem Prof. AEE': a.tem_professor ? 'Sim' : 'Não',
    'Professor AEE': a.professor_nome || '',
    'Necessita Acomp.': a.necessita_acompanhante ? 'Sim' : 'Não',
    'Tem Acomp.': a.tem_acompanhante ? 'Sim' : 'Não',
    'Acompanhante': a.acompanhante_nome || '',
    'Contrato Acomp.': a.contrato_acompanhante ? 'Regular' : 'Pendente/Não',
    'PDI Pendente': a.pdi_pendente ? 'Sim' : 'Não',
    'Observações': a.observacoes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
  XLSX.writeFile(wb, nomeArquivo);
}
