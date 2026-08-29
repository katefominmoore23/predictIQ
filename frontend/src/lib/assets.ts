/**
 * Platform-supported settlement assets for market creation.
 *
 * Reuses the contract's dual Soroban-token / classic-asset support
 * (contracts/predict-iq/src/test_multi_token.rs,
 * contracts/predict-iq/src/test_classic_assets.rs, via the SAC wrapper in
 * contracts/predict-iq/src/modules/sac.rs): an asset is "supported" only if
 * it appears here, independent of whether it's technically valid on-chain —
 * an asset that is valid on-chain but not on this list must still be
 * rejected client-side rather than left for the contract call to fail.
 */

export type AssetKind = 'soroban_token' | 'classic_asset';

export interface SupportedAsset {
  /** Stable identifier used as the form value and submitted to the API. */
  id: string;
  kind: AssetKind;
  /** Display symbol, e.g. "USDC", "XLM". */
  code: string;
  /** Soroban contract address (soroban_token) or issuing account (classic_asset). */
  address: string;
  label: string;
}

export const SUPPORTED_ASSETS: SupportedAsset[] = [
  {
    id: 'native:XLM',
    kind: 'classic_asset',
    code: 'XLM',
    address: 'native',
    label: 'XLM (Stellar Lumens)',
  },
  {
    id: 'classic:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    kind: 'classic_asset',
    code: 'USDC',
    address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    label: 'USDC (Circle, classic asset)',
  },
  {
    id: 'soroban:PIQ:CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K',
    kind: 'soroban_token',
    code: 'PIQ',
    address: 'CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K',
    label: 'PIQ (PredictIQ token)',
  },
];

export function isSupportedAsset(id: string): boolean {
  return SUPPORTED_ASSETS.some((asset) => asset.id === id);
}

export function getSupportedAsset(id: string): SupportedAsset | undefined {
  return SUPPORTED_ASSETS.find((asset) => asset.id === id);
}
