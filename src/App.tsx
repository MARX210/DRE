import React, { useState } from 'react';
import { AppStoreProvider, useAppStore } from './lib/store';
import { CabecalhoInstitucional } from './components/CabecalhoInstitucional';
import { UserSwitcher } from './components/UserSwitcher';
import { LoginView } from './components/LoginView';
import { Sidebar, TelaAtiva } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AlunosView } from './components/AlunosView';
import { EscolasView } from './components/EscolasView';
import { TurmasView } from './components/TurmasView';
import { PendenciasView } from './components/PendenciasView';
import { OficiosView } from './components/OficiosView';
import { ImportarView } from './components/ImportarView';
import { UsuariosView } from './components/UsuariosView';
import { DocumentosCoeesView } from './components/DocumentosCoeesView';
import { ModalImpressaoDocumento } from './components/ModalImpressaoDocumento';
import { StatusAtendimento } from './types';
import { Menu, Shield, School, AlertCircle, LogOut } from 'lucide-react';

function AppContent() {
  const { ehNucleo, currentUser, minhaEscola, isAuthenticated, logout } = useAppStore();

  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Estados de Navegação Cruzada
  const [filtroStatusAlunos, setFiltroStatusAlunos] = useState<StatusAtendimento | 'todos'>('todos');
  const [escolaSelecionada, setEscolaSelecionada] = useState<string | undefined>(undefined);
  
  // Transição de Pendências para Ofícios
  const [alunosOficioPreSelecionados, setAlunosOficioPreSelecionados] = useState<string[]>([]);
  const [demandaOficioPreSelecionada, setDemandaOficioPreSelecionada] = useState<string>('sem_professor');

  // Se não estiver autenticado, exibe a Tela de Login oficial
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Redirecionamento se usuário tentar acessar tela restrita ao núcleo
  const telasExclusivasNucleo: TelaAtiva[] = ['oficios', 'importar', 'usuarios'];
  const telaEfetiva: TelaAtiva = (!ehNucleo && telasExclusivasNucleo.includes(telaAtiva)) 
    ? 'dashboard' 
    : telaAtiva;

  const handleNavegarAlunosComFiltro = (filtro: StatusAtendimento | 'todos') => {
    setFiltroStatusAlunos(filtro);
    setTelaAtiva('alunos');
  };

  const handleNavegarEscola = (escolaId: string) => {
    setEscolaSelecionada(escolaId);
    setTelaAtiva('escolas');
  };

  const handleGerarOficioComAlunos = (alunosIds: string[], tipoDemanda: string) => {
    setAlunosOficioPreSelecionados(alunosIds);
    setDemandaOficioPreSelecionada(tipoDemanda);
    setTelaAtiva('oficios');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* 1. Cabeçalho Institucional Oficial SEDUC-PA / DRE Altamira */}
      <CabecalhoInstitucional subtitulo="Sistema Integrado de Acompanhamento do AEE" />

      {/* 2. Topbar de Navegação / Ações com Simulador RLS */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarMobileOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider hidden sm:inline">
              Módulo:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-700 capitalize">
              {telaEfetiva === 'dashboard' && 'Dashboard'}
              {telaEfetiva === 'alunos' && 'Alunos & AEE'}
              {telaEfetiva === 'documentos_coees' && 'Estudo de Caso & PEI (COEES)'}
              {telaEfetiva === 'escolas' && (ehNucleo ? 'Escolas da Regional' : 'Minha Escola')}
              {telaEfetiva === 'turmas' && 'Turmas e Turnos'}
              {telaEfetiva === 'pendencias' && 'Demandas & Pendências'}
              {telaEfetiva === 'oficios' && 'Ofícios à SEDUC'}
              {telaEfetiva === 'importar' && 'Importar Planilha'}
              {telaEfetiva === 'usuarios' && 'Usuários & Auditoria'}
            </span>

            <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              ehNucleo ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {ehNucleo ? <Shield className="w-3 h-3" /> : <School className="w-3 h-3" />}
              {ehNucleo ? 'Acesso Regional DRE' : `Escola: ${minhaEscola?.nome || 'Vinculada'}`}
            </span>
          </div>
        </div>

        {/* Controles de Usuário e Logout */}
        <div className="flex items-center gap-2">
          <UserSwitcher />
          
          <button
            id="btn-topo-logout"
            type="button"
            onClick={logout}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
            title="Sair da Conta (Ir para Tela de Login)"
            aria-label="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Corpo Principal com Sidebar e Área de Conteúdo */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          telaAtiva={telaEfetiva}
          onNavegar={(tela) => setTelaAtiva(tela)}
          isOpen={sidebarMobileOpen}
          onClose={() => setSidebarMobileOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {telaEfetiva === 'dashboard' && (
            <DashboardView
              onNavegarAlunosComFiltro={handleNavegarAlunosComFiltro}
              onNavegarEscola={handleNavegarEscola}
            />
          )}

          {telaEfetiva === 'alunos' && (
            <AlunosView
              filtroStatusInicial={filtroStatusAlunos}
              onLimparFiltroInicial={() => setFiltroStatusAlunos('todos')}
            />
          )}

          {telaEfetiva === 'documentos_coees' && <DocumentosCoeesView />}

          {telaEfetiva === 'escolas' && (
            <EscolasView
              escolaIdSelecionada={escolaSelecionada}
              onVerAluno={() => setTelaAtiva('alunos')}
            />
          )}

          {telaEfetiva === 'turmas' && <TurmasView />}

          {telaEfetiva === 'pendencias' && (
            <PendenciasView
              onGerarOficioComAlunos={handleGerarOficioComAlunos}
            />
          )}

          {telaEfetiva === 'oficios' && (
            <OficiosView
              alunosPreSelecionados={alunosOficioPreSelecionados}
              demandaPreSelecionada={demandaOficioPreSelecionada}
              onLimparPreSelecao={() => setAlunosOficioPreSelecionados([])}
            />
          )}

          {telaEfetiva === 'importar' && <ImportarView />}

          {telaEfetiva === 'usuarios' && <UsuariosView />}
        </main>
      </div>

      {/* 4. Rodapé Institucional */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SEDUC-PA</strong> · Diretoria Regional de Ensino — DRE Altamira · Núcleo de Educação Especial (NEE)
          </div>
          <div className="text-[11px] text-slate-400">
            Sistema de Gestão e Acompanhamento do AEE · Conformidade com a Lei nº 13.146/2015 e LGPD
          </div>
        </div>
      </footer>

      {/* 5. Modal Global de Impressão e Pré-Visualização Oficial */}
      <ModalImpressaoDocumento />
    </div>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}
