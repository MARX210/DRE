import { z } from 'zod';

export const SituacaoDocSchema = z.enum(['com_laudo', 'estudo_de_caso', 'sem_laudo']);
export const SexoSchema = z.enum(['M', 'F']).optional();
export const PapelUsuarioSchema = z.enum(['nucleo_diretor', 'nucleo_tecnico', 'diretor_escola', 'secretaria_escola']);
export const StatusPdiSchema = z.enum(['rascunho', 'vigente', 'encerrado']);
export const StatusOficioSchema = z.enum(['rascunho', 'emitido', 'enviado', 'respondido']);

// Validador de formato de CID (ex.: F84.0, G80, F70, etc. ou vazio)
export const CidValidator = z.string()
  .trim()
  .transform(val => val.toUpperCase())
  .refine(
    val => val === '' || /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/.test(val),
    { message: 'Formato de CID inválido (ex.: F84.0, G80, F70)' }
  )
  .optional();

export const AlunoSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1, 'Código do aluno é obrigatório').trim(),
  nome: z.string().min(3, 'Nome completo do aluno é obrigatório').trim(),
  data_nascimento: z.string().optional().nullable(),
  idade_informada: z.number().int().min(0).max(120).optional().nullable(),
  sexo: SexoSchema.nullable(),
  endereco: z.string().optional().nullable(),
  escola_id: z.string().min(1, 'Escola é obrigatória'),
  turma_id: z.string().optional().nullable(),
  ciclo: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  serie: z.string().optional().nullable(),
  situacao_doc: SituacaoDocSchema,
  cid: CidValidator,
  numero_processo: z.string().optional().nullable(),
  contrato_acompanhante: z.boolean().default(false),
  necessita_professor_aee: z.boolean().default(true),
  necessita_acompanhante: z.boolean().default(false),
  professor_aee_id: z.string().optional().nullable(),
  acompanhante_id: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type AlunoFormData = z.infer<typeof AlunoSchema>;

export const EscolaSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1, 'Código da escola é obrigatório').trim(),
  nome: z.string().min(3, 'Nome da escola é obrigatório').trim(),
  municipio: z.string().min(2, 'Município é obrigatório').default('Altamira'),
  diretor_nome: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  ativa: z.boolean().default(true),
});

export type EscolaFormData = z.infer<typeof EscolaSchema>;

export const TurmaSchema = z.object({
  id: z.string().optional(),
  escola_id: z.string().min(1, 'Escola é obrigatória'),
  codigo: z.string().min(1, 'Código da turma é obrigatório').trim(),
  nome: z.string().min(2, 'Nome da turma é obrigatório').trim(),
  turno: z.string().optional().nullable(),
  ano_letivo: z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
});

export type TurmaFormData = z.infer<typeof TurmaSchema>;

export const ProfissionalSchema = z.object({
  id: z.string().optional(),
  escola_id: z.string().min(1, 'Escola é obrigatória'),
  nome: z.string().min(3, 'Nome do profissional é obrigatório').trim(),
  tipo: z.enum(['professor_aee', 'acompanhante']),
  documento_ou_matricula: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type ProfissionalFormData = z.infer<typeof ProfissionalSchema>;

export const PdiSchema = z.object({
  id: z.string().optional(),
  aluno_id: z.string().min(1, 'Aluno é obrigatório'),
  escola_id: z.string().min(1, 'Escola é obrigatória'),
  ano_letivo: z.number().int().default(new Date().getFullYear()),
  status: StatusPdiSchema.default('rascunho'),
  elaborado_por: z.string().optional().nullable(),
  data_elaboracao: z.string().optional().nullable(),
  conteudo: z.object({
    potencialidades: z.string().optional(),
    dificuldades: z.string().optional(),
    objetivos_gerais: z.string().optional(),
    objetivos_especificos: z.string().optional(),
    estrategias_pedagogicas: z.string().optional(),
    recursos_acessibilidade: z.string().optional(),
    metas_bimestre_1: z.string().optional(),
    metas_bimestre_2: z.string().optional(),
    metas_bimestre_3: z.string().optional(),
    metas_bimestre_4: z.string().optional(),
    avaliacao: z.string().optional(),
  }).default({}),
});

export type PdiFormData = z.infer<typeof PdiSchema>;

export const OficioSchema = z.object({
  id: z.string().optional(),
  ano: z.number().int().default(new Date().getFullYear()),
  numero: z.number().int().optional(),
  assunto: z.string().min(5, 'Assunto é obrigatório').trim(),
  destinatario: z.string().min(3, 'Destinatário é obrigatório').default('SEDUC/PA - Diretoria de Educação Especial'),
  corpo: z.string().min(10, 'Corpo do ofício é obrigatório'),
  status: StatusOficioSchema.default('rascunho'),
  escola_id: z.string().optional().nullable(),
  alunos_ids: z.array(z.string()).default([]),
});

export type OficioFormData = z.infer<typeof OficioSchema>;
