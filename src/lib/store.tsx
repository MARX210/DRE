import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Escola, 
  Profile, 
  Profissional, 
  Turma, 
  Aluno, 
  AlunoComStatus, 
  PDI, 
  Oficio, 
  DocumentoAluno, 
  AuditLogItem,
  PapelUsuario,
  EstudoDeCaso,
  PEIOfficial
} from '../types';
import { 
  INITIAL_ESCOLAS, 
  INITIAL_PROFILES, 
  INITIAL_PROFISSIONAIS, 
  INITIAL_TURMAS, 
  INITIAL_ALUNOS, 
  INITIAL_PDIS, 
  INITIAL_OFICIOS, 
  INITIAL_DOCUMENTOS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_ESTUDOS_DE_CASO,
  INITIAL_PEIS
} from './mockData';
import { calcularStatusAtendimento, calcularPdiPendente, calcularIdade } from './status';
import { 
  isSupabaseConfigured, 
  checkSupabaseConnection 
} from './supabase/client';
import { 
  fetchFullDataFromSupabase, 
  seedInitialDataToSupabase,
  dbUpsertAluno,
  dbInativarAluno,
  dbUpsertEscola,
  dbInativarEscola,
  dbUpsertProfissional,
  dbInativarProfissional,
  dbUpsertTurma,
  dbDeleteTurma,
  dbUpsertPdi,
  dbUpsertOficio,
  dbInsertAuditLog,
  dbUpsertProfile,
  dbUpdateProfileStatus,
  dbDeleteProfile,
  toUUID,
  generateUUID,
  MASTER_USER_ID
} from './supabase/syncService';

const STORAGE_KEY = 'seduc_pa_aee_v5_clean_zero';

interface AppStoreContextType {
  // Autenticação & Sessão
  isAuthenticated: boolean;
  login: (emailOuNome: string, senha?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Usuário Atual & Permissões
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  trocarPerfil: (userId: string) => void;
  ehNucleo: boolean;
  minhaEscolaId: string | null;
  minhaEscola: Escola | null;

  // Dados Brutos (Visíveis conforme escopo de quem acessa)
  escolas: Escola[];
  profissionais: Profissional[];
  turmas: Turma[];
  alunos: AlunoComStatus[];
  pdis: PDI[];
  estudosDeCaso: EstudoDeCaso[];
  peis: PEIOfficial[];
  oficios: Oficio[];
  documentos: DocumentoAluno[];
  usuarios: Profile[];
  auditLogs: AuditLogItem[];
  auditoriaLogs: AuditLogItem[];

  // Listagens Irrestritas (usadas pelo Núcleo ou para selects autorizados)
  todasEscolas: Escola[];

  // Ações CRUD com Auditoria e RLS
  salvarAluno: (dados: Partial<Aluno>) => Promise<{ success: boolean; id?: string; error?: string }>;
  inativarAluno: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarEscola: (dados: Partial<Escola>) => Promise<{ success: boolean; id?: string; error?: string }>;
  inativarEscola: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarTurma: (dados: Partial<Turma>) => Promise<{ success: boolean; id?: string; error?: string }>;
  excluirTurma: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarProfissional: (dados: Partial<Profissional>) => Promise<{ success: boolean; id?: string; error?: string }>;
  inativarProfissional: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarPDI: (dados: Partial<PDI>) => Promise<{ success: boolean; id?: string; error?: string }>;
  salvarEstudoDeCaso: (dados: Partial<EstudoDeCaso>) => Promise<{ success: boolean; id?: string; error?: string }>;
  excluirEstudoDeCaso: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarPEI: (dados: Partial<PEIOfficial>) => Promise<{ success: boolean; id?: string; error?: string }>;
  excluirPEI: (id: string) => Promise<{ success: boolean; error?: string }>;
  obterEstudoDeCaso: (alunoId: string) => EstudoDeCaso | undefined;
  obterPEI: (alunoId: string) => PEIOfficial | undefined;
  salvarDocumento: (doc: Omit<DocumentoAluno, 'id' | 'created_at'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  excluirDocumento: (id: string) => Promise<{ success: boolean; error?: string }>;
  salvarOficio: (dados: Partial<Oficio>) => Promise<{ success: boolean; id?: string; error?: string }>;
  registrarRespostaOficio: (id: string, dataResp: string, protocolo: string, resumo: string) => Promise<{ success: boolean; error?: string }>;
  proximoNumeroOficio: (ano: number) => number;
  salvarUsuario: (dados: Partial<Profile>) => Promise<{ success: boolean; id?: string; error?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ success: boolean; error?: string }>;
  excluirUsuario: (id: string) => Promise<{ success: boolean; error?: string }>;
  registrarLog: (acao: string, tabela: string, registroId?: string, detalhes?: Record<string, unknown>) => void;
  importarLote: (
    escolasNovas: Partial<Escola>[],
    turmasNovas: Partial<Turma>[],
    profissionaisNovos: Partial<Profissional>[],
    alunosNovos: Partial<Aluno>[]
  ) => Promise<{ criados: number; atualizados: number; erros: string[] }>;
  importarAlunosEmLote: (linhasValidadas: any[]) => Promise<{ success: boolean; totalImportados: number; error?: string }>;
  restaurarDadosIniciais: () => void;

  // Banco de Dados / Supabase
  isDbConfigured: boolean;
  dbStatus: 'connected' | 'syncing' | 'offline' | 'error';
  dbMessage?: string;
  lastSyncedAt: Date | null;
  syncWithDatabase: (forceUpload?: boolean) => Promise<{ success: boolean; message: string }>;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização com localStorage ou seed
  const [escolasState, setEscolasState] = useState<Escola[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_escolas`);
    return saved ? JSON.parse(saved) : INITIAL_ESCOLAS;
  });

  const [profilesState, setProfilesState] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profiles`);
    if (!saved) return INITIAL_PROFILES;
    try {
      const parsed: Profile[] = JSON.parse(saved);
      return (parsed && parsed.length > 0) ? parsed : INITIAL_PROFILES;
    } catch {
      return INITIAL_PROFILES;
    }
  });

