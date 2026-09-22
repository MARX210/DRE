// Tipos principais do Sistema de Gestão de Educação Especial
// SEDUC-PA · DRE Altamira · Núcleo de Educação Especial

export type PapelUsuario = 'nucleo_diretor' | 'nucleo_tecnico' | 'diretor_escola' | 'secretaria_escola';
export type SexoTipo = 'M' | 'F';
export type SituacaoDoc = 'com_laudo' | 'estudo_de_caso' | 'sem_laudo';
export type TipoProfissional = 'professor_aee' | 'acompanhante';
export type StatusPDI = 'rascunho' | 'vigente' | 'encerrado';
export type StatusOficio = 'rascunho' | 'emitido' | 'enviado' | 'respondido';
export type TipoDocumento = 'laudo' | 'estudo_de_caso' | 'pdi' | 'contrato' | 'outro';
export type TurnoTipo = 'matutino' | 'vespertino' | 'noturno' | 'integral';

export type StatusAtendimento = 
  | 'ok'                  // Verde: tem tudo o que precisa
  | 'sem_nenhum'          // Vermelho: precisa de professor E acompanhante e não tem nenhum
  | 'sem_professor'       // Roxo: falta o Professor AEE
  | 'sem_acompanhante'    // Laranja: falta o Acompanhante
  | 'contrato_pendente'   // Amarelo: tem acompanhante, mas contrato_acompanhante = false
  | 'nao_se_aplica';      // Cinza: não precisa de atendimento

export const MUNICIPIOS_DRE = [
  'Altamira',
  'Brasil Novo',
  'Vitória do Xingu',
  'Porto de Moz',
  'Senador José Porfírio',
  'Medicilândia',
  'Anapu',
  'Uruará'
] as const;

export type MunicipioDRE = typeof MUNICIPIOS_DRE[number] | string;

export interface Escola {
  id: string;
  codigo: string;
  nome: string;
  municipio: MunicipioDRE;
  diretor_nome?: string;
  cargo_responsavel?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  modalidade?: 'REGULAR' | 'INTEGRAL' | 'SOME' | 'CEMEP' | 'SOME/CEMEP' | string;
  srm_status?: 'ativa' | 'inativa' | 'nao_possui' | string;
  possui_srm?: boolean;
  atendimento_some?: boolean;
  pdi_status_geral?: 'todos' | 'parcial' | 'nenhum' | string;
  situacao_cuidadores?: 'ok' | 'parcial' | 'nenhum' | string;
  dificuldades_docentes?: string;
  observacoes_regionais?: string;
  qtd_alunos_laudo?: number;
  qtd_alunos_sem_laudo?: number;
  detalhe_diagnosticos?: string;
  ativa: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  papel: PapelUsuario;
  escola_id?: string | null;
  ativo: boolean;
  senha?: string;
  created_at: string;
  ultimo_acesso?: string;
}

export type Usuario = Profile;

export interface Profissional {
  id: string;
  escola_id: string;
  nome: string;
  tipo: TipoProfissional;
  documento_ou_matricula?: string;
  telefone?: string;
  vinculo_contratual?: string;
  ativo: boolean;
  created_at: string;
}

export interface Turma {
  id: string;
  escola_id: string;
  codigo: string;
  nome: string;
  turno?: TurnoTipo | string;
  ano_letivo: number;
  serie_ou_etapa?: string;
  created_at: string;
}

