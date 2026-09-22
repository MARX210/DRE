import { PDI, AlunoComStatus } from '../../types';

function escapeHtml(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function gerarHtmlPDI(pdi: Partial<PDI> & { 
  ano_letivo?: number;
  status?: string;
  potencialidades?: string;
  dificuldades?: string;
  objetivos_gerais?: string;
  estrategias_pedagogicas?: string;
  metas_bimestre_1?: string;
  metas_bimestre_2?: string;
  metas_bimestre_3?: string;
  metas_bimestre_4?: string;
  avaliacao?: string;
  elaborado_por?: string;
  data_elaboracao?: string;
}, aluno: AlunoComStatus): string {
  const ano = pdi.ano_letivo || new Date().getFullYear();
  const dataElab = pdi.data_elaboracao 
    ? new Date(pdi.data_elaboracao + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Desenvolvimento Individual (PDI) — ${escapeHtml(aluno.nome)} — SEDUC-PA</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #111;
      background-color: #f4f6f8;
      margin: 0;
      padding: 0;
    }
    .btn-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-bar-title {
      font-size: 13px;
      font-weight: bold;
      color: #f8fafc;
    }
    .btn-group {
      display: flex;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background-color: #0284c7;
      color: white;
    }
    .btn-primary:hover {
      background-color: #0369a1;
    }
    .btn-secondary {
      background-color: #334155;
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background-color: #475569;
    }
    .pagina-documento {
      max-width: 210mm;
      margin: 20px auto;
      background: #ffffff;
      padding: 16mm 14mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .no-print {
        display: none !important;
      }
      .pagina-documento {
        max-width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
    .cabecalho-oficial {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .cabecalho-oficial .governo {
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .cabecalho-oficial .secretaria {
      font-size: 8.5pt;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .cabecalho-oficial .coees {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .cabecalho-oficial .titulo-doc {
      font-size: 12pt;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 6px;
      text-decoration: underline;
    }
    .secao-bloco {
      margin-bottom: 12px;
    }
    .secao-titulo {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      padding: 3px 6px;
      margin-bottom: 4px;
    }
    .tabela-dados {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .tabela-dados td, .tabela-dados th {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      font-size: 8.5pt;
      vertical-align: top;
    }
    .campo-rotulo {
      font-weight: bold;
      font-size: 7.5pt;
      color: #475569;
      text-transform: uppercase;
      display: block;
      margin-bottom: 1px;
    }
    .campo-valor {
      font-size: 8.5pt;
      color: #0f172a;
    }
    .campo-texto {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      min-height: 38px;
      white-space: pre-wrap;
    }
    .grade-assinaturas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px 30px;
      margin-top: 24px;
    }
    .linha-assinatura {
      border-top: 1px solid #0f172a;
      text-align: center;
      padding-top: 4px;
      font-size: 8pt;
    }
    .linha-assinatura strong {
      display: block;
      font-size: 8.5pt;
    }
  </style>
</head>
<body>

  <!-- Barra Superior de Ações (Oculta na Impressão) -->
  <div class="btn-bar no-print">
    <div class="btn-bar-title">
      Plano de Desenvolvimento Individual (PDI) — ${escapeHtml(aluno.nome)}
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Imprimir / Salvar em PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Fechar Janela
      </button>
    </div>
  </div>

  <div class="pagina-documento">
    <!-- CABEÇALHO OFICIAL SEDUC-PA -->
    <div class="cabecalho-oficial">
      <div class="governo">Governo do Estado do Pará • Secretaria de Estado de Educação — SEDUC</div>
      <div class="secretaria">Secretaria Adjunta de Educação Básica • Diretoria de Diversidade e Inclusão</div>
      <div class="coees">Coordenadoria de Educação Especial — COEES • DRE Altamira</div>
      <div class="titulo-doc">PLANO DE DESENVOLVIMENTO INDIVIDUAL — PDI (${ano})</div>
    </div>

    <!-- 1. IDENTIFICAÇÃO -->
    <div class="secao-bloco">
      <div class="secao-titulo">1. Identificação do Estudante e Dados Escolares</div>
      <table class="tabela-dados">
        <tr>
          <td colspan="3">
            <span class="campo-rotulo">Nome do Estudante</span>
            <span class="campo-valor"><strong>${escapeHtml(aluno.nome)}</strong></span>
          </td>
          <td>
            <span class="campo-rotulo">Código Matrícula / ID</span>
            <span class="campo-valor">${escapeHtml(aluno.codigo)}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-rotulo">Data de Nascimento</span>
            <span class="campo-valor">${aluno.data_nascimento ? new Date(aluno.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
          </td>
          <td>
            <span class="campo-rotulo">Idade</span>
            <span class="campo-valor">${aluno.idade_calculada || aluno.idade_informada || '-'} anos</span>
          </td>
          <td>
            <span class="campo-rotulo">Diagnóstico Clínico / CID</span>
            <span class="campo-valor"><strong>${escapeHtml(aluno.cid || 'Em avaliação')}</strong></span>
          </td>
          <td>
            <span class="campo-rotulo">Nº Processo SEDUC</span>
            <span class="campo-valor">${escapeHtml(aluno.numero_processo || 'Sem processo')}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo-rotulo">Unidade Escolar</span>
            <span class="campo-valor">${escapeHtml(aluno.escola_nome)}</span>
          </td>
          <td>
            <span class="campo-rotulo">Município</span>
            <span class="campo-valor">${escapeHtml(aluno.escola_municipio || 'DRE Altamira')}</span>
          </td>
          <td>
            <span class="campo-rotulo">Turma / Série</span>
            <span class="campo-valor">${escapeHtml(aluno.turma_nome)} ${aluno.serie ? `(${escapeHtml(aluno.serie)})` : ''}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo-rotulo">Professor de AEE</span>
            <span class="campo-valor">${escapeHtml(aluno.professor_nome || (aluno.necessita_professor_aee ? 'Aguardando Lotação' : 'Não se aplica'))}</span>
          </td>
          <td colspan="2">
            <span class="campo-rotulo">Profissional de Apoio / Acompanhante</span>
            <span class="campo-valor">${escapeHtml(aluno.acompanhante_nome || (aluno.necessita_acompanhante ? 'Aguardando Contratação' : 'Não se aplica'))}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 2. POTENCIALIDADES E HABILIDADES -->
    <div class="secao-bloco">
      <div class="secao-titulo">2. Potencialidades, Interesses e Habilidades</div>
      <div class="campo-texto">${escapeHtml(pdi.potencialidades || 'Sem registros específicos.')}</div>
    </div>

    <!-- 3. DIFICULDADES E BARREIRAS -->
    <div class="secao-bloco">
      <div class="secao-titulo">3. Dificuldades e Barreiras Pedagógicas / Acessibilidade</div>
      <div class="campo-texto">${escapeHtml(pdi.dificuldades || 'Sem registros específicos.')}</div>
    </div>

    <!-- 4. OBJETIVOS GERAIS DO AEE -->
    <div class="secao-bloco">
      <div class="secao-titulo">4. Objetivos Gerais e Específicos do AEE</div>
      <div class="campo-texto">${escapeHtml(pdi.objetivos_gerais || 'Desenvolver a autonomia, apropriação dos conteúdos da base curricular comum e recursos de tecnologia assistiva.')}</div>
    </div>

    <!-- 5. ESTRATÉGIAS PEDAGÓGICAS -->
    <div class="secao-bloco">
      <div class="secao-titulo">5. Estratégias Pedagógicas e Recursos de Acessibilidade</div>
      <div class="campo-texto">${escapeHtml(pdi.estrategias_pedagogicas || 'Adaptação de materiais instrucionais, flexibilização temporal e apoio especializado no contraturno.')}</div>
    </div>

    <!-- 6. METAS BIMESTRAIS -->
    <div class="secao-bloco">
      <div class="secao-titulo">6. Metas e Avanços por Bimestre</div>
      <table class="tabela-dados">
        <tr>
          <th style="width: 50%;">1º Bimestre</th>
          <th style="width: 50%;">2º Bimestre</th>
        </tr>
        <tr>
          <td class="campo-texto">${escapeHtml(pdi.metas_bimestre_1 || 'Metas em planejamento')}</td>
          <td class="campo-texto">${escapeHtml(pdi.metas_bimestre_2 || 'Metas em planejamento')}</td>
        </tr>
      </table>
    </div>

    <!-- 7. AVALIAÇÃO E PARECER DESCRITIVO -->
    <div class="secao-bloco">
      <div class="secao-titulo">7. Avaliação e Parecer Descritivo do Processo</div>
      <div class="campo-texto">${escapeHtml(pdi.avaliacao || 'O acompanhamento do plano é continuado, reavaliado trimestralmente pela equipe do AEE e coordenação pedagógica da unidade escolar.')}</div>
    </div>

    <!-- ASSINATURAS -->
    <div class="grade-assinaturas">
      <div class="linha-assinatura">
        <strong>${escapeHtml(pdi.elaborado_por || aluno.professor_nome || 'Professor Especializado do AEE')}</strong>
        Docente do Atendimento Educacional Especializado
      </div>
      <div class="linha-assinatura">
        <strong>Coordenação Pedagógica / Direção</strong>
        ${escapeHtml(aluno.escola_nome)}
      </div>
    </div>
    
    <div style="text-align: right; font-size: 8pt; color: #64748b; margin-top: 20px;">
      Data de elaboração: ${dataElab} • Sistema COEES — DRE Altamira • SEDUC-PA
    </div>
  </div>

</body>
</html>`;
}
