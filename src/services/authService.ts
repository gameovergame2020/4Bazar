import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types/user';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
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

class AuthService {
  // Telefon raqam bilan ro'yhatdan o'tish (email o'rniga telefon ishlatamiz)
  async registerWithPhone(phone: string, password: string, name: string, role: UserRole = 'customer'): Promise<UserData> {
    try {
      // Firebase Auth email formatini talab qiladi, shuning uchun telefon raqamni email formatiga o'tkazamiz
      const emailFormat = `${phone.replace(/[^0-9]/g, '')}@tortbazar.local`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, emailFormat, password);
      const user = userCredential.user;

      // Foydalanuvchi profilini yangilash
      await updateProfile(user, {
        displayName: name
      });

      // Firestore da foydalanuvchi ma'lumotlarini saqlash
      const userData: UserData = {
        id: user.uid,
        name,
        email: emailFormat,
        phone,
        role,
        joinDate: new Date().toISOString(),
        totalOrders: 0,
        favoriteCount: 0
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      return userData;
    } catch (error) {
      console.error('Ro\'yhatdan o\'tishda xatolik:', error);
      throw error;
    }
  }

  // Telefon raqam bilan kirish
  async loginWithPhone(phone: string, password: string): Promise<UserData> {
    try {
      const emailFormat = `${phone.replace(/[^0-9]/g, '')}@tortbazar.local`;
      
      const userCredential = await signInWithEmailAndPassword(auth, emailFormat, password);
      const user = userCredential.user;

      // Firestore dan foydalanuvchi ma'lumotlarini olish
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      } else {
        throw new Error('Foydalanuvchi ma\'lumotlari topilmadi');
      }
    } catch (error) {
      console.error('Kirishda xatolik:', error);
      throw error;
    }
  }

  // Chiqish
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Chiqishda xatolik:', error);
      throw error;
    }
  }

  // Parolni tiklash
  async resetPassword(phone: string): Promise<void> {
    try {
      const emailFormat = `${phone.replace(/[^0-9]/g, '')}@tortbazar.local`;
      await sendPasswordResetEmail(auth, emailFormat);
    } catch (error) {
      console.error('Parolni tiklashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi ma'lumotlarini yangilash
  async updateUserData(userId: string, data: Partial<UserData>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      console.error('Ma\'lumotlarni yangilashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi ma'lumotlarini olish
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() as UserData : null;
    } catch (error) {
      console.error('Ma\'lumotlarni olishda xatolik:', error);
      throw error;
    }
  }

  // Auth holatini kuzatish
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Joriy foydalanuvchini olish
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();