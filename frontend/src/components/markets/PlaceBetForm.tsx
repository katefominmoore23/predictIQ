'use client';

import { useState, type FormEvent } from 'react';
import { describeWriteError, isNotAuthorizedError } from '../../lib/api/contractErrors';

export interface PlaceBetFormProps {
  marketId: string | number;
  outcomes: string[];
  /** Submits the signed bet transaction. Rejects with the raw error on failure. */
  onSubmitBet: (params: { marketId: string | number; outcome: string; amount: string }) => Promise<void>;
}

/**
 * Bet-placement form for a market.
 *
 * Error 101 (`NotAuthorized`) is routed through the shared
 * `describeWriteError` helper (frontend/src/lib/api/contractErrors.ts) so the
 * wording matches the same error surfaced by the create/cancel/resolve
 * flows, rather than this component inventing its own copy.
 */
export function PlaceBetForm({ marketId, outcomes, onSubmitBet }: PlaceBetFormProps) {
  const [outcome, setOutcome] = useState(outcomes[0] ?? '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAuthorized, setNotAuthorized] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!outcome || !amount) return;

    setSubmitting(true);
    setError(null);
    setNotAuthorized(false);

    try {
      await onSubmitBet({ marketId, outcome, amount });
      setAmount('');
    } catch (err) {
      setNotAuthorized(isNotAuthorizedError(err));
      setError(describeWriteError(err, 'bet'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="place-bet-form" aria-label="Place a bet">
      <label htmlFor="bet-outcome">Outcome</label>
      <select
        id="bet-outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        disabled={submitting}
      >
        {outcomes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label htmlFor="bet-amount">Amount</label>
      <input
        id="bet-amount"
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={submitting}
        required
      />

      <button type="submit" disabled={submitting || !amount}>
        {submitting ? 'Placing bet…' : 'Place bet'}
      </button>

      {error && (
        <p role="alert" className={notAuthorized ? 'place-bet-form__error--not-authorized' : 'place-bet-form__error'}>
          {error}
        </p>
      )}
    </form>
  );
}

export default PlaceBetForm;