  const [profissionaisState, setProfissionaisState] = useState<Profissional[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profissionais`);
    return saved ? JSON.parse(saved) : INITIAL_PROFISSIONAIS;
  });

  const [turmasState, setTurmasState] = useState<Turma[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_turmas`);
    return saved ? JSON.parse(saved) : INITIAL_TURMAS;
  });

  const [alunosState, setAlunosState] = useState<Aluno[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_alunos`);
    return saved ? JSON.parse(saved) : INITIAL_ALUNOS;
  });

  const [pdisState, setPdisState] = useState<PDI[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pdis`);
    return saved ? JSON.parse(saved) : INITIAL_PDIS;
  });

  const [estudosDeCasoState, setEstudosDeCasoState] = useState<EstudoDeCaso[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_estudos_de_caso`);
    return saved ? JSON.parse(saved) : INITIAL_ESTUDOS_DE_CASO;
  });

  const [peisState, setPeisState] = useState<PEIOfficial[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_peis_oficiais`);
    return saved ? JSON.parse(saved) : INITIAL_PEIS;
  });

  const [oficiosState, setOficiosState] = useState<Oficio[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_oficios`);
    return saved ? JSON.parse(saved) : INITIAL_OFICIOS;
  });

  const [documentosState, setDocumentosState] = useState<DocumentoAluno[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_documentos`);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTOS;
  });

  const [auditLogsState, setAuditLogsState] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Estado de Autenticação / Sessão ativa
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auth`);
    return saved !== null ? saved === 'true' : true;
  });

  // Usuário ativo padrão: Diretor do Núcleo
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currentUser`);
    return saved || MASTER_USER_ID;
  });

  // Persistência automática no localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auth`, String(isAuthenticated));
  }, [isAuthenticated]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_escolas`, JSON.stringify(escolasState));
  }, [escolasState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(profilesState));
  }, [profilesState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_profissionais`, JSON.stringify(profissionaisState));
  }, [profissionaisState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_turmas`, JSON.stringify(turmasState));
  }, [turmasState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_alunos`, JSON.stringify(alunosState));
  }, [alunosState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pdis`, JSON.stringify(pdisState));
  }, [pdisState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_estudos_de_caso`, JSON.stringify(estudosDeCasoState));
  }, [estudosDeCasoState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_peis_oficiais`, JSON.stringify(peisState));
  }, [peisState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_oficios`, JSON.stringify(oficiosState));
  }, [oficiosState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_documentos`, JSON.stringify(documentosState));
  }, [documentosState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogsState));
  }, [auditLogsState]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currentUser`, currentUserId);
  }, [currentUserId]);

  // Estado de Sincronização com o Banco de Dados (Supabase / PostgreSQL)
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>(
    isSupabaseConfigured ? 'syncing' : 'offline'
  );
  const [dbMessage, setDbMessage] = useState<string>('');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const syncWithDatabase = useCallback(async (forceUpload = false) => {
    if (!isSupabaseConfigured) {
      setDbStatus('offline');
      setDbMessage('Supabase não configurado');
      return { success: false, message: 'Supabase não configurado no .env.local' };
    }

    try {
      setDbStatus('syncing');
      setDbMessage('Conectando ao banco de dados...');
      const conn = await checkSupabaseConnection();
      if (!conn.connected) {
        setDbStatus('error');
        setDbMessage(conn.error || 'Falha ao conectar');
        return { success: false, message: conn.error || 'Erro de conexão' };
      }

      if (forceUpload) {
        setDbMessage('Enviando dados locais para o banco...');
        const seedRes = await seedInitialDataToSupabase({
          escolas: escolasState,
          profiles: profilesState,
          profissionais: profissionaisState,
          turmas: turmasState,
          alunos: alunosState,
          pdis: pdisState,
          oficios: oficiosState,
          auditLogs: auditLogsState
        });
        if (!seedRes.success) {
          throw new Error(seedRes.error || 'Erro ao sincronizar');
        }
        setDbStatus('connected');
        setLastSyncedAt(new Date());
        setDbMessage('Todos os dados foram salvos no banco com sucesso!');
        return { success: true, message: 'Todos os dados foram salvos no banco com sucesso!' };
      }

      // Obter lista de usuários já excluídos localmente para sincronização com o banco
      const savedDeleted = localStorage.getItem(`${STORAGE_KEY}_deleted_profiles`);
      const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];

      // Carregar dados existentes no banco
      const cloudData = await fetchFullDataFromSupabase();
      if (cloudData) {
        if (cloudData.escolas && cloudData.escolas.length > 0) {
          setEscolasState(cloudData.escolas);
        }
        if (cloudData.profiles && cloudData.profiles.length > 0) {
          const validProfiles = cloudData.profiles.map(cp => {
            const local = profilesState.find(lp => lp.id === cp.id || toUUID(lp.id) === cp.id);
            return {
              ...cp,
              senha: local?.senha || 'seduc@dre2026',
              ultimo_acesso: local?.ultimo_acesso || cp.ultimo_acesso
            };
          });
          setProfilesState(validProfiles);
          localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(validProfiles));
        }
        setProfissionaisState(cloudData.profissionais || []);
        setTurmasState(cloudData.turmas || []);
        setAlunosState(cloudData.alunos || []);
        setPdisState(cloudData.pdis || []);
        setOficiosState(cloudData.oficios || []);
        setAuditLogsState(cloudData.auditLogs || []);
      }

      setDbStatus('connected');
      setLastSyncedAt(new Date());
      setDbMessage('Conectado ao Supabase (PostgreSQL)');
      return { success: true, message: 'Conectado e sincronizado com o banco.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDbStatus('error');
      setDbMessage(msg);
      return { success: false, message: msg };
    }
  }, [escolasState, profilesState, profissionaisState, turmasState, alunosState, pdisState, oficiosState, auditLogsState]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      syncWithDatabase(false);
    }
  }, []);

  const currentUser = useMemo(() => {
    return profilesState.find(p => p.id === currentUserId) || profilesState[0];
  }, [profilesState, currentUserId]);

  const ehNucleo = currentUser.papel === 'nucleo_diretor' || currentUser.papel === 'nucleo_tecnico';
  const minhaEscolaId = currentUser.escola_id || null;

  const minhaEscola = useMemo(() => {
    if (!minhaEscolaId) return null;
    return escolasState.find(e => e.id === minhaEscolaId) || null;
  }, [escolasState, minhaEscolaId]);

  const trocarPerfil = useCallback((userId: string) => {
    const target = profilesState.find(p => p.id === userId);
    if (target) {
      if (!target.ativo) {
        alert(`O usuário "${target.nome}" está desativado. Ative-o na lista de Usuários antes de utilizá-lo.`);
        return;
      }
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      setProfilesState(prev => prev.map(p => p.id === target.id ? { ...p, ultimo_acesso: new Date().toISOString() } : p));
    }
  }, [profilesState]);

  const registrarLog = useCallback((acao: string, tabela: string, registroId?: string, detalhes?: Record<string, unknown>) => {
    const novoLog: AuditLogItem = {
      id: generateUUID(),
      user_id: currentUser.id,
      user_nome: currentUser.nome,
      acao,
      tabela,
      registro_id: registroId,
      detalhes,
      created_at: new Date().toISOString(),
    };
    setAuditLogsState(prev => [novoLog, ...prev.slice(0, 499)]); // limite de 500 logs
    dbInsertAuditLog(novoLog);
  }, [currentUser]);

  // Aplicação das políticas de segurança RLS sobre os dados expostos
  const escolas = useMemo(() => {
    if (ehNucleo) return escolasState;
    return escolasState.filter(e => e.id === minhaEscolaId);
  }, [escolasState, ehNucleo, minhaEscolaId]);

  const todasEscolas = escolasState;

  const profissionais = useMemo(() => {
    if (ehNucleo) return profissionaisState;
    return profissionaisState.filter(p => p.escola_id === minhaEscolaId);
  }, [profissionaisState, ehNucleo, minhaEscolaId]);

  const turmas = useMemo(() => {
    if (ehNucleo) return turmasState;
    return turmasState.filter(t => t.escola_id === minhaEscolaId);
  }, [turmasState, ehNucleo, minhaEscolaId]);

  const pdis = useMemo(() => {
    if (ehNucleo) return pdisState;
    return pdisState.filter(p => p.escola_id === minhaEscolaId);
  }, [pdisState, ehNucleo, minhaEscolaId]);

  const oficios = useMemo(() => {
    // Escolas NÃO têm acesso a ofícios (Regra 3.3 e RLS)
    if (!ehNucleo) return [];
    return oficiosState;
  }, [oficiosState, ehNucleo]);

  const documentos = useMemo(() => {
    if (ehNucleo) return documentosState;
    return documentosState.filter(d => d.escola_id === minhaEscolaId);
  }, [documentosState, ehNucleo, minhaEscolaId]);

  const usuarios = useMemo(() => {
    if (ehNucleo) return profilesState;
    // Usuários da escola só veem a si próprios
    return profilesState.filter(p => p.id === currentUser.id);
  }, [profilesState, ehNucleo, currentUser.id]);

  const auditLogs = useMemo(() => {
    if (ehNucleo) return auditLogsState;
    return [];
  }, [auditLogsState, ehNucleo]);

  // Alunos enriquecidos com status do semáforo (vw_alunos_status com RLS)
  const alunos = useMemo(() => {
    const baseAlunos = ehNucleo 
      ? alunosState.filter(a => a.ativo)
      : alunosState.filter(a => a.ativo && a.escola_id === minhaEscolaId);

    const escolaMap = new Map(escolasState.map(e => [e.id, e.nome]));
    const escolaMuniMap = new Map(escolasState.map(e => [e.id, e.municipio]));
    const turmaMap = new Map(turmasState.map(t => [t.id, t.nome]));
    const profMap = new Map(profissionaisState.map(p => [p.id, p.nome]));

    return baseAlunos.map(a => {
      const status_atendimento = calcularStatusAtendimento(a);
      const pdi_pendente = calcularPdiPendente(a, pdisState);
      const idade_calculada = calcularIdade(a.data_nascimento, a.idade_informada);

      return {
        ...a,
        tem_professor: Boolean(a.professor_aee_id),
        tem_acompanhante: Boolean(a.acompanhante_id),
        status_atendimento,
        pdi_pendente,
        escola_nome: escolaMap.get(a.escola_id) || 'Escola não identificada',
        escola_municipio: escolaMuniMap.get(a.escola_id) || 'Altamira',
        turma_nome: a.turma_id ? turmaMap.get(a.turma_id) || 'Sem Turma' : 'Sem Turma',
        professor_nome: a.professor_aee_id ? profMap.get(a.professor_aee_id) : undefined,
        acompanhante_nome: a.acompanhante_id ? profMap.get(a.acompanhante_id) : undefined,
        idade_calculada,
      };
    });
  }, [alunosState, ehNucleo, minhaEscolaId, escolasState, turmasState, profissionaisState, pdisState]);

  // Operações de CRUD
  const salvarAluno = useCallback(async (dados: Partial<Aluno>) => {
    try {
      // Validação de permissão: escola só pode salvar na própria escola
      const escolaAlvo = dados.escola_id || minhaEscolaId;
      if (!ehNucleo && escolaAlvo !== minhaEscolaId) {
        return { success: false, error: 'Acesso negado: você só pode gerenciar alunos da sua própria escola.' };
      }

      const now = new Date().toISOString();
      let alunoId = dados.id;

      if (alunoId) {
        // Atualizar
        let alunoAtualizado: Aluno | null = null;
        setAlunosState(prev => prev.map(item => {
          if (item.id === alunoId) {
            alunoAtualizado = {
              ...item,
              ...dados,
              updated_by: currentUser.id,
              updated_at: now,
            } as Aluno;
            return alunoAtualizado;
          }
          return item;
        }));
        if (alunoAtualizado) {
          await dbUpsertAluno(alunoAtualizado);
        }
        registrarLog('ATUALIZACAO_ALUNO', 'alunos', alunoId, { codigo: dados.codigo, nome: dados.nome });
      } else {
        // Criar
        alunoId = generateUUID();
        const novoAluno: Aluno = {
          id: alunoId,
          codigo: dados.codigo || `ALU-${Date.now().toString().slice(-4)}`,
          nome: dados.nome || '',
          data_nascimento: dados.data_nascimento,
          idade_informada: dados.idade_informada,
          sexo: dados.sexo,
          endereco: dados.endereco,
          escola_id: escolaAlvo!,
          turma_id: dados.turma_id || null,
          ciclo: dados.ciclo || 1,
          serie: dados.serie || '',
          situacao_doc: dados.situacao_doc || 'sem_laudo',
          cid: dados.cid?.toUpperCase() || '',
          numero_processo: dados.numero_processo || '',
          contrato_acompanhante: Boolean(dados.contrato_acompanhante),
          necessita_professor_aee: dados.necessita_professor_aee !== undefined ? dados.necessita_professor_aee : true,
          necessita_acompanhante: Boolean(dados.necessita_acompanhante),
          professor_aee_id: dados.professor_aee_id || null,
          acompanhante_id: dados.acompanhante_id || null,
          observacoes: dados.observacoes || '',
          ativo: true,
          created_by: currentUser.id,
          updated_by: currentUser.id,
          created_at: now,
          updated_at: now,
        };

        setAlunosState(prev => [novoAluno, ...prev]);
        await dbUpsertAluno(novoAluno);
        registrarLog('CRIACAO_ALUNO', 'alunos', alunoId, { codigo: novoAluno.codigo, nome: novoAluno.nome });
      }

      return { success: true, id: alunoId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar aluno';
      return { success: false, error: msg };
    }
  }, [ehNucleo, minhaEscolaId, currentUser.id, registrarLog]);

  const inativarAluno = useCallback(async (id: string) => {
    const alvo = alunosState.find(a => a.id === id);
    if (!alvo) return { success: false, error: 'Aluno não encontrado' };
    if (!ehNucleo && alvo.escola_id !== minhaEscolaId) {
      return { success: false, error: 'Permissão negada' };
    }

    setAlunosState(prev => prev.map(a => a.id === id ? { ...a, ativo: false, updated_at: new Date().toISOString() } : a));
    dbInativarAluno(id);
    registrarLog('INATIVACAO_ALUNO', 'alunos', id, { codigo: alvo.codigo, nome: alvo.nome });
    return { success: true };
  }, [alunosState, ehNucleo, minhaEscolaId, registrarLog]);

  const salvarEscola = useCallback(async (dados: Partial<Escola>) => {
    if (!ehNucleo && dados.id && dados.id !== minhaEscolaId) {
      return { success: false, error: 'Permissão negada: você só pode alterar os dados da sua escola vinculada.' };
    }

    if (dados.id) {
      let escolaAtualizada: Escola | null = null;
      setEscolasState(prev => prev.map(e => {
        if (e.id === dados.id) {
          const srmStatus = dados.srm_status || e.srm_status;
          escolaAtualizada = {
            ...e,
            ...dados,
            possui_srm: srmStatus ? (srmStatus === 'ativa' || srmStatus === 'inativa') : e.possui_srm,
            updated_at: new Date().toISOString()
          } as Escola;
          return escolaAtualizada;
        }
        return e;
      }));
      if (escolaAtualizada) {
        await dbUpsertEscola(escolaAtualizada);
      }
      registrarLog('ATUALIZACAO_ESCOLA', 'escolas', dados.id, { nome: dados.nome, municipio: dados.municipio });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const siglaMuni = (dados.municipio || 'ALT').substring(0, 3).toUpperCase();
      const srmStatus = dados.srm_status || (dados.possui_srm ? 'ativa' : 'nao_possui');
      const nova: Escola = {
        id: novoId,
        codigo: dados.codigo?.trim() || `ESC-${siglaMuni}-${Date.now().toString().slice(-3)}`,
        nome: dados.nome?.trim() || 'Nova Escola Estadual',
        municipio: dados.municipio || 'Altamira',
        diretor_nome: dados.diretor_nome || '',
        cargo_responsavel: dados.cargo_responsavel || 'Diretor(a) Escolar',
        endereco: dados.endereco || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        modalidade: dados.modalidade || 'REGULAR',
        srm_status: srmStatus,
        possui_srm: srmStatus === 'ativa' || srmStatus === 'inativa',
        atendimento_some: dados.modalidade?.includes('SOME') || false,
        pdi_status_geral: dados.pdi_status_geral || 'parcial',
        situacao_cuidadores: dados.situacao_cuidadores || 'nenhum',
        qtd_alunos_laudo: Number(dados.qtd_alunos_laudo) || 0,
        qtd_alunos_sem_laudo: Number(dados.qtd_alunos_sem_laudo) || 0,
        detalhe_diagnosticos: dados.detalhe_diagnosticos || '',
        dificuldades_docentes: dados.dificuldades_docentes || '',
        observacoes_regionais: dados.observacoes_regionais || '',
        ativa: true,
        created_at: new Date().toISOString(),
      };
      setEscolasState(prev => [nova, ...prev]);
      await dbUpsertEscola(nova);
      registrarLog('CRIACAO_ESCOLA', 'escolas', novoId, { nome: nova.nome, codigo: nova.codigo, municipio: nova.municipio });
      return { success: true, id: novoId };
    }
  }, [ehNucleo, minhaEscolaId, registrarLog]);

  const inativarEscola = useCallback(async (id: string) => {
    if (!ehNucleo) return { success: false, error: 'Apenas a equipe do Núcleo pode inativar escolas.' };
    setEscolasState(prev => prev.map(e => e.id === id ? { ...e, ativa: false } : e));
    dbInativarEscola(id);
    registrarLog('INATIVACAO_ESCOLA', 'escolas', id);
    return { success: true };
  }, [ehNucleo, registrarLog]);

  const salvarTurma = useCallback(async (dados: Partial<Turma>) => {
    const escolaAlvo = dados.escola_id || minhaEscolaId;
    if (!ehNucleo && escolaAlvo !== minhaEscolaId) {
      return { success: false, error: 'Permissão negada para turmas de outra escola.' };
    }

    if (dados.id) {
      let turmaAtualizada: Turma | null = null;
      setTurmasState(prev => prev.map(t => {
        if (t.id === dados.id) {
          turmaAtualizada = { ...t, ...dados } as Turma;
          return turmaAtualizada;
        }
        return t;
      }));
      if (turmaAtualizada) {
        await dbUpsertTurma(turmaAtualizada);
      }
      registrarLog('ATUALIZACAO_TURMA', 'turmas', dados.id, { nome: dados.nome });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const nova: Turma = {
        id: novoId,
        escola_id: escolaAlvo!,
        codigo: dados.codigo || `TUR-${Date.now().toString().slice(-3)}`,
        nome: dados.nome || 'Turma',
        turno: dados.turno || 'Manhã',
        ano_letivo: dados.ano_letivo || new Date().getFullYear(),
        created_at: new Date().toISOString(),
      };
      setTurmasState(prev => [nova, ...prev]);
      await dbUpsertTurma(nova);
      registrarLog('CRIACAO_TURMA', 'turmas', novoId, { codigo: nova.codigo, escola_id: nova.escola_id });
      return { success: true, id: novoId };
    }
  }, [ehNucleo, minhaEscolaId, registrarLog]);

  const excluirTurma = useCallback(async (id: string) => {
    const turma = turmasState.find(t => t.id === id);
    if (!turma) return { success: false, error: 'Turma não encontrada' };
    if (!ehNucleo && turma.escola_id !== minhaEscolaId) return { success: false, error: 'Permissão negada' };

    setTurmasState(prev => prev.filter(t => t.id !== id));
    dbDeleteTurma(id);
    registrarLog('EXCLUSAO_TURMA', 'turmas', id);
    return { success: true };
  }, [turmasState, ehNucleo, minhaEscolaId, registrarLog]);

  const salvarProfissional = useCallback(async (dados: Partial<Profissional>) => {
    const escolaAlvo = dados.escola_id || minhaEscolaId;
    if (!ehNucleo && escolaAlvo !== minhaEscolaId) {
      return { success: false, error: 'Permissão negada.' };
    }

    if (dados.id) {
      let profAtualizado: Profissional | null = null;
      setProfissionaisState(prev => prev.map(p => {
        if (p.id === dados.id) {
          profAtualizado = { ...p, ...dados } as Profissional;
          return profAtualizado;
        }
        return p;
      }));
      if (profAtualizado) {
        await dbUpsertProfissional(profAtualizado);
      }
      registrarLog('ATUALIZACAO_PROFISSIONAL', 'profissionais', dados.id, { nome: dados.nome });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const novo: Profissional = {
        id: novoId,
        escola_id: escolaAlvo!,
        nome: dados.nome || '',
        tipo: dados.tipo || 'professor_aee',
        documento_ou_matricula: dados.documento_ou_matricula,
        telefone: dados.telefone,
        ativo: true,
        created_at: new Date().toISOString(),
      };
      setProfissionaisState(prev => [novo, ...prev]);
      await dbUpsertProfissional(novo);
      registrarLog('CRIACAO_PROFISSIONAL', 'profissionais', novoId, { nome: novo.nome, tipo: novo.tipo });
      return { success: true, id: novoId };
    }
  }, [ehNucleo, minhaEscolaId, registrarLog]);

  const inativarProfissional = useCallback(async (id: string) => {
    const prof = profissionaisState.find(p => p.id === id);
    if (!prof) return { success: false, error: 'Profissional não encontrado' };
    if (!ehNucleo && prof.escola_id !== minhaEscolaId) return { success: false, error: 'Permissão negada' };

    setProfissionaisState(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));
    dbInativarProfissional(id);
    registrarLog('INATIVACAO_PROFISSIONAL', 'profissionais', id);
    return { success: true };
  }, [profissionaisState, ehNucleo, minhaEscolaId, registrarLog]);

  const salvarPDI = useCallback(async (dados: Partial<PDI>) => {
    const aluno = alunosState.find(a => a.id === dados.aluno_id);
    if (!aluno) return { success: false, error: 'Aluno não encontrado' };
    if (!ehNucleo && aluno.escola_id !== minhaEscolaId) return { success: false, error: 'Permissão negada' };

    const ano = dados.ano_letivo || new Date().getFullYear();
    const now = new Date().toISOString();

    // Regra do banco: se o status for 'vigente', apenas 1 PDI pode ser vigente por aluno no ano
    if (dados.status === 'vigente') {
      const jaExisteVigente = pdisState.some(
        p => p.aluno_id === aluno.id && p.ano_letivo === ano && p.status === 'vigente' && p.id !== dados.id
      );
      if (jaExisteVigente) {
        // Encerra ou altera o anterior para evitar conflito
        setPdisState(prev => prev.map(p => {
          if (p.aluno_id === aluno.id && p.ano_letivo === ano && p.status === 'vigente' && p.id !== dados.id) {
            return { ...p, status: 'encerrado', updated_at: now };
          }
          return p;
        }));
      }
    }

    if (dados.id) {
      let pdiAtualizado: PDI | null = null;
      setPdisState(prev => prev.map(p => {
        if (p.id === dados.id) {
          pdiAtualizado = { ...p, ...dados, updated_at: now } as PDI;
          return pdiAtualizado;
        }
        return p;
      }));
      if (pdiAtualizado) {
        await dbUpsertPdi(pdiAtualizado);
      }
      registrarLog('ATUALIZACAO_PDI', 'pdis', dados.id, { aluno_id: aluno.id, ano });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const novo: PDI = {
        id: novoId,
        aluno_id: aluno.id,
        escola_id: aluno.escola_id,
        ano_letivo: ano,
        status: dados.status || 'rascunho',
        conteudo: dados.conteudo || {},
        elaborado_por: dados.elaborado_por || currentUser.nome,
        data_elaboracao: dados.data_elaboracao || new Date().toISOString().split('T')[0],
        created_by: currentUser.id,
        created_at: now,
        updated_at: now,
      };
      setPdisState(prev => [novo, ...prev]);
      await dbUpsertPdi(novo);
      registrarLog('CRIACAO_PDI', 'pdis', novoId, { aluno_id: aluno.id, ano });
      return { success: true, id: novoId };
    }
  }, [alunosState, ehNucleo, minhaEscolaId, pdisState, currentUser, registrarLog]);

  const salvarEstudoDeCaso = useCallback(async (dados: Partial<EstudoDeCaso>) => {
    const now = new Date().toISOString();
    if (!dados.aluno_id) {
      return { success: false, error: 'Aluno não informado' };
    }

    if (dados.id) {
      setEstudosDeCasoState(prev => prev.map(e => e.id === dados.id ? { ...e, ...dados, updated_at: now } as EstudoDeCaso : e));
      registrarLog('ATUALIZACAO_ESTUDO_CASO', 'estudos_de_caso', dados.id, { aluno_id: dados.aluno_id });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const novo: EstudoDeCaso = {
        ...(dados as EstudoDeCaso),
        id: novoId,
        status: dados.status || 'rascunho',
        data_preenchimento: dados.data_preenchimento || new Date().toISOString().split('T')[0],
        created_by: currentUser.id,
        updated_at: now,
      };
      setEstudosDeCasoState(prev => [novo, ...prev]);
      registrarLog('CRIACAO_ESTUDO_CASO', 'estudos_de_caso', novoId, { aluno_id: dados.aluno_id });
      return { success: true, id: novoId };
    }
  }, [currentUser.id, registrarLog]);

  const excluirEstudoDeCaso = useCallback(async (id: string) => {
    setEstudosDeCasoState(prev => prev.filter(e => e.id !== id));
    registrarLog('EXCLUSAO_ESTUDO_CASO', 'estudos_de_caso', id);
    return { success: true };
  }, [registrarLog]);

  const salvarPEI = useCallback(async (dados: Partial<PEIOfficial>) => {
    const now = new Date().toISOString();
    if (!dados.aluno_id) {
      return { success: false, error: 'Aluno não informado' };
    }

    if (dados.id) {
      setPeisState(prev => prev.map(p => p.id === dados.id ? { ...p, ...dados, updated_at: now } as PEIOfficial : p));
      registrarLog('ATUALIZACAO_PEI', 'peis', dados.id, { aluno_id: dados.aluno_id });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const novo: PEIOfficial = {
        ...(dados as PEIOfficial),
        id: novoId,
        status: dados.status || 'rascunho',
        ano_letivo: dados.ano_letivo || new Date().getFullYear(),
        data_elaboracao: dados.data_elaboracao || new Date().toISOString().split('T')[0],
        created_by: currentUser.id,
        updated_at: now,
      };
      setPeisState(prev => [novo, ...prev]);
      registrarLog('CRIACAO_PEI', 'peis', novoId, { aluno_id: dados.aluno_id });
      return { success: true, id: novoId };
    }
  }, [currentUser.id, registrarLog]);

  const excluirPEI = useCallback(async (id: string) => {
    setPeisState(prev => prev.filter(p => p.id !== id));
    registrarLog('EXCLUSAO_PEI', 'peis', id);
    return { success: true };
  }, [registrarLog]);

  const obterEstudoDeCaso = useCallback((alunoId: string) => {
    return estudosDeCasoState.find(e => e.aluno_id === alunoId);
  }, [estudosDeCasoState]);

  const obterPEI = useCallback((alunoId: string) => {
    return peisState.find(p => p.aluno_id === alunoId);
  }, [peisState]);

  const salvarDocumento = useCallback(async (doc: Omit<DocumentoAluno, 'id' | 'created_at'>) => {
    if (!ehNucleo && doc.escola_id !== minhaEscolaId) {
      return { success: false, error: 'Permissão negada' };
    }
    const novoId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const novoDoc: DocumentoAluno = {
      ...doc,
      id: novoId,
      created_at: new Date().toISOString(),
    };
    setDocumentosState(prev => [novoDoc, ...prev]);
    registrarLog('UPLOAD_DOCUMENTO', 'documentos_aluno', novoId, { tipo: doc.tipo, titulo: doc.titulo });
    return { success: true, id: novoId };
  }, [ehNucleo, minhaEscolaId, registrarLog]);

  const excluirDocumento = useCallback(async (id: string) => {
    const doc = documentosState.find(d => d.id === id);
    if (!doc) return { success: false, error: 'Documento não encontrado' };
    if (!ehNucleo && doc.escola_id !== minhaEscolaId) return { success: false, error: 'Permissão negada' };

    setDocumentosState(prev => prev.filter(d => d.id !== id));
    registrarLog('EXCLUSAO_DOCUMENTO', 'documentos_aluno', id);
    return { success: true };
  }, [documentosState, ehNucleo, minhaEscolaId, registrarLog]);

  const proximoNumeroOficio = useCallback((ano: number) => {
    const oficiosAno = oficiosState.filter(o => o.ano === ano);
    if (oficiosAno.length === 0) return 1;
    const max = Math.max(...oficiosAno.map(o => o.numero));
    return max + 1;
  }, [oficiosState]);

  const salvarOficio = useCallback(async (dados: Partial<Oficio>) => {
    if (!ehNucleo) {
      return { success: false, error: 'Apenas a equipe do Núcleo pode criar ou emitir ofícios.' };
    }

    const ano = dados.ano || new Date().getFullYear();
    const now = new Date().toISOString();

    if (dados.id) {
      let oficioAtualizado: Oficio | null = null;
      setOficiosState(prev => prev.map(o => {
        if (o.id === dados.id) {
          oficioAtualizado = {
            ...o,
            ...dados,
            emitido_em: dados.status === 'emitido' && !o.emitido_em ? now : o.emitido_em,
          } as Oficio;
          return oficioAtualizado;
        }
        return o;
      }));
      if (oficioAtualizado) {
        await dbUpsertOficio(oficioAtualizado);
      }
      registrarLog('ATUALIZACAO_OFICIO', 'oficios', dados.id, { numero: dados.numero, status: dados.status });
      return { success: true, id: dados.id };
    } else {
      const numero = proximoNumeroOficio(ano);
      const novoId = generateUUID();
      const novo: Oficio = {
        id: novoId,
        ano,
        numero,
        assunto: dados.assunto || 'Solicitação de Atendimento Educacional Especializado',
        destinatario: dados.destinatario || 'SEDUC/PA - Diretoria de Educação Especial',
        corpo: dados.corpo || '',
        status: dados.status || 'rascunho',
        escola_id: dados.escola_id || null,
        criado_por: currentUser.id,
        criado_por_nome: `${currentUser.nome} (${currentUser.cargo})`,
        emitido_em: dados.status === 'emitido' ? now : undefined,
        created_at: now,
        alunos_ids: dados.alunos_ids || [],
      };
      setOficiosState(prev => [novo, ...prev]);
      await dbUpsertOficio(novo);
      registrarLog('EMISSAO_OFICIO', 'oficios', novoId, { numero, ano, destinatario: novo.destinatario });
      return { success: true, id: novoId };
    }
  }, [ehNucleo, proximoNumeroOficio, currentUser, registrarLog]);

  const registrarRespostaOficio = useCallback(async (
    id: string,
    dataResp: string,
    protocolo: string,
    resumo: string
  ) => {
    if (!ehNucleo) return { success: false, error: 'Apenas o Núcleo pode registrar respostas de ofícios' };
    let respOficio: Oficio | null = null;
    setOficiosState(prev => prev.map(o => {
      if (o.id === id) {
        respOficio = {
          ...o,
          status: 'respondido',
          resposta_recebida_em: dataResp,
          resposta_resumo: protocolo ? `[Protocolo ${protocolo}] ${resumo}` : resumo,
        };
        return respOficio;
      }
      return o;
    }));
    if (respOficio) {
      await dbUpsertOficio(respOficio);
    }
    registrarLog('RESPOSTA_OFICIO', 'oficios', id, { dataResp, protocolo, resumo });
    return { success: true };
  }, [ehNucleo, registrarLog]);

  const salvarUsuario = useCallback(async (dados: Partial<Profile>) => {
    if (dados.id) {
      let usuarioSalvo: Profile | null = null;
      const updated = profilesState.map(p => {
        if (p.id === dados.id) {
          const senhaFinal = (dados.senha && dados.senha.trim() !== '') ? dados.senha.trim() : p.senha;
          usuarioSalvo = {
            ...p,
            ...dados,
            senha: senhaFinal,
            escola_id: dados.papel?.startsWith('nucleo') ? null : (dados.escola_id !== undefined ? dados.escola_id : p.escola_id),
          } as Profile;
          return usuarioSalvo;
        }
        return p;
      });
      setProfilesState(updated);
      localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(updated));
      if (usuarioSalvo) {
        await dbUpsertProfile(usuarioSalvo);
      }
      registrarLog('ATUALIZACAO_USUARIO', 'profiles', dados.id, { nome: dados.nome, papel: dados.papel });
      return { success: true, id: dados.id };
    } else {
      const novoId = generateUUID();
      const novo: Profile = {
        id: novoId,
        nome: dados.nome || 'Novo Usuário',
        email: dados.email || '',
        cargo: dados.cargo || 'Servidor SEDUC',
        papel: dados.papel || 'secretaria_escola',
        escola_id: dados.papel?.startsWith('nucleo') ? null : (dados.escola_id || null),
        ativo: dados.ativo ?? true,
        senha: (dados.senha && dados.senha.trim() !== '') ? dados.senha.trim() : 'seduc@dre2026',
        created_at: new Date().toISOString(),
      };
      const updated = [...profilesState, novo];
      setProfilesState(updated);
      localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(updated));
      await dbUpsertProfile(novo);
      registrarLog('CRIACAO_USUARIO', 'profiles', novoId, { email: novo.email, papel: novo.papel });
      return { success: true, id: novoId };
    }
  }, [profilesState, registrarLog]);

  const alternarStatusUsuario = useCallback(async (id: string) => {
    if (id === currentUser.id) return { success: false, error: 'Você não pode desativar seu próprio usuário atualmente conectado.' };

    const target = profilesState.find(p => p.id === id);
    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    const novoStatus = !target.ativo;
    const updated = profilesState.map(p => p.id === id ? { ...p, ativo: novoStatus } : p);
    setProfilesState(updated);
    localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(updated));
    await dbUpdateProfileStatus(id, novoStatus);

    registrarLog(novoStatus ? 'ATIVACAO_USUARIO' : 'DESATIVACAO_USUARIO', 'profiles', id, {
      nome: target.nome,
      email: target.email,
      novoStatus: novoStatus ? 'ativo' : 'inativo'
    });
    return { success: true, novoStatus };
  }, [currentUser.id, profilesState, registrarLog]);

  const excluirUsuario = useCallback(async (id: string) => {
    if (id === currentUser.id) return { success: false, error: 'Você não pode excluir seu próprio usuário atualmente conectado.' };

    const target = profilesState.find(p => p.id === id);
    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    // Não permitir excluir o único Diretor do Núcleo
    const outrosDiretores = profilesState.filter(p => p.id !== id && p.papel === 'nucleo_diretor');
    if (target.papel === 'nucleo_diretor' && outrosDiretores.length === 0) {
      return { success: false, error: 'Não é possível excluir o único Diretor do Núcleo cadastrado.' };
    }

    const updated = profilesState.filter(p => p.id !== id);
    setProfilesState(updated);
    localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(updated));

    const savedDeleted = localStorage.getItem(`${STORAGE_KEY}_deleted_profiles`);
    const deletedList: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
    if (!deletedList.includes(id)) {
      deletedList.push(id);
      localStorage.setItem(`${STORAGE_KEY}_deleted_profiles`, JSON.stringify(deletedList));
    }

    // Excluir definitivamente do Supabase (PostgreSQL)
    await dbDeleteProfile(id);

    registrarLog('EXCLUSAO_USUARIO', 'profiles', id, { nome: target.nome, email: target.email, papel: target.papel });
    return { success: true };
  }, [currentUser.id, profilesState, registrarLog]);

  const login = useCallback(async (emailOuNome: string, senhaDigitada?: string) => {
    const termo = emailOuNome.trim().toLowerCase();
    if (!termo) {
      return { success: false, error: 'Por favor, informe seu e-mail institucional.' };
    }

    const user = profilesState.find(p => {
      const pEmail = p.email.toLowerCase();
      const pNome = p.nome.toLowerCase();
      if (pEmail === termo || pNome === termo) return true;
      // Compatibilidade especial para Prof. Antonio Vieira Bispo (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br)
      if (
        (termo === 'antonio.bispo@escola.seduc.pa.gov.br' || 
         termo === 'antonio.bispo@seduc.pa.gov.br' || 
         termo === 'antonio.bispo' ||
         termo === 'antonio bispo') &&
        (pEmail.includes('antonio.bispo') || p.id === 'u-antonio-bispo')
      ) {
        return true;
      }
      return false;
    });

    if (!user) {
      return { success: false, error: 'E-mail institucional não cadastrado no sistema da DRE.' };
    }

    if (!user.ativo) {
      return { success: false, error: 'Este usuário está INATIVO/DESATIVADO no sistema. Procure o Núcleo da DRE Altamira para reativação de acesso.' };
    }

    const digitada = (senhaDigitada || '').trim();
    const senhaPerfil = (user.senha || '').trim();
    const ehAntonioBispo = user.id === 'u-antonio-bispo' || user.email.toLowerCase().includes('antonio.bispo');

    // Validação com suporte à senha temporária do Prof. Antonio Bispo e senha padrão institucional do Núcleo
    const senhaValida = 
      (digitada === senhaPerfil) ||
      (ehAntonioBispo && (digitada === 'Bispo@2026' || digitada === 'bispo@2026' || digitada === 'seduc@dre2026')) ||
      (user.papel?.startsWith('nucleo') && (digitada === 'seduc@dre2026' || digitada === senhaPerfil)) ||
      (digitada === 'seduc@dre2026'); // Senha mestra inicial institucional da DRE

    if (!senhaValida) {
      return { success: false, error: 'Senha incorreta. Digite a senha cadastrada pelo Núcleo ou sua senha temporária.' };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    const updated = profilesState.map(p => p.id === user.id ? { ...p, ultimo_acesso: new Date().toISOString() } : p);
    setProfilesState(updated);
    localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(updated));
    registrarLog('LOGIN_SISTEMA', 'auth', user.id, { email: user.email, nome: user.nome });
    return { success: true };
  }, [profilesState, registrarLog]);

  const loginAsUser = useCallback(async (userId: string) => {
    const user = profilesState.find(p => p.id === userId);
    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }
    if (!user.ativo) {
      return { success: false, error: 'Este usuário está desativado.' };
    }
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setProfilesState(prev => prev.map(p => p.id === user.id ? { ...p, ultimo_acesso: new Date().toISOString() } : p));
    registrarLog('LOGIN_USUARIO_DIRETO', 'auth', user.id, { email: user.email, nome: user.nome });
    return { success: true };
  }, [profilesState, registrarLog]);

  const logout = useCallback(() => {
    registrarLog('LOGOUT_SISTEMA', 'auth', currentUser.id, { email: currentUser.email });
    setIsAuthenticated(false);
  }, [currentUser.id, currentUser.email, registrarLog]);

  const importarLote = useCallback(async (
    escolasNovas: Partial<Escola>[],
    turmasNovas: Partial<Turma>[],
    profissionaisNovos: Partial<Profissional>[],
    alunosNovos: Partial<Aluno>[]
  ) => {
    if (!ehNucleo) return { criados: 0, atualizados: 0, erros: ['Permissão negada: apenas o Núcleo pode importar planilhas'] };

    let criados = 0;
    let atualizados = 0;
    const erros: string[] = [];

    // 1. Upsert Escolas
    setEscolasState(prev => {
      const copy = [...prev];
      for (const e of escolasNovas) {
        if (!e.codigo || !e.nome) continue;
        const idx = copy.findIndex(x => x.codigo.toLowerCase() === e.codigo?.toLowerCase());
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...e };
        } else {
          copy.push({
            id: e.id || generateUUID(),
            codigo: e.codigo,
            nome: e.nome,
            municipio: e.municipio || 'Altamira',
            diretor_nome: e.diretor_nome,
            endereco: e.endereco,
            telefone: e.telefone,
            email: e.email,
            ativa: true,
            created_at: new Date().toISOString(),
          });
        }
      }
      return copy;
    });

    // 2. Upsert Turmas
    setTurmasState(prev => {
      const copy = [...prev];
      for (const t of turmasNovas) {
        if (!t.codigo || !t.escola_id) continue;
        const idx = copy.findIndex(x => x.codigo.toLowerCase() === t.codigo?.toLowerCase() && x.escola_id === t.escola_id);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...t };
        } else {
          copy.push({
            id: t.id || generateUUID(),
            codigo: t.codigo,
            nome: t.nome || t.codigo,
            escola_id: t.escola_id,
            turno: t.turno || 'Manhã',
            ano_letivo: t.ano_letivo || new Date().getFullYear(),
            created_at: new Date().toISOString(),
          });
        }
      }
      return copy;
    });

    // 3. Upsert Profissionais
    setProfissionaisState(prev => {
      const copy = [...prev];
      for (const p of profissionaisNovos) {
        if (!p.nome || !p.escola_id || !p.tipo) continue;
        const idx = copy.findIndex(x => x.nome.toLowerCase() === p.nome?.toLowerCase() && x.escola_id === p.escola_id);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...p };
        } else {
          copy.push({
            id: p.id || generateUUID(),
            nome: p.nome,
            escola_id: p.escola_id,
            tipo: p.tipo,
            documento_ou_matricula: p.documento_ou_matricula,
            ativo: true,
            created_at: new Date().toISOString(),
          });
        }
      }
      return copy;
    });

    // 4. Upsert Alunos
    setAlunosState(prev => {
      const copy = [...prev];
      const now = new Date().toISOString();
      for (const a of alunosNovos) {
        if (!a.codigo || !a.nome || !a.escola_id) {
          erros.push(`Linha ignorada: dados obrigatórios ausentes (${a.nome || 'sem nome'})`);
          continue;
        }

        const idx = copy.findIndex(x => x.codigo.toLowerCase() === a.codigo?.toLowerCase());
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            ...a,
            updated_by: currentUser.id,
            updated_at: now,
          };
          atualizados++;
        } else {
          copy.push({
            id: a.id || generateUUID(),
            codigo: a.codigo,
            nome: a.nome,
            data_nascimento: a.data_nascimento,
            idade_informada: a.idade_informada,
            sexo: a.sexo,
            endereco: a.endereco,
            escola_id: a.escola_id,
            turma_id: a.turma_id || null,
            ciclo: a.ciclo || 1,
            serie: a.serie || '',
            situacao_doc: a.situacao_doc || 'sem_laudo',
            cid: a.cid || '',
            numero_processo: a.numero_processo || '',
            contrato_acompanhante: Boolean(a.contrato_acompanhante),
            necessita_professor_aee: a.necessita_professor_aee !== undefined ? a.necessita_professor_aee : true,
            necessita_acompanhante: Boolean(a.necessita_acompanhante),
            professor_aee_id: a.professor_aee_id || null,
            acompanhante_id: a.acompanhante_id || null,
            observacoes: a.observacoes || '',
            ativo: true,
            created_by: currentUser.id,
            updated_by: currentUser.id,
            created_at: now,
            updated_at: now,
          });
          criados++;
        }
      }
      return copy;
    });

    registrarLog('IMPORTACAO_EXCEL', 'alunos', undefined, { criados, atualizados, total_erros: erros.length });
    return { criados, atualizados, erros };
  }, [ehNucleo, currentUser.id, registrarLog]);

  const importarAlunosEmLote = useCallback(async (linhasValidadas: any[]) => {
    if (!ehNucleo) return { success: false, totalImportados: 0, error: 'Apenas o Núcleo pode importar planilhas' };

    const alunosParaInserir: Partial<Aluno>[] = linhasValidadas
      .filter((r: any) => r.valida)
      .map((r: any) => ({
        ...r.normalized,
        ativo: true,
      }));

    const res = await importarLote([], [], [], alunosParaInserir);
    return {
      success: res.erros.length === 0 || (res.criados + res.atualizados) > 0,
      totalImportados: res.criados + res.atualizados,
      error: res.erros.join(', '),
    };
  }, [ehNucleo, importarLote]);

  const restaurarDadosIniciais = useCallback(() => {
    localStorage.clear();
    setEscolasState(INITIAL_ESCOLAS);
    setProfilesState(INITIAL_PROFILES);
    setProfissionaisState(INITIAL_PROFISSIONAIS);
    setTurmasState(INITIAL_TURMAS);
    setAlunosState(INITIAL_ALUNOS);
    setPdisState(INITIAL_PDIS);
    setEstudosDeCasoState(INITIAL_ESTUDOS_DE_CASO);
    setPeisState(INITIAL_PEIS);
    setOficiosState(INITIAL_OFICIOS);
    setDocumentosState(INITIAL_DOCUMENTOS);
    setAuditLogsState(INITIAL_AUDIT_LOGS);
    setCurrentUserId(INITIAL_PROFILES[0].id);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    login,
    loginAsUser,
    logout,
    currentUser,
    setCurrentUser: (u: Profile) => setCurrentUserId(u.id),
    trocarPerfil,
    ehNucleo,
    minhaEscolaId,
    minhaEscola,
    escolas,
    profissionais,
    turmas,
    alunos,
    pdis,
    estudosDeCaso: estudosDeCasoState,
    peis: peisState,
    oficios,
    documentos,
    usuarios,
    auditLogs,
    auditoriaLogs: auditLogs,
    todasEscolas,
    salvarAluno,
    inativarAluno,
    salvarEscola,
    inativarEscola,
    salvarTurma,
    excluirTurma,
    salvarProfissional,
    inativarProfissional,
    salvarPDI,
    salvarEstudoDeCaso,
    excluirEstudoDeCaso,
    salvarPEI,
    excluirPEI,
    obterEstudoDeCaso,
    obterPEI,
    salvarDocumento,
    excluirDocumento,
    salvarOficio,
    registrarRespostaOficio,
    proximoNumeroOficio,
    salvarUsuario,
    alternarStatusUsuario,
    excluirUsuario,
    registrarLog,
    importarLote,
    importarAlunosEmLote,
    restaurarDadosIniciais,
    isDbConfigured: isSupabaseConfigured,
    dbStatus,
    dbMessage,
    lastSyncedAt,
    syncWithDatabase,
  }), [
    isAuthenticated,
    login,
    loginAsUser,
    logout,
    currentUser,
    trocarPerfil,
    ehNucleo,
    minhaEscolaId,
    minhaEscola,
    escolas,
    profissionais,
    turmas,
    alunos,
    pdis,
    estudosDeCasoState,
    peisState,
    oficios,
    documentos,
    usuarios,
    auditLogs,
    todasEscolas,
    salvarAluno,
    inativarAluno,
    salvarEscola,
    inativarEscola,
    salvarTurma,
    excluirTurma,
    salvarProfissional,
    inativarProfissional,
    salvarPDI,
    salvarEstudoDeCaso,
    excluirEstudoDeCaso,
    salvarPEI,
    excluirPEI,
    obterEstudoDeCaso,
    obterPEI,
    salvarDocumento,
    excluirDocumento,
    salvarOficio,
    registrarRespostaOficio,
    proximoNumeroOficio,
    salvarUsuario,
    alternarStatusUsuario,
    excluirUsuario,
    registrarLog,
    importarLote,
    importarAlunosEmLote,
    restaurarDadosIniciais,
    dbStatus,
    dbMessage,
    lastSyncedAt,
    syncWithDatabase,
  ]);

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore deve ser usado dentro de AppStoreProvider');
  }
  return context;
};
