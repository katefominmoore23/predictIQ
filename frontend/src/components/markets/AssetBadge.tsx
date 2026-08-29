import React from 'react';
import './AssetBadge.css';

/**
 * A market's betting asset comes in two shapes on-chain (see
 * contracts/predict-iq/src/test_classic_assets.rs):
 *  - a Stellar *classic* asset, moved via its Stellar Asset Contract (SAC) —
 *    identified by an asset code + issuer account, not a bespoke contract.
 *  - a native *Soroban* token — identified by its token contract address.
 *
 * Both ultimately settle through the same `token_address` on the market, so
 * the UI can't tell them apart from that address alone; callers must pass
 * the resolved shape explicitly.
 */
export interface ClassicAssetInfo {
  kind: 'classic';
  /** Stellar asset code, e.g. "USDC". */
  code: string;
  /** Issuer account (G...), long-form. */
  issuer: string;
}

export interface SorobanAssetInfo {
  kind: 'soroban';
  /** Display symbol for the Soroban token, e.g. "USDC". */
  symbol: string;
  /** Token contract address (C...), long-form. */
  contractAddress: string;
}

export type MarketAssetInfo = ClassicAssetInfo | SorobanAssetInfo;

interface AssetBadgeProps {
  asset: MarketAssetInfo;
  className?: string;
}

/** Truncates a long Stellar address/issuer to `abcd…wxyz` for compact display. */
function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/**
 * Renders a market's asset, distinguishing a classic Stellar asset (code +
 * issuer) from a Soroban token (symbol + contract address). The two are kept
 * visually distinct — via a kind pill plus differing badge styling — even
 * when their displayed code/symbol looks identical, so users are never
 * ambiguous about which asset they're betting (see #1367).
 */
export const AssetBadge: React.FC<AssetBadgeProps> = ({ asset, className }) => {
  const [copied, setCopied] = React.useState(false);

  const code = asset.kind === 'classic' ? asset.code : asset.symbol;
  const fullAddress = asset.kind === 'classic' ? asset.issuer : asset.contractAddress;
  const addressLabel = asset.kind === 'classic' ? 'Issuer' : 'Contract';

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; the tooltip still
      // exposes the full value, so this is a non-fatal no-op.
    }
  }, [fullAddress]);

  return (
    <span
      className={`asset-badge asset-badge--${asset.kind} ${className ?? ''}`}
      title={`${addressLabel}: ${fullAddress}`}
    >
      <span className="asset-badge__kind">{asset.kind === 'classic' ? 'Classic' : 'Soroban'}</span>
      <span className="asset-badge__code">{code}</span>
      <button
        type="button"
        className="asset-badge__address"
        onClick={handleCopy}
        aria-label={`Copy ${addressLabel.toLowerCase()} address ${fullAddress}`}
      >
        {truncateMiddle(fullAddress)}
        <span className="asset-badge__copy-hint" aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      </button>
    </span>
  );
};
