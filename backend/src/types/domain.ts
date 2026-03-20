export type UserRole = 'user' | 'admin';

export interface RoomRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  image: string;
  totalRooms: number;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomInventory extends RoomRecord {
  bookedRooms: number;
  availableRooms: number;
  isAvailable: boolean;
  availabilityMessage: string;
}

export interface BookingRecord {
  id: string;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  totalPrice: number;
  specialRequests: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaAddOnSelection {
  id: string;
  name: string;
  price: number;
}

export interface SpaBookingRecord {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  serviceType: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  appointmentDate: string;
  appointmentTime: string;
  therapistPreference: string;
  addOns: SpaAddOnSelection[];
  basePrice: number;
  addOnsTotal: number;
  totalPrice: number;
  specialRequests: string;
  allergies: string;
  medicalConditions: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodOrderItem {
  itemId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  total: number;
}

export interface FoodOrderRecord {
  id: string;
  orderId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  deliveryTime: string;
  estimatedDeliveryTime: string;
  items: FoodOrderItem[];
  notes: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponseRecord {
  adminName?: string;
  message?: string;
  respondedAt?: string;
}

export interface ReviewRecord {
  id: string;
  bookingId: string;
  userId: string;
  roomType: string;
  title: string;
  comment: string;
  rating: number;
  cleanliness: number | null;
  comfort: number | null;
  service: number | null;
  amenities: number | null;
  valueForMoney: number | null;
  helpful: number;
  wouldRecommend: boolean;
  wouldStayAgain: boolean;
  status: string;
  visitType: string | null;
  response: ReviewResponseRecord | null;
  guestName: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  booking?: Pick<BookingRecord, 'roomType' | 'checkInDate' | 'checkOutDate'> | null;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentIntentId: string;
  status: string;
  providerStatus: string;
  transactionId: string | null;
  refundId: string | null;
  paidAt: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: Pick<BookingRecord, 'roomType' | 'checkInDate' | 'checkOutDate'> | null;
  user?: Pick<UserRecord, 'id' | 'name' | 'email'> | null;
}

export interface JwtUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