export interface Aluno {
  id: string;
  codigo: string;
  nome: string;
  data_nascimento?: string;
  idade_informada?: number;
  sexo?: SexoTipo;
  endereco?: string;
  escola_id: string;
  turma_id?: string | null;
  ciclo?: 1 | 2 | 3 | null;
  serie?: string;
  situacao_doc: SituacaoDoc;
  cid?: string;
  numero_processo?: string;
  contrato_acompanhante: boolean;
  necessita_professor_aee: boolean;
  necessita_acompanhante: boolean;
  professor_aee_id?: string | null;
  acompanhante_id?: string | null;
  observacoes?: string;
  ativo: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AlunoComStatus extends Aluno {
  tem_professor: boolean;
  tem_acompanhante: boolean;
  status_atendimento: StatusAtendimento;
  pdi_pendente: boolean;
  escola_nome?: string;
  escola_municipio?: string;
  turma_nome?: string;
  professor_nome?: string;
  acompanhante_nome?: string;
  idade_calculada?: number;
}

export interface ConteudoPDI {
  potencialidades?: string;
  dificuldades?: string;
  objetivos_gerais?: string;
  objetivos_especificos?: string;
  estrategias_pedagogicas?: string;
  recursos_acessibilidade?: string;
  metas_bimestre_1?: string;
  metas_bimestre_2?: string;
  metas_bimestre_3?: string;
  metas_bimestre_4?: string;
  avaliacao?: string;
}

export interface PDI {
  id: string;
  aluno_id: string;
  escola_id: string;
  ano_letivo: number;
  status: StatusPDI;
  conteudo: ConteudoPDI;
  elaborado_por?: string;
  data_elaboracao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentoAluno {
  id: string;
  aluno_id: string;
  escola_id: string;
  tipo: TipoDocumento;
  titulo: string;
  storage_path: string;
  file_name?: string;
  mime_type?: string;
  tamanho_bytes?: number;
  enviado_por?: string;
  created_at: string;
  url_temporaria?: string;
}

export interface Oficio {
  id: string;
  ano: number;
  numero: number;
  assunto: string;
  destinatario: string;
  corpo: string;
  status: StatusOficio;
  escola_id?: string | null;
  pdf_path?: string;
  criado_por?: string;
  criado_por_nome?: string;
  emitido_em?: string;
  resposta_recebida_em?: string;
  resposta_resumo?: string;
  created_at: string;
  alunos_ids?: string[];
}

export interface OficioAluno {
  oficio_id: string;
  aluno_id: string;
  status_no_momento: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_nome?: string;
  usuario_nome?: string;
  usuario_papel?: string;
  acao: string;
  tabela: string;
  entidade?: string;
  registro_id?: string;
  detalhes?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// MODELOS OFICIAIS: COEES / SEDUC-PA (COORDENADORIA DE EDUCAÇÃO ESPECIAL)
// ============================================================================

export type IndicadorAvaliacao = 'sim' | 'nao' | 'ED' | 'NA';

export interface EstudoDeCaso {
  id: string;
  aluno_id: string;
  escola_id: string;
  data_preenchimento: string;
  status: 'rascunho' | 'concluido';
  
  // 1. Identificação do Estudante
  identificacao: {
    nome: string;
    data_nascimento: string;
    idade: string | number;
    responsavel: string;
    telefone: string;
    endereco: string;
    numero: string;
    bairro: string;
    complemento?: string;
    cep: string;
    cidade: string;
    estado: string;
  };

  // 2. Informações Familiares
  familia: {
    genitor: { nome: string; profissao: string; telefone: string; escolaridade: string };
    genitora: { nome: string; profissao: string; telefone: string; escolaridade: string };
    outros_responsaveis?: { 
      nome: string; 
      profissao: string; 
      telefone: string; 
      parentesco: string; 
      escolaridade: string; 
      endereco_residencial: string; 
      bairro: string; 
      municipio: string 
    };
  };

  // 3. Escola Atual (1ª Matrícula - Escolarização)
  escola_1_matricula: {
    nome_escola: string;
    endereco: string;
    telefone_escola: string;
    dre: string;
    diretor: string;
    telefone_diretor: string;
    ano_etapa: string;
    turma: string;
    turno: string;
    quantitativo_estudantes: string | number;
  };

  // 4. Unidade Escolar Atual (2ª Matrícula - AEE)
  escola_2_aee: {
    nome: string;
    telefone: string;
    endereco: string;
    ure_use: string;
    bairro: string;
    municipio: string;
    ano_ingresso: string | number;
    idade: string | number;
    turma: string;
    turno: string;
    quantitativo_turma: string | number;
  };

