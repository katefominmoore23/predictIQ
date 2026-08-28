/**
 * Public-safe subset of the Soroban contract error map for wallet write
 * flows (bet, create, cancel, resolve).
 *
 * The full map (`CONTRACT_ERROR_MESSAGES` in `../api/admin-client`) is
 * intentionally excluded from the public bundle (see that module's header
 * comment and `public-client.test.ts`), so flows reachable from every
 * visitor — like placing a bet — read their base message from here instead.
 *
 * Source of truth: contracts/predict-iq/src/errors.rs
 */

/** Soroban `ErrorCode::InsufficientBalance`. */
export const INSUFFICIENT_BALANCE_CODE = 107;

/** Base message — kept in sync with CONTRACT_ERROR_MESSAGES[107] in admin-client.ts. */
export const INSUFFICIENT_BALANCE_MESSAGE = 'Insufficient balance to complete this transaction.';

/** True when an ApiError's details identify a Soroban InsufficientBalance failure. */
export function isInsufficientBalanceError(details: Record<string, unknown> | undefined): boolean {
  return details?.contract_code === INSUFFICIENT_BALANCE_CODE;
}
