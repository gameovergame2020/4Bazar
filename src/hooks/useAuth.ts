import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService, UserData } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const data = await authService.getUserData(firebaseUser.uid);
          setUserData(data);
        } catch (err) {
          console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', err);
          setError('Ma\'lumotlarni yuklashda xatolik');
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const data = await authService.loginWithPhone(phone, password);
      setUserData(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, password: string, name: string, role: string = 'customer', birthDate?: string) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.register(phone, password, name, role, birthDate);
      setUserData(userData);
      return userData;
    } catch (err: any) {
      setError(err.message || 'Ro\'yhatdan o\'tishda xatolik');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
      setUserData(null);
    } catch (err: any) {
      setError(err.message || 'Chiqishda xatolik');
      throw err;
    }
  };

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!userData) return;

    try {
      setError(null);
      await authService.updateUserData(userData.id, updates);
      setUserData({ ...userData, ...updates });
    } catch (err: any) {
      setError(err.message || 'Ma\'lumotlarni yangilashda xatolik');
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    login,
    register,
    logout,
    updateUserData,
    isAuthenticated: !!user
  };
};