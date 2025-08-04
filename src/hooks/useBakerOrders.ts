
import { useState, useEffect } from 'react';
import { Order } from '../services/dataService';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';

export const useBakerOrders = (bakerId: string | undefined, cakeIds: string[]) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (bakerId && cakeIds.length > 0) {
      loadOrders();
    }
  }, [bakerId, cakeIds]);

  const loadOrders = async () => {
    try {
      const allOrders = await dataService.getOrders();
      const bakerOrders = allOrders.filter(order => 
        cakeIds.includes(order.cakeId)
      );
      setOrders(bakerOrders);
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await dataService.updateOrderStatus(orderId, status);

      const order = orders.find(o => o.id === orderId);

      if (status === 'cancelled' && order) {
        await dataService.revertOrderQuantity(order.cakeId, order.quantity, order.fromStock || false);
        console.log('✅ Buyurtma bekor qilindi, mahsulot quantity to\'g\'ri qaytarildi');
      }

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        )
      );

      if (order) {
        await notificationService.createOrderNotification(
          order.customerId,
          orderId,
          status,
          order.cakeName
        );
      }
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      throw error;
    }
  };

  return {
    orders,
    setOrders,
    selectedOrder,
    setSelectedOrder,
    handleOrderStatusUpdate,
    loadOrders
  };
};
