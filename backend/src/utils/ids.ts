import { randomBytes } from 'node:crypto';

function compactDatePart(date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function createObjectIdLike(): string {
  return randomBytes(12).toString('hex');
}

export function createBookingReference(): string {
  return `BK-${compactDatePart()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function createSpaConfirmationCode(): string {
  return `SPA-${compactDatePart()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function createFoodOrderReference(): string {
  return `FD-${compactDatePart()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function createPaymentIntentReference(): string {
  return `pi_${Date.now().toString(36)}_${randomBytes(5).toString('hex')}`;
}

export function createRefundReference(): string {
  return `rf_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
}

