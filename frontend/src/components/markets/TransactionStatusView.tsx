import React from 'react';
import { api, ApiError } from '../../lib/api/public-client';
import { apiCache } from '../../lib/api/cache';
import { LoadingSpinner } from '../LoadingSpinner';
import './TransactionStatusView.css';

/**
 * Shape returned by GET /api/v1/blockchain/tx/{tx_hash}, mirroring
 * `TransactionStatus` in services/api/src/blockchain.rs. `status` is the raw
 * Soroban RPC `getTransaction` status: "SUCCESS" | "FAILED" | "NOT_FOUND".
 */
interface TransactionStatusData {
  hash?: string;
  status: string;
  ledger?: number | null;
  error?: string | null;
  source?: string;
  [key: string]: unknown;
}

const STATUS_SUCCESS = 'SUCCESS';
const STATUS_FAILED = 'FAILED';
const STATUS_NOT_FOUND = 'NOT_FOUND';
const TERMINAL_STATUSES = new Set([STATUS_SUCCESS, STATUS_FAILED]);

const POLL_INTERVAL_MS = 4000;
// After this many consecutive NOT_FOUND polls (~2 minutes) stop waiting and
// treat the hash as unknown/invalid instead of spinning forever (see #1366).
const MAX_POLL_ATTEMPTS = 30;

interface TransactionStatusViewProps {
  txHash: string;
}

export const TransactionStatusView: React.FC<TransactionStatusViewProps> = ({ txHash }) => {
  const [data, setData] = React.useState<TransactionStatusData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const attemptsRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true);

  const stopPolling = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = React.useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // The public client caches GET responses for up to 30 minutes (see
      // cache.ts). Bypass that for polling so each attempt observes fresh
      // chain state instead of replaying the first response forever.
      apiCache.invalidateByPattern(encodeURIComponent(txHash));
      const result = (await api.getTransactionStatus(txHash, controller.signal)) as TransactionStatusData;
      if (!mountedRef.current) return;

      setLoading(false);
      setError(null);
      setData(result);

      if (TERMINAL_STATUSES.has(result.status)) {
        setNotFound(false);
        stopPolling();
        return;
      }

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        // Never resolved after sustained polling — surface this as an
        // unknown/invalid hash rather than an infinite spinner (see #1366).
        setNotFound(true);
        stopPolling();
        return;
      }

      timerRef.current = setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;

      setLoading(false);
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load transaction status.');
    }
  }, [txHash, stopPolling]);

  React.useEffect(() => {
    mountedRef.current = true;
    attemptsRef.current = 0;
    setData(null);
    setLoading(true);
    setNotFound(false);
    setError(null);

    void poll();

    return () => {
      mountedRef.current = false;
      stopPolling();
      controllerRef.current?.abort();
    };
  }, [poll, stopPolling]);

  const handleRetry = () => {
    attemptsRef.current = 0;
    setNotFound(false);
    setError(null);
    setLoading(true);
    void poll();
  };

  const isTerminal = data ? TERMINAL_STATUSES.has(data.status) : false;

  return (
    <section className="tx-status" aria-labelledby="tx-status-heading">
      <h1 id="tx-status-heading">Transaction Status</h1>
      <p className="tx-status__hash" title={txHash}>{txHash}</p>

      {notFound && (
        <div className="tx-status__not-found" role="status">
          <p>We couldn&apos;t find a transaction matching this hash.</p>
          <p>It may not have been submitted yet, or the hash may be invalid.</p>
          <button type="button" className="retry-button" onClick={handleRetry}>
            Check again
          </button>
        </div>
      )}

      {!notFound && error && (
        <div className="tx-status__error" role="alert">
          <p>{error}</p>
          <button type="button" className="retry-button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {!notFound && !error && loading && !data && (
        <div className="tx-status__loading" aria-live="polite">
          <LoadingSpinner aria-label="Loading transaction status" />
        </div>
      )}

      {!notFound && !error && data && (
        <>
          <div
            className={`tx-status__badge tx-status__badge--${data.status.toLowerCase()}`}
            role="status"
            aria-live="polite"
          >
            {data.status === STATUS_SUCCESS && 'Confirmed'}
            {data.status === STATUS_FAILED && 'Failed'}
            {data.status === STATUS_NOT_FOUND && 'Pending confirmation'}
            {![STATUS_SUCCESS, STATUS_FAILED, STATUS_NOT_FOUND].includes(data.status) && data.status}
          </div>

          {data.ledger != null && (
            <p className="tx-status__ledger">Confirmed at ledger {data.ledger}</p>
          )}

          {data.error && <p className="tx-status__error-detail">{data.error}</p>}

          {!isTerminal && (
            <p className="tx-status__polling-note">Checking for updates every few seconds…</p>
          )}
        </>
      )}
    </section>
  );
};
