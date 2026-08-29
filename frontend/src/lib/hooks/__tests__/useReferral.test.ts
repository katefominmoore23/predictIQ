import { renderHook, waitFor } from '@testing-library/react';
import {
  REFERRAL_STORAGE_KEY,
  attachReferralCode,
  captureReferralFromLocation,
  clearStoredReferralCode,
  getStoredReferralCode,
  setStoredReferralCode,
  useReferral,
} from '../useReferral';

function setLocationSearch(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  });
}

describe('useReferral persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLocationSearch('');
  });

  it('returns null when nothing has been captured', () => {
    expect(getStoredReferralCode()).toBeNull();
  });

  it('captures a ref param from the URL and persists it', () => {
    setLocationSearch('?ref=abc123');
    const code = captureReferralFromLocation();

    expect(code).toBe('abc123');
    expect(getStoredReferralCode()).toBe('abc123');
    expect(JSON.parse(window.localStorage.getItem(REFERRAL_STORAGE_KEY)!).code).toBe('abc123');
  });

  it('last-touch-wins: a new ref param overwrites a previously stored one', () => {
    setStoredReferralCode('first-code');
    setLocationSearch('?ref=second-code');

    const code = captureReferralFromLocation();

    expect(code).toBe('second-code');
    expect(getStoredReferralCode()).toBe('second-code');
  });

  it('does not clear or override the stored code when a later visit has no ref param', () => {
    setStoredReferralCode('sticky-code');
    setLocationSearch(''); // navigated to a page with no ?ref=

    const code = captureReferralFromLocation();

    expect(code).toBe('sticky-code');
    expect(getStoredReferralCode()).toBe('sticky-code');
  });

  it('clearStoredReferralCode removes the persisted code', () => {
    setStoredReferralCode('to-clear');
    clearStoredReferralCode();

    expect(getStoredReferralCode()).toBeNull();
  });

  it('attachReferralCode merges the stored code into a payload', () => {
    setStoredReferralCode('attach-me');

    const payload = attachReferralCode({ market_id: 42 });

    expect(payload).toEqual({ market_id: 42, referral_code: 'attach-me' });
  });

  it('attachReferralCode leaves the payload unchanged when no code is stored', () => {
    const payload = attachReferralCode({ market_id: 42 });

    expect(payload).toEqual({ market_id: 42 });
  });

  it('attachReferralCode does not clobber an explicitly-set referral_code', () => {
    setStoredReferralCode('stored-code');

    const payload = attachReferralCode({ referral_code: 'explicit-code' });

    expect(payload.referral_code).toBe('explicit-code');
  });
});

describe('useReferral hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLocationSearch('');
  });

  it('captures the ref param on mount and exposes it', async () => {
    setLocationSearch('?ref=hook-code');

    const { result } = renderHook(() => useReferral());

    await waitFor(() => {
      expect(result.current.referralCode).toBe('hook-code');
    });
  });

  it('clear() removes the persisted code and resets state', async () => {
    setStoredReferralCode('will-clear');

    const { result } = renderHook(() => useReferral());

    await waitFor(() => {
      expect(result.current.referralCode).toBe('will-clear');
    });

    result.current.clear();

    await waitFor(() => {
      expect(result.current.referralCode).toBeNull();
    });
    expect(getStoredReferralCode()).toBeNull();
  });
});
