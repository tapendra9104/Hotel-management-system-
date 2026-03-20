import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { roomCatalog } from '../data/catalog';
import { createObjectIdLike } from '../utils/ids';

fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });

export const db = new DatabaseSync(env.databaseFile);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    amenities_json TEXT NOT NULL,
    image TEXT NOT NULL,
    total_rooms INTEGER NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL UNIQUE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    room_type TEXT NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    number_of_guests INTEGER NOT NULL,
    number_of_rooms INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    special_requests TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spa_bookings (
    id TEXT PRIMARY KEY,
    confirmation_code TEXT NOT NULL UNIQUE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    therapist_preference TEXT NOT NULL,
    add_ons_json TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    add_ons_total INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    special_requests TEXT NOT NULL DEFAULT '',
    allergies TEXT NOT NULL DEFAULT '',
    medical_conditions TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS food_orders (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    room_number TEXT NOT NULL,
    delivery_time TEXT NOT NULL,
    estimated_delivery_time TEXT NOT NULL,
    items_json TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    subtotal INTEGER NOT NULL,
    delivery_fee INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    stripe_customer_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    room_type TEXT NOT NULL,
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER NOT NULL,
    cleanliness INTEGER,
    comfort INTEGER,
    service INTEGER,
    amenities INTEGER,
    value_for_money INTEGER,
    helpful INTEGER NOT NULL DEFAULT 0,
    would_recommend INTEGER NOT NULL DEFAULT 1,
    would_stay_again INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'published',
    visit_type TEXT,
    response_json TEXT,
    guest_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_intent_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_status TEXT NOT NULL DEFAULT 'pending',
    transaction_id TEXT,
    refund_id TEXT,
    paid_at TEXT,
    processed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings (guest_email);
  CREATE INDEX IF NOT EXISTS idx_bookings_room_type ON bookings (room_type);
  CREATE INDEX IF NOT EXISTS idx_spa_bookings_guest_email ON spa_bookings (guest_email);
  CREATE INDEX IF NOT EXISTS idx_spa_bookings_date_time ON spa_bookings (appointment_date, appointment_time);
  CREATE INDEX IF NOT EXISTS idx_food_orders_guest_email ON food_orders (guest_email);
  CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
  CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
  CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
`);

function seedRooms(): void {
  const count = (db.prepare('SELECT COUNT(*) AS count FROM rooms').get() as { count: number }).count;
  if (count > 0) {
    return;
  }

  const statement = db.prepare(`
    INSERT INTO rooms (
      id, name, description, price, capacity, amenities_json, image, total_rooms, available, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  roomCatalog.forEach((room, index) => {
    statement.run(
      createObjectIdLike(),
      room.name,
      room.description,
      room.price,
      room.capacity,
      JSON.stringify(room.amenities || []),
      room.image,
      room.totalRooms,
      room.available ? 1 : 0,
      index,
      now,
      now
    );
  });
}

function seedAdminUser(): void {
  if (!env.adminEmail || !env.adminPassword) {
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(env.adminEmail) as { id?: string } | undefined;
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(env.adminPassword, 10);

  if (existing?.id) {
    db.prepare(`
      UPDATE users
      SET name = ?, password_hash = ?, role = 'admin', updated_at = ?
      WHERE id = ?
    `).run(env.adminName, passwordHash, now, existing.id);
    return;
  }

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, stripe_customer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'admin', NULL, ?, ?)
  `).run(createObjectIdLike(), env.adminName, env.adminEmail, passwordHash, '', now, now);
}

seedRooms();
seedAdminUser();

type SqlParameter = string | number | bigint | Uint8Array | null;

export function all<T>(sql: string, ...params: SqlParameter[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: SqlParameter[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: SqlParameter[]) {
  return db.prepare(sql).run(...params);
}

export function transaction<T>(callback: () => T): T {
  db.exec('BEGIN');

  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
