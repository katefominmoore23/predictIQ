/**
 * Minimal wallet-connection accessor.
 *
 * The full wallet-connect flow (Freighter / WalletConnect, tx signing, etc.)
 * ships under #77. Until then, forms that must "submit via the wallet" read
 * the connected public key from this single seam so that swapping in the
 * real implementation later touches one file instead of every caller.
 */

const WALLET_STORAGE_KEY = 'predictiq_wallet_address';

/** Returns the connected Stellar public key, or null if no wallet is connected. */
export function getConnectedWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(WALLET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function isWalletConnected(): boolean {
  return getConnectedWalletAddress() !== null;
}
