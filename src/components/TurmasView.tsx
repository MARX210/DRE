import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Turma, TurnoTipo } from '../types';
import { StatusBadge } from './StatusBadge';
import { Users, Plus, School, Clock, Check, X, AlertCircle } from 'lucide-react';

export const TurmasView: React.FC = () => {
  const { turmas, escolas, alunos, ehNucleo, minhaEscola, salvarTurma } = useAppStore();

  const [escolaFiltro, setEscolaFiltro] = useState<string>(ehNucleo ? 'todas' : (minhaEscola?.id || ''));
  const [modalAberta, setModalAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Turma>>({
    escola_id: ehNucleo ? (escolas[0]?.id || '') : (minhaEscola?.id || ''),
    nome: '',
    ano_letivo: new Date().getFullYear(),
    turno: 'matutino',
    serie_ou_etapa: '',
  });

  const turmasFiltradas = turmas.filter(t => {
    if (escolaFiltro !== 'todas' && t.escola_id !== escolaFiltro) return false;
    return true;
  });

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.escola_id) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    setSalvando(true);
    await salvarTurma(formData);
    setSalvando(false);
    setModalAberta(false);
    setFormData({
      escola_id: ehNucleo ? (escolas[0]?.id || '') : (minhaEscola?.id || ''),
      nome: '',
      ano_letivo: new Date().getFullYear(),
      turno: 'matutino',
      serie_ou_etapa: '',
    });
  };

  return (
    <div id="turmas-view" className="space-y-6 pb-12">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Turmas e Enturmação
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organização das salas de aula comuns e enturmação dos estudantes da Educação Especial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberta(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Turma
        </button>
      </div>

      {/* Filtro Escola (se Núcleo) */}
      {ehNucleo && (
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
          <label className="font-bold text-slate-700">Filtrar por Escola:</label>
          <select
            value={escolaFiltro}
            onChange={(e) => setEscolaFiltro(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 font-medium text-slate-800"
          >
            <option value="todas">Todas as Escolas</option>
            {escolas.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grid de Turmas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmasFiltradas.map((turma) => {
          const escolaDaTurma = escolas.find(e => e.id === turma.escola_id);
          const alunosDaTurma = alunos.filter(a => a.turma_id === turma.id);
          const alunosComPendencia = alunosDaTurma.filter(a => a.status_atendimento !== 'ok' && a.status_atendimento !== 'nao_se_aplica');

          return (
            <div
              key={turma.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black text-slate-900 text-base">{turma.nome}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize">
                    {turma.turno}
                  </span>
                </div>

                <div className="text-xs text-slate-600 font-medium line-clamp-1 mb-1">
                  {escolaDaTurma?.nome}
                </div>

                <div className="text-[11px] text-slate-500 mb-3">
                  {turma.serie_ou_etapa || 'Ensino Regular'} • Ano {turma.ano_letivo}
                </div>

                {/* Lista de Alunos da Educação Especial nesta turma */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                    <span>Alunos da Educação Especial:</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {alunosDaTurma.length}
                    </span>
                  </div>

                  {alunosDaTurma.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-1">
                      Nenhum aluno AEE enturmado nesta sala.
                    </div>
                  ) : (
                    alunosDaTurma.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span className="font-medium text-slate-800 truncate max-w-[170px]">{a.nome}</span>
                        <StatusBadge status={a.status_atendimento} tamanho="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova Turma */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Nova Turma</h3>
              <button onClick={() => setModalAberta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escola *</label>
                <select
                  disabled={!ehNucleo}
                  value={formData.escola_id}
                  onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 p-2 bg-slate-50 font-medium"
                >
                  {escolas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome / Identificação da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: 101-M, 9º Ano B, 3ª Série 02"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno</label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as TurnoTipo })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="matutino">Matutino</option>
                    <option value="vespertino">Vespertino</option>
                    <option value="noturno">Noturno</option>
                    <option value="integral">Integral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ano Letivo</label>
                  <input
                    type="number"
                    value={formData.ano_letivo}
                    onChange={(e) => setFormData({ ...formData, ano_letivo: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Série ou Etapa</label>
                <input
                  type="text"
                  placeholder="Ex.: 1ª Série Ensino Médio"
                  value={formData.serie_ou_etapa || ''}
                  onChange={(e) => setFormData({ ...formData, serie_ou_etapa: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
