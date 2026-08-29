/**
 * Fetches a wallet's current native (XLM) balance directly from Horizon.
 *
 * Deliberately bypasses the app's cached API client (`src/lib/api/*`) — the
 * balance shown after an insufficient-balance error must reflect the
 * connected wallet's actual state at the moment of the failed submission,
 * not whatever was cached at page load (see #79).
 */

const HORIZON_URLS: Record<string, string> = {
  PUBLIC: 'https://horizon.stellar.org',
  TESTNET: 'https://horizon-testnet.stellar.org',
  FUTURENET: 'https://horizon-futurenet.stellar.org',
};

const DEFAULT_NETWORK = 'TESTNET';

interface HorizonBalanceEntry {
  asset_type: string;
  balance: string;
}

/**
 * Returns the account's native XLM balance as a decimal string, "0" for an
 * unfunded account, or null if the balance could not be determined.
 */
export async function fetchNativeBalance(
  address: string,
  network: string | null
): Promise<string | null> {
  const base = HORIZON_URLS[(network ?? DEFAULT_NETWORK).toUpperCase()] ?? HORIZON_URLS[DEFAULT_NETWORK];

  try {
    const res = await fetch(`${base}/accounts/${encodeURIComponent(address)}`, { cache: 'no-store' });
    if (res.status === 404) return '0';
    if (!res.ok) return null;

    const data = (await res.json()) as { balances?: HorizonBalanceEntry[] };
    const native = data.balances?.find((entry) => entry.asset_type === 'native');
    return native?.balance ?? null;
  } catch {
    return null;
  }
}
