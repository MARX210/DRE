import { supabase, isSupabaseConfigured } from './client';
import { 
  Escola, 
  Profile, 
  Profissional, 
  Turma, 
  Aluno, 
  PDI, 
  Oficio, 
  AuditLogItem 
} from '../../types';

export const MASTER_USER_ID = 'daad1701-0680-420b-af89-5c8e6dc4a1bf'; // Prof. Antonio Vieira Bispo

// Utilitário para gerar UUID v4 autêntico
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Utilitário para garantir que qualquer ID de formato legado ou gerado em tela seja um UUID v4 válido
export function toUUID(str: string | null | undefined): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  // Hash determinístico compatível com UUID v4 para strings customizadas
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x12345678, h4 = 0x87654321;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2860486313);
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const full = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).slice(0, 32);
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-4${full.slice(13, 16)}-a${full.slice(17, 20)}-${full.slice(20, 32)}`;
}

// Mapeadores para adequar aos tipos e colunas estritos do PostgreSQL
function mapEscolaToDb(e: Escola) {
  return {
    id: toUUID(e.id) || generateUUID(),
    codigo: e.codigo || `ESC-${Math.floor(100 + Math.random() * 900)}`,
    nome: e.nome,
    municipio: e.municipio || 'Altamira',
    diretor_nome: e.diretor_nome || null,
    endereco: e.endereco || null,
    telefone: e.telefone || null,
    email: e.email || null,
    ativa: e.ativa !== undefined ? e.ativa : true,
    created_at: e.created_at || new Date().toISOString(),
  };
}

function mapProfileToDb(p: Profile) {
  const isNucleo = p.papel === 'nucleo_diretor' || p.papel === 'nucleo_tecnico';
  const resolvedEscolaId = isNucleo
    ? null
    : (toUUID(p.escola_id) || 'e1111111-1111-1111-1111-111111111111');
  return {
    id: toUUID(p.id) || generateUUID(),
    nome: p.nome,
    email: p.email || null,
    cargo: p.cargo || null,
    papel: p.papel,
    escola_id: resolvedEscolaId,
    ativo: p.ativo !== undefined ? p.ativo : true,
    created_at: p.created_at || new Date().toISOString(),
  };
}

function mapProfissionalToDb(p: Profissional) {
  return {
    id: toUUID(p.id) || generateUUID(),
    escola_id: toUUID(p.escola_id) || 'e1111111-1111-1111-1111-111111111111',
    nome: p.nome,
    tipo: p.tipo === 'acompanhante' ? 'acompanhante' : 'professor_aee',
    documento_ou_matricula: p.documento_ou_matricula || null,
    telefone: p.telefone || null,
    ativo: p.ativo !== undefined ? p.ativo : true,
    created_at: p.created_at || new Date().toISOString(),
  };
}

function mapTurmaToDb(t: Turma) {
  return {
    id: toUUID(t.id) || generateUUID(),
    escola_id: toUUID(t.escola_id) || 'e1111111-1111-1111-1111-111111111111',
    codigo: t.codigo || `TUR-${Math.floor(100 + Math.random() * 900)}`,
    nome: t.nome,
    turno: t.turno || 'Manhã',
    ano_letivo: Number(t.ano_letivo) || 2026,
    created_at: t.created_at || new Date().toISOString(),
  };
}

function mapAlunoToDb(a: Aluno) {
  const cleanId = toUUID(a.id) || generateUUID();
  const cleanEscolaId = toUUID(a.escola_id) || 'e1111111-1111-1111-1111-111111111111';
  const cleanTurmaId = a.turma_id ? toUUID(a.turma_id) : null;
  const cleanProfAeeId = a.professor_aee_id ? toUUID(a.professor_aee_id) : null;
  const cleanAcompId = a.acompanhante_id ? toUUID(a.acompanhante_id) : null;
  const cleanCreatedBy = toUUID(a.created_by) || MASTER_USER_ID;
  const cleanUpdatedBy = toUUID(a.updated_by) || MASTER_USER_ID;

  return {
    id: cleanId,
    codigo: a.codigo || `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
    nome: a.nome,
    data_nascimento: a.data_nascimento || null,
    idade_informada: a.idade_informada ? Number(a.idade_informada) : null,
    sexo: a.sexo === 'F' ? 'F' : 'M',
    endereco: a.endereco || null,
    escola_id: cleanEscolaId,
    turma_id: cleanTurmaId,
    ciclo: (a.ciclo === 2 || a.ciclo === 3) ? a.ciclo : 1,
    serie: a.serie || '',
    situacao_doc: a.situacao_doc || 'sem_laudo',
    cid: a.cid ? a.cid.toUpperCase() : null,
    numero_processo: a.numero_processo || null,
    contrato_acompanhante: Boolean(a.contrato_acompanhante),
    necessita_professor_aee: a.necessita_professor_aee !== undefined ? Boolean(a.necessita_professor_aee) : true,
    necessita_acompanhante: Boolean(a.necessita_acompanhante),
    professor_aee_id: cleanProfAeeId,
    acompanhante_id: cleanAcompId,
    observacoes: a.observacoes || null,
    ativo: a.ativo !== undefined ? a.ativo : true,
    created_by: cleanCreatedBy,
    updated_by: cleanUpdatedBy,
    created_at: a.created_at || new Date().toISOString(),
    updated_at: a.updated_at || new Date().toISOString(),
  };
}

