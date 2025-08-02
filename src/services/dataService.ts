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
  quantity?: number; // Mavjud miqdor
  amount?: number; // Buyurtma berilgan miqdor
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Buyurtmalar uchun interface
export interface Order {
  id?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  cakeId: string;
  cakeName: string;
  quantity: number;
  amount?: number; // Mahsulot amount maydonini tracking qilish uchun
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
  customerId: string;
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
  // TORTLAR BILAN ISHLASH

  // Yangi tort qo'shish
  async addCake(cake: Omit<Cake, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const cakeData: any = {
        ...cake,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Baker mahsulotlari uchun logika
      if (cake.productType === 'baked') {
        if (cake.available) {
          // "Hozir mavjud" baker mahsulotlari - amount da hisoblansin
          cakeData.amount = cake.amount !== undefined ? cake.amount : 0;
        } else {
          // "Buyurtma uchun" baker mahsulotlari - quantity da hisoblansin
          if (cake.quantity !== undefined && cake.quantity !== null) {
            cakeData.quantity = cake.quantity;
          }
        }
      } else if (cake.productType === 'ready') {
        // Shop mahsulotlari - doim quantity da hisoblansin
        cakeData.quantity = cake.quantity !== undefined ? cake.quantity : 0;
      }

      // undefined qiymatlarni olib tashlash
      Object.keys(cakeData).forEach(key => {
        if (cakeData[key] === undefined) {
          delete cakeData[key];
        }
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
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const orderData = {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      return docRef.id;
    } catch (error) {
      console.error('Buyurtma yaratishda xatolik:', error);
      throw error;
    }
  }

  // Telefon raqamini normalize qilish funksiyasi
  private normalizePhone(phone: string): string {
    // Barcha harflar va maxsus belgilarni olib tashlash
    const numbersOnly = phone.replace(/\D/g, '');
    
    // Agar +998 bilan boshlansa
    if (numbersOnly.startsWith('998')) {
      return `+${numbersOnly}`;
    }
    
    // Agar 998 siz boshlansa
    if (numbersOnly.length === 9) {
      return `+998${numbersOnly}`;
    }
    
    // Agar uzun bo'lsa va oxirgi 9 ta raqamni olish
    if (numbersOnly.length > 9) {
      const last9 = numbersOnly.slice(-9);
      return `+998${last9}`;
    }
    
    return phone;
  }

  // Foydalanuvchi buyurtmalarini telefon raqami bo'yicha olish (yaxshilangan)
  async getOrdersByCustomerPhone(customerPhone: string): Promise<Order[]> {
    try {
      console.log('📱 Buyurtmalar yuklanmoqda telefon:', customerPhone);

      if (!customerPhone || customerPhone.trim() === '') {
        console.log('⚠️ Bo\'sh telefon raqami');
        return [];
      }

      // Step 1: Barcha buyurtmalarni olish (eng samarali yondashuv)
      console.log('📊 Barcha buyurtmalar yuklanmoqda...');
      const allOrdersQuery = query(
        collection(db, 'orders'), 
        orderBy('createdAt', 'desc')
      );
      const allOrdersSnapshot = await getDocs(allOrdersQuery);
      console.log('📋 Jami buyurtmalar:', allOrdersSnapshot.size, 'ta');

      if (allOrdersSnapshot.empty) {
        console.log('📭 Bazada buyurtma yo\'q');
        return [];
      }

      // Step 2: Telefon raqamini normalize qilish
      const cleanPhone = customerPhone.replace(/\D/g, '');
      console.log('🔍 Tozalangan telefon:', cleanPhone);

      if (cleanPhone.length < 7) {
        console.log('⚠️ Telefon raqami juda qisqa:', cleanPhone.length, 'belgi');
        return [];
      }

      // Step 3: Telefon variantlarini yaratish
      const phoneVariants = new Set([
        cleanPhone,
        `+998${cleanPhone.length === 9 ? cleanPhone : cleanPhone.slice(-9)}`,
        `998${cleanPhone.length === 9 ? cleanPhone : cleanPhone.slice(-9)}`,
        cleanPhone.startsWith('998') ? cleanPhone.substring(3) : cleanPhone,
        customerPhone.trim()
      ]);

      console.log('📱 Qidirilayotgan variantlar:', Array.from(phoneVariants));

      // Step 4: Buyurtmalarni filtrlash
      const matchedOrders: Order[] = [];

      allOrdersSnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (!data.customerPhone) return;
        
        const orderPhoneClean = data.customerPhone.replace(/\D/g, '');
        const orderPhoneOriginal = data.customerPhone.trim();
        
        // Turli xil formatlarni tekshirish
        let isMatch = false;
        
        // 1. To'liq mos kelish
        if (phoneVariants.has(orderPhoneClean) || phoneVariants.has(orderPhoneOriginal)) {
          isMatch = true;
        }
        
        // 2. Oxirgi 9 raqamni solishtirish (O'zbekiston uchun)
        if (!isMatch && orderPhoneClean.length >= 9 && cleanPhone.length >= 9) {
          const orderLast9 = orderPhoneClean.slice(-9);
          const userLast9 = cleanPhone.slice(-9);
          if (orderLast9 === userLast9) {
            isMatch = true;
          }
        }
        
        // 3. 998 prefiksi bilan/siz
        if (!isMatch) {
          if (cleanPhone.startsWith('998') && orderPhoneClean === cleanPhone.substring(3)) {
            isMatch = true;
          }
          if (orderPhoneClean.startsWith('998') && cleanPhone === orderPhoneClean.substring(3)) {
            isMatch = true;
          }
        }

        if (isMatch) {
          try {
            const order: Order = {
              id: doc.id,
              customerId: data.customerId || 'unknown',
              customerName: data.customerName || 'Noma\'lum',
              customerPhone: data.customerPhone || '',
              cakeId: data.cakeId || '',
              cakeName: data.cakeName || '',
              quantity: data.quantity || 1,
              amount: data.amount,
              totalPrice: data.totalPrice || 0,
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

            matchedOrders.push(order);
          } catch (parseError) {
            console.warn('⚠️ Buyurtma parse qilishda xato:', doc.id, parseError);
          }
        }
      });

      // Step 5: Duplikatlarni olib tashlash va saralash
      const uniqueOrders = matchedOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );

      const sortedOrders = uniqueOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('✅ Telefon bo\'yicha topildi:', sortedOrders.length, 'ta buyurtma');
      
      if (sortedOrders.length > 0) {
        console.log('📋 Topilgan buyurtmalar:', sortedOrders.slice(0, 5).map(order => ({
          id: order.id?.slice(-8),
          cake: order.cakeName,
          status: order.status,
          phone: order.customerPhone,
          date: order.createdAt.toDateString()
        })));
      } else {
        console.log('🔍 Telefon bo\'yicha buyurtma topilmadi. Bazadagi birinchi 3 ta buyurtma:');
        allOrdersSnapshot.docs.slice(0, 3).forEach(doc => {
          const data = doc.data();
          console.log(`  - ${doc.id.slice(-8)}: ${data.customerPhone} (${data.customerName})`);
        });
      }
      
      return sortedOrders;
    } catch (error) {
      console.error('❌ Buyurtmalarni yuklashda xato:', error);
      return [];
    }
  }

  // Telefon raqami variantlarini yaratish
  private generatePhoneVariants(cleanPhone: string): string[] {
    const variants = [cleanPhone];
    
    // +998 bilan boshlash
    if (!cleanPhone.startsWith('998')) {
      variants.push(`998${cleanPhone}`);
    }
    
    // 998 siz versiya
    if (cleanPhone.startsWith('998')) {
      variants.push(cleanPhone.substring(3));
    }
    
    return variants;
  }

  // Telefon raqamlarini solishtirish
  private comparePhoneNumbers(orderPhone: string, searchPhone: string, searchVariants: string[]): boolean {
    if (!orderPhone || !searchPhone) return false;
    
    // 1. To'liq mos kelish
    if (orderPhone === searchPhone) return true;
    
    // 2. Variantlar bilan solishtirish
    for (const variant of searchVariants) {
      if (orderPhone === variant) return true;
    }
    
    // 3. Oxirgi 9 raqam mos kelish (O'zbekiston uchun)
    if (orderPhone.length >= 9 && searchPhone.length >= 9) {
      const orderLast9 = orderPhone.slice(-9);
      const searchLast9 = searchPhone.slice(-9);
      if (orderLast9 === searchLast9) return true;
    }
    
    // 4. Oxirgi 7 raqam mos kelish
    if (orderPhone.length >= 7 && searchPhone.length >= 7) {
      const orderLast7 = orderPhone.slice(-7);
      const searchLast7 = searchPhone.slice(-7);
      if (orderLast7 === searchLast7) return true;
    }
    
    // 5. Ichida mavjudlik (ehtiyotkorlik bilan)
    if (orderPhone.length >= 8 && searchPhone.length >= 8) {
      if (orderPhone.includes(searchPhone) || searchPhone.includes(orderPhone)) {
        return true;
      }
    }
    
    return false;
  }

  // Buyurtmalarni olish
  async getOrders(filters?: { customerId?: string; status?: string }): Promise<Order[]> {
    try {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

      if (filters?.customerId) {
        q = query(q, where('customerId', '==', filters.customerId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
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
          type: 'refund',
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
    customerId?: string; 
    status?: string;
    assignedTo?: string;
    priority?: string;
  }): Promise<SupportTicket[]> {
    try {
      let q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));

      if (filters?.customerId) {
        q = query(q, where('customerId', '==', filters.customerId));
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

      let newQuantity = cake.quantity || 0;
      let newAmount = cake.amount || 0;

      if (isOrder) {
        // Buyurtma berilganda - quantity kamayadi, amount oshadi
        newQuantity = Math.max(0, newQuantity - Math.abs(quantityChange));
        newAmount += Math.abs(quantityChange);
      } else {
        // Mahsulot qo'shilganda - quantity oshadi
        newQuantity += Math.abs(quantityChange);
      }

      await this.updateCake(cakeId, {
        quantity: newQuantity,
        amount: newAmount,
        available: newQuantity > 0
      });
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
  async processOrderQuantity(cakeId: string, orderQuantity: number): Promise<void> {
    await this.updateProductQuantityAndAmount(cakeId, orderQuantity, true);
  }

  // Buyurtma bekor qilinganda mahsulot miqdorini qaytarish va amount kamaytirish
  async revertOrderQuantity(cakeId: string, orderQuantity: number): Promise<void> {
    try {
      const cake = await this.getCakeById(cakeId);
      if (!cake) throw new Error('Mahsulot topilmadi');

      const newQuantity = (cake.quantity || 0) + orderQuantity;
      const newAmount = Math.max(0, (cake.amount || 0) - orderQuantity);

      await this.updateCake(cakeId, {
        quantity: newQuantity,
        amount: newAmount,
        available: newQuantity > 0
      });
    } catch (error) {
      console.error('Buyurtma bekor qilishda xatolik:', error);
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

  // Real-time statistika kuzatish
  subscribeToStats(callback: (stats: {
    available: any;
    orderBased: any;
    business: any;
  }) => void) {
    // Tortlar va buyurtmalar o'zgarganda statistikani yangilash
    const unsubscribeCakes = this.subscribeToRealtimeCakes(async () => {
      try {
        const [available, orderBased, business] = await Promise.all([
          this.getAvailableProductsStats(),
          this.getOrderBasedProductsStats(),
          this.getBusinessStats()
        ]);

        callback({ available, orderBased, business });
      } catch (error) {
        console.error('Statistikani yangilashda xatolik:', error);
      }
    });

    const unsubscribeOrders = this.subscribeToOrders(async () => {
      try {
        const [available, orderBased, business] = await Promise.all([
          this.getAvailableProductsStats(),
          this.getOrderBasedProductsStats(),
          this.getBusinessStats()
        ]);

        callback({ available, orderBased, business });
      } catch (error) {
        console.error('Statistikani yangilashda xatolik:', error);
      }
    });

    return () => {
      if (typeof unsubscribeCakes === 'function') {
        unsubscribeCakes();
      }
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
    };
  }

  // REAL-TIME YANGILANISHLAR

  // Tortlarni real-time kuzatish
  subscribeToRealtimeCakes(callback: (cakes: Cake[]) => void, filters?: { 
    category?: string; 
    bakerId?: string; 
    shopId?: string;
    available?: boolean;
    productType?: 'baked' | 'ready';
  }) {
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

    return onSnapshot(q, (querySnapshot) => {
      const cakes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Cake));

      callback(cakes);
    });
  }

  // Buyurtmalar holatini real-time kuzatish (optimallashtirilgan)
  subscribeToOrders(callback: (orders: Order[]) => void, filters?: { customerId?: string }) {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)); // Limit qo'shish

    if (filters?.customerId) {
      q = query(q, where('customerId', '==', filters.customerId));
    }

    return onSnapshot(q, (querySnapshot) => {
      try {
        const orders = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerId: data.customerId || 'unknown',
            customerName: data.customerName || 'Noma\'lum',
            customerPhone: data.customerPhone || '',
            cakeId: data.cakeId || '',
            cakeName: data.cakeName || '',
            quantity: data.quantity || 1,
            amount: data.amount,
            totalPrice: data.totalPrice || 0,
            status: data.status || 'pending',
            deliveryAddress: data.deliveryAddress || '',
            coordinates: data.coordinates,
            paymentMethod: data.paymentMethod,
            paymentType: data.paymentType,
            notes: data.notes,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            deliveryTime: data.deliveryTime?.toDate()
          } as Order;
        });

        callback(orders);
      } catch (error) {
        console.error('❌ Subscription callback xatosi:', error);
        callback([]); // Empty array on error
      }
    }, (error) => {
      console.error('❌ Subscription xatosi:', error);
      callback([]); // Empty array on error
    });
  }
}

export const dataService = new DataService();