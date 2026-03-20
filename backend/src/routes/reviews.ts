import { Router } from 'express';
import { findBookingForGuest } from '../lib/room-store';
import {
  createReview,
  deleteReview,
  getReviewByBookingId,
  getReviewById,
  incrementReviewHelpful,
  listPublishedReviews,
  listRoomReviews,
  updateReview
} from '../lib/review-store';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { ReviewRecord } from '../types/domain';
import { createObjectIdLike } from '../utils/ids';

const router = Router();

const roomTypeAliasMap: Record<string, string> = {
  standard: 'Standard Room',
  deluxe: 'Deluxe Room',
  suite: 'Suite'
};

function normalizeRoomType(value: string): string {
  return roomTypeAliasMap[value.trim().toLowerCase()] || value;
}

router.get('/', (req, res) => {
  const roomType = req.query.roomType ? normalizeRoomType(String(req.query.roomType)) : undefined;
  const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
  const result = listPublishedReviews({
    roomType,
    minRating,
    sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  });

  res.status(200).json({
    success: true,
    data: result.reviews,
    pagination: {
      total: result.total,
      page: result.page,
      pages: result.pages,
      limit: result.limit
    }
  });
});

router.get('/room/:roomType', (req, res) => {
  const roomType = normalizeRoomType(req.params.roomType);
  const reviews = listRoomReviews(roomType, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sort: req.query.sort ? String(req.query.sort) : undefined
  });
  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0;

  res.status(200).json({
    success: true,
    data: {
      roomType,
      averageRating,
      totalReviews: reviews.length,
      reviews
    }
  });
});

router.get('/:id', (req, res) => {
  const review = getReviewById(req.params.id);

  if (!review) {
    res.status(404).json({
      success: false,
      message: 'Review not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

router.post('/', auth, (req: AuthenticatedRequest, res) => {
  const { bookingId, rating, title, comment } = req.body ?? {};

  if (!bookingId || !rating || !title || !comment || !req.user) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: bookingId, rating, title, comment'
    });
    return;
  }

  const booking = findBookingForGuest(String(bookingId), req.user.email);
  if (!booking) {
    res.status(403).json({
      success: false,
      message: 'Invalid booking or unauthorized'
    });
    return;
  }

  if (getReviewByBookingId(String(bookingId))) {
    res.status(400).json({
      success: false,
      message: 'You have already reviewed this booking'
    });
    return;
  }

  const timestamp = new Date().toISOString();
  const review: ReviewRecord = {
    id: createObjectIdLike(),
    bookingId: String(bookingId),
    userId: req.user.id,
    roomType: booking.roomType,
    title: String(title).trim(),
    comment: String(comment).trim(),
    rating: Number(rating),
    cleanliness: req.body?.cleanliness !== undefined ? Number(req.body.cleanliness) : null,
    comfort: req.body?.comfort !== undefined ? Number(req.body.comfort) : null,
    service: req.body?.service !== undefined ? Number(req.body.service) : null,
    amenities: req.body?.amenities !== undefined ? Number(req.body.amenities) : null,
    valueForMoney: req.body?.valueForMoney !== undefined ? Number(req.body.valueForMoney) : null,
    helpful: 0,
    wouldRecommend: req.body?.wouldRecommend !== undefined ? Boolean(req.body.wouldRecommend) : true,
    wouldStayAgain: req.body?.wouldStayAgain !== undefined ? Boolean(req.body.wouldStayAgain) : true,
    status: 'published',
    visitType: req.body?.visitType ? String(req.body.visitType) : null,
    response: null,
    guestName: req.user.name,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  createReview(review);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review
  });
});

router.put('/:id', auth, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Only admins can update reviews'
    });
    return;
  }

  const responsePayload = req.body?.response
    ? {
        adminName: req.user.name,
        message: typeof req.body.response === 'string' ? req.body.response : String(req.body.response.message || ''),
        respondedAt: new Date().toISOString()
      }
    : undefined;

  const review = updateReview(req.params.id, {
    title: req.body?.title ? String(req.body.title) : undefined,
    comment: req.body?.comment ? String(req.body.comment) : undefined,
    rating: req.body?.rating !== undefined ? Number(req.body.rating) : undefined,
    status: req.body?.status ? String(req.body.status) : undefined,
    response: responsePayload,
    updatedAt: new Date().toISOString()
  });

  if (!review) {
    res.status(404).json({
      success: false,
      message: 'Review not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

router.put('/:id/helpful', (req, res) => {
  const review = incrementReviewHelpful(req.params.id);

  if (!review) {
    res.status(404).json({
      success: false,
      message: 'Review not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

router.delete('/:id', auth, (req: AuthenticatedRequest, res) => {
  const review = getReviewById(req.params.id);

  if (!review) {
    res.status(404).json({
      success: false,
      message: 'Review not found'
    });
    return;
  }

  if (review.userId !== req.user?.id && req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Unauthorized to delete this review'
    });
    return;
  }

  deleteReview(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

export default router;
