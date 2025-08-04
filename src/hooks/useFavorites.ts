
import { useState, useEffect, useCallback } from 'react';
import { dataService, Favorite } from '../services/dataService';

export const useFavorites = (userId?: string) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sevimlilarni yuklash
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userFavorites = await dataService.getUserFavorites(userId);
      setFavorites(userFavorites);
      setFavoriteIds(new Set(userFavorites.map(fav => fav.cakeId)));
    } catch (error) {
      console.error('Sevimlilarni yuklashda xatolik:', error);
      setError('Sevimlilarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Sevimlilar ro'yxatiga qo'shish
  const addToFavorites = async (cakeId: string, cakeData: {
    name: string;
    image: string;
    price: number;
    shopName?: string;
  }) => {
    if (!userId) {
      throw new Error('Foydalanuvchi tizimga kirmagan');
    }

    try {
      await dataService.addToFavorites(userId, cakeId, cakeData);
      setFavoriteIds(prev => new Set([...prev, cakeId]));
      await loadFavorites(); // Sevimlilarni qayta yuklash
      return true;
    } catch (error) {
      console.error('Sevimlilar ro\'yxatiga qo\'shishda xatolik:', error);
      throw error;
    }
  };

  // Sevimlilar ro'yxatidan o'chirish
  const removeFromFavorites = async (cakeId: string) => {
    if (!userId) {
      throw new Error('Foydalanuvchi tizimga kirmagan');
    }

    try {
      await dataService.removeFromFavorites(userId, cakeId);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cakeId);
        return newSet;
      });
      await loadFavorites(); // Sevimlilarni qayta yuklash
      return true;
    } catch (error) {
      console.error('Sevimlilar ro\'yxatidan o\'chirishda xatolik:', error);
      throw error;
    }
  };

  // Sevimli ekanligini tekshirish
  const isFavorite = (cakeId: string): boolean => {
    return favoriteIds.has(cakeId);
  };

  // Sevimlilar toggle funksiyasi
  const toggleFavorite = async (cakeId: string, cakeData: {
    name: string;
    image: string;
    price: number;
    shopName?: string;
  }) => {
    if (isFavorite(cakeId)) {
      await removeFromFavorites(cakeId);
    } else {
      await addToFavorites(cakeId, cakeData);
    }
  };

  // Component mount bo'lganda sevimlilarni yuklash
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    loadFavorites,
    favoriteCount: favorites.length
  };
};
