import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types/user';
import { UserData } from './shared/types';

class AuthService {
  // Telefon raqam bilan ro'yhatdan o'tish (email o'rniga telefon ishlatamiz)
  async registerWithPhone(phone: string, password: string, name: string, role: UserRole = 'customer'): Promise<UserData> {
    try {
      if (!auth || !db) {
        throw new Error('Firebase xizmatlar ishga tushirilmagan. Firebase konfiguratsiyasini tekshiring.');
      }

      // Firebase Auth email formatini talab qiladi, shuning uchun telefon raqamni email formatiga o'tkazamiz
      const emailFormat = `${phone.replace(/[^0-9]/g, '')}@tortbazar.local`;

      const userCredential = await createUserWithEmailAndPassword(auth, emailFormat, password);
      const user = userCredential.user;

      // Unique username yaratish
      const username = await this.generateUniqueUsername(name);

      // Foydalanuvchi profilini yangilash
      await updateProfile(user, {
        displayName: name
      });

      // Firestore da foydalanuvchi ma'lumotlarini saqlash
      const userData: UserData = {
        id: user.uid,
        name,
        username,
        email: emailFormat,
        phone,
        role,
        joinDate: new Date().toISOString(),
        totalOrders: 0,
        favoriteCount: 0,
        isVerified: false
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
      if (!auth || !db) {
        throw new Error('Firebase xizmatlar ishga tushirilmagan. Firebase konfiguratsiyasini tekshiring.');
      }

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
      if (!auth) {
        console.warn('Firebase Auth is not initialized');
        return;
      }
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
    if (!auth) {
      console.warn('Firebase Auth is not initialized');
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  }

  // Joriy foydalanuvchini olish
  getCurrentUser(): User | null {
    if (!auth) {
      console.warn('Firebase Auth is not initialized');
      return null;
    }
    return auth.currentUser;
  }

  // Username yaratish va tekshirish
  private async generateUniqueUsername(name: string): Promise<string> {
    // Ismdan username yaratish (faqat harflar va raqamlar)
    let baseUsername = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);

    if (baseUsername.length < 3) {
      baseUsername = 'user' + baseUsername;
    }

    let username = baseUsername;
    let counter = 1;

    // Username unique ekanligini tekshirish
    while (await this.isUsernameExists(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  // Username mavjudligini tekshirish
  private async isUsernameExists(username: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Username tekshirishda xatolik:', error);
      return false;
    }
  }

  // Username o'zgartirish so'rovi yuborish (Admin tasdig'ini kutadi)
  async requestUsernameChange(userId: string, newUsername: string): Promise<boolean> {
    try {
      // Yangi username formatini tekshirish
      if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
        throw new Error('Username faqat kichik harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak (3-20 ta belgi)');
      }

      // Username mavjudligini tekshirish
      if (await this.isUsernameExists(newUsername)) {
        throw new Error('Bu username allaqachon band');
      }

      // Username o'zgartirish so'rovini saqlash
      const requestData = {
        userId,
        currentUsername: (await this.getUserData(userId))?.username || '',
        requestedUsername: newUsername,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null
      };

      await setDoc(doc(db, 'usernameRequests', `${userId}_${Date.now()}`), requestData);

      return true;
    } catch (error) {
      console.error('Username o\'zgartirish so\'rovida xatolik:', error);
      throw error;
    }
  }

  // Admin tomonidan username o'zgartirishni tasdiqlash
  async approveUsernameChange(requestId: string, adminId: string): Promise<boolean> {
    try {
      const requestDoc = await getDoc(doc(db, 'usernameRequests', requestId));

      if (!requestDoc.exists()) {
        throw new Error('So\'rov topilmadi');
      }

      const requestData = requestDoc.data();

      if (requestData.status !== 'pending') {
        throw new Error('Bu so\'rov allaqachon ko\'rib chiqilgan');
      }

      // Username hali ham mavjud emasligini tekshirish
      if (await this.isUsernameExists(requestData.requestedUsername)) {
        throw new Error('Bu username allaqachon band');
      }

      // Foydalanuvchi username-ini yangilash
      await updateDoc(doc(db, 'users', requestData.userId), {
        username: requestData.requestedUsername
      });

      // So'rov holatini yangilash
      await updateDoc(doc(db, 'usernameRequests', requestId), {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Username tasdiqalaganda xatolik:', error);
      throw error;
    }
  }

  // Admin tomonidan username o'zgartirishni rad etish
  async rejectUsernameChange(requestId: string, adminId: string, reason?: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'usernameRequests', requestId), {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || 'Admin tomonidan rad etildi'
      });

      return true;
    } catch (error) {
      console.error('Username rad qilishda xatolik:', error);
      throw error;
    }
  }

  // Kutilayotgan username so'rovlarini olish
  async getPendingUsernameRequests(): Promise<any[]> {
    try {
      const requestsRef = collection(db, 'usernameRequests');
      const q = query(requestsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('So\'rovlarni olishda xatolik:', error);
      return [];
    }
  }

  // Foydalanuvchining username so'rovlarini olish
  async getUserUsernameRequests(userId: string): Promise<any[]> {
    try {
      const requestsRef = collection(db, 'usernameRequests');
      const q = query(requestsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    } catch (error) {
      console.error('Foydalanuvchi so\'rovlarini olishda xatolik:', error);
      return [];
    }
  }

  // Username yangilash (faqat admin uchun)
  async updateUsername(userId: string, newUsername: string): Promise<boolean> {
    try {
      // Yangi username formatini tekshirish
      if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
        throw new Error('Username faqat kichik harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak (3-20 ta belgi)');
      }

      // Username mavjudligini tekshirish
      if (await this.isUsernameExists(newUsername)) {
        throw new Error('Bu username allaqachon band');
      }

      await updateDoc(doc(db, 'users', userId), {
        username: newUsername
      });

      return true;
    } catch (error) {
      console.error('Username yangilashda xatolik:', error);
      throw error;
    }
  }

  // Username bo'yicha foydalanuvchi qidirish
  async findUserByUsername(username: string): Promise<UserData | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as UserData;
    } catch (error) {
      console.error('Username bo\'yicha qidirishda xatolik:', error);
      return null;
    }
  }

  //Admin tomonidan foydalanuvchini tasdiqlash
  async verifyUser(userId: string, adminId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminId
      });
      return true;
    } catch (error) {
      console.error('Foydalanuvchini tasdiqlashda xatolik:', error);
      throw error;
    }
  }

  //Admin tomonidan foydalanuvchini bekor qilish
  async unverifyUser(userId: string, adminId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: false,
        unverifiedAt: new Date().toISOString(),
        unverifiedBy: adminId
      });
      return true;
    } catch (error) {
      console.error('Foydalanuvchini bekor qilishda xatolik:', error);
      throw error;
    }
  }
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'baker' | 'shop' | 'courier' | 'operator' | 'admin';
  avatar?: string;
  address?: string;
  birthDate?: string;
  joinDate: string;
  username?: string;
  blocked?: boolean;
  isVerified?: boolean; // Admin tomonidan tasdiqlangan
  verifiedAt?: string;
  verifiedBy?: string;
  unverifiedAt?: string;
  unverifiedBy?: string;
}

export const authService = new AuthService();