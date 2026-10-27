import type { PaymentMethod } from '@/types/store';
import { formatMoney } from 'dirk-cfx-react';

/**
 * Money, the way every other dirk screen says it.
 *
 * `formatMoney` owns the grouping and the server's currency symbol, so nothing
 * here re-implements either. The only thing a store adds is that a payment
 * METHOD can carry its own symbol — a crypto method reading ₿ tells the player
 * what they are spending. When it does not, the server's currency answers.
 */
export function money(amount: number, method?: PaymentMethod): string {
  if (method?.symbol) return `${method.symbol}${formatMoney(amount, { symbol: false })}`;
  return formatMoney(amount);
}
