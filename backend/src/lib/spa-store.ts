import { all, get, run } from '../db/database';
import { SpaAddOnSelection, SpaBookingRecord } from '../types/domain';
import { parseJson } from './sql-helpers';

type SpaBookingRow = {
  id: string;
  confirmation_code: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  service_type: string;
  service_id: string;
  service_name: string;
  duration: number;
  appointment_date: string;
  appointment_time: string;
  therapist_preference: string;
  add_ons_json: string;
  base_price: number;
  add_ons_total: number;
  total_price: number;
  special_requests: string;
  allergies: string;
  medical_conditions: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

function mapSpaBooking(row: SpaBookingRow): SpaBookingRecord {
  return {
    id: row.id,
    confirmationCode: row.confirmation_code,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    serviceType: row.service_type,
    serviceId: row.service_id,
    serviceName: row.service_name,
    duration: Number(row.duration),
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    therapistPreference: row.therapist_preference,
    addOns: parseJson<SpaAddOnSelection[]>(row.add_ons_json, []),
    basePrice: Number(row.base_price),
    addOnsTotal: Number(row.add_ons_total),
    totalPrice: Number(row.total_price),
    specialRequests: row.special_requests || '',
    allergies: row.allergies || '',
    medicalConditions: row.medical_conditions || '',
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listSpaBookings(): SpaBookingRecord[] {
  return all<SpaBookingRow>('SELECT * FROM spa_bookings ORDER BY appointment_date ASC, appointment_time ASC').map(mapSpaBooking);
}

export function getSpaBookingById(id: string): SpaBookingRecord | null {
  const row = get<SpaBookingRow>('SELECT * FROM spa_bookings WHERE id = ?', id);
  return row ? mapSpaBooking(row) : null;
}

export function getSpaBookingByConfirmationCode(confirmationCode: string): SpaBookingRecord | null {
  const row = get<SpaBookingRow>('SELECT * FROM spa_bookings WHERE confirmation_code = ?', confirmationCode);
  return row ? mapSpaBooking(row) : null;
}

export function getSpaBookingsByEmail(email: string): SpaBookingRecord[] {
  return all<SpaBookingRow>(
    'SELECT * FROM spa_bookings WHERE lower(guest_email) = lower(?) ORDER BY appointment_date ASC, appointment_time ASC',
    email
  ).map(mapSpaBooking);
}

export function createSpaBooking(booking: SpaBookingRecord): SpaBookingRecord {
  run(
    `INSERT INTO spa_bookings (
      id, confirmation_code, guest_name, guest_email, guest_phone, service_type, service_id, service_name, duration, appointment_date, appointment_time, therapist_preference, add_ons_json, base_price, add_ons_total, total_price, special_requests, allergies, medical_conditions, status, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    booking.id,
    booking.confirmationCode,
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
    booking.serviceType,
    booking.serviceId,
    booking.serviceName,
    booking.duration,
    booking.appointmentDate,
    booking.appointmentTime,
    booking.therapistPreference,
    JSON.stringify(booking.addOns),
    booking.basePrice,
    booking.addOnsTotal,
    booking.totalPrice,
    booking.specialRequests,
    booking.allergies,
    booking.medicalConditions,
    booking.status,
    booking.paymentStatus,
    booking.createdAt,
    booking.updatedAt
  );

  return booking;
}

export function updateSpaBooking(
  id: string,
  updates: Partial<Pick<SpaBookingRecord, 'status' | 'paymentStatus' | 'updatedAt'>>
): SpaBookingRecord | null {
  const existing = getSpaBookingById(id);
  if (!existing) {
    return null;
  }

  const nextBooking: SpaBookingRecord = {
    ...existing,
    ...updates,
    updatedAt: updates.updatedAt || existing.updatedAt
  };

  run(
    'UPDATE spa_bookings SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?',
    nextBooking.status,
    nextBooking.paymentStatus,
    nextBooking.updatedAt,
    id
  );

  return getSpaBookingById(id);
}

export function getSpaDashboardStats(): {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  upcomingBookings: SpaBookingRecord[];
} {
  const stats = get<{
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
  }>(`
    SELECT
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingBookings,
      SUM(total_price) AS totalRevenue
    FROM spa_bookings
  `);

  const upcomingBookings = all<SpaBookingRow>(
    `SELECT * FROM spa_bookings
     WHERE status IN ('confirmed', 'pending')
       AND appointment_date >= date('now')
     ORDER BY appointment_date ASC, appointment_time ASC
     LIMIT 10`
  ).map(mapSpaBooking);

  return {
    totalBookings: Number(stats?.totalBookings || 0),
    confirmedBookings: Number(stats?.confirmedBookings || 0),
    pendingBookings: Number(stats?.pendingBookings || 0),
    totalRevenue: Number(stats?.totalRevenue || 0),
    upcomingBookings
  };
}

