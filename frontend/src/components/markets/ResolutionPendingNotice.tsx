import React from 'react';
import './ResolutionPendingNotice.css';

interface ResolutionPendingNoticeProps {
  className?: string;
}

/**
 * Informational state for payout/claim UI when a market hasn't resolved yet
 * (Soroban contract error 147, `MarketNotResolved`). This is a normal,
 * expected state for any market before resolution — not an exceptional
 * failure — so it uses `role="status"` (polite) rather than `role="alert"`,
 * and gold/informational styling rather than red/danger styling, so it
 * doesn't alarm users on every unresolved market (see #1369).
 */
export const ResolutionPendingNotice: React.FC<ResolutionPendingNoticeProps> = ({ className }) => (
  <div className={`resolution-pending ${className ?? ''}`} role="status">
    <span className="resolution-pending__icon" aria-hidden="true">⏳</span>
    <div>
      <p className="resolution-pending__title">Resolution pending</p>
      <p className="resolution-pending__desc">
        This market hasn&apos;t been resolved yet, so payout details aren&apos;t available.
        Check back after the market resolves.
      </p>
    </div>
  </div>
);
