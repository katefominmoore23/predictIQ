import React from 'react';
import './PayoutSummary.css';

/**
 * Soroban `PayoutMode` (contracts/predict-iq/src/types.rs):
 *  - "push": the contract distributes to all winners automatically.
 *  - "pull": winners claim their payout individually.
 *
 * `test_payout_mode_immutability.rs` proves this is fixed at market
 * creation and can never change afterwards — the UI must not imply
 * otherwise, so this component renders read-only with no edit affordance.
 */
export type PayoutMode = 'push' | 'pull';

export interface PayoutOutcomeSummary {
  index: number;
  label: string;
  /** Payout amount for this outcome, in the market token's base units. */
  amount: string | number;
  isWinningOutcome: boolean;
}

export interface PayoutSummaryData {
  payoutMode: PayoutMode;
  outcomes: PayoutOutcomeSummary[];
  tokenSymbol?: string;
}

interface PayoutSummaryProps {
  summary: PayoutSummaryData;
  className?: string;
}

const MODE_LABEL: Record<PayoutMode, string> = {
  push: 'Push payout',
  pull: 'Pull payout',
};

const MODE_DESCRIPTION: Record<PayoutMode, string> = {
  push: 'Winnings were distributed automatically to all winners when this market resolved.',
  pull: 'Winners claim their payout individually from the contract.',
};

/**
 * Read-only display of a resolved market's payout mode and per-outcome
 * payout amounts. There is intentionally no control here (or anywhere else
 * in the UI) that could suggest payout mode is editable post-resolution,
 * for any user including admins/creators (see #1368).
 */
export const PayoutSummary: React.FC<PayoutSummaryProps> = ({ summary, className }) => (
  <section className={`payout-summary ${className ?? ''}`} aria-labelledby="payout-summary-heading">
    <h2 id="payout-summary-heading">Payout</h2>

    <div className="payout-summary__mode">
      <span className="payout-summary__mode-badge" data-mode={summary.payoutMode}>
        {MODE_LABEL[summary.payoutMode]}
      </span>
      <p className="payout-summary__mode-desc">{MODE_DESCRIPTION[summary.payoutMode]}</p>
    </div>

    <ul className="payout-summary__outcomes">
      {summary.outcomes.map((outcome) => (
        <li
          key={outcome.index}
          className={`payout-summary__outcome ${outcome.isWinningOutcome ? 'payout-summary__outcome--winner' : ''}`}
        >
          <span className="payout-summary__outcome-label">
            {outcome.label}
            {outcome.isWinningOutcome && (
              <span className="payout-summary__winner-tag">Winning outcome</span>
            )}
          </span>
          <span className="payout-summary__outcome-amount">
            {outcome.amount}
            {summary.tokenSymbol ? ` ${summary.tokenSymbol}` : ''}
          </span>
        </li>
      ))}
    </ul>

    <p className="payout-summary__immutability-note">
      The payout mode is fixed when a market is created and cannot be changed after resolution.
    </p>
  </section>
);
