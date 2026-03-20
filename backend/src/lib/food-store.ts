import { all, get, run } from '../db/database';
import { FoodOrderItem, FoodOrderRecord } from '../types/domain';
import { parseJson } from './sql-helpers';

type FoodOrderRow = {
  id: string;
  order_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_number: string;
  delivery_time: string;
  estimated_delivery_time: string;
  items_json: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapFoodOrder(row: FoodOrderRow): FoodOrderRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    roomNumber: row.room_number,
    deliveryTime: row.delivery_time,
    estimatedDeliveryTime: row.estimated_delivery_time,
    items: parseJson<FoodOrderItem[]>(row.items_json, []),
    notes: row.notes || '',
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createFoodOrder(order: FoodOrderRecord): FoodOrderRecord {
  run(
    `INSERT INTO food_orders (
      id, order_id, guest_name, guest_email, guest_phone, room_number, delivery_time, estimated_delivery_time, items_json, notes, subtotal, delivery_fee, total_amount, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    order.id,
    order.orderId,
    order.guestName,
    order.guestEmail,
    order.guestPhone,
    order.roomNumber,
    order.deliveryTime,
    order.estimatedDeliveryTime,
    JSON.stringify(order.items),
    order.notes,
    order.subtotal,
    order.deliveryFee,
    order.totalAmount,
    order.status,
    order.createdAt,
    order.updatedAt
  );

  return order;
}

export function getFoodOrderByOrderId(orderId: string): FoodOrderRecord | null {
  const row = get<FoodOrderRow>('SELECT * FROM food_orders WHERE order_id = ?', orderId);
  return row ? mapFoodOrder(row) : null;
}

export function listFoodOrdersByEmail(email: string): FoodOrderRecord[] {
  return all<FoodOrderRow>(
    'SELECT * FROM food_orders WHERE lower(guest_email) = lower(?) ORDER BY created_at DESC',
    email
  ).map(mapFoodOrder);
}

export function listFoodOrders(): FoodOrderRecord[] {
  return all<FoodOrderRow>('SELECT * FROM food_orders ORDER BY created_at DESC').map(mapFoodOrder);
}
