import { get, run } from '../db/database';
import { UserRecord } from '../types/domain';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: 'user' | 'admin';
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone || '',
    role: row.role,
    stripeCustomerId: row.stripe_customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function findUserByEmail(email: string): UserRecord | null {
  const row = get<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', email);
  return row ? mapUser(row) : null;
}

export function getUserById(id: string): UserRecord | null {
  const row = get<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ? mapUser(row) : null;
}

export function createUser(user: UserRecord): UserRecord {
  run(
    `INSERT INTO users (id, name, email, password_hash, phone, role, stripe_customer_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    user.id,
    user.name,
    user.email,
    user.passwordHash,
    user.phone,
    user.role,
    user.stripeCustomerId,
    user.createdAt,
    user.updatedAt
  );

  return user;
}

export function updateUserStripeCustomerId(id: string, stripeCustomerId: string, updatedAt: string): UserRecord | null {
  run('UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?', stripeCustomerId, updatedAt, id);
  return getUserById(id);
}

