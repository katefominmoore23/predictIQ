import React, { useEffect, useState, useCallback } from 'react';

interface OraclePriceResponse {
  price: string;
  as_of: string; // ISO timestamp
}

interface OraclePriceWidgetProps {
  marketId: string;
  /** Seconds after which a price is considered stale. Defaults to 60s. */
  freshnessThresholdSeconds?: number;
  apiBaseUrl?: string;
}

interface WidgetState {
  price: string | null;
  asOf: Date | null;
  loading: boolean;
  error: string | null;
}

export const OraclePriceWidget: React.FC<OraclePriceWidgetProps> = ({
  marketId,
  freshnessThresholdSeconds = 60,
  apiBaseUrl = '',
}) => {
  const [state, setState] = useState<WidgetState>({
    price: null,
    asOf: null,
    loading: true,
    error: null,
  });

  const fetchPrice = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/blockchain/oracle/${marketId}`);
      if (!res.ok) throw new Error(`Oracle request failed (${res.status})`);
      const data: OraclePriceResponse = await res.json();
      setState({
        price: data.price,
        asOf: new Date(data.as_of),
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        price: null,
        asOf: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load oracle price',
      });
    }
  }, [marketId, apiBaseUrl]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  if (state.loading) {
    return (
      <div className="oracle-price-widget" role="status" aria-live="polite">
        Loading price…
      </div>
    );
  }

  if (state.error || !state.price || !state.asOf) {
    return (
      <div className="oracle-price-widget oracle-price-widget--error" role="alert">
        {state.error ?? 'Oracle price unavailable'}
      </div>
    );
  }

  const ageSeconds = (Date.now() - state.asOf.getTime()) / 1000;
  const isStale = ageSeconds > freshnessThresholdSeconds;

  return (
    <div className="oracle-price-widget">
      <span className="oracle-price-widget__price">{state.price}</span>
      <time
        className="oracle-price-widget__timestamp"
        dateTime={state.asOf.toISOString()}
        title={state.asOf.toISOString()}
      >
        as of {state.asOf.toLocaleString()}
      </time>
      {isStale && (
        <span
          className="oracle-price-widget__badge oracle-price-widget__badge--stale"
          role="status"
          aria-label={`Price is stale, last updated ${Math.round(ageSeconds)} seconds ago`}
        >
          Stale
        </span>
      )}
    </div>
  );
};

export default OraclePriceWidget;
