import { Router } from 'express';
import { foodMenu, foodOrderSettings } from '../data/catalog';
import { createFoodOrder, getFoodOrderByOrderId, listFoodOrders, listFoodOrdersByEmail } from '../lib/food-store';
import { adminAuth } from '../middleware/auth';
import { FoodOrderItem, FoodOrderRecord } from '../types/domain';
import { createFoodOrderReference, createObjectIdLike } from '../utils/ids';

const router = Router();

function buildEstimatedDeliveryTime(deliveryTime: string): string {
  if (deliveryTime && deliveryTime !== 'asap') {
    return deliveryTime;
  }

  const eta = new Date(Date.now() + foodOrderSettings.averageDeliveryMinutes * 60 * 1000);
  return eta.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeItems(items: unknown): FoodOrderItem[] {
  const lookup = new Map(foodMenu.map((item) => [item.id, item]));

  return (Array.isArray(items) ? items : [])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const itemId = String((entry as { itemId?: string }).itemId || '');
      const quantity = Number((entry as { quantity?: number }).quantity) || 0;
      const menuItem = lookup.get(itemId);

      if (!menuItem || quantity <= 0) {
        return null;
      }

      return {
        itemId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        price: menuItem.price,
        quantity,
        total: menuItem.price * quantity
      };
    })
    .filter((item): item is FoodOrderItem => Boolean(item));
}

router.get('/menu', (_req, res) => {
  const categories = [...new Set(foodMenu.map((item) => item.category))];

  res.status(200).json({
    success: true,
    categories,
    menu: foodMenu,
    settings: foodOrderSettings
  });
});

router.post('/orders', (req, res) => {
  const { guestName, guestEmail, guestPhone, roomNumber, deliveryTime, items, notes } = req.body ?? {};

  if (!guestName || !guestEmail || !guestPhone || !roomNumber) {
    res.status(400).json({
      success: false,
      message: 'Please provide guest name, email, phone number, and room number.'
    });
    return;
  }

  const normalizedItems = normalizeItems(items);
  if (normalizedItems.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Please add at least one menu item to your order.'
    });
    return;
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.total, 0);
  const timestamp = new Date().toISOString();
  const order: FoodOrderRecord = {
    id: createObjectIdLike(),
    orderId: createFoodOrderReference(),
    guestName: String(guestName).trim(),
    guestEmail: String(guestEmail).trim().toLowerCase(),
    guestPhone: String(guestPhone).trim(),
    roomNumber: String(roomNumber).trim(),
    deliveryTime: String(deliveryTime || 'asap'),
    estimatedDeliveryTime: buildEstimatedDeliveryTime(String(deliveryTime || 'asap')),
    items: normalizedItems,
    notes: String(notes || '').trim(),
    subtotal,
    deliveryFee: foodOrderSettings.deliveryFee,
    totalAmount: subtotal + foodOrderSettings.deliveryFee,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createFoodOrder(order);

  res.status(201).json({
    success: true,
    message: 'Food order placed successfully',
    order
  });
});

router.get('/orders/email/:email', (req, res) => {
  const orders = listFoodOrdersByEmail(req.params.email);
  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

router.get('/admin/orders', adminAuth, (_req, res) => {
  const orders = listFoodOrders();
  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

router.get('/orders/:orderId', (req, res) => {
  const order = getFoodOrderByOrderId(req.params.orderId);

  if (!order) {
    res.status(404).json({
      success: false,
      message: 'Food order not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    order
  });
});

export default router;
