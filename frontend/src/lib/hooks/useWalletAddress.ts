import { useEffect, useState } from 'react';

/**
 * Placeholder wallet-connection read used by the cancellation (#1376) and
 * resolution (#1377) UIs to know which address is "connected" for
 * authorization checks (e.g. "only this market's creator may cancel it").
 *
 * There is no wallet-connect integration in the frontend yet — no Freighter
 * / Stellar Wallets Kit dependency, provider, or context exists anywhere in
 * `frontend/src`. Rather than block those two issues on that (separate,
 * larger) piece of work, this reads a `predictiq:wallet_address` key that a
 * future wallet-connect implementation is expected to own and keep in sync
 * (e.g. via `localStorage.setItem('predictiq:wallet_address', publicKey)`
 * on connect / disconnect). Swap this hook's internals for the real
 * provider once that work lands — its return shape is deliberately the
 * minimal `{ address }` so call sites don't need to change.
 */

export const WALLET_ADDRESS_STORAGE_KEY = 'predictiq:wallet_address';

export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function useWalletAddress(): { address: string | null } {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getStoredWalletAddress());

    const onStorage = (event: StorageEvent) => {
      if (event.key === WALLET_ADDRESS_STORAGE_KEY) {
        setAddress(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { address };
}
