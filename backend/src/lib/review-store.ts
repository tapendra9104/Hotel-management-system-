import { all, get, run } from '../db/database';
import { ReviewRecord, ReviewResponseRecord } from '../types/domain';
import { clamp, parseJson } from './sql-helpers';

type ReviewRow = {
  id: string;
  booking_id: string;
  user_id: string;
  room_type: string;
  title: string;
  comment: string;
  rating: number;
  cleanliness: number | null;
  comfort: number | null;
  service: number | null;
  amenities: number | null;
  value_for_money: number | null;
  helpful: number;
  would_recommend: number;
  would_stay_again: number;
  status: string;
  visit_type: string | null;
  response_json: string | null;
  guest_name: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  check_in_date?: string | null;
  check_out_date?: string | null;
};

type SqlParameter = string | number | bigint | Uint8Array | null;

function mapReview(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    roomType: row.room_type,
    title: row.title,
    comment: row.comment,
    rating: Number(row.rating),
    cleanliness: row.cleanliness === null ? null : Number(row.cleanliness),
    comfort: row.comfort === null ? null : Number(row.comfort),
    service: row.service === null ? null : Number(row.service),
    amenities: row.amenities === null ? null : Number(row.amenities),
    valueForMoney: row.value_for_money === null ? null : Number(row.value_for_money),
    helpful: Number(row.helpful),
    wouldRecommend: Boolean(row.would_recommend),
    wouldStayAgain: Boolean(row.would_stay_again),
    status: row.status,
    visitType: row.visit_type,
    response: parseJson<ReviewResponseRecord | null>(row.response_json, null),
    guestName: row.guest_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.user_name,
    userEmail: row.user_email,
    booking: row.check_in_date && row.check_out_date
      ? {
          roomType: row.room_type,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date
        }
      : null
  };
}

export function getReviewById(id: string): ReviewRecord | null {
  const row = get<ReviewRow>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email, b.check_in_date, b.check_out_date
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN bookings b ON b.id = r.booking_id
     WHERE r.id = ?`,
    id
  );

  return row ? mapReview(row) : null;
}

export function getReviewByBookingId(bookingId: string): ReviewRecord | null {
  const row = get<ReviewRow>('SELECT * FROM reviews WHERE booking_id = ?', bookingId);
  return row ? mapReview(row) : null;
}

export function createReview(review: ReviewRecord): ReviewRecord {
  run(
    `INSERT INTO reviews (
      id, booking_id, user_id, room_type, title, comment, rating, cleanliness, comfort, service, amenities, value_for_money, helpful, would_recommend, would_stay_again, status, visit_type, response_json, guest_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    review.id,
    review.bookingId,
    review.userId,
    review.roomType,
    review.title,
    review.comment,
    review.rating,
    review.cleanliness,
    review.comfort,
    review.service,
    review.amenities,
    review.valueForMoney,
    review.helpful,
    review.wouldRecommend ? 1 : 0,
    review.wouldStayAgain ? 1 : 0,
    review.status,
    review.visitType,
    review.response ? JSON.stringify(review.response) : null,
    review.guestName,
    review.createdAt,
    review.updatedAt
  );

  return review;
}

export function listPublishedReviews(options: {
  roomType?: string;
  minRating?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}): {
  reviews: ReviewRecord[];
  total: number;
  page: number;
  pages: number;
  limit: number;
} {
  const page = clamp(Number(options.page) || 1, 1, 1000);
  const limit = clamp(Number(options.limit) || 10, 1, 100);
  const offset = (page - 1) * limit;
  const whereParts = ["r.status = 'published'"];
  const params: SqlParameter[] = [];

  if (options.roomType) {
    whereParts.push('r.room_type = ?');
    params.push(options.roomType);
  }

  if (options.minRating) {
    whereParts.push('r.rating >= ?');
    params.push(options.minRating);
  }

  const sortMap: Record<string, string> = {
    latest: 'r.created_at DESC',
    highest: 'r.rating DESC, r.created_at DESC',
    lowest: 'r.rating ASC, r.created_at DESC',
    helpful: 'r.helpful DESC, r.created_at DESC'
  };
  const orderBy = sortMap[options.sortBy || 'latest'] || sortMap.latest;
  const whereSql = whereParts.join(' AND ');
  const totalRow = get<{ count: number }>(`SELECT COUNT(*) AS count FROM reviews r WHERE ${whereSql}`, ...params);

  const reviews = all<ReviewRow>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    ...params
  ).map(mapReview);

  const total = Number(totalRow?.count || 0);

  return {
    reviews,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    limit
  };
}

export function listRoomReviews(roomType: string, options: { limit?: number; sort?: string }): ReviewRecord[] {
  const limit = clamp(Number(options.limit) || 5, 1, 50);
  const orderBy = options.sort === 'rating' ? 'rating DESC, created_at DESC' : 'created_at DESC';

  return all<ReviewRow>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.room_type = ? AND r.status = 'published'
     ORDER BY ${orderBy}
     LIMIT ${limit}`,
    roomType
  ).map(mapReview);
}

export function updateReview(
  id: string,
  updates: {
    title?: string;
    comment?: string;
    rating?: number;
    status?: string;
    response?: ReviewResponseRecord | null;
    updatedAt: string;
  }
): ReviewRecord | null {
  const existing = getReviewById(id);
  if (!existing) {
    return null;
  }

  run(
    `UPDATE reviews
     SET title = ?, comment = ?, rating = ?, status = ?, response_json = ?, updated_at = ?
     WHERE id = ?`,
    updates.title ?? existing.title,
    updates.comment ?? existing.comment,
    updates.rating ?? existing.rating,
    updates.status ?? existing.status,
    updates.response ? JSON.stringify(updates.response) : existing.response ? JSON.stringify(existing.response) : null,
    updates.updatedAt,
    id
  );

  return getReviewById(id);
}

export function incrementReviewHelpful(id: string): ReviewRecord | null {
  run('UPDATE reviews SET helpful = helpful + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', id);
  return getReviewById(id);
}

export function deleteReview(id: string): boolean {
  const result = run('DELETE FROM reviews WHERE id = ?', id);
  return Number(result.changes) > 0;
}
