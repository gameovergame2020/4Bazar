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
  quantity?: number;
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
  totalPrice: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  deliveryTime?: Date;
  notes?: string;
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
      const cakeData = {
        ...cake,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
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
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
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

  // Buyurtmalar holatini real-time kuzatish
  subscribeToOrders(callback: (orders: Order[]) => void, filters?: { customerId?: string }) {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    if (filters?.customerId) {
      q = query(q, where('customerId', '==', filters.customerId));
    }

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        deliveryTime: doc.data().deliveryTime?.toDate()
      } as Order));
      
      callback(orders);
    });
  }
}

export const dataService = new DataService();