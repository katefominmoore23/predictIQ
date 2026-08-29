/**
 * CSRF token handling for cookie-authenticated mutation requests (#1417).
 *
 * Wallet-signed transaction submissions are self-authenticating and never
 * carry a session cookie, so they don't need this. Admin requests currently
 * authenticate via `X-Api-Key`, which a forged cross-site request can't
 * attach either (see services/api/src/csrf.rs). This module only matters
 * once a request is riding on a browser-managed session cookie — it reads
 * the double-submit `csrf_token` cookie proxy.ts issues and echoes it back
 * as a header, and lets the caller distinguish an expired/missing token
 * (ask the user to retry) from any other 403.
 */

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Reads a cookie value by name from `document.cookie`. Returns undefined outside a browser. */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/**
 * True when this browser session is riding on a cookie-based session (i.e.
 * proxy.ts has issued a CSRF cookie) rather than API-key or wallet auth.
 */
export function hasCsrfCookie(): boolean {
  return readCookie(CSRF_COOKIE_NAME) !== undefined;
}

/**
 * Returns the CSRF header to attach to a mutation request, or `{}` when the
 * request doesn't need one — either because the method is safe (GET/HEAD) or
 * because no session cookie is present (API-key / wallet-signed requests).
 */
export function csrfHeaders(method: string): HeadersInit {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return {};
  const token = readCookie(CSRF_COOKIE_NAME);
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

/** True for a 403 response whose body signals a stale/expired CSRF token, not a generic denial. */
export function isCsrfTokenError(status: number, code?: string): boolean {
  return status === 403 && code === 'CSRF_TOKEN_INVALID';
}
