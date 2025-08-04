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

  // Username yangilash
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
}

export const authService = new AuthService();