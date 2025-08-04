
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  db
} from './shared/firebaseConfig';
import { UserData } from './shared/types';

class UserService {
  // Barcha foydalanuvchilarni olish
  async getUsers(filters?: { 
    role?: string;
    blocked?: boolean; 
  }): Promise<UserData[]> {
    try {
      let q = query(collection(db, 'users'));

      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters?.blocked !== undefined) {
        q = query(q, where('blocked', '==', filters.blocked));
      }

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinDate: data.createdAt?.toDate()?.toISOString() || data.joinDate || new Date().toISOString(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          blocked: data.blocked || false,
          active: data.active !== undefined ? data.active : true
        } as UserData;
      });
      
      console.log('UserService getUsers natijasi:', users);
      return users;
    } catch (error) {
      console.error('Foydalanuvchilarni olishda xatolik:', error);
      // Xato bo'lsa ham bo'sh array qaytarish
      return [];
    }
  }

  // Foydalanuvchi holatini yangilash
  async updateUserStatus(userId: string, updates: { blocked?: boolean; active?: boolean }): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Foydalanuvchi holatini yangilashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchi rolini o'zgartirish
  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Foydalanuvchi rolini o\'zgartirishda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchini o'chirish
  async deleteUser(userId: string): Promise<void> {
    try {
      // Foydalanuvchining barcha ma'lumotlarini o'chirish
      await deleteDoc(doc(db, 'users', userId));
      
      // Foydalanuvchining buyurtmalarini ham o'chirish yoki arxivlash mumkin
      // Bu yerda faqat users collection dan o'chiramiz
    } catch (error) {
      console.error('Foydalanuvchini o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Yangi foydalanuvchi qo'shish
  async createUser(userData: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newUserData = {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        blocked: false,
        active: true
      };

      const docRef = await addDoc(collection(db, 'users'), newUserData);
      return docRef.id;
    } catch (error) {
      console.error('Foydalanuvchi yaratishda xatolik:', error);
      throw error;
    }
  }

  // BO'LIMLAR BILAN ISHLASH

  // Yangi bo'lim yaratish
  async createDepartment(departmentData: any): Promise<string> {
    try {
      const newDepartment = {
        ...departmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'departments'), newDepartment);
      console.log('✅ Yangi bo\'lim yaratildi:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Bo\'lim yaratishda xatolik:', error);
      throw error;
    }
  }

  // Barcha bo'limlarni olish
  async getDepartments(): Promise<any[]> {
    try {
      const q = query(collection(db, 'departments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('❌ Bo\'limlarni olishda xatolik:', error);
      // Bo'limlar mavjud bo'lmasa bo'sh array qaytarish
      return [];
    }
  }

  // Bo'limni yangilash
  async updateDepartment(departmentId: string, updates: any): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'departments', departmentId), updateData);
      console.log('✅ Bo\'lim yangilandi:', departmentId);
    } catch (error) {
      console.error('❌ Bo\'limni yangilashda xatolik:', error);
      throw error;
    }
  }

  // Bo'limni o'chirish
  async deleteDepartment(departmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      console.log('✅ Bo\'lim o\'chirildi:', departmentId);
    } catch (error) {
      console.error('❌ Bo\'limni o\'chirishda xatolik:', error);
      throw error;
    }
  }

  // Bo'lim xodimlarini olish
  async getDepartmentMembers(departmentId: string): Promise<UserData[]> {
    try {
      const q = query(
        collection(db, 'users'), 
        where('departmentId', '==', departmentId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as UserData));
    } catch (error) {
      console.error('❌ Bo\'lim xodimlarini olishda xatolik:', error);
      return [];
    }
  }

  // Foydalanuvchini bo'limga tayinlash
  async assignUserToDepartment(userId: string, departmentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        departmentId,
        updatedAt: Timestamp.now()
      });

      // Bo'limdagi xodimlar sonini yangilash
      const departmentMembers = await this.getDepartmentMembers(departmentId);
      await updateDoc(doc(db, 'departments', departmentId), {
        memberCount: departmentMembers.length + 1,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limga tayinlandi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limga tayinlashda xatolik:', error);
      throw error;
    }
  }

  // Foydalanuvchini bo'limdan chiqarish
  async removeUserFromDepartment(userId: string, departmentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        departmentId: null,
        updatedAt: Timestamp.now()
      });

      // Bo'limdagi xodimlar sonini yangilash
      const departmentMembers = await this.getDepartmentMembers(departmentId);
      await updateDoc(doc(db, 'departments', departmentId), {
        memberCount: Math.max(0, departmentMembers.length - 1),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Foydalanuvchi bo\'limdan chiqarildi');
    } catch (error) {
      console.error('❌ Foydalanuvchini bo\'limdan chiqarishda xatolik:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