function mapPdiToDb(p: PDI) {
  return {
    id: toUUID(p.id) || generateUUID(),
    aluno_id: toUUID(p.aluno_id),
    escola_id: toUUID(p.escola_id) || 'e1111111-1111-1111-1111-111111111111',
    ano_letivo: Number(p.ano_letivo) || 2026,
    status: p.status || 'rascunho',
    conteudo: typeof p.conteudo === 'string' ? p.conteudo : JSON.stringify(p.conteudo || {}),
    elaborado_por: p.elaborado_por || null,
    data_elaboracao: p.data_elaboracao || new Date().toISOString().split('T')[0],
    created_by: toUUID(p.created_by) || MASTER_USER_ID,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

function mapOficioToDb(o: Oficio) {
  return {
    id: toUUID(o.id) || generateUUID(),
    ano: Number(o.ano) || new Date().getFullYear(),
    numero: Number(o.numero) || 1,
    assunto: o.assunto || 'Ofício DRE Altamira',
    destinatario: o.destinatario || 'SEDUC/PA',
    corpo: o.corpo || '',
    status: o.status || 'rascunho',
    escola_id: toUUID(o.escola_id),
    pdf_path: o.pdf_path || null,
    criado_por: toUUID(o.criado_por) || MASTER_USER_ID,
    emitido_em: o.emitido_em || null,
    resposta_recebida_em: o.resposta_recebida_em || null,
    resposta_resumo: o.resposta_resumo || null,
    created_at: o.created_at || new Date().toISOString(),
  };
}

function mapAuditLogToDb(l: AuditLogItem) {
  return {
    user_id: toUUID(l.user_id) || MASTER_USER_ID,
    acao: l.acao,
    tabela: l.tabela,
    registro_id: l.registro_id || null,
    detalhes: l.detalhes || null,
    created_at: l.created_at || (l as { timestamp?: string }).timestamp || new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// CONSULTA COMPLETA DOS DADOS DO SUPABASE
// -------------------------------------------------------------

export async function fetchFullDataFromSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [
      escolasRes,
      profilesRes,
      profissionaisRes,
      turmasRes,
      alunosRes,
      pdisRes,
      oficiosRes,
      auditRes
    ] = await Promise.all([
      supabase.from('escolas').select('*').order('nome'),
      supabase.from('profiles').select('*'),
      supabase.from('profissionais').select('*'),
      supabase.from('turmas').select('*'),
      supabase.from('alunos').select('*'),
      supabase.from('pdis').select('*'),
      supabase.from('oficios').select('*'),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
    ]);

    if (escolasRes.error) {
      console.warn('[Supabase Sync] Aviso ao carregar escolas:', escolasRes.error);
    }

    return {
      escolas: (escolasRes.data as Escola[]) || [],
      profiles: (profilesRes.data as Profile[]) || [],
      profissionais: (profissionaisRes.data as Profissional[]) || [],
      turmas: (turmasRes.data as Turma[]) || [],
      alunos: (alunosRes.data as Aluno[]) || [],
      pdis: (pdisRes.data as PDI[]) || [],
      oficios: (oficiosRes.data as Oficio[]) || [],
      auditLogs: (auditRes.data as AuditLogItem[]) || []
    };
  } catch (error) {
    console.error('[Supabase Sync] Erro ao carregar dados do banco:', error);
    return null;
  }
}

// -------------------------------------------------------------
// SINCRONIZAÇÃO EM MASSA / SEED INICIAL NO BANCO DE DADOS
// -------------------------------------------------------------

export async function seedInitialDataToSupabase(payload: {
  escolas: Escola[];
  profiles: Profile[];
  profissionais: Profissional[];
  turmas: Turma[];
  alunos: Aluno[];
  pdis: PDI[];
  oficios: Oficio[];
  auditLogs: AuditLogItem[];
}): Promise<{ success: boolean; stats?: Record<string, number>; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase não configurado.' };
  }

  try {
    const stats: Record<string, number> = {};

    // 1. Escolas
    if (payload.escolas.length > 0) {
      const dbEscolas = payload.escolas.map(mapEscolaToDb);
      const { error } = await supabase.from('escolas').upsert(dbEscolas, { onConflict: 'id' });
      if (error) console.error('Erro ao salvar escolas:', error);
      else stats.escolas = dbEscolas.length;
    }

    // 2. Perfis / Usuários
    if (payload.profiles.length > 0) {
      const dbProfiles = payload.profiles.map(mapProfileToDb);
      const { error } = await supabase.from('profiles').upsert(dbProfiles, { onConflict: 'id' });
      if (error) console.error('Erro ao salvar perfis:', error);
      else stats.profiles = dbProfiles.length;
    }

    // 3. Profissionais
    if (payload.profissionais.length > 0) {
      const dbProfissionais = payload.profissionais.map(mapProfissionalToDb);
      const { error } = await supabase.from('profissionais').upsert(dbProfissionais, { onConflict: 'id' });
      if (error) console.error('Erro ao salvar profissionais:', error);
      else stats.profissionais = dbProfissionais.length;
    }

    // 4. Turmas
    if (payload.turmas.length > 0) {
      const dbTurmas = payload.turmas.map(mapTurmaToDb);
      const { error } = await supabase.from('turmas').upsert(dbTurmas, { onConflict: 'id' });
      if (error) console.error('Erro ao salvar turmas:', error);
      else stats.turmas = dbTurmas.length;
    }

    // 5. Alunos
    if (payload.alunos.length > 0) {
      const dbAlunos = payload.alunos.map(mapAlunoToDb);
      const { error } = await supabase.from('alunos').upsert(dbAlunos, { onConflict: 'id' });
      if (error) console.error('Erro ao salvar alunos:', error);
      else stats.alunos = dbAlunos.length;
    }

    return { success: true, stats };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// OPERAÇÕES UNITÁRIAS PERSISTENTES EM TEMPO REAL
// -------------------------------------------------------------

export async function dbUpsertAluno(aluno: Aluno): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapAlunoToDb(aluno);
    let { error } = await supabase.from('alunos').upsert(payload, { onConflict: 'id' });

    // Auto-recuperação inteligente de violação de chave estrangeira
    if (error && (error.code === '23503' || error.message.includes('foreign key'))) {
      console.warn('[Supabase] Chave estrangeira não encontrada, auto-ajustando relacionamentos...', error.message);
      if (error.message.includes('turma_id')) payload.turma_id = null;
      if (error.message.includes('professor_aee_id')) payload.professor_aee_id = null;
      if (error.message.includes('acompanhante_id')) payload.acompanhante_id = null;
      if (error.message.includes('created_by')) payload.created_by = MASTER_USER_ID;
      if (error.message.includes('updated_by')) payload.updated_by = MASTER_USER_ID;
      if (error.message.includes('escola_id')) {
        await supabase.from('escolas').upsert({
          id: payload.escola_id,
          codigo: 'ESC-' + payload.escola_id.slice(0, 8),
          nome: 'Escola Estadual Regional',
          municipio: 'Altamira',
          ativa: true
        }, { onConflict: 'id' });
      }
      const retry = await supabase.from('alunos').upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Erro ao salvar aluno no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Falha ao salvar aluno:', msg);
    return { success: false, error: msg };
  }
}

export async function dbInativarAluno(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const dbId = toUUID(id);
    if (!dbId) return { success: false, error: 'ID inválido' };
    const { error } = await supabase.from('alunos').update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', dbId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao inativar aluno no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertEscola(escola: Escola): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapEscolaToDb(escola);
    const { error } = await supabase.from('escolas').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Erro ao salvar escola no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar escola no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertProfissional(prof: Profissional): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapProfissionalToDb(prof);
    let { error } = await supabase.from('profissionais').upsert(payload, { onConflict: 'id' });
    
    // Se a escola ainda não existe no banco, garante a escola e tenta de novo
    if (error && (error.code === '23503' || error.message.includes('foreign key'))) {
      await supabase.from('escolas').upsert({
        id: payload.escola_id,
        codigo: 'ESC-' + payload.escola_id.slice(0, 8),
        nome: 'Escola Estadual Regional',
        municipio: 'Altamira',
        ativa: true
      }, { onConflict: 'id' });
      const retry = await supabase.from('profissionais').upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Erro ao salvar profissional no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar profissional no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertTurma(turma: Turma): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapTurmaToDb(turma);
    let { error } = await supabase.from('turmas').upsert(payload, { onConflict: 'id' });

    if (error && (error.code === '23503' || error.message.includes('foreign key'))) {
      await supabase.from('escolas').upsert({
        id: payload.escola_id,
        codigo: 'ESC-' + payload.escola_id.slice(0, 8),
        nome: 'Escola Estadual Regional',
        municipio: 'Altamira',
        ativa: true
      }, { onConflict: 'id' });
      const retry = await supabase.from('turmas').upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Erro ao salvar turma no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar turma no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertPdi(pdi: PDI): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapPdiToDb(pdi);
    let { error } = await supabase.from('pdis').upsert(payload, { onConflict: 'id' });

    if (error && (error.code === '23503' || error.message.includes('foreign key'))) {
      if (error.message.includes('created_by')) payload.created_by = MASTER_USER_ID;
      const retry = await supabase.from('pdis').upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Erro ao salvar PDI no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar PDI no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertOficio(oficio: Oficio): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapOficioToDb(oficio);
    let { error } = await supabase.from('oficios').upsert(payload, { onConflict: 'id' });

    if (error && (error.code === '23503' || error.message.includes('foreign key'))) {
      if (error.message.includes('criado_por')) payload.criado_por = MASTER_USER_ID;
      if (error.message.includes('escola_id')) payload.escola_id = null;
      const retry = await supabase.from('oficios').upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Erro ao salvar ofício no banco:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar ofício no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbInsertAuditLog(log: AuditLogItem): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const payload = mapAuditLogToDb(log);
    const { error } = await supabase.from('audit_log').insert(payload);
    if (error) {
      console.warn('[Supabase] Erro ao registrar log no banco:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Supabase] Erro ao registrar log no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpsertProfile(profile: Profile): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' };
  try {
    const payload = mapProfileToDb(profile);
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao salvar usuário no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbUpdateProfileStatus(id: string, ativo: boolean): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' };
  try {
    const dbId = toUUID(id);
    if (!dbId) return { success: false, error: 'ID inválido' };
    const { error } = await supabase.from('profiles').update({ ativo }).eq('id', dbId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao atualizar status do usuário no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbDeleteProfile(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase não configurado' };
  try {
    const dbId = toUUID(id);
    if (!dbId) return { success: false, error: 'ID inválido' };

    // Desvincular de referências nas outras tabelas para garantir que a exclusão não falhe por chave estrangeira
    await Promise.allSettled([
      supabase.from('alunos').update({ created_by: null }).eq('created_by', dbId),
      supabase.from('alunos').update({ updated_by: null }).eq('updated_by', dbId),
      supabase.from('pdis').update({ created_by: null }).eq('created_by', dbId),
      supabase.from('oficios').update({ criado_por: null }).eq('criado_por', dbId),
      supabase.from('audit_log').update({ user_id: null }).eq('user_id', dbId)
    ]);

    const { error } = await supabase.from('profiles').delete().eq('id', dbId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao excluir usuário no banco:', msg);
    return { success: false, error: msg };
  }
}

export async function dbInativarEscola(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const dbId = toUUID(id);
    if (dbId) {
      await supabase.from('escolas').update({ ativa: false }).eq('id', dbId);
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao inativar escola:', msg);
    return { success: false, error: msg };
  }
}

export async function dbInativarProfissional(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const dbId = toUUID(id);
    if (dbId) {
      await supabase.from('profissionais').update({ ativo: false }).eq('id', dbId);
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao inativar profissional:', msg);
    return { success: false, error: msg };
  }
}

export async function dbDeleteTurma(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const dbId = toUUID(id);
    if (dbId) {
      await supabase.from('alunos').update({ turma_id: null }).eq('turma_id', dbId);
      await supabase.from('turmas').delete().eq('id', dbId);
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Erro ao excluir turma:', msg);
    return { success: false, error: msg };
  }
}
