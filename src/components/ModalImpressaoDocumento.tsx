import React, { useState, useEffect, useRef } from 'react';
import { Printer, ExternalLink, X, ZoomIn, ZoomOut, Check, FileText } from 'lucide-react';
import { registrarListenerImpressao, DocumentoImpressaoEvent, abrirEmNovaJanelaEImprimir } from '../lib/documentos/imprimirDocumento';

export const ModalImpressaoDocumento: React.FC = () => {
  const [documento, setDocumento] = useState<DocumentoImpressaoEvent | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [imprimindo, setImprimindo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const desinscrever = registrarListenerImpressao((doc) => {
      setDocumento(doc);
      setZoom(100);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDocumento(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && documento) {
        e.preventDefault();
        handleImprimir();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      desinscrever();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [documento]);

  if (!documento) return null;

  const handleImprimir = () => {
    setImprimindo(true);
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        setTimeout(() => setImprimindo(false), 800);
        return;
      }
    } catch (err) {
      console.warn('Tentativa via iframe falhou, acionando nova janela:', err);
    }

    // Fallback garantido
    abrirEmNovaJanelaEImprimir(documento.html, documento.titulo);
    setTimeout(() => setImprimindo(false), 800);
  };

  const handleAbrirNovaAba = () => {
    abrirEmNovaJanelaEImprimir(documento.html, documento.titulo);
  };

  const handleFechar = () => {
    setDocumento(null);
  };

  return (
    <div 
      id="modal-impressao-documento"
      className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex flex-col justify-between overflow-hidden animate-in fade-in duration-150"
    >
      {/* Barra de Ações Superior (no-print) */}
      <div 
        id="modal-impressao-documento-barra-acoes"
        className="bg-slate-900 text-white px-4 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none print:hidden shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">
                {documento.titulo || 'Documento Oficial COEES / SEDUC-PA'}
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                Padrão A4 Oficial
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Pronto para envio à impressora física ou gravação como arquivo PDF
            </p>
          </div>
        </div>

        {/* Controles de Zoom e Botões de Impressão */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Zoom */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(150, prev + 10))}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão Nova Aba */}
          <button
            type="button"
            onClick={handleAbrirNovaAba}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Abrir este documento em uma nova aba do navegador"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>

          {/* Botão Primário: Disparar Impressora */}
          <button
            type="button"
            onClick={handleImprimir}
            disabled={imprimindo}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 hover:text-black shadow-md shadow-sky-500/20 transition-all transform active:scale-95"
            title="Abrir o assistente de impressão do sistema"
          >
            <Printer className="w-4 h-4" />
            <span>{imprimindo ? 'Enviando...' : 'Imprimir / Salvar PDF'}</span>
          </button>

          {/* Fechar */}
          <button
            type="button"
            onClick={handleFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Fechar pré-visualização (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área de Visualização do Documento (Iframe isolado com zoom) */}
      <div 
        id="modal-impressao-documento-conteudo"
        className="flex-1 bg-slate-800/90 overflow-y-auto p-4 sm:p-8 flex justify-center items-start"
      >
        <div 
          className="bg-white rounded shadow-2xl overflow-hidden transition-transform duration-100 ease-out origin-top border border-slate-300"
          style={{ 
            width: '210mm', 
            minHeight: '297mm',
            transform: `scale(${zoom / 100})`,
            marginBottom: '3rem'
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={documento.html}
            title={documento.titulo}
            className="w-full border-0"
            style={{ 
              height: '350mm',
              display: 'block'
            }}
            onLoad={() => {
              // Tenta ajustar altura interna se possível
              try {
                const doc = iframeRef.current?.contentDocument;
                if (doc && doc.body) {
                  const scrollH = doc.body.scrollHeight;
                  if (scrollH > 1000 && iframeRef.current) {
                    iframeRef.current.style.height = `${scrollH + 40}px`;
                  }
                }
              } catch {}
            }}
          />
        </div>
      </div>
    </div>
  );
};
