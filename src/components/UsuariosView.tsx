import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Profile, PapelUsuario, AuditLogItem } from '../types';
import { 
  Shield, 
  UserCheck, 
  School, 
  Plus, 
  Search, 
  ShieldAlert, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Power, 
  PowerOff, 
  LogIn, 
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const { 
    usuarios, 
    auditoriaLogs, 
    todasEscolas, 
    currentUser, 
    salvarUsuario, 
    alternarStatusUsuario, 
    excluirUsuario, 
    trocarPerfil 
  } = useAppStore();

  const [aba, setAba] = useState<'usuarios' | 'auditoria'>('usuarios');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Profile | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  // Modal de Confirmação In-App (evita bloqueio de window.confirm no iframe)
  const [confirmModal, setConfirmModal] = useState<{
    tipo: 'status' | 'excluir';
    usuario: Profile;
  } | null>(null);

  // Visualização de senhas na tabela
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});
  const [mostrarSenhaForm, setMostrarSenhaForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Profile>>({
    nome: '',
    email: '',
    cargo: '',
    papel: 'diretor_escola',
    escola_id: todasEscolas[0]?.id || null,
    ativo: true,
    senha: '',
  });

  const abrirModalCriacao = () => {
    setUsuarioEmEdicao(null);
    setFormData({
      nome: '',
      email: '',
      cargo: 'Diretor Escolar',
      papel: 'diretor_escola',
      escola_id: todasEscolas[0]?.id || null,
      ativo: true,
      senha: 'seduc@dre2026',
    });
    setMostrarSenhaForm(false);
    setModalAberto(true);
  };

  const abrirModalEdicao = (u: Profile) => {
    setUsuarioEmEdicao(u);
    setFormData({
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo || '',
      papel: u.papel,
      escola_id: u.escola_id || todasEscolas[0]?.id || null,
      ativo: u.ativo,
      senha: u.senha || 'seduc@dre2026',
    });
    setMostrarSenhaForm(false);
    setModalAberto(true);
  };

  const gerarSenhaAleatoria = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const nova = `Seduc@${num}`;
    setFormData(prev => ({ ...prev, senha: nova }));
    setMostrarSenhaForm(true);
  };

  const alternarVisibilidadeSenha = (id: string) => {
    setSenhasVisiveis(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim() || !formData.email?.trim()) {
      setFeedback({ tipo: 'erro', mensagem: 'Nome completo e E-mail institucional são obrigatórios.' });
      return;
    }

    if (!usuarioEmEdicao && (!formData.senha || formData.senha.trim().length < 4)) {
      setFeedback({ tipo: 'erro', mensagem: 'Por favor, cadastre uma senha com pelo menos 4 caracteres para este usuário.' });
      return;
    }

    const payload: Partial<Profile> = {
      ...formData,
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      cargo: formData.cargo?.trim() || 'Servidor SEDUC',
      senha: formData.senha?.trim() || 'seduc@dre2026',
      escola_id: formData.papel?.startsWith('nucleo') ? null : formData.escola_id,
    };

    if (usuarioEmEdicao) {
      payload.id = usuarioEmEdicao.id;
    }

    const res = await salvarUsuario(payload);
    if (res.success) {
      setModalAberto(false);
      setFeedback({ 
        tipo: 'sucesso', 
        mensagem: usuarioEmEdicao 
          ? `Usuário "${payload.nome}" atualizado com sucesso!` 
          : `Usuário "${payload.nome}" cadastrado com sucesso! A senha foi definida como "${payload.senha}".`
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ tipo: 'erro', mensagem: res.error || 'Erro ao salvar usuário.' });
    }
  };

  const solicitarAlternarStatus = (u: Profile) => {
    if (u.id === currentUser.id) {
      setFeedback({ tipo: 'erro', mensagem: 'Você não pode desativar o usuário atualmente conectado.' });
      return;
    }
    setConfirmModal({ tipo: 'status', usuario: u });
  };

  const solicitarExclusao = (u: Profile) => {
    if (u.id === currentUser.id) {
      setFeedback({ tipo: 'erro', mensagem: 'Você não pode excluir o seu próprio usuário conectado.' });
      return;
    }
    setConfirmModal({ tipo: 'excluir', usuario: u });
  };

  const executarAcaoConfirmada = async () => {
    if (!confirmModal) return;
    const { tipo, usuario } = confirmModal;
    setConfirmModal(null);

    if (tipo === 'status') {
      const res = await alternarStatusUsuario(usuario.id);
      if (res.success) {
        setFeedback({ 
          tipo: 'sucesso', 
          mensagem: `Usuário "${usuario.nome}" foi ${usuario.ativo ? 'DESATIVADO (Inativo)' : 'ATIVADO'} com sucesso!` 
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ tipo: 'erro', mensagem: res.error || 'Erro ao alterar status.' });
      }
    } else if (tipo === 'excluir') {
      const res = await excluirUsuario(usuario.id);
      if (res.success) {
        setFeedback({ 
          tipo: 'sucesso', 
          mensagem: `Usuário "${usuario.nome}" foi EXCLUÍDO definitivamente.` 
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ tipo: 'erro', mensagem: res.error || 'Erro ao excluir usuário.' });
      }
    }
  };

  const handleUsarPerfil = (u: Profile) => {
    if (!u.ativo) {
      setFeedback({ tipo: 'erro', mensagem: `O usuário "${u.nome}" está inativo. Ative-o antes de utilizá-lo.` });
      return;
    }
    trocarPerfil(u.id);
    setFeedback({ 
      tipo: 'sucesso', 
      mensagem: `Perfil alterado para "${u.nome}". Você agora está navegando com as permissões deste usuário.` 
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const escolaU = todasEscolas.find(e => e.id === u.escola_id);
      return (
        u.nome.toLowerCase().includes(termo) || 
        u.email.toLowerCase().includes(termo) ||
        (u.cargo && u.cargo.toLowerCase().includes(termo)) ||
        (escolaU && escolaU.nome.toLowerCase().includes(termo)) ||
        (escolaU && escolaU.municipio.toLowerCase().includes(termo))
      );
    }
    return true;
  });

  const logsFiltrados = auditoriaLogs.filter((l: AuditLogItem) => {
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const nome = (l.usuario_nome || l.user_nome || '').toLowerCase();
      const acao = (l.acao || '').toLowerCase();
      const ent = (l.entidade || l.tabela || '').toLowerCase();
      return nome.includes(termo) || acao.includes(termo) || ent.includes(termo);
    }
    return true;
  });

  return (
    <div id="usuarios-view" className="space-y-6 pb-12">
      {/* Topo institucional */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Usuários, Perfis e Acesso RLS
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Núcleo DRE Altamira
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre servidores com senhas individuais, ative ou desative o acesso e controle permissões escolares e regionais.
          </p>
        </div>

        {aba === 'usuarios' && (
          <button
            id="btn-novo-usuario"
            type="button"
            onClick={abrirModalCriacao}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs text-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Usuário & Senha
          </button>
        )}
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div 
          id="alerta-feedback-usuarios"
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            feedback.tipo === 'sucesso' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.mensagem}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs gap-4 text-xs font-bold">
        <button
          id="tab-usuarios"
          type="button"
          onClick={() => setAba('usuarios')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            aba === 'usuarios' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Usuários e Perfis ({usuarios.length})
        </button>

        <button
          id="tab-auditoria"
          type="button"
          onClick={() => setAba('auditoria')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            aba === 'auditoria' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          Trilha de Auditoria LGPD ({auditoriaLogs.length})
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80 text-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-busca-usuarios"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, cargo ou escola..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="text-[11px] text-slate-500 self-start sm:self-center">
          Mostrando <strong>{aba === 'usuarios' ? usuariosFiltrados.length : logsFiltrados.length}</strong> registro(s)
        </div>
      </div>

      {/* ABA 1: USUÁRIOS E PERFIS */}
      {aba === 'usuarios' && (
        <div className="space-y-4">
          {/* Visualização em Cards para Mobile */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {usuariosFiltrados.map((u) => {
              const escolaU = todasEscolas.find(e => e.id === u.escola_id);
              const ehConectado = currentUser.id === u.id;
              const ehNucleo = u.papel.startsWith('nucleo');
              const senhaExibida = senhasVisiveis[u.id];

              return (
                <div 
                  key={u.id}
                  id={`card-mobile-usuario-${u.id}`}
                  className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between gap-3 ${
                    ehConectado ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        ehNucleo ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.papel.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {ehConectado && (
                          <span className="text-[10px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Você
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.ativo ? 'Ativo' : 'Desativado'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{u.nome}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">{u.cargo || 'Servidor SEDUC'}</p>

                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700">Senha: </span>
                        <span className="font-mono font-bold text-slate-800">
                          {senhaExibida ? (u.senha || 'seduc@dre2026') : '••••••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alternarVisibilidadeSenha(u.id)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title={senhaExibida ? 'Ocultar Senha' : 'Ver Senha'}
                      >
                        {senhaExibida ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Escopo RLS: </span>
                      {ehNucleo ? 'DRE Altamira (Todos os 8 Municípios)' : (escolaU ? `${escolaU.nome} (${escolaU.municipio})` : 'Sem escola')}
                    </div>
                  </div>

                  {/* Ações no Mobile */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleUsarPerfil(u)}
                      disabled={ehConectado || !u.ativo}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        ehConectado
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : !u.ativo
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {ehConectado ? 'Conectado' : 'Usar Perfil'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => abrirModalEdicao(u)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                        title="Editar Usuário e Senha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => solicitarAlternarStatus(u)}
                        disabled={ehConectado}
                        className={`p-1.5 rounded-lg border text-xs font-semibold ${
                          ehConectado
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : u.ativo
                            ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                        }`}
                        title={u.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
                      >
                        {u.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => solicitarExclusao(u)}
                        disabled={ehConectado}
                        className={`p-1.5 rounded-lg border ${
                          ehConectado
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50 border-red-200'
                        }`}
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Nome & Identificação</th>
                    <th className="py-3.5 px-4">Papel & Cargo</th>
                    <th className="py-3.5 px-4">Escola Vinculada (RLS)</th>
                    <th className="py-3.5 px-4">Senha Cadastrada</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Simular Perfil</th>
                    <th className="py-3.5 px-4 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosFiltrados.map((u) => {
                    const escolaU = todasEscolas.find(e => e.id === u.escola_id);
                    const ehConectado = currentUser.id === u.id;
                    const ehNucleo = u.papel.startsWith('nucleo');
                    const senhaExibida = senhasVisiveis[u.id];

                    return (
                      <tr 
                        key={u.id} 
                        id={`row-usuario-${u.id}`}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          ehConectado ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.nome}
                              {ehConectado && (
                                <span className="text-[9px] bg-sky-600 text-white font-bold px-1.5 py-0.2 rounded-sm">
                                  Conectado
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            ehNucleo ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.papel.replace('_', ' ')}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium mt-1">
                            {u.cargo || 'Servidor SEDUC'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {ehNucleo ? (
                            <div className="text-slate-700 font-medium">
                              <span className="text-sky-700 font-bold">Regional Completa</span>
                              <span className="block text-[11px] text-slate-500">8 Municípios da DRE Altamira</span>
                            </div>
                          ) : escolaU ? (
                            <div>
                              <div className="font-medium text-slate-800">{escolaU.nome}</div>
                              <div className="text-[11px] text-slate-500">{escolaU.municipio}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Nenhuma escola vinculada</span>
                          )}
                        </td>

                        {/* Senha cadastrada */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                              {senhaExibida ? (u.senha || 'seduc@dre2026') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => alternarVisibilidadeSenha(u.id)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title={senhaExibida ? 'Ocultar Senha' : 'Ver Senha Cadastrada'}
                            >
                              {senhaExibida ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.ativo ? 'Ativo' : 'Desativado'}
                          </span>
                        </td>

                        {/* Troca de Perfil */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            id={`btn-usar-perfil-${u.id}`}
                            type="button"
                            onClick={() => handleUsarPerfil(u)}
                            disabled={ehConectado || !u.ativo}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                              ehConectado
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : !u.ativo
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 cursor-pointer'
                            }`}
                            title={ehConectado ? 'Você já está usando este usuário' : 'Entrar com este perfil'}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            {ehConectado ? 'Em uso' : 'Usar Perfil'}
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Botão Editar */}
                            <button
                              id={`btn-editar-usuario-${u.id}`}
                              type="button"
                              onClick={() => abrirModalEdicao(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 transition-colors cursor-pointer"
                              title="Editar Dados e Senha do Usuário"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Botão Ativar / Desativar */}
                            <button
                              id={`btn-status-usuario-${u.id}`}
                              type="button"
                              onClick={() => solicitarAlternarStatus(u)}
                              disabled={ehConectado}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                ehConectado
                                  ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                  : u.ativo
                                  ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                              }`}
                              title={ehConectado ? 'Não é possível inativar a si mesmo' : u.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
                            >
                              {u.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </button>

                            {/* Botão Excluir */}
                            <button
                              id={`btn-excluir-usuario-${u.id}`}
                              type="button"
                              onClick={() => solicitarExclusao(u)}
                              disabled={ehConectado}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                ehConectado
                                  ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 border-red-200'
                              }`}
                              title={ehConectado ? 'Não é possível excluir seu próprio usuário' : 'Excluir Usuário'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: AUDITORIA LGPD */}
      {aba === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Logs de Operações e Trilha de Conformidade LGPD (Art. 11 - Dados Sensíveis de Saúde)
            </span>
            <span className="text-slate-500">Últimos registros gravados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Usuário Responsável</th>
                  <th className="py-3 px-4">Ação Realizada</th>
                  <th className="py-3 px-4">Módulo / Tabela</th>
                  <th className="py-3 px-4">Detalhes Técnicos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsFiltrados.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.usuario_nome || log.user_nome || 'Sistema'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.acao.includes('EXCLUSAO') || log.acao.includes('DESATIVACAO')
                          ? 'bg-red-100 text-red-800'
                          : log.acao.includes('CRIACAO') || log.acao.includes('ATIVACAO')
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.acao.includes('LOGIN')
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {log.entidade || log.tabela || 'sistema'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                      {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal In-App de Confirmação (Substitui confirm do browser que trava no iframe) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            id="modal-confirmacao-in-app"
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.tipo === 'excluir' 
                  ? 'bg-red-100 text-red-700' 
                  : confirmModal.usuario.ativo 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {confirmModal.tipo === 'excluir' ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmModal.usuario.ativo ? (
                  <PowerOff className="w-5 h-5" />
                ) : (
                  <Power className="w-5 h-5" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.tipo === 'excluir'
                    ? 'Confirmar Exclusão Definitiva'
                    : confirmModal.usuario.ativo
                    ? 'Confirmar Desativação de Acesso'
                    : 'Confirmar Reativação de Acesso'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmModal.usuario.nome} ({confirmModal.usuario.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {confirmModal.tipo === 'excluir' ? (
                <span>
                  Tem certeza que deseja <strong>excluir permanentemente</strong> este usuário? Esta ação será registrada na trilha de auditoria e não poderá ser desfeita.
                </span>
              ) : confirmModal.usuario.ativo ? (
                <span>
                  Ao <strong>desativar</strong> este usuário, ele ficará <strong>impedido de fazer login</strong> e não conseguirá acessar os dados do sistema até que seja reativado pelo Núcleo.
                </span>
              ) : (
                <span>
                  Deseja <strong>reativar</strong> o acesso deste usuário? Ele poderá voltar a fazer login normalmente com seu e-mail e senha cadastrados.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-acao-modal"
                type="button"
                onClick={executarAcaoConfirmada}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                  confirmModal.tipo === 'excluir'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.usuario.ativo
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.tipo === 'excluir'
                  ? 'Sim, Excluir Usuário'
                  : confirmModal.usuario.ativo
                  ? 'Sim, Desativar Acesso'
                  : 'Sim, Ativar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Usuário com Senha */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            id="modal-gestao-usuario"
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  {usuarioEmEdicao ? 'Editar Dados do Usuário & Senha' : 'Cadastrar Novo Usuário e Senha'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados institucionais e defina a senha para acesso na tela de login.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Completo do Servidor / Gestor *
                </label>
                <input
                  id="input-form-usuario-nome"
                  type="text"
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="ex: Prof. Antonio Vieira Bispo"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail Institucional (@seduc.pa.gov.br) *
                  </label>
                  <input
                    id="input-form-usuario-email"
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="antonio.bispo@seduc.pa.gov.br"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cargo / Função Institucional
                  </label>
                  <input
                    id="input-form-usuario-cargo"
                    type="text"
                    value={formData.cargo || ''}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="ex: Diretor Escolar, Prof. AEE"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Seção de Cadastro / Redefinição de Senha */}
              <div className="bg-sky-50/70 border border-sky-200 p-3.5 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-sky-950 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-sky-600" />
                    Senha de Acesso ao Sistema *
                  </label>

                  <button
                    type="button"
                    onClick={gerarSenhaAleatoria}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar Nova Senha
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="input-form-usuario-senha"
                    type={mostrarSenhaForm ? 'text' : 'password'}
                    required={!usuarioEmEdicao}
                    value={formData.senha || ''}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder={usuarioEmEdicao ? 'Digite nova senha ou mantenha a atual' : 'Cadastre a senha (mínimo 4 caracteres)'}
                    className="w-full rounded-xl border border-sky-300 bg-white p-2.5 pr-10 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaForm(!mostrarSenhaForm)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={mostrarSenhaForm ? 'Ocultar' : 'Visualizar'}
                  >
                    {mostrarSenhaForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-sky-800 mt-1.5 leading-tight">
                  {usuarioEmEdicao 
                    ? 'Esta senha será exigida na tela de login para este usuário. Altere se o servidor solicitou nova senha.'
                    : 'O Núcleo DRE deve fornecer esta senha ao servidor para que ele possa efetuar login.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Papel de Acesso no Sistema *
                </label>
                <select
                  id="select-form-usuario-papel"
                  value={formData.papel}
                  onChange={(e) => setFormData({ ...formData, papel: e.target.value as PapelUsuario })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="nucleo_diretor">Diretor do Núcleo DRE (Acesso Regional Total aos 8 Municípios)</option>
                  <option value="nucleo_tecnico">Técnico de Referência DRE (Acesso Regional Total)</option>
                  <option value="diretor_escola">Diretor Escolar (Acesso Restrito à sua Escola)</option>
                  <option value="secretaria_escola">Secretaria Escolar (Acesso Restrito à sua Escola)</option>
                </select>
              </div>

              {!formData.papel?.startsWith('nucleo') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vincular à Escola Estadual *
                  </label>
                  <select
                    id="select-form-usuario-escola"
                    value={formData.escola_id || ''}
                    onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                  >
                    {todasEscolas.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nome} — {e.municipio}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    O usuário só terá visibilidade dos alunos, laudos e turmas desta escola específica.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="checkbox-form-usuario-ativo"
                    type="checkbox"
                    checked={formData.ativo ?? true}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">
                    Usuário Ativo (Pode acessar a plataforma e realizar login)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-usuario-modal"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {usuarioEmEdicao ? 'Salvar Alterações' : 'Cadastrar Usuário & Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