  // 5. Informação Escolar (Histórico Escolar)
  historico_escolar: {
    antecedentes_relevantes: string;
  };

  // 6. Procedimentos Referentes à Avaliação Inicial
  avaliacao_inicial: {
    // 6.1 Necessidade Específica do Estudante
    deficiencia_intelectual: boolean;
    deficiencia_auditiva: '' | 'leve' | 'moderada' | 'severa' | 'profunda';
    surdez: boolean;
    surdez_faz_uso_libras: 'sim' | 'nao' | '';
    deficiencia_visual: '' | 'baixa_visao' | 'cegueira';
    surdocegueira: boolean;
    deficiencia_fisica: boolean;
    deficiencia_multipla: boolean;
    deficiencia_multipla_especifique?: string;
    tea: boolean;
    altas_habilidades_superdotacao: boolean;

    // 6.2 Transtornos de Aprendizagem
    dislexia: boolean;
    discalculia: boolean;
    disgrafia: boolean;
    tdah: boolean;
    tpac: boolean;
    tda: boolean;
    outros_transtornos?: string;

    // 6.3 Área da Saúde
    laudo_medico: 'sim' | 'nao';
    cid_laudo?: string;
    processos_avaliativos_medicos?: string;
    possui_problema_saude: 'sim' | 'nao';
    qual_problema_saude?: string;
    necessita_atencao_horario_escolar: 'sim' | 'nao';
    qual_atencao_necessita?: string;
    faz_uso_medicacao: 'sim' | 'nao';
    qual_medicacao?: string;
    horarios_medicacao?: string;
    tem_restricao_alimentar: 'sim' | 'nao';
    restricao_alimentar_orientacao?: string;
  };

  // 7. Aspectos Pedagógicos (sim / nao / ED / NA)
  aspectos_pedagogicos: {
    psicomotores: {
      praxia_global: IndicadorAvaliacao;
      preensao_lapis: IndicadorAvaliacao;
      dominancia_lateral: IndicadorAvaliacao;
      dominancia_lateral_qual?: string;
      lateralidade_dir_esq: IndicadorAvaliacao;
      esquema_corporal: IndicadorAvaliacao;
      coordenacao_visomotora: IndicadorAvaliacao;
      complementares?: string;
    };
    linguagem_oral: {
      expressa_pela_fala: IndicadorAvaliacao;
      fala_sem_omissao: IndicadorAvaliacao;
      articula_palavras: IndicadorAvaliacao;
      discriminacao_fonematica: IndicadorAvaliacao;
      vocabulario_adequado: IndicadorAvaliacao;
      compreensao_comandos: IndicadorAvaliacao;
      expressa_pensamento_organizado: IndicadorAvaliacao;
      faz_leitura: IndicadorAvaliacao;
      nomeia_objetos_corretamente: IndicadorAvaliacao;
      interpretacao_texto: IndicadorAvaliacao;
      cria_historias: IndicadorAvaliacao;
      uso_sinais: IndicadorAvaliacao;
      complementares?: string;
    };
    linguagem_escrita: {
      escrita_palavras_textos: IndicadorAvaliacao;
      distincao_letras_numeros: IndicadorAvaliacao;
      producao_textual_espontanea: IndicadorAvaliacao;
      caligrafia_compreensivel: IndicadorAvaliacao;
      escrita_espelhada: IndicadorAvaliacao;
      pontuacao_acentuacao: IndicadorAvaliacao;
      trocas: IndicadorAvaliacao;
      inversoes: IndicadorAvaliacao;
      omissoes: IndicadorAvaliacao;
      aglutinacoes: IndicadorAvaliacao;
      repeticao: IndicadorAvaliacao;
      substituicao: IndicadorAvaliacao;
      acrescimo: IndicadorAvaliacao;
      organizacao_sintatica_semantica: IndicadorAvaliacao;
      complementares?: string;
    };
    raciocinio_matematico: {
      reconhecimento_numeros: IndicadorAvaliacao;
      contagem: IndicadorAvaliacao;
      calculos_sem_concreto: IndicadorAvaliacao;
      formas_geometricas: IndicadorAvaliacao;
      sequencia_fatos: IndicadorAvaliacao;
      correlaciona_objetos_funcao: IndicadorAvaliacao;
      complementares?: string;
    };
    atencao_concentracao: {
      mantem_atencao: IndicadorAvaliacao;
      distrai_se_nao_finaliza: IndicadorAvaliacao;
      necessita_acompanhamento_continuo: IndicadorAvaliacao;
      permanece_em_sala: IndicadorAvaliacao;
      complementares?: string;
    };
    sociabilidade_afetividade: {
      descricao: string;
    };
    vida_autonoma: {
      alimentacao_banheiro_autonomia: IndicadorAvaliacao;
      identifica_perigo: IndicadorAvaliacao;
      complementares?: string;
    };
  };

