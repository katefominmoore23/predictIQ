/**
 * Client-side validation for the market-creation form
 * (frontend/src/app/markets/create/page.tsx).
 *
 * Kept separate from the page component so it can be extended independently
 * as later issues layer on more rules (outcome-count/duplicate checks,
 * settlement-asset validation) without growing the component itself.
 */

import { z } from 'zod';

// Mirrors the contract's supported outcome-count range
// (contracts/predict-iq/src/types.rs: MAX_OUTCOMES_PER_MARKET) plus a
// minimum of 2, since a market needs at least two distinct outcomes to be
// meaningful. Validating this client-side avoids a wasted, gas-costing
// failed transaction (#1372).
export const MIN_OUTCOMES = 2;
export const MAX_OUTCOMES = 100;

/**
 * Two outcome labels are considered duplicates if they're equal once
 * surrounding whitespace is trimmed and case is normalized — e.g. "Yes",
 * " yes ", and "YES" all collide.
 */
function normalizeOutcome(label: string): string {
  return label.trim().toLowerCase();
}

export function hasDuplicateOutcome(outcomes: string[]): boolean {
  const seen = new Set<string>();
  for (const outcome of outcomes) {
    const normalized = normalizeOutcome(outcome);
    if (seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}

export const marketFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(2000, 'Description must be 2000 characters or fewer.'),
  outcomes: z
    .array(z.string().trim().min(1, 'Outcome labels cannot be empty.'))
    .min(MIN_OUTCOMES, `At least ${MIN_OUTCOMES} outcomes are required.`)
    .max(MAX_OUTCOMES, `A market can have at most ${MAX_OUTCOMES} outcomes.`)
    .refine((outcomes) => !hasDuplicateOutcome(outcomes), {
      message: 'Outcome labels must be unique (case and whitespace insensitive).',
    }),
  closeTime: z
    .string()
    .min(1, 'Close time is required.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Close time must be a valid date.')
    .refine(
      (value) => Date.parse(value) > Date.now(),
      'Close time must be in the future.'
    ),
});

export type MarketFormValues = z.infer<typeof marketFormSchema>;

export type MarketFormErrors = Partial<Record<keyof MarketFormValues | 'form', string>>;

/**
 * Validates raw form state and returns a flat map of the first error per
 * field, keyed the same way the form renders inline errors. Returns an empty
 * object when the form is valid.
 */
export function validateMarketForm(values: MarketFormValues): MarketFormErrors {
  const result = marketFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: MarketFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof MarketFormValues | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
