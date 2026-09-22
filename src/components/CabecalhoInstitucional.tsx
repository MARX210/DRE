import React from 'react';

interface CabecalhoProps {
  compacto?: boolean;
  className?: string;
  subtitulo?: string;
}

export const CabecalhoInstitucional: React.FC<CabecalhoProps> = ({ 
  compacto = false, 
  className = '',
  subtitulo
}) => {
  return (
    <header 
      id="cabecalho-institucional"
      className={`bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs ${className}`}
    >
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Logo SEDUC Pará */}
          <div className="flex-shrink-0 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-md">
            <img 
              src="/logo-seduc-pa.svg" 
              alt="Logo SEDUC Pará" 
              className={compacto ? 'h-9 w-auto' : 'h-11 w-auto'}
              onError={(e) => {
                // Fallback para PNG se SVG não carregar
                (e.target as HTMLImageElement).src = '/logo-seduc-pa.png';
              }}
            />
          </div>

          {/* Textos Institucionais SEDUC-PA / DRE Altamira */}
          <div className="leading-tight">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
              Secretaria de Estado de Educação — SEDUC
            </h1>
            <h2 className="text-xs sm:text-xs font-bold text-slate-700 tracking-normal">
              Diretoria Regional de Ensino — DRE Altamira
            </h2>
            <p className="text-[11px] sm:text-xs font-semibold text-sky-700">
              Núcleo de Educação Especial (NEE)
            </p>
          </div>
        </div>

        {subtitulo && (
          <div className="text-right hidden sm:block">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
              {subtitulo}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
