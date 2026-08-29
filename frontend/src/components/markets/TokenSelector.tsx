import React from 'react';

export interface MarketToken {
  symbol: string;
  decimals: number;
}

interface TokenSelectorProps {
  token: MarketToken;
  className?: string;
}

/**
 * Formats a raw integer amount (as returned by the contract) into a
 * human-readable string using the market's actual token decimals — never
 * a hardcoded default. Uses BigInt math so high-decimal tokens (e.g. 18)
 * don't lose precision to floating point.
 */
export const formatTokenAmount = (rawAmount: string | bigint, token: MarketToken): string => {
  const amount = typeof rawAmount === 'bigint' ? rawAmount : BigInt(rawAmount);
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;

  const divisor = 10n ** BigInt(token.decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;

  const fractionStr =
    token.decimals > 0 ? '.' + fraction.toString().padStart(token.decimals, '0').replace(/0+$/, '') : '';

  const trimmedFraction = fractionStr === '.' ? '' : fractionStr;

  return `${negative ? '-' : ''}${whole.toString()}${trimmedFraction} ${token.symbol}`;
};

/** Displays the settlement token badge for a market, read from market data. */
export const TokenSelector: React.FC<TokenSelectorProps> = ({ token, className = '' }) => {
  return (
    <span
      className={`token-selector ${className}`.trim()}
      title={`${token.decimals} decimals`}
    >
      {token.symbol}
    </span>
  );
};

export default TokenSelector;
