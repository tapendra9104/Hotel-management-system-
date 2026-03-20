import { Router } from 'express';
import { getPaymentDashboard, getPaymentById, getCompletedPaymentByBookingId, listPaymentsForUser, upsertPendingPayment, capturePayment, getPaymentByIntentId, refundPayment } from '../lib/payment-store';
import { findBookingForGuest, updateBooking } from '../lib/room-store';
import { updateUserStripeCustomerId } from '../lib/user-store';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { PaymentRecord } from '../types/domain';
import { createObjectIdLike, createPaymentIntentReference, createRefundReference } from '../utils/ids';

const router = Router();

router.get('/admin/dashboard', auth, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access only'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: getPaymentDashboard()
  });
});

router.post('/create-intent', auth, (req: AuthenticatedRequest, res) => {
  const { bookingId, paymentMethod } = req.body ?? {};

  if (!bookingId) {
    res.status(400).json({ success: false, message: 'bookingId is required' });
    return;
  }

  if (!paymentMethod || !req.user) {
    res.status(400).json({ success: false, message: 'paymentMethod is required' });
    return;
  }

  const booking = findBookingForGuest(String(bookingId), req.user.email);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  if (getCompletedPaymentByBookingId(String(bookingId))) {
    res.status(400).json({
      success: false,
      message: 'Payment already completed for this booking'
    });
    return;
  }

  const paymentIntentId = createPaymentIntentReference();
  const timestamp = new Date().toISOString();
  const localCustomerId = `cust_${req.user.id}`;
  const payment: PaymentRecord = {
    id: createObjectIdLike(),
    bookingId: String(bookingId),
    userId: req.user.id,
    amount: booking.totalPrice,
    paymentMethod: String(paymentMethod),
    paymentIntentId,
    status: 'pending',
    providerStatus: 'requires_confirmation',
    transactionId: null,
    refundId: null,
    paidAt: null,
    processedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const savedPayment = upsertPendingPayment(payment);
  updateUserStripeCustomerId(req.user.id, localCustomerId, timestamp);

  res.status(200).json({
    success: true,
    data: {
      clientSecret: `${paymentIntentId}_secret_local`,
      paymentIntentId,
      paymentId: savedPayment.id,
      amount: booking.totalPrice
    }
  });
});

router.post('/confirm', auth, (req: AuthenticatedRequest, res) => {
  const { paymentIntentId, bookingId } = req.body ?? {};

  if (!paymentIntentId || !bookingId || !req.user) {
    res.status(400).json({
      success: false,
      message: !paymentIntentId ? 'paymentIntentId is required' : 'bookingId is required'
    });
    return;
  }

  const booking = findBookingForGuest(String(bookingId), req.user.email);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
    return;
  }

  const payment = getPaymentByIntentId(String(paymentIntentId));
  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment intent not found'
    });
    return;
  }

  const capturedPayment = capturePayment(String(paymentIntentId), new Date().toISOString());
  updateBooking(String(bookingId), {
    paymentStatus: 'paid',
    updatedAt: new Date().toISOString()
  });

  res.status(200).json({
    success: true,
    message: 'Payment confirmed successfully',
    data: {
      paymentId: capturedPayment?.id || payment.id,
      status: capturedPayment?.status || 'captured',
      amount: booking.totalPrice
    }
  });
});

router.get('/:paymentId', auth, (req: AuthenticatedRequest, res) => {
  const payment = getPaymentById(req.params.paymentId);

  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
    return;
  }

  if (payment.userId !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

router.get('/', auth, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    data: listPaymentsForUser(req.user!.id)
  });
});

router.post('/:paymentId/refund', auth, (req: AuthenticatedRequest, res) => {
  const payment = getPaymentById(req.params.paymentId);

  if (!payment) {
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
    return;
  }

  if (payment.userId !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  const refundId = createRefundReference();
  const refundedPayment = refundPayment(req.params.paymentId, refundId, new Date().toISOString());
  updateBooking(payment.bookingId, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    updatedAt: new Date().toISOString()
  });

  res.status(200).json({
    success: true,
    message: 'Refund initiated successfully',
    data: {
      refundId,
      amount: refundedPayment?.amount || payment.amount,
      status: refundedPayment?.status || 'refunded'
    }
  });
});

export default router;
