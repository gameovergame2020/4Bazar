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
  Timestamp,
  db
} from './shared/firebaseConfig';
import { Order } from './shared/types';
import { productService } from './productService';

class OrderService {
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
        const result = await productService.processOrderQuantity(order.cakeId, order.quantity);
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
  async getOrders(filters?: { customerPhone?: string; status?: string; customerId?: string }): Promise<Order[]> {
    try {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

      if (filters?.customerPhone) {
        q = query(q, where('customerPhone', '==', filters.customerPhone));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.customerId) {
        q = query(q, where('customerId', '==', filters.customerId));
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

      console.log('🚫 Buyurtma bekor qilindi:', {
        orderId,
        cakeId: orderData.cakeId,
        quantity: orderData.quantity,
        cakeName: orderData.cakeName,
        fromStock: orderData.fromStock
      });

      // Buyurtma holatini cancelled ga o'zgartirish
      await this.updateOrderStatus(orderId, 'cancelled');

      // Mahsulot quantity/amount ni qaytarish
      try {
        // fromStock qiymati bo'yicha to'g'ri qaytarish
        const fromStockValue = orderData.fromStock === true;

        console.log('🔍 Buyurtma bekor qilish detallari:', {
          orderId,
          fromStock: orderData.fromStock,
          fromStockValue,
          cakeId: orderData.cakeId,
          quantity: orderData.quantity
        });

        if (fromStockValue) {
          console.log('📦 "Hozir mavjud" dan bekor qilingan - quantity qaytariladi');
        } else {
          console.log('📦 "Buyurtma uchun" dan bekor qilingan - amount kamayadi, rejectAmount oshadi');
        }

        await productService.revertOrderQuantity(orderData.cakeId, orderData.quantity, fromStockValue);
        console.log('✅ Buyurtma bekor qilindi, mahsulot holati to\'g\'ri yangilandi');
      } catch (revertError) {
        console.error('❌ Mahsulot holatini qaytarishda xato:', revertError);
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

        // Firebase initialization check
        if (!db) {
          console.error('❌ Firebase Firestore is not initialized');
          return () => {}; // Return empty unsubscribe function
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
}

export const orderService = new OrderService();

// Buyurtmani bekor qilish uchun alohida export
export const cancelOrder = (orderId: string) => orderService.cancelOrder(orderId);

// Foydalanuvchi buyurtmalarini olish uchun alohida export
export const getUserOrders = (userId: string) => orderService.getOrdersByUserId(userId);