import { StatusAtendimento, Aluno, PDI } from '../types';
import { 
  CheckCircle2, 
  AlertOctagon, 
  UserX, 
  UserMinus, 
  FileWarning, 
  Minus,
  type LucideIcon 
} from 'lucide-react';

export interface StatusConfig {
  key: StatusAtendimento;
  label: string;
  descricao: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  rowBg: string;
  dotColor: string;
  icon: LucideIcon;
}

export const STATUS_SEMAFORO_CONFIG: Record<StatusAtendimento, StatusConfig> = {
  ok: {
    key: 'ok',
    label: 'Atendimento Regular',
    descricao: 'Tem todos os profissionais dos quais necessita',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    rowBg: 'hover:bg-emerald-50/50',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  sem_nenhum: {
    key: 'sem_nenhum',
    label: 'Sem Nenhum Atendimento',
    descricao: 'Precisa de Professor AEE e Acompanhante, mas não tem nenhum',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-800',
    rowBg: 'hover:bg-red-50/50',
    dotColor: 'bg-red-500',
    icon: AlertOctagon,
  },
  sem_professor: {
    key: 'sem_professor',
    label: 'Falta Professor AEE',
    descricao: 'Precisa de Professor AEE, mas não possui professor alocado',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    rowBg: 'hover:bg-purple-50/50',
    dotColor: 'bg-purple-500',
    icon: UserX,
  },
  sem_acompanhante: {
    key: 'sem_acompanhante',
    label: 'Falta Acompanhante',
    descricao: 'Precisa de Acompanhante, mas não possui profissional alocado',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    rowBg: 'hover:bg-amber-50/50',
    dotColor: 'bg-amber-500',
    icon: UserMinus,
  },
  contrato_pendente: {
    key: 'contrato_pendente',
    label: 'Contrato Pendente',
    descricao: 'Tem acompanhante, mas o contrato não está regularizado/ativo',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
    rowBg: 'hover:bg-yellow-50/50',
    dotColor: 'bg-yellow-500',
    icon: FileWarning,
  },
  nao_se_aplica: {
    key: 'nao_se_aplica',
    label: 'Não se Aplica',
    descricao: 'Não necessita de atendimento especializado',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    rowBg: 'hover:bg-slate-50',
    dotColor: 'bg-slate-400',
    icon: Minus,
  },
};

/**
 * Calcula o status de atendimento de um aluno conforme regra da view vw_alunos_status
 */
export function calcularStatusAtendimento(aluno: Aluno): StatusAtendimento {
  const necessitaProf = Boolean(aluno.necessita_professor_aee);
  const necessitaAcomp = Boolean(aluno.necessita_acompanhante);
  const temProf = Boolean(aluno.professor_aee_id);
  const temAcomp = Boolean(aluno.acompanhante_id);
  const contratoOk = Boolean(aluno.contrato_acompanhante);

  if (!necessitaProf && !necessitaAcomp) {
    return 'nao_se_aplica';
  }

  if (necessitaProf && !temProf && necessitaAcomp && !temAcomp) {
    return 'sem_nenhum';
  }

  if (necessitaProf && !temProf) {
    return 'sem_professor';
  }

  if (necessitaAcomp && !temAcomp) {
    return 'sem_acompanhante';
  }

  if (temAcomp && !contratoOk) {
    return 'contrato_pendente';
  }

  return 'ok';
}

/**
 * Verifica se o aluno possui PDI pendente
 */
export function calcularPdiPendente(aluno: Aluno, pdis: PDI[], anoLetivo = new Date().getFullYear()): boolean {
  if (aluno.situacao_doc === 'sem_laudo') return false;
  return !pdis.some(
    p => p.aluno_id === aluno.id && p.status === 'vigente' && p.ano_letivo === anoLetivo
  );
}

/**
 * Calcula o pior status entre uma lista de alunos (para exibir na escola ou turma)
 */
export function calcularPiorStatus(statusList: StatusAtendimento[]): StatusAtendimento {
  if (statusList.length === 0) return 'nao_se_aplica';
  if (statusList.includes('sem_nenhum')) return 'sem_nenhum';
  if (statusList.includes('sem_professor')) return 'sem_professor';
  if (statusList.includes('sem_acompanhante')) return 'sem_acompanhante';
  if (statusList.includes('contrato_pendente')) return 'contrato_pendente';
  if (statusList.includes('ok')) return 'ok';
  return 'nao_se_aplica';
}

export function calcularIdade(dataNascimento?: string, idadeInformada?: number): number | undefined {
  if (dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return Math.max(0, idade);
  }
  return idadeInformada;
}
