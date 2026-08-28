import React from 'react';
import './MarketStatusBadge.css';

interface MarketStatusBadgeProps {
  status?: string | null;
  className?: string;
}

type StatusConfig = {
  label: string;
  icon: string;
  colorClass: string;
  ariaLabel: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  Active: {
    label: 'Active',
    icon: '●',
    colorClass: 'status-active',
    ariaLabel: 'Market is active',
  },
  PendingResolution: {
    label: 'Pending Resolution',
    icon: '⧗',
    colorClass: 'status-pending',
    ariaLabel: 'Market is pending resolution',
  },
  Disputed: {
    label: 'Disputed',
    icon: '⚡',
    colorClass: 'status-disputed',
    ariaLabel: 'Market is disputed',
  },
  Resolved: {
    label: 'Resolved',
    icon: '✓',
    colorClass: 'status-resolved',
    ariaLabel: 'Market is resolved',
  },
  Cancelled: {
    label: 'Cancelled',
    icon: '✕',
    colorClass: 'status-cancelled',
    ariaLabel: 'Market is cancelled',
  },
};

const UNKNOWN_STATUS: StatusConfig = {
  label: 'Unknown',
  icon: '?',
  colorClass: 'status-unknown',
  ariaLabel: 'Market status is unknown',
};

export const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config = status && STATUS_MAP[status] ? STATUS_MAP[status] : UNKNOWN_STATUS;

  return (
    <div
      className={`market-status-badge ${config.colorClass} ${className}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <span className="status-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="status-label">{config.label}</span>
    </div>
  );
};
