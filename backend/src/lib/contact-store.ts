import { all, get, run } from '../db/database';
import { ContactRecord } from '../types/domain';

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapContact(row: ContactRow): ContactRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createContact(contact: ContactRecord): ContactRecord {
  run(
    `INSERT INTO contacts (id, name, email, phone, subject, message, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    contact.id,
    contact.name,
    contact.email,
    contact.phone,
    contact.subject,
    contact.message,
    contact.status,
    contact.createdAt,
    contact.updatedAt
  );

  return contact;
}

export function listContacts(): ContactRecord[] {
  return all<ContactRow>('SELECT * FROM contacts ORDER BY created_at DESC').map(mapContact);
}

export function getContactById(id: string): ContactRecord | null {
  const row = get<ContactRow>('SELECT * FROM contacts WHERE id = ?', id);
  return row ? mapContact(row) : null;
}

export function updateContact(id: string, status: string, updatedAt: string): ContactRecord | null {
  run('UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?', status, updatedAt, id);
  return getContactById(id);
}

export function deleteContact(id: string): boolean {
  const result = run('DELETE FROM contacts WHERE id = ?', id);
  return Number(result.changes) > 0;
}

