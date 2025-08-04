import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { UserData } from './authService';

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

class DataService {
  // 8 belgilik noyob buyurtma ID yaratish (harf va raqamlar kombinatsiyasi)
  private async generateUniqueOrderId(): Promise<string> {
    let isUnique = false;
    let uniqueId = '';
    let attempts = 0;
    const maxAttempts = 10;

    // Harf va raqamlar kombinatsiyasi uchun belgilar
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    while (!isUnique && attempts < maxAttempts) {
      // 8 belgilik random kod yaratish (masalan: D9OAHZ7Z)
      uniqueId = '';
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        uniqueId += characters[randomIndex];
      }

      try {
        // Firebase'da bunday ID mavjudligini tekshirish
        const existingOrderQuery = query(
          collection(db, 'orders'),
          where('orderUniqueId', '==', uniqueId),
          limit(1)
        );
        
        const querySnapshot = await getDocs(existingOrderQuery);
        
        if (querySnapshot.empty) {
          isUnique = true;
          console.log(`✅ 8 belgilik noyob ID topildi: ${uniqueId}`);
        } else {
          console.log(`⚠️ ID ${uniqueId} allaqachon mavjud, qayta urinish...`);
          attempts++;
        }
      } catch (error) {
        console.error('❌ ID tekshirishda xato:', error);
        attempts++;
      }
    }

    if (!isUnique) {
      // Fallback: timestamp va random harflar kombinatsiyasi
      const timestamp = Date.now().toString();
      const randomChars = Math.random().toString(36).toUpperCase().substr(2, 4);
      uniqueId = (timestamp.slice(-4) + randomChars).substr(0, 8);
      console.log(`⚠️ Fallback ID ishlatildi: ${uniqueId}`);
    }

