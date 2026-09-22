/**
 * Utilitário Unificado de Impressão de Documentos Oficiais SEDUC-PA / COEES
 * Garante que ao clicar em "Imprimir", o documento abra imediatamente tanto
 * via nova janela de impressão quanto via modal de alta fidelidade na tela.
 */

export interface DocumentoImpressaoEvent {
  html: string;
  titulo: string;
}

export function registrarListenerImpressao(callback: (doc: DocumentoImpressaoEvent | null) => void) {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<DocumentoImpressaoEvent>;
    callback(custom.detail);
  };
  window.addEventListener('seduc-abrir-impressao', handler);
  return () => window.removeEventListener('seduc-abrir-impressao', handler);
}

/**
 * Prepara o HTML com script de auto-impressão seguro
 */
function prepararHtmlComScript(htmlConteudo: string, titulo: string): string {
  const scriptAutoPrint = `
    <script>
      (function() {
        function dispararImpressao() {
          try {
            window.focus();
            window.print();
          } catch(e) {
            console.warn('Erro ao acionar window.print():', e);
          }
        }
        if (document.readyState === 'complete') {
          setTimeout(dispararImpressao, 250);
        } else {
          window.addEventListener('load', function() {
            setTimeout(dispararImpressao, 250);
          });
        }
      })();
    </script>
  `;

  if (htmlConteudo.includes('</body>')) {
    return htmlConteudo.replace('</body>', `${scriptAutoPrint}</body>`);
  }
  return htmlConteudo + scriptAutoPrint;
}

/**
 * Abre o documento em nova aba usando Blob URL com tipo MIME correto e dispara a impressão
 */
export function abrirEmNovaJanelaEImprimir(htmlConteudo: string, titulo: string = 'Documento Oficial COEES - SEDUC-PA'): boolean {
  try {
    const htmlFinal = prepararHtmlComScript(htmlConteudo, titulo);
    const blob = new Blob([htmlFinal], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const popup = window.open(url, '_blank');
    if (popup) {
      try {
        popup.focus();
      } catch {}
      return true;
    }
  } catch (err) {
    console.warn('Não foi possível abrir via Blob URL, tentando window.open direto:', err);
  }

  // Segunda tentativa: window.open direto com document.write
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlFinal = prepararHtmlComScript(htmlConteudo, titulo);
      printWindow.document.open();
      printWindow.document.write(htmlFinal);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {}
      }, 250);
      return true;
    }
  } catch (e) {
    console.warn('Bloqueio estrito de popups detectado:', e);
  }

  return false;
}

/**
 * Função principal chamada por TODOS os botões de imprimir do sistema:
 * 1. Dispara o evento para abrir o modal oficial de alta fidelidade na tela (0ms)
 * 2. Tenta abrir a caixa nativa de impressão/nova aba diretamente
 */
export function imprimirHtml(htmlConteudo: string, titulo: string = 'Documento Oficial COEES - SEDUC-PA') {
  // 1. Abre imediatamente o visualizador modal na interface (o usuário NUNCA fica com tela parada)
  window.dispatchEvent(
    new CustomEvent<DocumentoImpressaoEvent>('seduc-abrir-impressao', {
      detail: { html: htmlConteudo, titulo },
    })
  );

  // 2. Tenta abrir a janela com o assistente nativo de impressão
  abrirEmNovaJanelaEImprimir(htmlConteudo, titulo);
}

export function abrirEmNovaAbaParaImpressao(htmlConteudo: string, titulo: string = 'Documento Oficial COEES - SEDUC-PA') {
  abrirEmNovaJanelaEImprimir(htmlConteudo, titulo);
}
