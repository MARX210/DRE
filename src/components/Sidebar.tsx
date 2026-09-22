import React from 'react';
import { useAppStore } from '../lib/store';
import { 
  LayoutDashboard, 
  School, 
  GraduationCap, 
  Users, 
  AlertTriangle, 
  FileText, 
  UploadCloud, 
  UserCheck, 
  ShieldAlert,
  FileCheck2,
  FileSpreadsheet,
  X
} from 'lucide-react';

export type TelaAtiva = 
  | 'dashboard' 
  | 'escolas' 
  | 'turmas' 
  | 'alunos' 
  | 'documentos_coees'
  | 'pendencias' 
  | 'oficios' 
  | 'importar' 
  | 'usuarios';

interface SidebarProps {
  telaAtiva: TelaAtiva;
  onNavegar: (tela: TelaAtiva) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  telaAtiva, 
  onNavegar,
  isOpen = false,
  onClose
}) => {
  const { ehNucleo, currentUser, minhaEscola, alunos, estudosDeCaso, peis } = useAppStore();

  // Contagem de pendências ativas
  const totalPendencias = alunos.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica').length;
  const totalPdiPendente = alunos.filter(a => a.pdi_pendente).length;

  const itensMenu = [
    {
      id: 'dashboard' as TelaAtiva,
      label: 'Dashboard',
      descricao: ehNucleo ? 'Visão Regional e Comparativos' : 'Estatísticas da Escola',
      icone: LayoutDashboard,
      visivel: true,
    },
    {
      id: 'alunos' as TelaAtiva,
      label: 'Alunos & AEE',
      descricao: 'Matrículas, Atendimento e Semáforo',
      icone: GraduationCap,
      visivel: true,
      badge: alunos.length,
    },
    {
      id: 'documentos_coees' as TelaAtiva,
      label: 'Estudo de Caso & PEI',
      descricao: 'Modelos Oficiais COEES / SEDUC',
      icone: FileSpreadsheet,
      visivel: true,
      badge: (estudosDeCaso?.length || 0) + (peis?.length || 0),
      badgeCor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'escolas' as TelaAtiva,
      label: ehNucleo ? 'Escolas' : 'Minha Escola',
      descricao: ehNucleo ? 'Todas as Unidades da DRE' : (minhaEscola?.nome || 'Unidade Escolar'),
      icone: School,
      visivel: true,
    },
    {
      id: 'turmas' as TelaAtiva,
      label: 'Turmas',
      descricao: 'Enturmação e Turnos',
      icone: Users,
      visivel: true,
    },
    {
      id: 'pendencias' as TelaAtiva,
      label: 'Demandas & Pendências',
      descricao: 'Alunos sem atendimento regular',
      icone: AlertTriangle,
      visivel: true,
      badge: totalPendencias,
      badgeCor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    // Itens exclusivos do Núcleo
    {
      id: 'oficios' as TelaAtiva,
      label: 'Ofícios à SEDUC',
      descricao: 'Gerador e Controle de Respostas',
      icone: FileText,
      visivel: ehNucleo,
      apenasNucleo: true,
    },
    {
      id: 'importar' as TelaAtiva,
      label: 'Importar Planilha',
      descricao: 'Carga Excel / CSV com Validação',
      icone: UploadCloud,
      visivel: ehNucleo,
      apenasNucleo: true,
    },
    {
      id: 'usuarios' as TelaAtiva,
      label: 'Usuários & Auditoria',
      descricao: 'Controle de Acessos e LGPD',
      icone: UserCheck,
      visivel: ehNucleo,
      apenasNucleo: true,
    },
  ];

  const handleNav = (id: TelaAtiva) => {
    onNavegar(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navegacao"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              PA
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-white uppercase">
                AEE · Altamira
              </div>
              <div className="text-[10px] text-slate-400">
                SEDUC Pará · DRE Altamira
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Perfil e Escopo RLS */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
            <span>Escopo de Acesso:</span>
            <span className={ehNucleo ? 'text-sky-400 font-black' : 'text-emerald-400 font-black'}>
              {ehNucleo ? 'Regional DRE' : 'Escolar'}
            </span>
          </div>
          <div className="font-semibold text-slate-200 truncate">
            {ehNucleo ? 'Todas as Escolas' : (minhaEscola?.nome || 'Escola Vinculada')}
          </div>
          {!ehNucleo && (
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Alimentação restrita à sua escola
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {itensMenu.filter(item => item.visivel).map((item) => {
            const Icon = item.icone;
            const isAtivo = telaAtiva === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                  isAtivo
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isAtivo ? 'text-white' : 'text-slate-400'}`} />
                  <div className="min-w-0 truncate">
                    <div className="text-xs truncate">{item.label}</div>
                  </div>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                    item.badgeCor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium">Ano Letivo 2026</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Garantia da Educação Especial Inclusiva · SEDUC-PA
          </div>
        </div>
      </aside>
    </>
  );
};