    return uniqueId;
  }
  // TORTLAR BILAN ISHLASH

  // Yangi tort qo'shish
  async addCake(cake: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const cakeData: any = {
        ...cake,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Yangi tizim: inStockQuantity va amount maydonlari
      if (cake.productType === 'baked') {
        // Baker mahsulotlari
        cakeData.inStockQuantity = cake.inStockQuantity !== undefined ? cake.inStockQuantity : 0;
        cakeData.amount = cake.amount !== undefined ? cake.amount : 0;
        
        // Available holati: quantity mavjud va > 0 bo'lsa true
        if (cake.quantity !== undefined && cake.quantity > 0) {
          cakeData.available = true;
        } else {
          cakeData.available = false;
        }
      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari
        cakeData.inStockQuantity = cake.inStockQuantity !== undefined ? cake.inStockQuantity : 0;
        cakeData.available = (cakeData.inStockQuantity > 0);
      }

      // Legacy quantity field ni ham saqlash (backward compatibility)
      if (cake.quantity !== undefined) {
        cakeData.quantity = cake.quantity;
      }

      // undefined qiymatlarni olib tashlash
      Object.keys(cakeData).forEach(key => {
        if (cakeData[key] === undefined) {
          delete cakeData[key];
        }
      });

      console.log('🍰 Yangi mahsulot qo\'shilmoqda:', {
        productType: cakeData.productType,
        inStockQuantity: cakeData.inStockQuantity,
        amount: cakeData.amount,
        available: cakeData.available
      });

      const docRef = await addDoc(collection(db, 'cakes'), cakeData);
      return docRef.id;
    } catch (error) {
      console.error('Tort qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Tortlarni olish
  async getCakes(filters?: { 
    category?: string; 
    bakerId?: string; 
    shopId?: string;
    available?: boolean;
    productType?: 'baked' | 'ready';
  }): Promise<Cake[]> {
    try {
      let q = query(collection(db, 'cakes'), orderBy('createdAt', 'desc'));

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.bakerId) {
        q = query(q, where('bakerId', '==', filters.bakerId));
      }
      if (filters?.shopId) {
        q = query(q, where('shopId', '==', filters.shopId));
      }
      if (filters?.productType) {
        q = query(q, where('productType', '==', filters.productType));
      }
      if (filters?.available !== undefined) {
        q = query(q, where('available', '==', filters.available));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Cake));
    } catch (error) {
      console.error('Tortlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Tortni yangilash
  async updateCake(cakeId: string, updates: Partial<Cake>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'cakes', cakeId), updateData);
    } catch (error) {
      console.error('Tortni yangilashda xatolik:', error);
      throw error;
    }
  }

  // Tortni o'chirish
  async deleteCake(cakeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'cakes', cakeId));
    } catch (error) {
      console.error('Tortni o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // BUYURTMALAR BILAN ISHLASH

  // Yangi buyurtma yaratish
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ docId: string; orderUniqueId: string }> {
    try {
      // 8 belgilik alphanumeric noyob buyurtma ID yaratish
      const uniqueOrderId = await this.generateUniqueOrderId();
      
      console.log('🆔 8 belgilik noyob buyurtma ID yaratildi:', uniqueOrderId);
      console.log('🍰 Mahsulot ID:', order.cakeId);
      console.log('👤 Customer ID (User ID):', order.customerId);
      
      const orderData: any = {
        ...order,
        orderUniqueId: uniqueOrderId, // 8 belgilik alphanumeric noyob ID
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // undefined qiymatlarni olib tashlash (Firebase undefined ni qabul qilmaydi)
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined) {
          delete orderData[key];
        }
      });

      // Firebase'ga buyurtma qo'shish
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      console.log('✅ Firebase hujjat ID:', docRef.id);
      console.log('🆔 Noyob buyurtma ID:', uniqueOrderId);
      console.log('👤 Customer ID bilan bog\'langan:', order.customerId);
      
      // Buyurtma yaratilganda mahsulot quantity ni avtomatik yangilash
      let fromStock = false;
      try {
        const result = await this.processOrderQuantity(order.cakeId, order.quantity);
        fromStock = result.fromStock;
        console.log('📦 Mahsulot quantity muvaffaqiyatli yangilandi, fromStock:', fromStock);
      } catch (quantityError) {
        console.warn('⚠️ Mahsulot quantity yangilashda xato:', quantityError);
      }

      // fromStock ma'lumotini buyurtmaga qo'shish
      if (fromStock) {
        await updateDoc(doc(db, 'orders', docRef.id), {
          fromStock: true,
          updatedAt: Timestamp.now()
        });
        console.log('✅ fromStock field buyurtmaga qo\'shildi');
      }
      
      return { docId: docRef.id, orderUniqueId: uniqueOrderId };
    } catch (error) {
      console.error('Buyurtma yaratishda xatolik:', error);
      throw error;
    }
  }

  

  // Foydalanuvchi buyurtmalarini customerId bo'yicha olish
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.log('⚠️ User ID noto\'g\'ri yoki bo\'sh:', userId);
        return [];
      }

      const cleanUserId = userId.trim();
      console.log('🔍 User ID bo\'yicha qidirish:', cleanUserId);

      // Firebase query - customerId bo'yicha filter
      const userQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', cleanUserId),
        orderBy('createdAt', 'desc'),
        limit(1000) // Yetarli limit
      );

      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        console.log('📭 User buyurtmalari topilmadi:', cleanUserId);
        return [];
      }

      console.log(`📥 ${querySnapshot.docs.length} ta hujjat topildi`);

      const orders: Order[] = [];

      querySnapshot.docs.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Strict customerId checking
          if (data.customerId !== cleanUserId) {
            console.warn('⚠️ Customer ID noto\'g\'ri:', data.customerId, '!=', cleanUserId);
            return;
          }

          // Data validation va parsing
          if (!data.cakeId || !data.cakeName) {
            console.warn('⚠️ Noto\'g\'ri buyurtma ma\'lumotlari:', doc.id);
            return;
          }
          
          const order: Order = {
            id: doc.id,
            orderUniqueId: data.orderUniqueId || doc.id,
            customerId: data.customerId || '',
            customerName: data.customerName || 'Noma\'lum mijoz',
            customerPhone: data.customerPhone || '',
            cakeId: data.cakeId,
            cakeName: data.cakeName,
            quantity: Math.max(1, data.quantity || 1),
            amount: data.amount,
            totalPrice: Math.max(0, data.totalPrice || 0),
            status: data.status || 'pending',
            deliveryAddress: data.deliveryAddress || '',
            coordinates: data.coordinates,
            paymentMethod: data.paymentMethod || 'cash',
            paymentType: data.paymentType,
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            deliveryTime: data.deliveryTime?.toDate()
          };

          orders.push(order);
        } catch (parseError) {
          console.error('❌ Buyurtma parse xatosi:', doc.id, parseError);
        }
      });

      console.log(`✅ User (${cleanUserId}): ${orders.length} ta buyurtma yuklandi`);
      
      // Verify all orders belong to correct user
      const invalidOrders = orders.filter(order => order.customerId !== cleanUserId);
      if (invalidOrders.length > 0) {
        console.error('❌ Noto\'g\'ri customer ID li buyurtmalar topildi:', invalidOrders.length);
      }

      return orders;
      
    } catch (error) {
      console.error('❌ Foydalanuvchi buyurtmalarini yuklashda xato:', error);
      
      // Detailed error logging
      if (error instanceof Error) {
        console.error('❌ Xato detallari:', error.message);
        console.error('❌ Stack trace:', error.stack);
      }
      
      return [];
    }
  }

  // Backward compatibility uchun eski funksiya nomi
  async getOrdersByCustomerId(userId: string): Promise<Order[]> {
    return this.getOrdersByUserId(userId);
  }

  

  

  

  // Buyurtmalarni olish
  async getOrders(filters?: { customerPhone?: string; status?: string }): Promise<Order[]> {
    try {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

      if (filters?.customerPhone) {
        q = query(q, where('customerPhone', '==', filters.customerPhone));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        orderUniqueId: doc.data().orderUniqueId,
        customerId: doc.data().customerId,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        deliveryTime: doc.data().deliveryTime?.toDate()
      } as Order));
    } catch (error) {
      console.error('Buyurtmalarni olishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtmani bekor qilish
  async cancelOrder(orderId: string): Promise<void> {
    try {
      // Buyurtma ma'lumotlarini olish
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Buyurtma topilmadi');
      }

      const orderData = orderDoc.data() as Order;
      
      console.log('🚫 Foydalanuvchi buyurtmani bekor qildi:', {
        orderId,
        cakeId: orderData.cakeId,
        quantity: orderData.quantity,
        cakeName: orderData.cakeName,
        fromStock: orderData.fromStock
      });

      // Buyurtma holatini cancelled ga o'zgartirish
      await this.updateOrderStatus(orderId, 'cancelled');

      // Mahsulot quantity'ni qaytarish
      try {
        await this.revertOrderQuantity(orderData.cakeId, orderData.quantity, orderData.fromStock || false);
        console.log('✅ Foydalanuvchi buyurtmani bekor qildi, mahsulot soni qaytarildi');
      } catch (revertError) {
        console.error('❌ Mahsulot sonini qaytarishda xato:', revertError);
        // Xatoga qaramay order status ni cancelled qilib qo'yamiz
      }
    } catch (error) {
      console.error('Buyurtmani bekor qilishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma holatini yangilash
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Buyurtma topilmadi');
      }

      const orderData = orderDoc.data() as Order;

      // Agar buyurtma bekor qilinayotgan bo'lsa va bank kartasi orqali to'lov qilingan bo'lsa
      if (status === 'cancelled' && orderData.paymentMethod === 'card' && orderData.paymentType) {
        await this.processRefund(orderId, orderData);
      }

      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // To'lov qaytarish tizimi
  async processRefund(orderId: string, orderData: Order): Promise<void> {
    try {
      console.log('💳 To\'lov qaytarish jarayoni boshlandi:', orderId);

      const refundAmount = this.calculateRefundAmount(orderData.totalPrice, orderData.paymentType!);

      // Refund ma'lumotlarini yaratish
      const refundData = {
        orderId,
        originalAmount: orderData.totalPrice,
        serviceFee: orderData.totalPrice - refundAmount,
        refundAmount,
        paymentType: orderData.paymentType,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        status: 'pending', // pending, processed, failed
        createdAt: Timestamp.now(),
        processedAt: null,
        notes: `${orderData.paymentType} orqali to'lov qilingan buyurtma bekor qilindi. Xizmat haqi: ${orderData.totalPrice - refundAmount} so'm`
      };

      // Refunds collection'ga yozish
      const refundDocRef = await addDoc(collection(db, 'refunds'), refundData);

      console.log('✅ Refund yaratildi:', refundDocRef.id);

      // Buyurtmaga refund ID ni qo'shish
      await updateDoc(doc(db, 'orders', orderId), {
        refundId: refundDocRef.id,
        refundAmount,
        refundStatus: 'pending',
        updatedAt: Timestamp.now()
      });

      // Operator uchun bildirishnoma yaratish
      try {
        const { notificationService } = await import('./notificationService');
        await notificationService.createNotification({
          userId: 'operator-refunds',
          type: 'system',
          title: 'To\'lov qaytarish so\'rovi',
          message: `${orderData.customerName} - ${refundAmount.toLocaleString()} so'm qaytarish kerak (${orderData.paymentType})`,
          data: {
            orderId,
            refundId: refundDocRef.id,
            refundAmount,
            paymentType: orderData.paymentType,
            customerPhone: orderData.customerPhone
          },
          read: false,
          priority: 'high',
          actionUrl: `/operator/refunds/${refundDocRef.id}`
        });
      } catch (notifError) {
        console.warn('⚠️ Refund bildirishnomasi yuborishda xato:', notifError);
      }

      // Mijoz uchun SMS/bildirishnoma yuborish
      this.sendRefundNotificationToCustomer(orderData, refundAmount);

    } catch (error) {
      console.error('❌ To\'lov qaytarishda xatolik:', error);
      throw error;
    }
  }

  // Qaytarish miqdorini hisoblash (xizmat haqini hisobga olgan holda)
  private calculateRefundAmount(originalAmount: number, paymentType: string): number {
    // Har xil to'lov tipi uchun turli xizmat haqlari
    const serviceFees = {
      'click': 2000, // Click uchun 2000 so'm xizmat haqi
      'payme': 1500, // Payme uchun 1500 so'm xizmat haqi
      'visa': 3000   // Visa/Mastercard uchun 3000 so'm xizmat haqi
    };

    const fee = serviceFees[paymentType as keyof typeof serviceFees] || 2500; // Default 2500 so'm
    const refundAmount = Math.max(0, originalAmount - fee);

    console.log(`💰 Refund hisobi: Original: ${originalAmount}, Fee: ${fee}, Refund: ${refundAmount}`);

    return refundAmount;
  }

  // Mijozga refund haqida xabar yuborish
  private async sendRefundNotificationToCustomer(orderData: Order, refundAmount: number): Promise<void> {
    try {
      // Bu yerda real SMS yoki email yuborish xizmati integratsiyasi bo'lishi mumkin
      console.log(`📱 SMS yuborildi: ${orderData.customerPhone} - ${refundAmount.toLocaleString()} so'm qaytariladi`);

      // Log sifatida saqlash
      await addDoc(collection(db, 'customerNotifications'), {
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName,
        type: 'refund_notification',
        message: `Hurmatli ${orderData.customerName}, buyurtmangiz bekor qilindi. ${refundAmount.toLocaleString()} so'm 3-5 ish kuni ichida qaytariladi. Xizmat haqi: ${orderData.totalPrice - refundAmount} so'm`,
        sentAt: Timestamp.now(),
        method: 'sms'
      });

    } catch (error) {
      console.warn('⚠️ Mijozga xabar yuborishda xato:', error);
    }
  }

  // Refund so'rovlarini olish
  async getRefunds(filters?: { 
    status?: string; 
    paymentType?: string;
    customerPhone?: string;
  }): Promise<any[]> {
    try {
      let q = query(collection(db, 'refunds'), orderBy('createdAt', 'desc'));

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.paymentType) {
        q = query(q, where('paymentType', '==', filters.paymentType));
      }
      if (filters?.customerPhone) {
        q = query(q, where('customerPhone', '==', filters.customerPhone));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        processedAt: doc.data().processedAt?.toDate()
      }));
    } catch (error) {
      console.error('Refundlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Refund holatini yangilash
  async updateRefundStatus(refundId: string, status: 'pending' | 'processed' | 'failed', notes?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'processed') {
        updateData.processedAt = Timestamp.now();
      }

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(doc(db, 'refunds', refundId), updateData);

      // Agar processed bo'lsa, buyurtma holatini ham yangilash
      if (status === 'processed') {
        const refundDoc = await getDoc(doc(db, 'refunds', refundId));
        if (refundDoc.exists()) {
          const refundData = refundDoc.data();
          await updateDoc(doc(db, 'orders', refundData.orderId), {
            refundStatus: 'processed',
            updatedAt: Timestamp.now()
          });
        }
      }

    } catch (error) {
      console.error('Refund holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // Buyurtmani yangilash (umumiy)
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (error) {
      console.error('Buyurtmani yangilashda xatolik:', error);
      throw error;
    }
  }

  // SHARHLAR BILAN ISHLASH

  // Sharh qo'shish
  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reviewData = {
        ...review,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // Tortning o'rtacha reytingini yangilash
      await this.updateCakeRating(review.cakeId);

      return docRef.id;
    } catch (error) {
      console.error('Sharh qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Tort uchun sharhlarni olish
  async getReviews(cakeId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('cakeId', '==', cakeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as Review));
    } catch (error) {
      console.error('Sharhlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Tortning reytingini yangilash
  private async updateCakeRating(cakeId: string): Promise<void> {
    try {
      const reviews = await this.getReviews(cakeId);

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await updateDoc(doc(db, 'cakes', cakeId), {
          rating: Math.round(averageRating * 10) / 10, // 1 xona aniqlik bilan
          reviewCount: reviews.length,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Reytingni yangilashda xatolik:', error);
    }
  }

  // QO'LLAB-QUVVATLASH SO'ROVLARI BILAN ISHLASH

  // Yangi support ticket yaratish
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ticketData = {
        ...ticket,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
      return docRef.id;
    } catch (error) {
      console.error('Support ticket yaratishda xatolik:', error);
      throw error;
    }
  }

  // Support ticketlarni olish
  async getSupportTickets(filters?: { 
    userId?: string; 
    status?: string;
    assignedTo?: string;
    priority?: string;
  }): Promise<SupportTicket[]> {
    try {
      let q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastReply: doc.data().lastReply?.toDate()
      } as SupportTicket));
    } catch (error) {
      console.error('Support ticketlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket holatini yangilash
  async updateSupportTicketStatus(ticketId: string, status: SupportTicket['status'], assignedTo?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      await updateDoc(doc(db, 'supportTickets', ticketId), updateData);
    } catch (error) {
      console.error('Support ticket holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // Support ticket'ga javob qo'shish
  async addSupportResponse(response: Omit<SupportResponse, 'id' | 'createdAt'>): Promise<string> {
    try {
      const responseData = {
        ...response,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'supportResponses'), responseData);

      // Ticket'ning lastReply maydonini yangilash
      await updateDoc(doc(db, 'supportTickets', response.ticketId), {
        lastReply: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Support response qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket uchun javoblarni olish
  async getSupportResponses(ticketId: string): Promise<SupportResponse[]> {
    try {
      const q = query(
        collection(db, 'supportResponses'),
        where('ticketId', '==', ticketId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as SupportResponse));
    } catch (error) {
      console.error('Support response\'larni olishda xatolik:', error);
      throw error;
    }
  }

  // Support ticket real-time kuzatish
  subscribeSupportTickets(callback: (tickets: SupportTicket[]) => void, filters?: { status?: string }) {
    let q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastReply: doc.data().lastReply?.toDate()
      } as SupportTicket));

      callback(tickets);
    });
  }

  // RASMLAR BILAN ISHLASH

  // Rasm yuklash
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Rasm yuklashda xatolik:', error);
      throw error;
    }
  }

  // Rasmni o'chirish
  async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Rasmni o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // MIQDOR VA AMOUNT HISOBLASH FUNKSIYALARI

  // Mahsulot miqdorini yangilash va amount hisoblash
  async updateProductQuantityAndAmount(cakeId: string, quantityChange: number, isOrder: boolean = false): Promise<void> {
    try {
      const cake = await this.getCakeById(cakeId);
      if (!cake) throw new Error('Mahsulot topilmadi');

      const updateData: any = {};

      if (isOrder) {
        // Buyurtma berilganda
        if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
          // Baker mahsulotlari
          if (cake.available && cake.quantity !== undefined) {
            // "Hozir mavjud" - quantity kamayadi, amount oshadi
            const newQuantity = Math.max(0, cake.quantity - Math.abs(quantityChange));
            updateData.quantity = newQuantity;
            updateData.available = newQuantity > 0;
            updateData.amount = (cake.amount || 0) + Math.abs(quantityChange);
          } else {
            // "Buyurtma uchun" - faqat amount oshadi
            updateData.amount = (cake.amount || 0) + Math.abs(quantityChange);
          }
        } else {
          // Shop mahsulotlari - quantity kamayadi
          const newQuantity = Math.max(0, (cake.quantity || 0) - Math.abs(quantityChange));
          updateData.quantity = newQuantity;
          updateData.available = newQuantity > 0;
        }
      } else {
        // Mahsulot qo'shilganda - quantity oshadi
        const newQuantity = (cake.quantity || 0) + Math.abs(quantityChange);
        updateData.quantity = newQuantity;
        updateData.available = newQuantity > 0;
      }

      await this.updateCake(cakeId, updateData);
    } catch (error) {
      console.error('Miqdor va amount yangilashda xatolik:', error);
      throw error;
    }
  }

  // Bitta tortning ma'lumotlarini olish
  async getCakeById(cakeId: string): Promise<Cake | null> {
    try {
      const docRef = doc(db, 'cakes', cakeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate()
        } as Cake;
      }
      return null;
    } catch (error) {
      console.error('Tortni olishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma berilganda mahsulot miqdorini kamaytirish va amount oshirish
  async processOrderQuantity(cakeId: string, orderQuantity: number): Promise<{ fromStock: boolean }> {
    try {
      const cake = await this.getCakeById(cakeId);
      if (!cake) {
        console.error('❌ Mahsulot topilmadi:', cakeId);
        return { fromStock: false };
      }

      console.log('📦 Mahsulot quantity processing:', {
        cakeId,
        productType: cake.productType,
        available: cake.available,
        quantity: cake.quantity,
        amount: cake.amount,
        inStockQuantity: cake.inStockQuantity,
        orderQuantity
      });

      const updateData: any = {};
      let fromStock = false;

      // Baker mahsulotlari uchun
      if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
        const currentQuantity = cake.quantity || 0;
        
        if (currentQuantity >= orderQuantity) {
          // "Hozir mavjud" dan olish mumkin
          const newQuantity = currentQuantity - orderQuantity;
          updateData.quantity = newQuantity;
          
          // inStockQuantity ni oshirish (sotilgan mahsulotlar kuzatuvi)
          updateData.inStockQuantity = (cake.inStockQuantity || 0) + orderQuantity;
          
          // Agar quantity 0 bo'lsa, avtomatik "Buyurtma uchun" ga o'tish
          if (newQuantity === 0) {
            updateData.available = false;
            console.log('🔄 Baker mahsulot "Hozir mavjud" dan "Buyurtma uchun" ga o\'tdi');
          } else {
            updateData.available = true;
          }
          
          fromStock = true;
          console.log('✅ Baker "Hozir mavjud" dan olindi:', {
            oldQuantity: currentQuantity,
            newQuantity,
            inStockQuantity: updateData.inStockQuantity,
            available: updateData.available
          });
        } else {
          // "Hozir mavjud" yetmaydi - "Buyurtma uchun" dan olish
          // Amount ni oshirish (buyurtma qilingan miqdor - real mahsulot emas)
          updateData.amount = (cake.amount || 0) + orderQuantity;
          fromStock = false;
          console.log('🔄 Baker "Buyurtma uchun" dan olindi, amount oshirildi (real mahsulot emas, faqat buyurtma soni):', {
            oldAmount: cake.amount || 0,
            newAmount: updateData.amount,
            quantityUnchanged: cake.quantity || 0,
            rule: 'amount - faqat buyurtma soni, quantity - real mavjud mahsulot'
          });
        }
        
      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari - faqat "Hozir mavjud" dan
        const currentQuantity = cake.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - orderQuantity);
        
        updateData.quantity = newQuantity;
        
        // inStockQuantity ni oshirish (sotilgan mahsulotlar kuzatuvi)
        updateData.inStockQuantity = (cake.inStockQuantity || 0) + orderQuantity;
        
        // Agar quantity 0 bo'lsa, mahsulot mavjud emas
        if (newQuantity === 0) {
          updateData.available = false;
          console.log('🔄 Shop mahsulot tugadi, available = false');
        } else {
          updateData.available = true;
        }
        
        fromStock = true; // Shop mahsulotlari doim stock dan
        
        console.log('✅ Shop mahsulot sotildi:', {
          oldQuantity: currentQuantity,
          newQuantity,
          inStockQuantity: updateData.inStockQuantity,
          available: updateData.available
        });
      }

      // Ma'lumotlarni yangilash
      if (Object.keys(updateData).length > 0) {
        await this.updateCake(cakeId, updateData);
        console.log('✅ Mahsulot quantity muvaffaqiyatli yangilandi:', updateData);
      }

      return { fromStock };

    } catch (error) {
      console.error('❌ processOrderQuantity xatosi:', error);
      throw error;
    }
  }

  // Buyurtma bekor qilinganda mahsulot miqdorini qaytarish va amount kamaytirish
  async revertOrderQuantity(cakeId: string, orderQuantity: number, fromStock: boolean = false): Promise<void> {
    try {
      console.log('🔄 Operator buyurtmani bekor qildi, mahsulot sonini qaytarish:', { cakeId, orderQuantity, fromStock });
      
      const cake = await this.getCakeById(cakeId);
      if (!cake) {
        console.error('❌ Mahsulot topilmadi:', cakeId);
        throw new Error('Mahsulot topilmadi');
      }

      console.log('📦 Joriy mahsulot holati:', {
        productType: cake.productType,
        available: cake.available,
        quantity: cake.quantity,
        amount: cake.amount,
        inStockQuantity: cake.inStockQuantity
      });

      const updateData: any = {};

      // Baker mahsulotlari uchun
      if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
        
        if (fromStock) {
          // "Hozir mavjud" dan sotilgan mahsulot operator tomonidan bekor qilindi
          // inStockQuantity dan BUTUNLAY olib tashlab, quantity ga qaytarish
          const currentInStock = cake.inStockQuantity || 0;
          const newInStockQuantity = Math.max(0, currentInStock - orderQuantity);
          const newQuantity = (cake.quantity || 0) + orderQuantity;
          
          updateData.inStockQuantity = newInStockQuantity;
          updateData.quantity = newQuantity;
          
          // MUHIM: Quantity > 0 bo'lganda avtomatik "Hozir mavjud" ga qaytarish
          updateData.available = newQuantity > 0;
          
          console.log('✅ Baker "Hozir mavjud" dan bekor qilindi - quantity qaytarildi:', {
            oldQuantity: cake.quantity || 0,
            newQuantity,
            oldInStock: currentInStock,
            newInStock: newInStockQuantity,
            orderQuantity,
            newAvailable: updateData.available,
            statusChange: newQuantity > 0 ? '"Buyurtma uchun" -> "Hozir mavjud"' : 'Mavjud emas'
          });
        } else {
          // "Buyurtma uchun" dan tasdiqlanib amount ga o'tgan mahsulot bekor qilindi
          // Faqat amount ni kamaytirish, quantity ga HECH QACHON qaytarmaydi
          const newAmount = Math.max(0, (cake.amount || 0) - orderQuantity);
          updateData.amount = newAmount;
          
          // MUHIM: quantity va available holatini o'zgartirmaydi
          // amount faqat buyurtma sonini ko'rsatadi, mavjud mahsulot emas
          
          console.log('🔄 Baker "Buyurtma uchun" (amount) dan bekor qilindi - quantity o\'zgartirilmaydi:', {
            oldAmount: cake.amount || 0,
            newAmount,
            quantityUnchanged: cake.quantity || 0,
            availableUnchanged: cake.available,
            inStockUnchanged: cake.inStockQuantity || 0,
            rule: 'amount bekor qilinganda quantity ga qo\'shilmaydi'
          });
        }
        
      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari - faqat "Hozir mavjud" dan sotiladi
        if (fromStock) {
          // inStockQuantity dan BUTUNLAY olib tashlab, quantity ga qaytarish
          const currentInStock = cake.inStockQuantity || 0;
          const newInStockQuantity = Math.max(0, currentInStock - orderQuantity);
          const newQuantity = (cake.quantity || 0) + orderQuantity;
          
          updateData.inStockQuantity = newInStockQuantity;
          updateData.quantity = newQuantity;
          
          // MUHIM: Quantity > 0 bo'lganda avtomatik mavjud ga qaytarish
          updateData.available = newQuantity > 0;
          
          console.log('✅ Shop mahsulot bekor qilindi - quantity qaytarildi:', {
            oldQuantity: cake.quantity || 0,
            newQuantity,
            oldInStock: currentInStock,
            newInStock: newInStockQuantity,
            orderQuantity,
            newAvailable: updateData.available,
            statusChange: newQuantity > 0 ? 'Tugagan -> Mavjud' : 'Tugagan'
          });
        }
      }

      // Ma'lumotlarni yangilash
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = Timestamp.now();
        
        await this.updateCake(cakeId, updateData);
        console.log('✅ Operator bekor qilish: mahsulot muvaffaqiyatli yangilandi:', updateData);
        
        // Status o'zgarishi haqida aniq log
        if (updateData.available === true && !cake.available) {
          console.log('🟢 OPERATOR BEKOR QILISH: Mahsulot "Hozir mavjud" holatiga qaytarildi');
        } else if (updateData.available === false && cake.available) {
          console.log('🔴 OPERATOR BEKOR QILISH: Mahsulot "Mavjud emas" holatiga o\'tdi');
        }

        // MUHIM: Operator bekor qilish uchun maxsus force update
        try {
          const operatorRevertData = {
            ...updateData,
            operatorReverted: true,
            operatorRevertedAt: Timestamp.now(),
            lastOperatorAction: 'order_cancelled',
            forceUpdate: Date.now(),
            statusChangeReason: 'operator_cancelled_order'
          };
          
          await this.updateCake(cakeId, operatorRevertData);
          console.log('🔄 Operator bekor qilish: Real-time yangilanish trigger qilindi');
          
        } catch (triggerError) {
          console.warn('⚠️ Operator bekor qilish: Real-time trigger da xato:', triggerError);
        }
      } else {
        console.warn('⚠️ Operator bekor qilish: Yangilanishi kerak bo\'lgan ma\'lumotlar topilmadi');
      }

    } catch (error) {
      console.error('❌ Operator buyurtma bekor qilishda xatolik:', error);
      throw error;
    }
  }

  // STATISTIKA FUNKSIYALARI

  // MAVJUD MAHSULOTLAR (SHOP) UCHUN INVENTORY COLLECTION
  async createInventoryEntry(productId: string, quantity: number): Promise<void> {
    try {
      await addDoc(collection(db, 'inventory'), {
        productId,
        quantity,
        type: 'available',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Inventory entry yaratishda xatolik:', error);
      throw error;
    }
  }

  async updateInventoryQuantity(productId: string, quantity: number): Promise<void> {
    try {
      const q = query(
        collection(db, 'inventory'),
        where('productId', '==', productId),
        where('type', '==', 'available')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await updateDoc(doc.ref, {
          quantity,
          updatedAt: Timestamp.now()
        });
      } else {
        await this.createInventoryEntry(productId, quantity);
      }
    } catch (error) {
      console.error('Inventory miqdorini yangilashda xatolik:', error);
      throw error;
    }
  }

  // BUYURTMA ASOSIDAGI MAHSULOTLAR (BAKER) UCHUN ORDERS COLLECTION
  async getOrderedQuantity(productId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('cakeId', '==', productId),
        where('status', 'in', ['pending', 'accepted', 'preparing'])
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.reduce((total, doc) => {
        const order = doc.data() as Order;
        return total + order.quantity;
      }, 0);
    } catch (error) {
      console.error('Buyurtma miqdorini olishda xatolik:', error);
      throw error;
    }
  }

  // Mavjud mahsulotlar statistikasi (shop mahsulotlari - available: true)
  async getAvailableProductsStats(): Promise<{
    totalAvailable: number;
    totalQuantity: number;
    lowStock: number; // 5 ta va undan kam
    outOfStock: number; // 0 ta
    categoryBreakdown: { [category: string]: number };
  }> {
    try {
      const allCakes = await this.getCakes();
      const availableProducts = allCakes.filter(cake => 
        cake.productType === 'ready' && cake.available === true
      );

      // Inventory collection'dan miqdorlarni olish
      const inventoryPromises = availableProducts.map(async (cake) => {
        const q = query(
          collection(db, 'inventory'),
          where('productId', '==', cake.id),
          where('type', '==', 'available')
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return querySnapshot.docs[0].data().quantity;
        }
        return cake.quantity || 0;
      });

      const quantities = await Promise.all(inventoryPromises);

      const stats = {
        totalAvailable: availableProducts.length,
        totalQuantity: quantities.reduce((sum, qty) => sum + qty, 0),
        lowStock: quantities.filter(qty => qty <= 5 && qty > 0).length,
        outOfStock: quantities.filter(qty => qty === 0).length,
        categoryBreakdown: {} as { [category: string]: number }
      };

      // Kategoriya bo'yicha taqsimlash
      availableProducts.forEach(cake => {
        stats.categoryBreakdown[cake.category] = (stats.categoryBreakdown[cake.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Mavjud mahsulotlar statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma berish uchun mahsulotlar statistikasi (baker mahsulotlari)
  async getOrderBasedProductsStats(): Promise<{
    totalOrderBased: number;
    totalOrdered: number;
    activeOrders: number; // pending, accepted, preparing
    completedOrders: number; // ready, delivered
    cancelledOrders: number;
    categoryBreakdown: { [category: string]: number };
    monthlyOrdersGrowth: number;
  }> {
    try {
      const allCakes = await this.getCakes();
      const allOrders = await this.getOrders();

      const orderBasedProducts = allCakes.filter(cake => 
        cake.productType === 'baked' || (cake.bakerId && !cake.shopId)
      );

      // Buyurtmalar bo'yicha statistika
      const activeOrderStatuses = ['pending', 'accepted', 'preparing'];
      const completedOrderStatuses = ['ready', 'delivered'];
      const cancelledOrderStatuses = ['cancelled'];

      const activeOrders = allOrders.filter(order => activeOrderStatuses.includes(order.status));
      const completedOrders = allOrders.filter(order => completedOrderStatuses.includes(order.status));
      const cancelledOrders = allOrders.filter(order => cancelledOrderStatuses.includes(order.status));

      // Oylik o'sish hisobi (oxirgi 2 oy)
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthOrders = allOrders.filter(order => 
        order.createdAt >= currentMonth
      ).length;

      const lastMonthOrders = allOrders.filter(order => 
        order.createdAt >= lastMonth && order.createdAt < currentMonth
      ).length;

      const monthlyOrdersGrowth = lastMonthOrders > 0 
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
        : 0;

      const stats = {
        totalOrderBased: orderBasedProducts.length,
        totalOrdered: allOrders.reduce((sum, order) => sum + order.quantity, 0),
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        categoryBreakdown: {} as { [category: string]: number },
        monthlyOrdersGrowth: Math.round(monthlyOrdersGrowth * 100) / 100
      };

      // Kategoriya bo'yicha taqsimlash
      orderBasedProducts.forEach(cake => {
        stats.categoryBreakdown[cake.category] = (stats.categoryBreakdown[cake.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Buyurtma asosidagi mahsulotlar statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Umumiy biznes statistikasi
  async getBusinessStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProducts: Array<{ cakeId: string; cakeName: string; totalSold: number; revenue: number }>;
    dailyOrdersThisWeek: Array<{ date: string; orders: number }>;
  }> {
    try {
      const allOrders = await this.getOrders();
      const completedOrders = allOrders.filter(order => 
        ['delivered', 'ready'].includes(order.status)
      );

      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const totalOrders = completedOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Eng ko'p sotilgan mahsulotlar
      const productSales: { [cakeId: string]: { name: string; sold: number; revenue: number } } = {};

      completedOrders.forEach(order => {
        if (!productSales[order.cakeId]) {
          productSales[order.cakeId] = {
            name: order.cakeName,
            sold: 0,
            revenue: 0
          };
        }
        productSales[order.cakeId].sold += order.quantity;
        productSales[order.cakeId].revenue += order.totalPrice;
      });

      const topSellingProducts = Object.entries(productSales)
        .map(([cakeId, data]) => ({
          cakeId,
          cakeName: data.name,
          totalSold: data.sold,
          revenue: data.revenue
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Haftalik buyurtmalar
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const dailyOrdersThisWeek: Array<{ date: string; orders: number }> = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(oneWeekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const ordersOnDate = allOrders.filter(order => {
          const orderDate = order.createdAt.toISOString().split('T')[0];
          return orderDate === dateStr;
        }).length;

        dailyOrdersThisWeek.push({
          date: dateStr,
          orders: ordersOnDate
        });
      }

      return {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue),
        topSellingProducts,
        dailyOrdersThisWeek
      };
    } catch (error) {
      console.error('Biznes statistikasini olishda xatolik:', error);
      throw error;
    }
  }

  // Real-time statistika kuzatish (optimized)
  subscribeToStats(callback: (stats: {
    available: any;
    orderBased: any;
    business: any;
  }) => void) {
    let isActive = true;
    let unsubscribeCakes: (() => void) | null = null;
    let unsubscribeOrders: (() => void) | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!isActive) return;
        
        try {
          const [available, orderBased, business] = await Promise.all([
            this.getAvailableProductsStats(),
            this.getOrderBasedProductsStats(),
            this.getBusinessStats()
          ]);

          if (isActive) {
            callback({ available, orderBased, business });
          }
        } catch (error) {
          console.error('Statistikani yangilashda xatolik:', error);
        }
      }, 1000); // 1 second debounce
    };

    try {
      // Less frequent updates to reduce BloomFilter load
      unsubscribeCakes = this.subscribeToRealtimeCakes(debouncedUpdate);
      unsubscribeOrders = this.subscribeToOrders(debouncedUpdate);
    } catch (error) {
      console.error('Subscription yaratishda xatolik:', error);
    }

    return () => {
      isActive = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      try {
        if (typeof unsubscribeCakes === 'function') {
          unsubscribeCakes();
        }
        if (typeof unsubscribeOrders === 'function') {
          unsubscribeOrders();  
        }
      } catch (error) {
        console.warn('Subscription o\'chirishda xatolik:', error);
      }
    };
  }

  // FOYDALANUVCHILAR BILAN ISHLASH (ADMIN UCHUN)

  // Barcha foydalanuvchilarni olish
  async getUsers(filters?: { 
    role?: string;
    blocked?: boolean; 
  }): Promise<UserData[]> {
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters?.blocked !== undefined) {
        q = query(q, where('blocked', '==', filters.blocked));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as UserData));
    } catch (error) {
      console.error('Foydalanuvchilarni olishda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi holatini yangilash
  async updateUserStatus(userId: string, updates: { blocked?: boolean; active?: boolean }): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Foydalanuvchi holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi rolini o'zgartirish
  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Foydalanuvchi rolini o\'zgartirishda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchini o'chirish
  async deleteUser(userId: string): Promise<void> {
    try {
      // Foydalanuvchining barcha ma'lumotlarini o'chirish
      await deleteDoc(doc(db, 'users', userId));
      
      // Foydalanuvchining buyurtmalarini ham o'chirish yoki arxivlash mumkin
      // Bu yerda faqat users collection dan o'chiramiz
    } catch (error) {
      console.error('Foydalanuvchini o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Yangi foydalanuvchi qo'shish
  async createUser(userData: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newUserData = {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        blocked: false,
        active: true
      };

      const docRef = await addDoc(collection(db, 'users'), newUserData);
      return docRef.id;
    } catch (error) {
      console.error('Foydalanuvchi yaratishda xatolik:', error);
      throw error;
    }
  }

  // BO'LIMLAR BILAN ISHLASH

  // Yangi bo'lim yaratish
  async createDepartment(departmentData: any): Promise<string> {
    try {
      const newDepartment = {
        ...departmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'departments'), newDepartment);
      console.log('✅ Yangi bo\'lim yaratildi:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Bo\'lim yaratishda xatolik:', error);
      throw error;
    }
  }

  // Barcha bo'limlarni olish
  async getDepartments(): Promise<any[]> {
    try {
      const q = query(collection(db, 'departments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('❌ Bo\'limlarni olishda xatolik:', error);
      // Bo'limlar mavjud bo'lmasa bo'sh array qaytarish
      return [];
    }
  }

  // Bo'limni yangilash
  async updateDepartment(departmentId: string, updates: any): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'departments', departmentId), updateData);
      console.log('✅ Bo\'lim yangilandi:', departmentId);
    } catch (error) {
      console.error('❌ Bo\'limni yangilashda xatolik:', error);
      throw error;
    }
  }

  // Bo'limni o'chirish
  async deleteDepartment(departmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      console.log('✅ Bo\'lim o\'chirildi:', departmentId);
    } catch (error) {
      console.error('❌ Bo\'limni o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Bitta bo'limni olish
  async getDepartmentById(departmentId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'departments', departmentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Bo\'limni olishda xatolik:', error);
      return null;
    }
  }

  // Bo'lim xodimlarini olish
  async getDepartmentMembers(departmentId: string): Promise<UserData[]> {
    try {
      const q = query(
        collection(db, 'users'), 
        where('departmentId', '==', departmentId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as UserData));
    } catch (error) {
      console.error('❌ Bo\'lim xodimlarini olishda xatolik:', error);
      return [];
    }
  }

  // Foydalanuvchini bo'limga tayinlash
  async assignUserToDepartment(userId: string, departmentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        departmentId,
        updatedAt: Timestamp.now()
      });

      // Bo'limdagi xodimlar sonini yangilash
      const departmentMembers = await this.getDepartmentMembers(departmentId);
      await updateDoc(doc(db, 'departments', departmentId), {
        memberCount: departmentMembers.length + 1,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limga tayinlandi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limga tayinlashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchini bo'limdan chiqarish
  async removeUserFromDepartment(userId: string, departmentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        departmentId: null,
        updatedAt: Timestamp.now()
      });

      // Bo'limdagi xodimlar sonini yangilash
      const departmentMembers = await this.getDepartmentMembers(departmentId);
      await updateDoc(doc(db, 'departments', departmentId), {
        memberCount: Math.max(0, departmentMembers.length - 1),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limdan chiqarildi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limdan chiqarishda xatolik:', error);
      throw error;
    }
  }

  // REAL-TIME YANGILANISHLAR

  // Tortlarni real-time kuzatish (BloomFilter optimized)
  subscribeToRealtimeCakes(callback: (cakes: Cake[]) => void, filters?: { 
    category?: string; 
    bakerId?: string; 
    shopId?: string;
    available?: boolean;
    productType?: 'baked' | 'ready';
  }) {
    let isActive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const createSubscription = () => {
      if (!isActive) return null;

      try {
        // Reduce query complexity to avoid BloomFilter issues
        let q = query(
          collection(db, 'cakes'), 
          orderBy('updatedAt', 'desc'),
          limit(50) // Reduced limit to prevent BloomFilter errors
        );

        // Apply only one filter at a time to reduce complexity
        if (filters?.bakerId) {
          q = query(q, where('bakerId', '==', filters.bakerId));
        } else if (filters?.shopId) {
          q = query(q, where('shopId', '==', filters.shopId));
        } else if (filters?.category) {
          q = query(q, where('category', '==', filters.category));
        } else if (filters?.productType) {
          q = query(q, where('productType', '==', filters.productType));
        } else if (filters?.available !== undefined) {
          q = query(q, where('available', '==', filters.available));
        }

        return onSnapshot(q, 
          {
            includeMetadataChanges: false // Reduce unnecessary updates
          },
          (querySnapshot) => {
            if (!isActive) return;

            try {
              let cakes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
              } as Cake));

              // Client-side filtering for multiple conditions to reduce server load
              if (filters) {
                cakes = cakes.filter(cake => {
                  if (filters.category && cake.category !== filters.category) return false;
                  if (filters.bakerId && cake.bakerId !== filters.bakerId) return false;
                  if (filters.shopId && cake.shopId !== filters.shopId) return false;
                  if (filters.available !== undefined && cake.available !== filters.available) return false;
                  if (filters.productType && cake.productType !== filters.productType) return false;
                  return true;
                });
              }

              retryCount = 0;
              callback(cakes);
            } catch (error) {
              console.error('❌ Cakes callback xatosi:', error);
              if (isActive) callback([]);
            }
          },
          (error) => {
            if (!isActive) return;

            // Handle BloomFilter errors specifically
            if (error.message?.includes('BloomFilter')) {
              console.warn('⚠️ BloomFilter xatosi, simple query bilan qayta urinish');
              // Fallback to simpler query
              const simpleQuery = query(
                collection(db, 'cakes'),
                orderBy('createdAt', 'desc'),
                limit(25)
              );
              
              return onSnapshot(simpleQuery, (snapshot) => {
                if (!isActive) return;
                const cakes = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate() || new Date(),
                  updatedAt: doc.data().updatedAt?.toDate() || new Date()
                } as Cake));
                callback(cakes);
              });
            }

            console.error('❌ Cakes subscription xatosi:', error);
            retryCount++;

            if (retryCount <= maxRetries) {
              const retryDelay = Math.min(2000 * retryCount, 10000);
              setTimeout(() => {
                if (isActive) createSubscription();
              }, retryDelay);
            } else {
              console.error('❌ Cakes subscription maksimal retry tugadi');
              if (isActive) callback([]);
            }
          }
        );
      } catch (error) {
        console.error('❌ Cakes subscription yaratishda xatolik:', error);
        return null;
      }
    };

    const unsubscribe = createSubscription();

    return () => {
      isActive = false;
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ Cakes subscription o\'chirishda xato:', error);
      }
    };
  }

  // Buyurtmalar holatini real-time kuzatish (BloomFilter optimized)
  subscribeToOrders(callback: (orders: Order[]) => void, filters?: { customerId?: string }) {
    let isSubscriptionActive = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const createSubscription = () => {
      if (!isSubscriptionActive) return null;
      
      let q;
      
      try {
        if (filters?.customerId) {
          console.log('🔄 Real-time subscription: Customer ID bo\'yicha', filters.customerId);
          // Specific customer uchun optimized query
          q = query(
            collection(db, 'orders'), 
            where('customerId', '==', filters.customerId),
            orderBy('updatedAt', 'desc'),
            limit(50) // Reduced limit for BloomFilter optimization
          );
        } else {
          console.log('🔄 Real-time subscription: Umumiy buyurtmalar');
          // General orders with reduced complexity
          q = query(
            collection(db, 'orders'), 
            orderBy('updatedAt', 'desc'), 
            limit(75) // Optimized limit
          );
        }

        return onSnapshot(q, 
          (querySnapshot) => {
            if (!isSubscriptionActive) return;
            
            try {
              const filterText = filters?.customerId ? `Customer ID (${filters.customerId})` : 'Umumiy';
              console.log(`📥 Real-time Orders (${filterText}): ${querySnapshot.docs.length} ta hujjat keldi`);
              
              const orders: Order[] = [];
              const changedDocs = querySnapshot.docChanges();
              
              // Change log
              changedDocs.forEach((change) => {
                if (change.type === 'modified') {
                  const data = change.doc.data();
                  console.log(`🔄 Order status changed: ${change.doc.id} -> ${data.status}`);
                }
              });

              querySnapshot.docs.forEach((doc) => {
                try {
                  const data = doc.data();
                  
                  // Customer filter bo'lsa, yana bir marta tekshirish
                  if (filters?.customerId && data.customerId !== filters.customerId) {
                    return; // Skip this order
                  }
                  
                  const order: Order = {
                    id: doc.id,
                    orderUniqueId: data.orderUniqueId,
                    customerId: data.customerId || '',
                    customerName: data.customerName || 'Noma\'lum',
                    customerPhone: data.customerPhone || '',
                    cakeId: data.cakeId || '',
                    cakeName: data.cakeName || '',
                    quantity: Math.max(1, data.quantity || 1),
                    amount: data.amount,
                    totalPrice: Math.max(0, data.totalPrice || 0),
                    status: data.status || 'pending',
                    deliveryAddress: data.deliveryAddress || '',
                    coordinates: data.coordinates,
                    paymentMethod: data.paymentMethod,
                    paymentType: data.paymentType,
                    notes: data.notes,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    deliveryTime: data.deliveryTime?.toDate()
                  };

                  orders.push(order);
                } catch (parseError) {
                  console.warn('⚠️ Hujjat parse qilishda xato:', doc.id, parseError);
                }
              });

              console.log(`✅ Real-time Orders (${filterText}): ${orders.length} ta buyurtma qayta ishlandi`);
              retryCount = 0; // Reset retry count on success
              callback(orders);

            } catch (error) {
              console.error('❌ Real-time orders callback xatosi:', error);
              if (isSubscriptionActive) {
                callback([]);
              }
            }
          }, 
          (error) => {
            if (!isSubscriptionActive) return;
            
            console.error('❌ Real-time orders subscription xatosi:', error);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              // Retry with exponential backoff
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`🔄 Orders subscription qayta urinish... (${retryCount}/${maxRetries}) - ${retryDelay}ms kutish`);
              
              setTimeout(() => {
                if (isSubscriptionActive) {
                  try {
                    createSubscription();
                  } catch (retryError) {
                    console.error('❌ Retry orders subscription xatosi:', retryError);
                  }
                }
              }, retryDelay);
            } else {
              console.error('❌ Orders subscription maksimal retry tugadi');
              if (isSubscriptionActive) {
                callback([]);
              }
            }
          }
        );
      } catch (error) {
        console.error('❌ Orders subscription yaratishda xatolik:', error);
        return null;
      }
    };

    const unsubscribe = createSubscription();

    return () => {
      isSubscriptionActive = false;
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ Orders subscription o\'chirishda xato:', error);
      }
    };
  }
}

export const dataService = new DataService();

// Buyurtmani bekor qilish uchun alohida export
export const cancelOrder = (orderId: string) => dataService.cancelOrder(orderId);

// Foydalanuvchi buyurtmalarini olish uchun alohida export
export const getUserOrders = (userId: string) => dataService.getOrdersByUserId(userId);