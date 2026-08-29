import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DepositTierBadge } from '../DepositTierBadge';

describe('DepositTierBadge', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('renders nothing when no wallet is connected', () => {
    const { container } = render(<DepositTierBadge walletAddress={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the reputation tier and waiver note once loaded', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reputation: 'Pro', creationDeposit: '0', depositWaived: true }),
    }) as unknown as typeof fetch;

    render(<DepositTierBadge walletAddress="GABC123" />);

    await waitFor(() => {
      expect(screen.getByText(/Pro reputation/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Creation deposit waived/i)).toBeInTheDocument();
  });

  it('explains specifically why a wallet below the required tier is blocked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reputation: 'Basic', creationDeposit: '500', depositWaived: false }),
    }) as unknown as typeof fetch;

    render(<DepositTierBadge walletAddress="GABC123" requiredTier="Pro" />);

    await waitFor(() => {
      expect(
        screen.getByText(/requires Pro reputation or higher/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/currently Basic/i)).toBeInTheDocument();
  });

  it('surfaces a fetch failure instead of failing silently', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    render(<DepositTierBadge walletAddress="GABC123" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load deposit tier/i);
    });
  });
});
