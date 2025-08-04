
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  db,
  storage
} from './shared/firebaseConfig';

class StorageService {
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
}

export const storageService = new StorageService();
