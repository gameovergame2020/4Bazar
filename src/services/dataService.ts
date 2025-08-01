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

  // REAL-TIME YANGILANISHLAR

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