import { canCancelMarket, canResolveMarket, parseMarketView, type MarketView } from '../marketState';

const CREATOR = 'GCREATOR000000000000000000000000000000000000000000000';
const OTHER = 'GOTHER0000000000000000000000000000000000000000000000';

function market(overrides: Partial<MarketView> = {}): MarketView {
  return {
    id: '1',
    creator: CREATOR,
    status: 'Active',
    totalStaked: 0n,
    deadline: 0,
    resolutionDeadline: 0,
    ...overrides,
  };
}

describe('parseMarketView', () => {
  it('returns null for a non-object payload', () => {
    expect(parseMarketView(null)).toBeNull();
    expect(parseMarketView('nope')).toBeNull();
  });

  it('returns null when the status is unrecognized', () => {
    expect(parseMarketView({ id: '1', creator: CREATOR, status: 'Whatever' })).toBeNull();
  });

  it('parses a well-formed snake_case on-chain payload', () => {
    const view = parseMarketView({
      id: '7',
      creator: CREATOR,
      status: 'PendingResolution',
      total_staked: '5000',
      deadline: 100,
      resolution_deadline: 200,
    });

    expect(view).toEqual({
      id: '7',
      creator: CREATOR,
      status: 'PendingResolution',
      totalStaked: 5000n,
      deadline: 100,
      resolutionDeadline: 200,
    });
  });
});

describe('canCancelMarket', () => {
  it('blocks when there is no market data', () => {
    expect(canCancelMarket(null, CREATOR).allowed).toBe(false);
  });

  it('blocks when no wallet is connected', () => {
    expect(canCancelMarket(market(), null).allowed).toBe(false);
  });

  it('blocks a wallet that is not the creator', () => {
    const result = canCancelMarket(market(), OTHER);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/creator/i);
  });

  it('allows the creator to cancel an active market with no bets', () => {
    expect(canCancelMarket(market(), CREATOR)).toEqual({ allowed: true, reason: null });
  });

  it('blocks cancellation once the market is no longer Active', () => {
    const result = canCancelMarket(market({ status: 'PendingResolution' }), CREATOR);
    expect(result.allowed).toBe(false);
  });

  it('blocks cancellation once bets are locked in, not merely after signing', () => {
    const result = canCancelMarket(market({ totalStaked: 1000n }), CREATOR);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/bets locked in/i);
  });
});

describe('canResolveMarket', () => {
  it('blocks when there is no market data', () => {
    expect(canResolveMarket(null).allowed).toBe(false);
  });

  it('hides the resolve control for a market that has not closed yet', () => {
    const result = canResolveMarket(market({ status: 'Active' }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not closed/i);
  });

  it('allows resolution once a market is PendingResolution', () => {
    expect(canResolveMarket(market({ status: 'PendingResolution' }))).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it('hides the resolve control for an already-resolved market', () => {
    const result = canResolveMarket(market({ status: 'Resolved' }));
    expect(result.allowed).toBe(false);
  });

  it('hides the resolve control for a cancelled market', () => {
    const result = canResolveMarket(market({ status: 'Cancelled' }));
    expect(result.allowed).toBe(false);
  });

  it('hides the resolve control for a disputed market', () => {
    const result = canResolveMarket(market({ status: 'Disputed' }));
    expect(result.allowed).toBe(false);
  });
});
