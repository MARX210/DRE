import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { Oficio, AlunoComStatus } from '../../types';

export function formatarNumeroOficio(numero: number, ano: number): string {
  const numPad = String(numero).padStart(3, '0');
  return `Ofício nº ${numPad}/${ano} – NEE/DRE ALTAMIRA`;
}

export function formatarDataExtenso(dataStr?: string): string {
  const data = dataStr ? new Date(dataStr) : new Date();
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();
  return `Altamira - PA, ${dia} de ${mes} de ${ano}.`;
}

/**
 * Monta o texto padrão de corpo de ofício para determinada demanda
 */
export function gerarTextoPadraoOficio(tipoDemanda: string, nomeEscola?: string): string {
  const escolaRef = nomeEscola ? `na unidade escolar ${nomeEscola}` : 'nas unidades escolares da regional';
  
  if (tipoDemanda === 'sem_professor') {
    return `Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria por meio deste Núcleo de Educação Especial da Diretoria Regional de Ensino de Altamira (DRE Altamira) com a finalidade de solicitar a imediata lotação de Professor(a) com habilitação em Atendimento Educacional Especializado (AEE) para atender aos estudantes matriculados ${escolaRef}.\n\nRessaltamos que os estudantes listados no quadro anexo possuem necessidades específicas devidamente comprovadas e a ausência do profissional de AEE compromete gravemente a garantia do direito fundamental à educação inclusiva e as adaptações curriculares necessárias.`;
  }

  if (tipoDemanda === 'sem_acompanhante') {
    return `Ao cumprimentá-lo cordialmente, servimo-nos do presente para solicitar, em caráter de urgência, a designação e contratação de profissional de Apoio Escolar / Acompanhante Especializado para prestar suporte individualizado aos estudantes ${escolaRef}.\n\nOs alunos em questão demandam auxílio contínuo para locomoção, higiene, alimentação e mediação pedagógica em sala de aula comum, conforme laudos médicos e relatórios pedagógicos anexos aos respectivos processos administrativos.`;
  }

  if (tipoDemanda === 'contrato_pendente') {
    return `Dirigimo-nos a Vossa Senhoria para requerer a célere regularização da situação funcional e contratual dos profissionais acompanhantes atuantes junto aos educandos da Educação Especial ${escolaRef}.\n\nA continuidade do atendimento especializado e a segurança jurídica de nossa rede pública estadual dependem da rápida formalização dos referidos contratos ou aditivos.`;
  }

  return `Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria por meio deste Núcleo de Educação Especial da DRE Altamira para encaminhar o relatório consolidado de demandas e pendências de atendimento aos estudantes da Educação Especial, solicitando providências tempestivas por parte desta Secretaria de Estado de Educação.`;
}

/**
 * Gera arquivo DOCX formatado para download
 */
export async function gerarOficioDOCX(oficio: Oficio, alunosAfetados: AlunoComStatus[]): Promise<Blob> {
  const numeroFormatado = formatarNumeroOficio(oficio.numero, oficio.ano);
  const dataExtenso = formatarDataExtenso(oficio.emitido_em);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.5cm
              bottom: 1440,
              left: 1700, // 3cm
              right: 1134, // 2cm
            },
          },
        },
        children: [
          // Cabeçalho Institucional
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'GOVERNO DO ESTADO DO PARÁ\n', bold: true, size: 22 }),
              new TextRun({ text: 'SECRETARIA DE ESTADO DE EDUCAÇÃO — SEDUC\n', bold: true, size: 20 }),
              new TextRun({ text: 'DIRETORIA REGIONAL DE ENSINO — DRE ALTAMIRA\n', bold: true, size: 18 }),
              new TextRun({ text: 'NÚCLEO DE EDUCAÇÃO ESPECIAL (NEE)\n', bold: true, size: 18, color: '0284c7' }),
            ],
            spacing: { after: 400 },
          }),

          // Numeração e Local/Data
          new Paragraph({
            children: [
              new TextRun({ text: numeroFormatado, bold: true, size: 22 }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: dataExtenso, size: 20, italics: true }),
            ],
            spacing: { after: 400 },
          }),

          // Destinatário
          new Paragraph({
            children: [
              new TextRun({ text: 'A Sua Senhoria\n', size: 20 }),
              new TextRun({ text: `${oficio.destinatario}\n`, bold: true, size: 20 }),
              new TextRun({ text: 'Belém - PA\n', size: 20 }),
            ],
            spacing: { after: 300 },
          }),

          // Assunto
          new Paragraph({
            children: [
              new TextRun({ text: 'Assunto: ', bold: true, size: 20 }),
              new TextRun({ text: oficio.assunto, size: 20 }),
            ],
            spacing: { after: 300 },
          }),

          // Corpo do Ofício
          ...oficio.corpo.split('\n\n').map(paragrafo => 
            new Paragraph({
              children: [new TextRun({ text: `    ${paragrafo}`, size: 21 })],
              spacing: { after: 200, line: 360 },
              alignment: AlignmentType.JUSTIFIED,
            })
          ),

          // Tabela de Alunos Afetados (se houver)
          new Paragraph({
            children: [
              new TextRun({ text: '\nRelação de Alunos Abrangidos pela Solicitação:\n', bold: true, size: 20 }),
            ],
            spacing: { before: 200, after: 150 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Código', bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estudante', bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Escola / Turma', bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CID / Situação', bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nº Processo', bold: true, size: 18 })] })] }),
                ],
              }),
              ...alunosAfetados.map(a => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.codigo, size: 17 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.nome, bold: true, size: 17 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${a.escola_nome}\n${a.turma_nome || '-'}`, size: 16 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${a.cid || 'S/ CID'} (${a.situacao_doc})`, size: 16 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.numero_processo || '-', size: 16 })] })] }),
                ],
              })),
            ],
          }),

          // Fecho e Assinatura
          new Paragraph({
            children: [new TextRun({ text: '\n\nAtenciosamente,', size: 20 })],
            spacing: { before: 400, after: 800 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '_____________________________________________________\n', color: '94a3b8' }),
              new TextRun({ text: `${oficio.criado_por_nome || 'Diretor do Núcleo de Educação Especial'}\n`, bold: true, size: 20 }),
              new TextRun({ text: 'Diretoria Regional de Ensino — DRE Altamira\n', size: 18 }),
              new TextRun({ text: 'SEDUC — Secretaria de Estado de Educação do Pará', size: 16, italics: true }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
