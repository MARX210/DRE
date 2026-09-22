import React from 'react';
import { StatusAtendimento } from '../types';
import { STATUS_SEMAFORO_CONFIG } from '../lib/status';

interface StatusBadgeProps {
  status: StatusAtendimento;
  tamanho?: 'sm' | 'md' | 'lg';
  mostrarIcone?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  tamanho = 'md',
  mostrarIcone = true,
  className = '',
}) => {
  const config = STATUS_SEMAFORO_CONFIG[status] || STATUS_SEMAFORO_CONFIG.nao_se_aplica;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[tamanho];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[tamanho];

  return (
    <span
      id={`status-badge-${status}`}
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap transition-colors ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses} ${className}`}
      title={config.descricao}
      role="status"
      aria-label={config.label}
    >
      {mostrarIcone && <Icon className={`${iconSizes} flex-shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};
