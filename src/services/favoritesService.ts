
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  db
} from './shared/firebaseConfig';

export interface Favorite {
  id?: string;
  userId: string;
  cakeId: string;
  cakeName: string;
  cakeImage: string;
  cakePrice: number;
  shopName?: string;
  createdAt: Date;
}

class FavoritesService {
  // Sevimlilar ro'yxatiga qo'shish
  async addToFavorites(userId: string, cakeId: string, cakeData: {
    name: string;
    image: string;
    price: number;
    shopName?: string;
  }): Promise<string> {
    try {
      // Avval mavjudligini tekshirish
      const existingFavorite = await this.checkIfFavorite(userId, cakeId);
      if (existingFavorite) {
        throw new Error('Bu mahsulot allaqachon sevimlilar ro\'yxatida');
      }

      const favoriteData = {
        userId,
        cakeId,
        cakeName: cakeData.name,
        cakeImage: cakeData.image,
        cakePrice: cakeData.price,
        shopName: cakeData.shopName || '',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'favorites'), favoriteData);
      console.log('✅ Sevimlilar ro\'yxatiga qo\'shildi:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Sevimlilar ro\'yxatiga qo\'shishda xatolik:', error);
      throw error;
    }
  }

  // Sevimlilar ro'yxatidan o'chirish
  async removeFromFavorites(userId: string, cakeId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('cakeId', '==', cakeId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Sevimlilar ro\'yxatida topilmadi');
      }

      // Barcha mos kelgan hujjatlarni o'chirish
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log('✅ Sevimlilar ro\'yxatidan o\'chirildi');
    } catch (error) {
      console.error('❌ Sevimlilar ro\'yxatidan o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi sevimlilarini olish
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Favorite));
    } catch (error) {
      console.error('❌ Sevimlilarni olishda xatolik:', error);
      return [];
    }
  }

  // Mahsulot sevimlilar ro'yxatida ekanligini tekshirish
  async checkIfFavorite(userId: string, cakeId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('cakeId', '==', cakeId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Sevimli ekanligini tekshirishda xatolik:', error);
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
