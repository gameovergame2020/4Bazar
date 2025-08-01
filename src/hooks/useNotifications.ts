import { useState, useEffect } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time bildirishnomalarni kuzatish
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userData.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userData?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Real-time subscription avtomatik yangilaydi
    } catch (err) {
      setError('Bildirishnomani o\'qilgan deb belgilashda xatolik');
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.id) return;
    
    try {
      await notificationService.markAllAsRead(userData.id);
      // Real-time subscription avtomatik yangilaydi
    } catch (err) {
      setError('Barcha bildirishnomalarni o\'qilgan deb belgilashda xatolik');
      console.error(err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Real-time subscription avtomatik yangilaydi
    } catch (err) {
      setError('Bildirishnomani o\'chirishda xatolik');
      console.error(err);
    }
  };

  const createOrderNotification = async (
    orderId: string, 
    orderStatus: string, 
    cakeName: string
  ) => {
    if (!userData?.id) return;
    
    try {
      await notificationService.createOrderNotification(
        userData.id, 
        orderId, 
        orderStatus, 
        cakeName
      );
    } catch (err) {
      console.error('Buyurtma bildirishnomasi yaratishda xatolik:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createOrderNotification
  };
};