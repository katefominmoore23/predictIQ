/**
 * Shared client-side view of the on-chain market state machine
 * (`contracts/predict-iq/src/types.rs::MarketStatus`), used by the
 * cancellation (#1376) and resolution (#1377) UIs to gate their actions
 * the same way the contract does, instead of only discovering an illegal
 * transition after a wallet has already signed and submitted a transaction.
 *
 * `GET /api/v1/blockchain/markets/{market_id}` (see `public-client.ts`)
 * returns the on-chain `Market` struct serialized as JSON; this module reads
 * it defensively (unknown/renamed fields degrade to "action not available"
 * rather than throwing) since its shape isn't yet part of the generated
 * OpenAPI schema.
 */

export type MarketStatus = 'Active' | 'PendingResolution' | 'Disputed' | 'Resolved' | 'Cancelled';

export interface MarketView {
  id: string;
  creator: string;
  status: MarketStatus;
  /** Total amount staked across all outcomes, in the market token's smallest unit. */
  totalStaked: bigint;
  deadline: number;
  resolutionDeadline: number;
}

const KNOWN_STATUSES: MarketStatus[] = [
  'Active',
  'PendingResolution',
  'Disputed',
  'Resolved',
  'Cancelled',
];

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function asBigInt(value: unknown): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.trunc(value));
    if (typeof value === 'string' && value.trim() !== '') return BigInt(value);
  } catch {
    // fall through
  }
  return 0n;
}

function normalizeStatus(value: unknown): MarketStatus | null {
  const raw = asString(value);
  const match = KNOWN_STATUSES.find((s) => s.toLowerCase() === raw.toLowerCase());
  return match ?? null;
}

/**
 * Parses the raw `GET /api/v1/blockchain/markets/{id}` response into a
 * `MarketView`, or `null` if it's missing fields this UI depends on for
 * gating (in which case callers should treat the action as unavailable
 * rather than guess).
 */
export function parseMarketView(raw: unknown): MarketView | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const status = normalizeStatus(obj['status']);
  const creator = asString(obj['creator']);
  const id = asString(obj['id'] ?? obj['market_id']);

  if (!status || !creator || !id) return null;

  return {
    id,
    creator,
    status,
    totalStaked: asBigInt(obj['total_staked'] ?? obj['totalStaked']),
    deadline: asNumber(obj['deadline']),
    resolutionDeadline: asNumber(obj['resolution_deadline'] ?? obj['resolutionDeadline']),
  };
}

export interface GateResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Mirrors `cancel_market_admin` eligibility: only the market's creator (or a
 * platform admin — admin auth isn't wired into the frontend yet, so this
 * checks creator only) may cancel, only while the market is still `Active`,
 * and never once bets are locked in. `total_staked > 0` is used as the
 * "bets locked in" signal, matching the acceptance criterion that cancellation
 * must be blocked once a market has any bets, not merely fail after signing.
 */
export function canCancelMarket(market: MarketView | null, connectedAddress: string | null): GateResult {
  if (!market) return { allowed: false, reason: 'Market data is unavailable.' };
  if (!connectedAddress) return { allowed: false, reason: 'Connect a wallet to manage this market.' };
  if (market.creator !== connectedAddress) {
    return { allowed: false, reason: 'Only this market’s creator can cancel it.' };
  }
  if (market.status !== 'Active') {
    return { allowed: false, reason: `This market is ${market.status.toLowerCase()} and can no longer be cancelled.` };
  }
  if (market.totalStaked > 0n) {
    return { allowed: false, reason: 'This market already has bets locked in and can no longer be cancelled.' };
  }
  return { allowed: true, reason: null };
}

/**
 * Mirrors the resolution state machine: the resolve action is only
 * meaningful once a market has left `Active` and is sitting in
 * `PendingResolution` (closed, oracle/vote result recorded, awaiting the
 * dispute-window finalize call that `POST /markets/{id}/resolve` performs).
 * `Disputed`, `Resolved`, and `Cancelled` markets must not offer an active
 * "resolve" control.
 */
export function canResolveMarket(market: MarketView | null): GateResult {
  if (!market) return { allowed: false, reason: 'Market data is unavailable.' };
  if (market.status !== 'PendingResolution') {
    return {
      allowed: false,
      reason:
        market.status === 'Active'
          ? 'This market has not closed yet and is not eligible for resolution.'
          : `This market is ${market.status.toLowerCase()} and is not eligible for resolution.`,
    };
  }
  return { allowed: true, reason: null };
}
