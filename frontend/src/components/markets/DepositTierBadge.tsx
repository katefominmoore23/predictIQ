'use client';

import { useEffect, useState } from 'react';
import { getEnvConfig } from '../../lib/env';
import './DepositTierBadge.css';

/**
 * Deposit-tier / reputation display for the market-creation form (#1375).
 *
 * `contracts/predict-iq/src/test_deposit_tier_reputation.rs` proves the
 * contract gates the creation deposit by (tier, reputation): `None` and
 * `Basic` reputation still owe the configured creation deposit, while `Pro`
 * and `Institutional` reputation waive it. Surfacing this *before* the
 * creator submits a signed transaction avoids a wallet failing on-chain for
 * a reason the UI could have explained up front.
 *
 * The read-only contract getter this maps to is
 * `PredictIQClient::get_creator_reputation(creator)` (see
 * `contracts/predict-iq/src/lib.rs`). There is no REST route for it yet in
 * `services/api/openapi.yaml` / `schema.d.ts`, so this component does its
 * own fetch instead of going through `lib/api/{public,admin}-client.ts` —
 * once a `/api/v1/blockchain/users/{address}/reputation`-shaped endpoint
 * lands and is generated into schema.d.ts, this should switch to the typed
 * client like every other blockchain read here.
 */

export type MarketTier = 'Basic' | 'Pro' | 'Institutional';
export type CreatorReputation = 'None' | 'Basic' | 'Pro' | 'Institutional';

export interface DepositTierInfo {
  reputation: CreatorReputation;
  /** Configured creation deposit, in the market's token's smallest unit, as a decimal string. */
  creationDeposit: string;
  /** True when this reputation level waives the creation deposit (Pro / Institutional). */
  depositWaived: boolean;
}

interface DepositTierBadgeProps {
  /** Connected wallet's Stellar address. Renders nothing until this is set. */
  walletAddress: string | null;
  /**
   * Minimum reputation tier required for the action the creator is about to
   * take (e.g. creating a market above a certain stake). When omitted, the
   * badge is purely informational.
   */
  requiredTier?: CreatorReputation;
}

const TIER_RANK: Record<CreatorReputation, number> = {
  None: 0,
  Basic: 1,
  Pro: 2,
  Institutional: 3,
};

const TIER_LABEL: Record<CreatorReputation, string> = {
  None: 'No reputation yet',
  Basic: 'Basic',
  Pro: 'Pro',
  Institutional: 'Institutional',
};

function meetsRequiredTier(current: CreatorReputation, required?: CreatorReputation): boolean {
  if (!required) return true;
  return TIER_RANK[current] >= TIER_RANK[required];
}

async function fetchDepositTierInfo(
  walletAddress: string,
  signal: AbortSignal
): Promise<DepositTierInfo> {
  const base = getEnvConfig().NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(
    `${base}/api/v1/blockchain/users/${encodeURIComponent(walletAddress)}/reputation`,
    { signal }
  );

  if (!res.ok) {
    throw new Error(`Failed to load deposit tier (HTTP ${res.status})`);
  }

  const data = (await res.json()) as Partial<DepositTierInfo>;
  const reputation: CreatorReputation =
    data.reputation && data.reputation in TIER_RANK ? data.reputation : 'None';

  return {
    reputation,
    creationDeposit: data.creationDeposit ?? '0',
    depositWaived: data.depositWaived ?? (reputation === 'Pro' || reputation === 'Institutional'),
  };
}

export function DepositTierBadge({ walletAddress, requiredTier }: DepositTierBadgeProps) {
  const [info, setInfo] = useState<DepositTierInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setInfo(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchDepositTierInfo(walletAddress, controller.signal)
      .then((result) => {
        setInfo(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load deposit tier.');
        setLoading(false);
      });

    return () => controller.abort();
  }, [walletAddress]);

  if (!walletAddress) return null;

  if (loading) {
    return (
      <div className="deposit-tier-badge deposit-tier-badge--loading" role="status" aria-live="polite">
        Checking deposit tier…
      </div>
    );
  }

  if (error) {
    return (
      <div className="deposit-tier-badge deposit-tier-badge--error" role="alert">
        {error}
      </div>
    );
  }

  if (!info) return null;

  const eligible = meetsRequiredTier(info.reputation, requiredTier);

  return (
    <div
      className={`deposit-tier-badge ${eligible ? 'deposit-tier-badge--ok' : 'deposit-tier-badge--blocked'}`}
      role="status"
      aria-live="polite"
    >
      <span className="deposit-tier-badge__tier">{TIER_LABEL[info.reputation]} reputation</span>
      {info.depositWaived ? (
        <span className="deposit-tier-badge__note">Creation deposit waived</span>
      ) : (
        <span className="deposit-tier-badge__note">Creation deposit required: {info.creationDeposit}</span>
      )}
      {!eligible && requiredTier && (
        <p className="deposit-tier-badge__blocked-reason">
          This action requires {TIER_LABEL[requiredTier]} reputation or higher. Your wallet is
          currently {TIER_LABEL[info.reputation]}.
        </p>
      )}
    </div>
  );
}

export default DepositTierBadge;
