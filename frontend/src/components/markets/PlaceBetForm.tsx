'use client';

import React from 'react';
import { api, ApiError } from '../../lib/api/public-client';
import { useWallet, WALLET_NOT_INSTALLED } from '../../lib/wallet/WalletProvider';
import './PlaceBetForm.css';

export interface MarketOutcome {
  index: number;
  label: string;
}

export interface BetMarket {
  id: number | string;
  title: string;
  outcomes: MarketOutcome[];
}

interface PlaceBetFormProps {
  market: BetMarket;
  /** Called after the bet's transaction is submitted (still pending). */
  onSubmitted?: (result: { txHash: string; outcome: number; amount: string }) => void;
}

const TX_POLL_INTERVAL_MS = 2000;
const TX_POLL_MAX_ATTEMPTS = 10;

export const PlaceBetForm: React.FC<PlaceBetFormProps> = ({ market, onSubmitted }) => {
  const wallet = useWallet();
  const [selectedOutcome, setSelectedOutcome] = React.useState<number | null>(
    market.outcomes[0]?.index ?? null
  );
  const [amount, setAmount] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [txHash, setTxHash] = React.useState<string | null>(null);
  const [txStatus, setTxStatus] = React.useState<string | null>(null);

  // Poll the submitted transaction until it leaves the "pending" state.
  React.useEffect(() => {
    if (!txHash || txStatus !== 'pending') return undefined;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const status = await api.getTransactionStatus(txHash);
        const nextStatus = (status as { status?: string })?.status;
        if (!cancelled && nextStatus) setTxStatus(nextStatus);
      } catch {
        // Transient — the interval below retries.
      }
      if (!cancelled && attempts < TX_POLL_MAX_ATTEMPTS) {
        timer = setTimeout(poll, TX_POLL_INTERVAL_MS);
      }
    };

    let timer = setTimeout(poll, TX_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [txHash, txStatus]);

  const validate = (): string | null => {
    if (selectedOutcome === null) return 'Choose an outcome to bet on.';
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      return 'Enter an amount greater than 0.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // No connected wallet yet — trigger the connect flow inline instead of
    // silently failing or leaving the button disabled with no explanation.
    if (!wallet.address) {
      await wallet.connect();
      return;
    }

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setTxHash(null);
    setTxStatus(null);

    try {
      const result = await api.placeBet(market.id, {
        wallet: wallet.address,
        outcome: selectedOutcome as number,
        amount,
      });
      setTxHash(result.tx_hash);
      setTxStatus(result.status);
      onSubmitted?.({ txHash: result.tx_hash, outcome: selectedOutcome as number, amount });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to submit your bet. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isNotInstalled = !wallet.address && wallet.error === WALLET_NOT_INSTALLED;

  return (
    <form className="place-bet-form" aria-labelledby="place-bet-heading" onSubmit={handleSubmit}>
      <h3 id="place-bet-heading">Place a bet</h3>

      {isNotInstalled && (
        <p className="place-bet-form__install-prompt" role="alert">
          No Stellar wallet extension detected.{' '}
          <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
            Install Freighter
          </a>{' '}
          to place a bet.
        </p>
      )}

      {!wallet.address && !isNotInstalled && (
        <p className="place-bet-form__hint">Connect your wallet to place a bet on this market.</p>
      )}

      {wallet.address && (
        <p className="place-bet-form__connected">
          Connected: {wallet.address.slice(0, 4)}…{wallet.address.slice(-4)}
        </p>
      )}

      <fieldset disabled={submitting}>
        <legend>Outcome</legend>
        <div className="place-bet-form__outcomes" role="radiogroup" aria-label="Outcome">
          {market.outcomes.map((outcome) => (
            <label key={outcome.index} className="place-bet-form__outcome">
              <input
                type="radio"
                name="outcome"
                value={outcome.index}
                checked={selectedOutcome === outcome.index}
                onChange={() => setSelectedOutcome(outcome.index)}
              />
              {outcome.label}
            </label>
          ))}
        </div>

        <label htmlFor="bet-amount" className="place-bet-form__amount-label">
          Amount
        </label>
        <input
          id="bet-amount"
          name="amount"
          type="number"
          min="0"
          step="0.0000001"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
      </fieldset>

      {formError && (
        <p className="place-bet-form__error" role="alert">
          {formError}
        </p>
      )}

      {wallet.error && wallet.error !== WALLET_NOT_INSTALLED && (
        <p className="place-bet-form__error" role="alert">
          {wallet.error}
        </p>
      )}

      {txHash && (
        <p className="place-bet-form__status" role="status">
          Bet submitted ({txStatus ?? 'pending'}). Transaction: {txHash.slice(0, 10)}…
        </p>
      )}

      <button type="submit" disabled={submitting || wallet.isConnecting}>
        {!wallet.address
          ? wallet.isConnecting
            ? 'Connecting…'
            : 'Connect Wallet'
          : submitting
            ? 'Placing Bet…'
            : 'Place Bet'}
      </button>
    </form>
  );
};