  // 8. Levantamento das Necessidades de Apoios do SAEE
  apoios_saee: {
    professor_aee_contraturno: boolean;
    professor_bilingue: boolean;
    professor_libras: boolean;
    professor_portugues_surdos: boolean;
    tradutor_interprete_libras: boolean;
    guia_interprete: boolean;
    braillista: boolean;
    acompanhante_especializado: boolean;
  };

  // 9. Definição do Plano de Atendimento
  plano_atendimento: {
    plano_aee: boolean;
    plano_aee_objetivo?: string;
    plano_pei: boolean;
    plano_pei_objetivo?: string;
    outros_encaminhamentos: boolean;
    outros_encaminhamentos_objetivo?: string;
  };

  // 10. Considerações Finais e Assinaturas
  consideracoes_finais: {
    texto: string;
    local: string;
    data: string;
    responsavel_nome: string;
    responsavel_cargo: string;
    responsavel_matricula: string;
  };

  created_by?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------------------
// PEI (Plano Educacional Individualizado - COEES / SEDUC-PA)
// ----------------------------------------------------------------------------

export interface IndicadorPEI {
  id: string;
  problema_central: string;
  causas: string;
  consequencias: string;
}

export interface PEIOfficial {
  id: string;
  aluno_id: string;
  escola_id: string;
  ano_letivo: number;
  status: StatusPDI;
  data_elaboracao: string;
  periodo_execucao: string;

  // 1. Identificação do Estudante
  identificacao: {
    nome: string;
    idade: string | number;
    data_nascimento: string;
    ano_etapa: string;
    turma: string;
    ano_ingresso: string | number;
    atendido_aee: 'sim' | 'nao' | 'outras';
    outras_necessidades?: string;
    local_aee: 'srm' | 'caee' | '';
    caee_qual?: string;
  };

  // 2. Indicadores para o PEI
  indicadores: IndicadorPEI[];

  // 3. Relato do Contexto Familiar
  contexto_familiar: {
    dados_responsaveis: string;
    historico_vida: string;
    expectativa_familiar: string; // curto, médio e longo prazo
  };

  // 4. Áreas de Desenvolvimento (Funções Cognitivas)
  areas_desenvolvimento: {
    percepcao: string;
    atencao_concentracao: string;
    memoria: string;
    linguagem: string; // oral / escrita / não verbal
    raciocinio_logico: string;
    aspectos_psicomotores: string;
    atividade_vida_autonoma: string;
    aspectos_interpessoais_sociais: string;
  };

  // 5. Ensino Individualizado (BNCC / Currículo Estado)
  ensino_individualizado: {
    objetivos_aprendizagem: string; // acadêmicos e socioemocionais
    avaliacao_aprendizagem: string; // como o estudante será avaliado
    tipos_apoio: string;
    projeto_vida?: string; // quando Ensino Médio
  };

  // Local, Data e Assinaturas
  assinaturas: {
    local: string;
    data: string;
    professor_saee: string;
    responsavel_pedagogico: string;
    professores_turma: string[];
  };

  created_by?: string;
  updated_at?: string;
}
