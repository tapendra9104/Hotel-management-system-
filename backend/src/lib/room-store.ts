import { all, get, run } from '../db/database';
import { BookingRecord, RoomRecord } from '../types/domain';

type RoomRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities_json: string;
  image: string;
  total_rooms: number;
  available: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BookingRow = {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms: number;
  total_price: number;
  special_requests: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

function parseAmenities(value: string): string[] {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

function mapRoom(row: RoomRow): RoomRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    capacity: Number(row.capacity),
    amenities: parseAmenities(row.amenities_json),
    image: row.image,
    totalRooms: Number(row.total_rooms),
    available: Boolean(row.available),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    roomType: row.room_type,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    numberOfGuests: Number(row.number_of_guests),
    numberOfRooms: Number(row.number_of_rooms),
    totalPrice: Number(row.total_price),
    specialRequests: row.special_requests || '',
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listRooms(): RoomRecord[] {
  return all<RoomRow>('SELECT * FROM rooms ORDER BY sort_order ASC, name ASC').map(mapRoom);
}

export function getRoomByName(name: string): RoomRecord | null {
  const row = get<RoomRow>('SELECT * FROM rooms WHERE name = ?', name);
  return row ? mapRoom(row) : null;
}

export function getRoomById(id: string): RoomRecord | null {
  const row = get<RoomRow>('SELECT * FROM rooms WHERE id = ?', id);
  return row ? mapRoom(row) : null;
}

export function createRoom(room: RoomRecord): RoomRecord {
  run(
    `INSERT INTO rooms (
      id, name, description, price, capacity, amenities_json, image, total_rooms, available, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    room.id,
    room.name,
    room.description,
    room.price,
    room.capacity,
    JSON.stringify(room.amenities),
    room.image,
    room.totalRooms,
    room.available ? 1 : 0,
    room.sortOrder,
    room.createdAt,
    room.updatedAt
  );

  return room;
}

export function updateRoom(
  id: string,
  updates: Partial<Pick<RoomRecord, 'name' | 'description' | 'price' | 'capacity' | 'amenities' | 'image' | 'available' | 'totalRooms' | 'sortOrder' | 'updatedAt'>>
): RoomRecord | null {
  const existing = getRoomById(id);
  if (!existing) {
    return null;
  }

  const nextRoom: RoomRecord = {
    ...existing,
    ...updates,
    amenities: updates.amenities ? [...updates.amenities] : existing.amenities,
    updatedAt: updates.updatedAt || existing.updatedAt
  };

  run(
    `UPDATE rooms
     SET name = ?, description = ?, price = ?, capacity = ?, amenities_json = ?, image = ?, total_rooms = ?, available = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    nextRoom.name,
    nextRoom.description,
    nextRoom.price,
    nextRoom.capacity,
    JSON.stringify(nextRoom.amenities),
    nextRoom.image,
    nextRoom.totalRooms,
    nextRoom.available ? 1 : 0,
    nextRoom.sortOrder,
    nextRoom.updatedAt,
    id
  );

  return getRoomById(id);
}

export function deleteRoom(id: string): boolean {
  const result = run('DELETE FROM rooms WHERE id = ?', id);
  return Number(result.changes) > 0;
}

export function listBookings(): BookingRecord[] {
  return all<BookingRow>('SELECT * FROM bookings ORDER BY created_at DESC').map(mapBooking);
}

export function getBookingById(id: string): BookingRecord | null {
  const row = get<BookingRow>('SELECT * FROM bookings WHERE id = ?', id);
  return row ? mapBooking(row) : null;
}

export function getBookingByReference(bookingId: string): BookingRecord | null {
  const row = get<BookingRow>('SELECT * FROM bookings WHERE booking_id = ?', bookingId);
  return row ? mapBooking(row) : null;
}

export function getBookingsByEmail(email: string): BookingRecord[] {
  return all<BookingRow>(
    'SELECT * FROM bookings WHERE lower(guest_email) = lower(?) ORDER BY created_at DESC',
    email
  ).map(mapBooking);
}

export function findBookingForGuest(id: string, email: string): BookingRecord | null {
  const row = get<BookingRow>(
    'SELECT * FROM bookings WHERE id = ? AND lower(guest_email) = lower(?)',
    id,
    email
  );

  return row ? mapBooking(row) : null;
}

export function createBooking(booking: BookingRecord): BookingRecord {
  run(
    `INSERT INTO bookings (
      id, booking_id, guest_name, guest_email, guest_phone, room_type, check_in_date, check_out_date, number_of_guests, number_of_rooms, total_price, special_requests, status, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    booking.id,
    booking.bookingId,
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
    booking.roomType,
    booking.checkInDate,
    booking.checkOutDate,
    booking.numberOfGuests,
    booking.numberOfRooms,
    booking.totalPrice,
    booking.specialRequests,
    booking.status,
    booking.paymentStatus,
    booking.createdAt,
    booking.updatedAt
  );

  return booking;
}

export function updateBooking(
  id: string,
  updates: Partial<Pick<BookingRecord, 'status' | 'paymentStatus' | 'updatedAt'>>
): BookingRecord | null {
  const existing = getBookingById(id);
  if (!existing) {
    return null;
  }

  const nextBooking: BookingRecord = {
    ...existing,
    ...updates,
    updatedAt: updates.updatedAt || existing.updatedAt
  };

  run(
    'UPDATE bookings SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?',
    nextBooking.status,
    nextBooking.paymentStatus,
    nextBooking.updatedAt,
    id
  );

  return getBookingById(id);
}

export function deleteBooking(id: string): boolean {
  const result = run('DELETE FROM bookings WHERE id = ?', id);
  return Number(result.changes) > 0;
}

export function getBookingStats(): { totalBookings: number; confirmedBookings: number; pendingBookings: number; totalRevenue: number } {
  const totals = get<{
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
  }>(`
    SELECT
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingBookings,
      SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END) AS totalRevenue
    FROM bookings
  `);

  return {
    totalBookings: Number(totals?.totalBookings || 0),
    confirmedBookings: Number(totals?.confirmedBookings || 0),
    pendingBookings: Number(totals?.pendingBookings || 0),
    totalRevenue: Number(totals?.totalRevenue || 0)
  };
}

