import { all, get, run } from '../db/database';
import { PaymentRecord } from '../types/domain';

type PaymentRow = {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_intent_id: string;
  status: string;
  provider_status: string;
  transaction_id: string | null;
  refund_id: string | null;
  paid_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  room_type?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  user_name?: string | null;
  user_email?: string | null;
};

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    paymentIntentId: row.payment_intent_id,
    status: row.status,
    providerStatus: row.provider_status,
    transactionId: row.transaction_id,
    refundId: row.refund_id,
    paidAt: row.paid_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    booking: row.room_type && row.check_in_date && row.check_out_date
      ? {
          roomType: row.room_type,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date
        }
      : null,
    user: row.user_name && row.user_email
      ? {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email
        }
      : null
  };
}

export function getPaymentById(id: string): PaymentRecord | null {
  const row = get<PaymentRow>(
    `SELECT p.*, b.room_type, b.check_in_date, b.check_out_date, u.name AS user_name, u.email AS user_email
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`,
    id
  );

  return row ? mapPayment(row) : null;
}

export function getPaymentByIntentId(paymentIntentId: string): PaymentRecord | null {
  const row = get<PaymentRow>('SELECT * FROM payments WHERE payment_intent_id = ?', paymentIntentId);
  return row ? mapPayment(row) : null;
}

export function getCompletedPaymentByBookingId(bookingId: string): PaymentRecord | null {
  const row = get<PaymentRow>(
    `SELECT * FROM payments
     WHERE booking_id = ? AND status IN ('captured', 'succeeded')
     ORDER BY created_at DESC
     LIMIT 1`,
    bookingId
  );

  return row ? mapPayment(row) : null;
}

export function upsertPendingPayment(payment: PaymentRecord): PaymentRecord {
  const existing = get<PaymentRow>('SELECT * FROM payments WHERE booking_id = ?', payment.bookingId);

  if (existing) {
    run(
      `UPDATE payments
       SET amount = ?, payment_method = ?, payment_intent_id = ?, status = ?, provider_status = ?, transaction_id = ?, refund_id = ?, paid_at = ?, processed_at = ?, updated_at = ?
       WHERE booking_id = ?`,
      payment.amount,
      payment.paymentMethod,
      payment.paymentIntentId,
      payment.status,
      payment.providerStatus,
      payment.transactionId,
      payment.refundId,
      payment.paidAt,
      payment.processedAt,
      payment.updatedAt,
      payment.bookingId
    );

    return mapPayment(get<PaymentRow>('SELECT * FROM payments WHERE booking_id = ?', payment.bookingId) as PaymentRow);
  }

  run(
    `INSERT INTO payments (
      id, booking_id, user_id, amount, payment_method, payment_intent_id, status, provider_status, transaction_id, refund_id, paid_at, processed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    payment.id,
    payment.bookingId,
    payment.userId,
    payment.amount,
    payment.paymentMethod,
    payment.paymentIntentId,
    payment.status,
    payment.providerStatus,
    payment.transactionId,
    payment.refundId,
    payment.paidAt,
    payment.processedAt,
    payment.createdAt,
    payment.updatedAt
  );

  return payment;
}

export function capturePayment(paymentIntentId: string, updatedAt: string): PaymentRecord | null {
  run(
    `UPDATE payments
     SET status = 'captured', provider_status = 'succeeded', transaction_id = ?, paid_at = ?, processed_at = ?, updated_at = ?
     WHERE payment_intent_id = ?`,
    paymentIntentId,
    updatedAt,
    updatedAt,
    updatedAt,
    paymentIntentId
  );

  const updated = get<PaymentRow>('SELECT * FROM payments WHERE payment_intent_id = ?', paymentIntentId);
  return updated ? mapPayment(updated) : null;
}

export function refundPayment(paymentId: string, refundId: string, updatedAt: string): PaymentRecord | null {
  run(
    `UPDATE payments
     SET status = 'refunded', provider_status = 'refunded', refund_id = ?, updated_at = ?
     WHERE id = ?`,
    refundId,
    updatedAt,
    paymentId
  );

  return getPaymentById(paymentId);
}

export function listPaymentsForUser(userId: string): PaymentRecord[] {
  return all<PaymentRow>(
    `SELECT p.*, b.room_type, b.check_in_date, b.check_out_date
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    userId
  ).map(mapPayment);
}

export function getPaymentDashboard(): {
  totalRevenue: number;
  todayRevenue: number;
  paymentsByStatus: Array<{ status: string; count: number; amount: number }>;
  paymentMethodStats: Array<{ paymentMethod: string; count: number; amount: number }>;
} {
  const totals = get<{ totalRevenue: number; todayRevenue: number }>(`
    SELECT
      SUM(CASE WHEN status = 'captured' THEN amount ELSE 0 END) AS totalRevenue,
      SUM(CASE WHEN status = 'captured' AND date(created_at) = date('now') THEN amount ELSE 0 END) AS todayRevenue
    FROM payments
  `);

  const paymentsByStatus = all<{ status: string; count: number; amount: number }>(`
    SELECT status, COUNT(*) AS count, SUM(amount) AS amount
    FROM payments
    GROUP BY status
    ORDER BY count DESC
  `).map((row) => ({
    status: row.status,
    count: Number(row.count),
    amount: Number(row.amount || 0)
  }));

  const paymentMethodStats = all<{ payment_method: string; count: number; amount: number }>(`
    SELECT payment_method, COUNT(*) AS count, SUM(amount) AS amount
    FROM payments
    GROUP BY payment_method
    ORDER BY count DESC
  `).map((row) => ({
    paymentMethod: row.payment_method,
    count: Number(row.count),
    amount: Number(row.amount || 0)
  }));

  return {
    totalRevenue: Number(totals?.totalRevenue || 0),
    todayRevenue: Number(totals?.todayRevenue || 0),
    paymentsByStatus,
    paymentMethodStats
  };
}

