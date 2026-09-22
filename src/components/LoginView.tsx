import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertTriangle,
  Building2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../lib/store';

export const LoginView: React.FC = () => {
  const { login } = useAppStore();
  
  const [emailOuNome, setEmailOuNome] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = emailOuNome.trim();
    const senhaLimpa = senha.trim();

    if (!emailLimpo) {
      setErro('Por favor, digite seu e-mail institucional.');
      return;
    }

    if (!senhaLimpa) {
      setErro('Por favor, digite sua senha de acesso.');
      return;
    }

    setCarregando(true);
    try {
      const res = await login(emailLimpo, senhaLimpa);
      if (!res.success) {
        setErro(res.error || 'Credenciais inválidas.');
      }
    } catch {
      setErro('Erro ao validar login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Efeitos visuais de iluminação no fundo */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo institucional */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">GOVERNO DO PARÁ</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">SEDUC-PA</span>
            </div>
            <h1 className="text-sm font-bold text-white leading-none mt-0.5">
              DRE Altamira · Sistema Regional de AEE
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Diretoria Regional de Ensino da Transamazônica</span>
        </div>
      </header>

      {/* Área Central: Caixa de Login Centralizada */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Cabeçalho do formulário */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white shadow-lg shadow-sky-500/25 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso Seguro ao Sistema</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Entrar com Credenciais
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Digite seu e-mail institucional e sua senha cadastrada pelo Núcleo da DRE Altamira.
              </p>
            </div>

            {/* Alerta de erro */}
            {erro && (
              <div 
                id="alerta-erro-login"
                className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Falha no Acesso:</span> {erro}
                </div>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail Institucional (@seduc.pa.gov.br)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    autoFocus
                    value={emailOuNome}
                    onChange={(e) => setEmailOuNome(e.target.value)}
                    placeholder="antonio.bispo@seduc.pa.gov.br"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-login-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha cadastrada"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label="Alternar visualização da senha"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-entrar-login"
                type="submit"
                disabled={carregando}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-400 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {carregando ? (
                  <span>Validando credenciais...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Rodapé e Orientações de Acesso */}
            <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col gap-3 text-center text-xs text-slate-400">
              <div className="flex items-center justify-center gap-1.5 text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Portal Corporativo · SEDUC-PA & DRE Altamira</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                Acesso exclusivo para gestores escolares, professores de AEE e equipe técnica da Educação Especial.
              </p>
              
              <div className="pt-2 text-[10px] text-slate-500">
                <span>Primeiro acesso ou redefinição de senha? </span>
                <span className="text-sky-400 font-medium">Contate o Núcleo de Educação Especial da DRE.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé institucional */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/80 px-4 py-3 text-center text-xs text-slate-500">
        Secretaria de Estado de Educação do Pará (SEDUC-PA) · Diretoria Regional de Ensino (DRE Altamira) · Atendimento Educacional Especializado (AEE)
      </footer>
    </div>
  );
};
