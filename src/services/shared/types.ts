
// UserData interface
export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'baker' | 'shop' | 'courier' | 'operator' | 'admin';
  avatar?: string;
  joinDate: string;
  totalOrders?: number;
  favoriteCount?: number;
  bakeryName?: string;
  specialties?: string[];
  rating?: number;
  shopName?: string;
  location?: string;
  vehicleType?: string;
  deliveryZone?: string;
  permissions?: string[];
}

// Tortlar uchun interface
export interface Cake {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  bakerId: string;
  bakerName: string;
  shopId?: string;
  shopName?: string;
  productType: 'baked' | 'ready'; // 'baked' - baker tomonidan tayyorlanadi, 'ready' - shop'da tayyor
  rating: number;
  reviewCount: number;
  available: boolean;
  ingredients: string[];
  quantity?: number; // Legacy field - eski maydon
  inStockQuantity?: number; // Haqiqiy mavjud zaxira miqdori
  amount?: number; // Buyurtma berilgan miqdor
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Buyurtmalar uchun interface
export interface Order {
  id?: string;
  orderUniqueId?: string; // Har bir buyurtma uchun bir martalik noyob ID
  customerId?: string; // Foydalanuvchi ID
  customerName: string;
  customerPhone: string;
  cakeId: string; // Mahsulot uchun bir martalik noyob ID
  cakeName: string;
  quantity: number;
  amount?: number; // Mahsulot amount maydonini tracking qilish uchun
  fromStock?: boolean; // Mahsulot stockdan olinganmi yoki pre-order mi
  totalPrice: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  coordinates?: { lat: number; lng: number }; // Joylashuv koordinatalari
  paymentMethod?: string; // cash, card
  paymentType?: string; // click, payme, visa
  notes?: string;
  deliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sharhlar uchun interface
export interface Review {
  id?: string;
  userId: string;
  userName: string;
  cakeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Qo'llab-quvvatlash so'rovlari uchun interface
export interface SupportTicket {
  id?: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  subject: string;
  message: string;
  category: 'delivery' | 'payment' | 'quality' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string; // operator ID
  createdAt: Date;
  updatedAt: Date;
  lastReply?: Date;
  responses?: SupportResponse[];
}

// Qo'llab-quvvatlash javoblari uchun interface
export interface SupportResponse {
  id?: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'customer' | 'operator' | 'admin';
  message: string;
  createdAt: Date;
}
