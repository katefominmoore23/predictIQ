/**
 * Renders the payout outcome for a resolved market.
 *
 * The contract supports resolving a market to more than one winning outcome
 * (a tie), splitting the pool proportionally across all of them — see
 * contracts/predict-iq/src/test_tie_handling.rs. This must be shown
 * distinctly from the single-winner case, and a three-way-or-more tie must
 * render every tied outcome, not just the first two.
 */

export interface WinningOutcome {
  outcomeIndex: number;
  label: string;
  /** This outcome's share of the total payout pool, in [0, 1]. */
  shareOfPool: number;
  /** Amount payable to this outcome's pool, in the market's payout token. */
  payoutAmount: number;
}

export interface PayoutSummaryProps {
  /** All outcomes the market resolved to. Length 1 = single winner; length > 1 = a tie. */
  winningOutcomes: WinningOutcome[];
  tokenSymbol?: string;
}

function formatAmount(amount: number, tokenSymbol?: string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 7 });
  return tokenSymbol ? `${formatted} ${tokenSymbol}` : formatted;
}

function formatPercent(share: number): string {
  return `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export function PayoutSummary({ winningOutcomes, tokenSymbol }: PayoutSummaryProps) {
  if (winningOutcomes.length === 0) {
    return (
      <div className="payout-summary payout-summary--pending">
        <p>This market has not been resolved yet.</p>
      </div>
    );
  }

  const isTie = winningOutcomes.length > 1;

  if (!isTie) {
    const [winner] = winningOutcomes;
    return (
      <div className="payout-summary payout-summary--single-winner">
        <h3>Winning outcome</h3>
        <p className="payout-summary__winner">{winner.label}</p>
        <p className="payout-summary__amount">{formatAmount(winner.payoutAmount, tokenSymbol)}</p>
      </div>
    );
  }

  // Tie: every tied outcome gets a proportional share of the pool. Render
  // all of them — a two-way tie is not the only shape this can take.
  return (
    <div className="payout-summary payout-summary--tie" data-tie-count={winningOutcomes.length}>
      <h3>
        Tied resolution &mdash; {winningOutcomes.length} winning outcomes
      </h3>
      <p className="payout-summary__tie-explainer">
        The pool is split proportionally across all {winningOutcomes.length} tied outcomes.
      </p>
      <ul className="payout-summary__tie-list">
        {winningOutcomes.map((outcome) => (
          <li key={outcome.outcomeIndex} className="payout-summary__tie-item">
            <span className="payout-summary__tie-label">{outcome.label}</span>
            <span className="payout-summary__tie-share">{formatPercent(outcome.shareOfPool)}</span>
            <span className="payout-summary__tie-amount">{formatAmount(outcome.payoutAmount, tokenSymbol)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PayoutSummary;
