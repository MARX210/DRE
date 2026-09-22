import { PEIOfficial } from '../../types';

function escapeHtml(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function gerarHtmlPEI(pei: PEIOfficial): string {
  const i = pei.identificacao || ({} as PEIOfficial['identificacao']);
  const ind = pei.indicadores || [];
  const fam = pei.contexto_familiar || ({} as PEIOfficial['contexto_familiar']);
  const dev = pei.areas_desenvolvimento || ({} as PEIOfficial['areas_desenvolvimento']);
  const ens = pei.ensino_individualizado || ({} as PEIOfficial['ensino_individualizado']);
  const ass = pei.assinaturas || ({} as PEIOfficial['assinaturas']);

  const dataAtualFormatada = ass.data
    ? new Date(ass.data + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano Educacional Individualizado (PEI) — ${escapeHtml(i.nome || 'Estudante')} — COEES / SEDUC-PA</title>
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
      .quebra-pagina {
        page-break-before: always;
      }
      .evitar-quebra {
        page-break-inside: avoid;
      }
    }
    
    /* Cabeçalho Oficial */
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
      padding: 4px 8px;
      margin-bottom: 5px;
      border-radius: 2px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    table.tabela-dados {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
      font-size: 8.5pt;
    }
    table.tabela-dados th, table.tabela-dados td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      vertical-align: top;
    }
    table.tabela-dados th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: left;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .campo-label {
      font-size: 7.5pt;
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      display: block;
      margin-bottom: 1px;
    }
    .campo-valor {
      font-size: 8.5pt;
      font-weight: normal;
      color: #0f172a;
      min-height: 14px;
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
      Plano Educacional Individualizado (PEI) — ${escapeHtml(i.nome || 'Estudante')}
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
      <div class="titulo-doc">PLANO EDUCACIONAL INDIVIDUALIZADO — PEI (ANO LETIVO: ${escapeHtml(pei.ano_letivo || new Date().getFullYear())})</div>
    </div>

    <!-- 1. IDENTIFICAÇÃO DO ESTUDANTE -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">1. Identificação do Estudante e Atendimento AEE</div>
      <table class="tabela-dados">
        <tr>
          <td colspan="2">
            <span class="campo-label">Nome Completo do Estudante</span>
            <div class="campo-valor"><strong>${escapeHtml(i.nome || 'Não informado')}</strong></div>
          </td>
          <td>
            <span class="campo-label">Data de Nascimento</span>
            <div class="campo-valor">${escapeHtml(i.data_nascimento || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Idade</span>
            <div class="campo-valor">${escapeHtml(i.idade || '-')} anos</div>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-label">Ano / Etapa</span>
            <div class="campo-valor">${escapeHtml(i.ano_etapa || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Turma</span>
            <div class="campo-valor">${escapeHtml(i.turma || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Ano de Ingresso</span>
            <div class="campo-valor">${escapeHtml(i.ano_ingresso || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Atendido no AEE?</span>
            <div class="campo-valor">
              <strong>${i.atendido_aee === 'sim' ? 'SIM (SRM/Polo)' : i.atendido_aee === 'nao' ? 'NÃO' : 'Outras'}</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 2. INDICADORES PARA O PEI -->
    <div class="secao-bloco">
      <div class="secao-titulo">2. Tabela de Indicadores para o PEI (Problema Central, Causas e Consequências)</div>
      <table class="tabela-dados">
        <thead>
          <tr>
            <th style="width: 33%;">Problema Central / Barreira Identificada</th>
            <th style="width: 33%;">Causas Observadas</th>
            <th style="width: 34%;">Consequências Pedagógicas / Funcionais</th>
          </tr>
        </thead>
        <tbody>
          ${ind.length === 0 ? `
            <tr>
              <td colspan="3" style="text-align: center; color: #64748b; padding: 10px;">
                Nenhum indicador cadastrado.
              </td>
            </tr>
          ` : ind.map(item => `
            <tr>
              <td><strong>${escapeHtml(item.problema_central || '-')}</strong></td>
              <td>${escapeHtml(item.causas || '-')}</td>
              <td>${escapeHtml(item.consequencias || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 3. CONTEXTO FAMILIAR -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">3. Relato do Contexto Familiar</div>
      <table class="tabela-dados">
        <tr>
          <td style="width: 50%;">
            <span class="campo-label">Dados dos Responsáveis e Histórico de Vida</span>
            <div class="campo-valor" style="white-space: pre-wrap; font-size: 8pt;">
              ${escapeHtml(fam.dados_responsaveis || '')}
              ${fam.historico_vida ? `\n\nHistórico: ${escapeHtml(fam.historico_vida)}` : ''}
            </div>
          </td>
          <td style="width: 50%;">
            <span class="campo-label">Expectativas Familiares (Curto, Médio e Longo Prazo)</span>
            <div class="campo-valor" style="white-space: pre-wrap; font-size: 8pt;">
              ${escapeHtml(fam.expectativa_familiar || 'Expectativa de pleno desenvolvimento da autonomia social e comunicativa.')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 4. ÁREAS DE DESENVOLVIMENTO COGNITIVO -->
    <div class="secao-bloco">
      <div class="secao-titulo">4. Áreas de Desenvolvimento (Funções Cognitivas e Psicomotoras)</div>
      <table class="tabela-dados">
        <tr>
          <td style="width: 50%;">
            <span class="campo-label">Atenção e Concentração</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.atencao_concentracao || 'Necessita de comandos fragmentados e reforço visual.')}</div>
          </td>
          <td style="width: 50%;">
            <span class="campo-label">Memória e Percepção</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.memoria || 'Boa retenção de estímulos visuais e táteis.')}</div>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-label">Linguagem e Comunicação</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.linguagem || 'Comunicação funcional com apoio de mediação.')}</div>
          </td>
          <td>
            <span class="campo-label">Raciocínio Lógico e Resolução de Problemas</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.raciocinio_logico || 'Compreensão de noções quantitativas com material concreto.')}</div>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-label">Aspectos Psicomotores e Locomoção</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.aspectos_psicomotores || 'Coordenação motora ampla preservada.')}</div>
          </td>
          <td>
            <span class="campo-label">Atividades de Vida Autônoma e Relações Interpessoais</span>
            <div class="campo-valor" style="font-size: 8pt;">${escapeHtml(dev.atividade_vida_autonoma || 'Independência para alimentação e higiene escolar.')}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 5. ENSINO INDIVIDUALIZADO (BNCC) -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">5. Proposta Curricular Individualizada (BNCC / SEDUC-PA)</div>
      <table class="tabela-dados">
        <tr>
          <td>
            <span class="campo-label">Objetivos de Aprendizagem e Flexibilizações Metodológicas</span>
            <div class="campo-valor" style="white-space: pre-wrap; font-size: 8pt;">
              ${escapeHtml(ens.objetivos_aprendizagem || 'Adaptação de tempos, formatos avaliativos e recursos pedagógicos multissensoriais.')}
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-label">Processo Avaliativo e Critérios de Acompanhamento</span>
            <div class="campo-valor" style="white-space: pre-wrap; font-size: 8pt;">
              ${escapeHtml(ens.avaliacao_aprendizagem || 'Avaliação processual diagnóstica contínua, considerando os avanços individuais em relação ao ponto de partida.')}
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <span class="campo-label">Recursos de Acessibilidade e Apoios Necessários</span>
            <div class="campo-valor" style="font-size: 8pt;">
              ${escapeHtml(ens.tipos_apoio || 'Materiais pedagógicos adaptados, fonte ampliada, rotina estruturada em pistas visuais.')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- LOCAL, DATA E ASSINATURAS -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">Validação e Assinaturas da Equipe Pedagógica</div>
      
      <div style="text-align: right; font-size: 8pt; margin: 10px 0 20px 0;">
        ${escapeHtml(ass.local || 'Altamira - PA')}, ${dataAtualFormatada}
      </div>

      <div class="grade-assinaturas">
        <div class="linha-assinatura">
          <strong>${escapeHtml(ass.professor_saee || 'Professor(a) de AEE')}</strong>
          Atendimento Educacional Especializado • Sala de Recursos
        </div>
        <div class="linha-assinatura">
          <strong>${escapeHtml(ass.responsavel_pedagogico || 'Coordenação Pedagógica')}</strong>
          Equipe Pedagógica da Unidade Escolar
        </div>
        <div class="linha-assinatura">
          <strong>Direção da Unidade Escolar</strong>
          Validação Institucional
        </div>
        <div class="linha-assinatura">
          <strong>Docente(s) da Sala Regular</strong>
          Regência de Classe / Área de Conhecimento
        </div>
      </div>
    </div>

  </div>

</body>
</html>`;
}
