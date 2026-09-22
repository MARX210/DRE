import { EstudoDeCaso, IndicadorAvaliacao } from '../../types';

function formatIndicador(valor?: IndicadorAvaliacao): { sim: string; nao: string; ed: string; na: string } {
  return {
    sim: valor === 'sim' ? 'X' : '',
    nao: valor === 'nao' ? 'X' : '',
    ed: valor === 'ED' ? 'X' : '',
    na: valor === 'NA' ? 'X' : '',
  };
}

function escapeHtml(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function gerarHtmlEstudoDeCaso(estudo: EstudoDeCaso): string {
  const i = estudo.identificacao || ({} as EstudoDeCaso['identificacao']);
  const f = estudo.familia || ({} as EstudoDeCaso['familia']);
  const genitor = f.genitor || { nome: '', profissao: '', telefone: '', escolaridade: '' };
  const genitora = f.genitora || { nome: '', profissao: '', telefone: '', escolaridade: '' };
  const e1 = estudo.escola_1_matricula || ({} as EstudoDeCaso['escola_1_matricula']);
  const e2 = estudo.escola_2_aee || ({} as EstudoDeCaso['escola_2_aee']);
  const hist = estudo.historico_escolar || { antecedentes_relevantes: '' };
  const saude = estudo.avaliacao_inicial || ({} as EstudoDeCaso['avaliacao_inicial']);
  const ped = estudo.aspectos_pedagogicos || ({} as EstudoDeCaso['aspectos_pedagogicos']);
  const apoios = estudo.apoios_saee || ({} as EstudoDeCaso['apoios_saee']);
  const plano = estudo.plano_atendimento || ({} as EstudoDeCaso['plano_atendimento']);
  const conf = estudo.consideracoes_finais || ({} as EstudoDeCaso['consideracoes_finais']);

  const dataAtualFormatada = conf.data 
    ? new Date(conf.data + 'T12:00:00').toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Estudo de Caso — ${escapeHtml(i.nome || 'Estudante')} — COEES / SEDUC-PA</title>
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
      background: #1e293b;
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
    
    /* Tipografia e Cabeçalho Oficial */
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
      letter-spacing: 0.5px;
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
      color: #0f172a;
    }
    .cabecalho-oficial .titulo-doc {
      font-size: 11.5pt;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 6px;
      text-decoration: underline;
    }
    
    /* Seções */
    .secao-bloco {
      margin-bottom: 11px;
    }
    .secao-titulo {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 2px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .subsecao-titulo {
      background-color: #e2e8f0;
      color: #1e293b;
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      padding: 3px 6px;
      margin: 6px 0 4px 0;
      border-left: 3px solid #0284c7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Tabelas e Campos */
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

    /* Tabela de Avaliação Pedagógica */
    table.tabela-pedagogica {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 6px;
    }
    table.tabela-pedagogica th, table.tabela-pedagogica td {
      border: 1px solid #94a3b8;
      padding: 3px 5px;
    }
    table.tabela-pedagogica th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table.tabela-pedagogica td.col-marcador {
      text-align: center;
      width: 32px;
      font-weight: bold;
      font-family: monospace;
      font-size: 9pt;
    }

    /* Checkbox visual para impressão */
    .chk {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1.2px solid #0f172a;
      text-align: center;
      line-height: 11px;
      font-size: 8.5pt;
      font-weight: bold;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* Assinaturas */
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
      Estudo de Caso Oficial — ${escapeHtml(i.nome || 'Estudante')} (COEES / SEDUC-PA)
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
      <div class="titulo-doc">ESTUDO DE CASO — AVALIAÇÃO INICIAL E ENCAMINHAMENTO</div>
    </div>

    <!-- 1. IDENTIFICAÇÃO DO ESTUDANTE -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">1. Identificação do Estudante</div>
      <table class="tabela-dados">
        <tr>
          <td colspan="3">
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
          <td colspan="3">
            <span class="campo-label">Responsável Legal</span>
            <div class="campo-valor">${escapeHtml(i.responsavel || '-')}</div>
          </td>
          <td colspan="2">
            <span class="campo-label">Telefone de Contato</span>
            <div class="campo-valor">${escapeHtml(i.telefone || '-')}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo-label">Endereço Residencial</span>
            <div class="campo-valor">${escapeHtml(i.endereco || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Número / Compl.</span>
            <div class="campo-valor">${escapeHtml(i.numero || 'S/N')} ${escapeHtml(i.complemento || '')}</div>
          </td>
          <td>
            <span class="campo-label">Bairro</span>
            <div class="campo-valor">${escapeHtml(i.bairro || '-')}</div>
          </td>
          <td>
            <span class="campo-label">Município / UF / CEP</span>
            <div class="campo-valor">${escapeHtml(i.cidade || 'Altamira')} - ${escapeHtml(i.estado || 'PA')} • ${escapeHtml(i.cep || '')}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 2. INFORMAÇÕES FAMILIARES -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">2. Informações Familiares</div>
      <table class="tabela-dados">
        <tr>
          <td style="width: 50%;">
            <span class="campo-label">Genitor (Pai):</span>
            <div class="campo-valor"><strong>${escapeHtml(genitor.nome || 'Não informado')}</strong></div>
            <div style="margin-top: 3px; font-size: 7.5pt; color: #475569;">
              Profissão: ${escapeHtml(genitor.profissao || '-')} | Escolaridade: ${escapeHtml(genitor.escolaridade || '-')} | Tel: ${escapeHtml(genitor.telefone || '-')}
            </div>
          </td>
          <td style="width: 50%;">
            <span class="campo-label">Genitora (Mãe):</span>
            <div class="campo-valor"><strong>${escapeHtml(genitora.nome || 'Não informada')}</strong></div>
            <div style="margin-top: 3px; font-size: 7.5pt; color: #475569;">
              Profissão: ${escapeHtml(genitora.profissao || '-')} | Escolaridade: ${escapeHtml(genitora.escolaridade || '-')} | Tel: ${escapeHtml(genitora.telefone || '-')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 3 e 4. ESCOLAS (1ª MATRÍCULA E 2ª MATRÍCULA AEE) -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">3 e 4. Unidades Escolares (Matrícula Regular e AEE)</div>
      <table class="tabela-dados">
        <tr>
          <th colspan="2">1ª Matrícula: Unidade de Ensino Comum (Escolarização)</th>
          <th colspan="2">2ª Matrícula: Atendimento Educacional Especializado (AEE)</th>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo-label">Escola</span>
            <div class="campo-valor"><strong>${escapeHtml(e1.nome_escola || '-')}</strong></div>
            <div style="font-size: 7.5pt; color: #475569; margin-top: 2px;">
              Direção: ${escapeHtml(e1.diretor || '-')} • Tel: ${escapeHtml(e1.telefone_escola || '-')}
            </div>
            <div style="font-size: 8pt; margin-top: 3px;">
              <strong>Ano/Etapa:</strong> ${escapeHtml(e1.ano_etapa || '-')} | <strong>Turma:</strong> ${escapeHtml(e1.turma || '-')} | <strong>Turno:</strong> ${escapeHtml(e1.turno || '-')} | <strong>Total Alunos:</strong> ${escapeHtml(e1.quantitativo_estudantes || '-')}
            </div>
          </td>
          <td colspan="2">
            <span class="campo-label">Sala de Recursos / Unidade AEE</span>
            <div class="campo-valor"><strong>${escapeHtml(e2.nome || 'AEE na própria unidade ou polo')}</strong></div>
            <div style="font-size: 7.5pt; color: #475569; margin-top: 2px;">
              Município: ${escapeHtml(e2.municipio || 'Altamira')} • Ano Ingresso: ${escapeHtml(e2.ano_ingresso || '-')}
            </div>
            <div style="font-size: 8pt; margin-top: 3px;">
              <strong>Turma AEE:</strong> ${escapeHtml(e2.turma || 'SRM')} | <strong>Turno:</strong> ${escapeHtml(e2.turno || 'Contraturno')} | <strong>Qtd Alunos SRM:</strong> ${escapeHtml(e2.quantitativo_turma || '-')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 5. HISTÓRICO ESCOLAR -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">5. Informação Escolar (Histórico do Estudante)</div>
      <table class="tabela-dados">
        <tr>
          <td>
            <span class="campo-label">Antecedentes Relevantes / Trajetória Escolar</span>
            <div class="campo-valor" style="white-space: pre-wrap; font-size: 8pt;">
              ${escapeHtml(hist.antecedentes_relevantes || 'Não constam registros prévios informados.')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 6. AVALIAÇÃO INICIAL & SAÚDE -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">6. Procedimentos Referentes à Avaliação Inicial e Saúde</div>
      
      <div class="subsecao-titulo">6.1 Necessidades Específicas e Transtornos do Estudante</div>
      <table class="tabela-dados">
        <tr>
          <td>
            <span class="chk">${saude.deficiencia_intelectual ? 'X' : '&nbsp;'}</span> Deficiência Intelectual<br/>
            <span class="chk">${saude.deficiencia_auditiva ? 'X' : '&nbsp;'}</span> Defic. Auditiva (${escapeHtml(saude.deficiencia_auditiva || 'N/A')})<br/>
            <span class="chk">${saude.surdez ? 'X' : '&nbsp;'}</span> Surdez (Usa Libras: ${escapeHtml(saude.surdez_faz_uso_libras || 'N/A')})<br/>
            <span class="chk">${saude.deficiencia_visual ? 'X' : '&nbsp;'}</span> Defic. Visual (${escapeHtml(saude.deficiencia_visual || 'N/A')})
          </td>
          <td>
            <span class="chk">${saude.surdocegueira ? 'X' : '&nbsp;'}</span> Surdocegueira<br/>
            <span class="chk">${saude.deficiencia_fisica ? 'X' : '&nbsp;'}</span> Deficiência Física<br/>
            <span class="chk">${saude.tea ? 'X' : '&nbsp;'}</span> Transtorno do Espectro Autista (TEA)<br/>
            <span class="chk">${saude.altas_habilidades_superdotacao ? 'X' : '&nbsp;'}</span> Altas Habilidades / Superdotação
          </td>
          <td>
            <span class="chk">${saude.tdah ? 'X' : '&nbsp;'}</span> TDAH<br/>
            <span class="chk">${saude.dislexia ? 'X' : '&nbsp;'}</span> Dislexia<br/>
            <span class="chk">${saude.discalculia ? 'X' : '&nbsp;'}</span> Discalculia<br/>
            <span class="chk">${saude.tpac ? 'X' : '&nbsp;'}</span> TPAC
          </td>
        </tr>
      </table>

      <div class="subsecao-titulo">6.2 Área da Saúde e Cuidados no Ambiente Escolar</div>
      <table class="tabela-dados">
        <tr>
          <td>
            <span class="campo-label">Possui Laudo Médico?</span>
            <div class="campo-valor">
              <strong>${saude.laudo_medico === 'sim' ? 'SIM' : 'NÃO'}</strong>
              ${saude.cid_laudo ? ` — CID: <strong>${escapeHtml(saude.cid_laudo)}</strong>` : ''}
              ${saude.processos_avaliativos_medicos ? ` (Proc. nº ${escapeHtml(saude.processos_avaliativos_medicos)})` : ''}
            </div>
          </td>
          <td>
            <span class="campo-label">Problemas de Saúde Específicos</span>
            <div class="campo-valor">${saude.possui_problema_saude === 'sim' ? escapeHtml(saude.qual_problema_saude || 'Sim') : 'Nenhum declarado'}</div>
          </td>
          <td>
            <span class="campo-label">Necessita de Atenção Específica no Horário Escolar?</span>
            <div class="campo-valor">${saude.necessita_atencao_horario_escolar === 'sim' ? escapeHtml(saude.qual_atencao_necessita || 'Sim') : 'Não'}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="campo-label">Uso de Medicação</span>
            <div class="campo-valor">
              ${saude.faz_uso_medicacao === 'sim' 
                ? `SIM — Medicamento: ${escapeHtml(saude.qual_medicacao || '-')} | Horários: ${escapeHtml(saude.horarios_medicacao || '-')}` 
                : 'Não faz uso contínuo no horário escolar'}
            </div>
          </td>
          <td>
            <span class="campo-label">Restrição Alimentar</span>
            <div class="campo-valor">
              ${saude.tem_restricao_alimentar === 'sim' ? `SIM — ${escapeHtml(saude.restricao_alimentar_orientacao || '')}` : 'Sem restrições'}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 7. ASPECTOS PEDAGÓGICOS -->
    <div class="secao-bloco">
      <div class="secao-titulo">7. Aspectos Pedagógicos (Avaliação Funcional Pedagógica)</div>
      <div style="font-size: 7pt; color: #475569; margin-bottom: 4px; font-style: italic;">
        Legenda: <strong>SIM</strong> = Apresenta habilidade consolidada | <strong>NÃO</strong> = Não apresenta | <strong>ED</strong> = Em Desenvolvimento | <strong>NA</strong> = Não se Aplica
      </div>

      <!-- 7.1 Psicomotores -->
      <div class="subsecao-titulo">7.1 Aspectos Psicomotores</div>
      <table class="tabela-pedagogica">
        <tr>
          <th>Indicador Avaliado</th>
          <th style="width:30px;">SIM</th>
          <th style="width:30px;">NÃO</th>
          <th style="width:30px;">ED</th>
          <th style="width:30px;">NA</th>
          <th>Indicador Avaliado</th>
          <th style="width:30px;">SIM</th>
          <th style="width:30px;">NÃO</th>
          <th style="width:30px;">ED</th>
          <th style="width:30px;">NA</th>
        </tr>
        ${(() => {
          const psi = ped.psicomotores || {};
          const p1 = formatIndicador(psi.praxia_global);
          const p2 = formatIndicador(psi.preensao_lapis);
          const p3 = formatIndicador(psi.dominancia_lateral);
          const p4 = formatIndicador(psi.coordenacao_visomotora);
          return `
          <tr>
            <td>Praxia Global (equilíbrio/locomoção)</td>
            <td class="col-marcador">${p1.sim}</td><td class="col-marcador">${p1.nao}</td><td class="col-marcador">${p1.ed}</td><td class="col-marcador">${p1.na}</td>
            <td>Preensão no Lápis / Instrumentos</td>
            <td class="col-marcador">${p2.sim}</td><td class="col-marcador">${p2.nao}</td><td class="col-marcador">${p2.ed}</td><td class="col-marcador">${p2.na}</td>
          </tr>
          <tr>
            <td>Dominância Lateral / Lateralidade</td>
            <td class="col-marcador">${p3.sim}</td><td class="col-marcador">${p3.nao}</td><td class="col-marcador">${p3.ed}</td><td class="col-marcador">${p3.na}</td>
            <td>Coordenação Visomotora</td>
            <td class="col-marcador">${p4.sim}</td><td class="col-marcador">${p4.nao}</td><td class="col-marcador">${p4.ed}</td><td class="col-marcador">${p4.na}</td>
          </tr>
          `;
        })()}
      </table>

      <!-- 7.2 e 7.3 Linguagem e Raciocínio -->
      <div class="subsecao-titulo">7.2 Linguagem, Comunicação e Raciocínio</div>
      <table class="tabela-pedagogica">
        <tr>
          <th>Indicador Avaliado</th>
          <th style="width:30px;">SIM</th>
          <th style="width:30px;">NÃO</th>
          <th style="width:30px;">ED</th>
          <th style="width:30px;">NA</th>
          <th>Indicador Avaliado</th>
          <th style="width:30px;">SIM</th>
          <th style="width:30px;">NÃO</th>
          <th style="width:30px;">ED</th>
          <th style="width:30px;">NA</th>
        </tr>
        ${(() => {
          const lo = ped.linguagem_oral || {};
          const le = ped.linguagem_escrita || {};
          const rm = ped.raciocinio_matematico || {};
          const ac = ped.atencao_concentracao || {};

          const i1 = formatIndicador(lo.expressa_pela_fala);
          const i2 = formatIndicador(lo.compreensao_comandos);
          const i3 = formatIndicador(le.escrita_palavras_textos);
          const i4 = formatIndicador(le.distincao_letras_numeros);
          const i5 = formatIndicador(rm.reconhecimento_numeros);
          const i6 = formatIndicador(rm.contagem);
          const i7 = formatIndicador(ac.mantem_atencao);
          const i8 = formatIndicador(ac.permanece_em_sala);

          return `
          <tr>
            <td>Expressa-se verbalmente (fala funcional)</td>
            <td class="col-marcador">${i1.sim}</td><td class="col-marcador">${i1.nao}</td><td class="col-marcador">${i1.ed}</td><td class="col-marcador">${i1.na}</td>
            <td>Compreende comandos simples e complexos</td>
            <td class="col-marcador">${i2.sim}</td><td class="col-marcador">${i2.nao}</td><td class="col-marcador">${i2.ed}</td><td class="col-marcador">${i2.na}</td>
          </tr>
          <tr>
            <td>Escrita de palavras / frases</td>
            <td class="col-marcador">${i3.sim}</td><td class="col-marcador">${i3.nao}</td><td class="col-marcador">${i3.ed}</td><td class="col-marcador">${i3.na}</td>
            <td>Diferencia letras, símbolos e numerais</td>
            <td class="col-marcador">${i4.sim}</td><td class="col-marcador">${i4.nao}</td><td class="col-marcador">${i4.ed}</td><td class="col-marcador">${i4.na}</td>
          </tr>
          <tr>
            <td>Reconhece numerais e quantidades</td>
            <td class="col-marcador">${i5.sim}</td><td class="col-marcador">${i5.nao}</td><td class="col-marcador">${i5.ed}</td><td class="col-marcador">${i5.na}</td>
            <td>Realiza contagem e correspondência termo a termo</td>
            <td class="col-marcador">${i6.sim}</td><td class="col-marcador">${i6.nao}</td><td class="col-marcador">${i6.ed}</td><td class="col-marcador">${i6.na}</td>
          </tr>
          <tr>
            <td>Mantém atenção e concentração nas atividades</td>
            <td class="col-marcador">${i7.sim}</td><td class="col-marcador">${i7.nao}</td><td class="col-marcador">${i7.ed}</td><td class="col-marcador">${i7.na}</td>
            <td>Permanece no espaço de sala de aula</td>
            <td class="col-marcador">${i8.sim}</td><td class="col-marcador">${i8.nao}</td><td class="col-marcador">${i8.ed}</td><td class="col-marcador">${i8.na}</td>
          </tr>
          `;
        })()}
      </table>

      <!-- 7.4 Atividades de Vida Autônoma e Sociabilidade -->
      <div class="subsecao-titulo">7.3 Autonomia e Convivência</div>
      <table class="tabela-dados">
        <tr>
          <td style="width: 50%;">
            <span class="campo-label">Sociabilidade e Interação Afetiva</span>
            <div class="campo-valor" style="font-size: 8pt;">
              ${escapeHtml(ped.sociabilidade_afetividade?.descricao || 'Interage bem com professores e colegas com mediação pedagógica.')}
            </div>
          </td>
          <td style="width: 50%;">
            <span class="campo-label">Atividades de Vida Autônoma (Alimentação / Higiene)</span>
            <div class="campo-valor" style="font-size: 8pt;">
              ${escapeHtml(ped.vida_autonoma?.complementares || 'Possui autonomia preservada nas rotinas escolares diárias.')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 8. APOIOS DO SAEE -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">8. Levantamento de Apoios do SAEE Identificados</div>
      <table class="tabela-dados">
        <tr>
          <td>
            <span class="chk">${apoios.professor_aee_contraturno ? 'X' : '&nbsp;'}</span> Professor(a) de AEE no Contraturno (Sala de Recursos)<br/>
            <span class="chk">${apoios.acompanhante_especializado ? 'X' : '&nbsp;'}</span> Acompanhante Especializado (Apoio Pedagógico/Cuidados)
          </td>
          <td>
            <span class="chk">${apoios.tradutor_interprete_libras ? 'X' : '&nbsp;'}</span> Tradutor e Intérprete de Libras<br/>
            <span class="chk">${apoios.professor_libras ? 'X' : '&nbsp;'}</span> Professor(a) de Libras
          </td>
          <td>
            <span class="chk">${apoios.braillista ? 'X' : '&nbsp;'}</span> Profissional Braillista<br/>
            <span class="chk">${apoios.guia_interprete ? 'X' : '&nbsp;'}</span> Guia-Intérprete
          </td>
        </tr>
      </table>
    </div>

    <!-- 9. PLANO DE ATENDIMENTO -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">9. Definição do Plano de Atendimento</div>
      <table class="tabela-dados">
        <tr>
          <td style="width: 50%;">
            <div style="font-weight: bold; margin-bottom: 2px;">
              <span class="chk">${plano.plano_aee ? 'X' : '&nbsp;'}</span> Atendimento na Sala de Recursos Multifuncionais (AEE)
            </div>
            <div style="font-size: 8pt; color: #334155;">
              ${escapeHtml(plano.plano_aee_objetivo || 'Atendimento especializado no contraturno para suplementação/complementação curricular.')}
            </div>
          </td>
          <td style="width: 50%;">
            <div style="font-weight: bold; margin-bottom: 2px;">
              <span class="chk">${plano.plano_pei ? 'X' : '&nbsp;'}</span> Elaboração do Plano Educacional Individualizado (PEI)
            </div>
            <div style="font-size: 8pt; color: #334155;">
              ${escapeHtml(plano.plano_pei_objetivo || 'Flexibilização de objetivos, metodologias e avaliações na sala comum em conjunto com os regentes.')}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 10. CONSIDERAÇÕES FINAIS E ASSINATURAS -->
    <div class="secao-bloco evitar-quebra">
      <div class="secao-titulo">10. Considerações Finais e Validação Oficial</div>
      <div style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 8pt; line-height: 1.4; margin-bottom: 12px; min-height: 45px;">
        ${escapeHtml(conf.texto || 'O presente Estudo de Caso foi elaborado em conformidade com as diretrizes da Coordenadoria de Educação Especial (COEES/SEDUC-PA), respaldando o direito do educando ao pleno acesso, permanência e aprendizagem na Educação Básica.')}
      </div>

      <div style="text-align: right; font-size: 8pt; margin-bottom: 20px;">
        ${escapeHtml(conf.local || 'Altamira - PA')}, ${dataAtualFormatada}
      </div>

      <!-- Grade de Assinaturas Oficiais -->
      <div class="grade-assinaturas">
        <div class="linha-assinatura">
          <strong>${escapeHtml(conf.responsavel_nome || 'Professor(a) de AEE')}</strong>
          ${escapeHtml(conf.responsavel_cargo || 'Atendimento Educacional Especializado')} • ${escapeHtml(conf.responsavel_matricula || 'SEDUC-PA')}
        </div>
        <div class="linha-assinatura">
          <strong>Coordenação Pedagógica</strong>
          Unidade Escolar / COEES Regional
        </div>
        <div class="linha-assinatura">
          <strong>Direção da Unidade Escolar</strong>
          ${escapeHtml(e1.nome_escola || 'Escola Estadual')}
        </div>
        <div class="linha-assinatura">
          <strong>Responsável Legal pelo Estudante</strong>
          ${escapeHtml(i.responsavel || 'Pai / Mãe / Tutor(a)')}
        </div>
      </div>
    </div>

  </div>

</body>
</html>`;
}
