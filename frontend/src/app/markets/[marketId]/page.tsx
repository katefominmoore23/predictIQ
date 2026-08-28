'use client';

import React from 'react';
import { useAsync } from '../../../lib/hooks/useAsync';
import { api, ApiError } from '../../../lib/api/public-client';
import { MarketStatusBadge } from '../../../components/markets/MarketStatusBadge';
import { Tabs } from '../../../components/Tabs';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import './page.css';

interface MarketDetailProps {
  params: Promise<{ marketId: string }>;
}

interface MarketData {
  market_id?: number;
  title?: string;
  status?: string;
  onchain_volume?: string;
  resolved_outcome?: number | null;
  ledger?: number;
  source?: string;
  [key: string]: unknown;
}

export default function MarketDetailPage({ params }: MarketDetailProps) {
  const [marketId, setMarketId] = React.useState<string | null>(null);
  const [isNotFound, setIsNotFound] = React.useState(false);

  React.useEffect(() => {
    params.then(({ marketId }) => {
      setMarketId(marketId);
    });
  }, [params]);

  const fetchMarketData = React.useCallback(
    (signal: AbortSignal) => {
      if (!marketId) return Promise.reject(new Error('Market ID not available'));
      return api.getBlockchainMarket(marketId, signal);
    },
    [marketId]
  );

  const { data, loading, error, execute } = useAsync<MarketData>(
    fetchMarketData,
    { immediate: !!marketId }
  );

  React.useEffect(() => {
    if (error && error instanceof ApiError) {
      if (error.status === 404 || error.code === 'NOT_FOUND') {
        setIsNotFound(true);
      }
    }
  }, [error]);

  if (!marketId) {
    return (
      <main className="market-detail-page">
        <LoadingSpinner size="large" aria-label="Loading market details" />
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="market-detail-page">
        <div className="market-not-found" role="alert">
          <div className="not-found-content">
            <h1>Market Not Found</h1>
            <p>The market you're looking for doesn't exist or has been removed.</p>
            <a href="/markets" className="back-link">
              ← Back to Markets
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (loading && !data) {
    return (
      <main className="market-detail-page">
        <div className="loading-state">
          <LoadingSpinner size="large" aria-label="Loading market details" />
          <p>Loading market details...</p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="market-detail-page">
        <div className="error-state" role="alert">
          <h2>Error Loading Market</h2>
          <p>{error.message}</p>
          <button onClick={execute} className="retry-button">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="market-detail-page">
        <div className="error-state" role="alert">
          <h2>No Data Available</h2>
          <p>Could not retrieve market information.</p>
          <button onClick={execute} className="retry-button">
            Retry
          </button>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'bets', label: 'Bets', icon: '🎯' },
    { id: 'oracle', label: 'Oracle', icon: '🔮' },
    { id: 'activity', label: 'Activity', icon: '📊' },
  ];

  return (
    <main className="market-detail-page">
      <div className="market-header">
        <div className="market-title-section">
          <h1>{data.title || `Market #${marketId}`}</h1>
          <MarketStatusBadge status={data.status} />
        </div>
        <a href="/markets" className="back-link">
          ← Back to Markets
        </a>
      </div>

      <Tabs tabs={tabs} defaultTab="overview">
        {/* Overview Tab */}
        <section className="tab-content overview-content" aria-labelledby="tab-overview">
          <div className="market-details-grid">
            <div className="detail-card">
              <h3>Market Status</h3>
              <p className="detail-value">{data.status || 'Unknown'}</p>
            </div>
            <div className="detail-card">
              <h3>On-Chain Volume</h3>
              <p className="detail-value">{data.onchain_volume || 'N/A'}</p>
            </div>
            {data.resolved_outcome !== undefined && data.resolved_outcome !== null && (
              <div className="detail-card">
                <h3>Resolved Outcome</h3>
                <p className="detail-value">Option {data.resolved_outcome}</p>
              </div>
            )}
            <div className="detail-card">
              <h3>Ledger</h3>
              <p className="detail-value">{data.ledger || 'N/A'}</p>
            </div>
            {data.source && (
              <div className="detail-card">
                <h3>Data Source</h3>
                <p className="detail-value capitalize">{data.source}</p>
              </div>
            )}
          </div>
        </section>

        {/* Bets Tab */}
        <section className="tab-content bets-content" aria-labelledby="tab-bets">
          <div className="coming-soon">
            <p>Bet information coming soon</p>
          </div>
        </section>

        {/* Oracle Tab */}
        <section className="tab-content oracle-content" aria-labelledby="tab-oracle">
          <div className="coming-soon">
            <p>Oracle information coming soon</p>
          </div>
        </section>

        {/* Activity Tab */}
        <section className="tab-content activity-content" aria-labelledby="tab-activity">
          <div className="coming-soon">
            <p>Activity information coming soon</p>
          </div>
        </section>
      </Tabs>
    </main>
  );
}
