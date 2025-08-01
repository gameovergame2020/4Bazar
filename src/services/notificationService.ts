import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id?: string;
  userId: string;
  type: 'order' | 'promotion' | 'reminder' | 'system' | 'delivery' | 'payment';
  title: string;
  message: string;
  data?: any; // Qo'shimcha ma'lumotlar (buyurtma ID, tort ID va h.k.)
  read: boolean;
  createdAt: Date;
  expiresAt?: Date; // Bildirishnoma muddati
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string; // Bosilganda o'tish kerak bo'lgan URL
}

class NotificationService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  // Yangi bildirishnoma yaratish
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationData = {
        ...notification,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Bildirishnoma yaratishda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi uchun bildirishnomalarni olish
  async getUserNotifications(userId: string, limitCount: number = 20): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      } as Notification));
    } catch (error) {
      console.error('Bildirishnomalarni olishda xatolik:', error);
      throw error;
    }
  }

  // Real-time bildirishnomalarni kuzatish
  subscribeToUserNotifications(
    userId: string, 
    callback: (notifications: Notification[]) => void,
    limitCount: number = 20
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      } as Notification));
      
      callback(notifications);
    });

    this.unsubscribeCallbacks.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Bildirishnomani o'qilgan deb belgilash
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Bildirishnomani o\'qilgan deb belgilashda xatolik:', error);
      throw error;
    }
  }

  // Barcha bildirishnomalarni o'qilgan deb belgilash
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Barcha bildirishnomalarni o\'qilgan deb belgilashda xatolik:', error);
      throw error;
    }
  }

  // Bildirishnomani o'chirish
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Bildirishnomani o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Eski bildirishnomalarni tozalash
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'notifications'),
        where('expiresAt', '<=', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Eski bildirishnomalarni tozalashda xatolik:', error);
      throw error;
    }
  }

  // Buyurtma uchun bildirishnoma yaratish
  async createOrderNotification(
    userId: string, 
    orderId: string, 
    orderStatus: string, 
    cakeName: string
  ): Promise<void> {
    const statusMessages = {
      'accepted': {
        title: 'Buyurtma qabul qilindi!',
        message: `${cakeName} uchun buyurtmangiz qabul qilindi va tayyorlanishni boshlaydi.`,
        type: 'order' as const,
        priority: 'medium' as const
      },
      'preparing': {
        title: 'Buyurtma tayyorlanmoqda',
        message: `${cakeName} hozir tayyorlanmoqda. Tez orada tayyor bo'ladi!`,
        type: 'order' as const,
        priority: 'medium' as const
      },
      'ready': {
        title: 'Buyurtma tayyor!',
        message: `${cakeName} tayyor bo'ldi va tez orada yetkazib beriladi.`,
        type: 'delivery' as const,
        priority: 'high' as const
      },
      'delivering': {
        title: 'Buyurtma yo\'lda!',
        message: `${cakeName} sizga yetkazib berilmoqda. Kuryer tez orada yetib keladi.`,
        type: 'delivery' as const,
        priority: 'high' as const
      },
      'delivered': {
        title: 'Buyurtma yetkazildi!',
        message: `${cakeName} muvaffaqiyatli yetkazib berildi. Yoqtirgan bo'lsangiz, baho bering!`,
        type: 'order' as const,
        priority: 'medium' as const
      }
    };

    const config = statusMessages[orderStatus];
    if (!config) return;

    await this.createNotification({
      userId,
      type: config.type,
      title: config.title,
      message: config.message,
      data: { orderId, orderStatus, cakeName },
      read: false,
      priority: config.priority,
      actionUrl: `/orders/${orderId}`
    });
  }

  // Aksiya bildirishnomasi yaratish
  async createPromotionNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    promotionData?: any
  ): Promise<void> {
    const promises = userIds.map(userId => 
      this.createNotification({
        userId,
        type: 'promotion',
        title,
        message,
        data: promotionData,
        read: false,
        priority: 'medium',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 kun
      })
    );

    await Promise.all(promises);
  }

  // Tizim bildirishnomasi yaratish
  async createSystemNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    const promises = userIds.map(userId => 
      this.createNotification({
        userId,
        type: 'system',
        title,
        message,
        read: false,
        priority
      })
    );

    await Promise.all(promises);
  }

  // Barcha subscription'larni to'xtatish
  unsubscribeAll(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }

  // O'qilmagan bildirishnomalar sonini olish
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('O\'qilmagan bildirishnomalar sonini olishda xatolik:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();