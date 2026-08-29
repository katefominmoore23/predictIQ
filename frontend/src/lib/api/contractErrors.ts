/**
 * Shared, action-aware presentation for Soroban contract errors.
 *
 * `getContractErrorMessage` (admin-client.ts) maps a raw contract error code
 * to a generic, action-agnostic message. Several write flows (bet, create,
 * cancel, resolve) all surface error 101 (`NotAuthorized`) but each needs the
 * message to name the specific action the user attempted — without every
 * flow re-implementing its own copy of the error-101 special case.
 *
 * This module is the single place that decides what to show for a contract
 * error in a write flow. Components should call `getWriteActionErrorMessage`
 * (or render `<ApiError>` and pass it through `contractErrorFromApiError`)
 * instead of reading `CONTRACT_ERROR_MESSAGES` directly.
 */

import { ApiError, getContractErrorMessage } from './admin-client';

/** The write flows that route through the shared contract-error presentation. */
export type WriteAction = 'bet' | 'create' | 'cancel' | 'resolve';

const NOT_AUTHORIZED_CODE = 101;

const NOT_AUTHORIZED_MESSAGES: Record<WriteAction, string> = {
  bet: 'You are not authorized to place this bet.',
  create: 'You are not authorized to create this market.',
  cancel: 'You are not authorized to cancel this market.',
  resolve: 'You are not authorized to resolve this market.',
};

/**
 * Returns the display-ready message for a contract error raised while
 * performing `action`. Error 101 gets an action-specific "not authorized"
 * message; every other code falls back to the shared generic mapping so the
 * table in admin-client.ts stays the single source of truth for wording.
 */
export function getWriteActionErrorMessage(code: number, action: WriteAction): string {
  if (code === NOT_AUTHORIZED_CODE) {
    return NOT_AUTHORIZED_MESSAGES[action];
  }
  return getContractErrorMessage(code);
}

/**
 * Pulls the Soroban contract error code out of an `ApiError`, if present.
 * The API surfaces contract errors as `code: "CONTRACT_ERROR"` with the raw
 * numeric code in `details.contract_code`.
 */
export function getContractErrorCode(error: unknown): number | null {
  if (!(error instanceof ApiError)) return null;
  const raw = error.details?.contract_code;
  return typeof raw === 'number' ? raw : null;
}

/**
 * One-stop helper for write-flow catch blocks: given whatever was thrown and
 * the action being attempted, returns the message to show the user. Falls
 * back to the error's own message (or a generic string) for non-contract
 * errors so unrelated failures (network, validation) aren't mislabeled.
 */
export function describeWriteError(error: unknown, action: WriteAction): string {
  const contractCode = getContractErrorCode(error);
  if (contractCode !== null) {
    return getWriteActionErrorMessage(contractCode, action);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/** True when `error` is specifically the shared "not authorized" (101) contract error. */
export function isNotAuthorizedError(error: unknown): boolean {
  return getContractErrorCode(error) === NOT_AUTHORIZED_CODE;
}
