
import { useState, useEffect } from 'react';
import { Order, Cake } from '../services/dataService';

interface BakerStats {
  pendingOrders: number;
  totalProducts: number;
  averageRating: number;
  totalCustomers: number;
  todayEarnings: number;
  monthlyEarnings: number;
}

export const useBakerStats = (orders: Order[], cakes: Cake[]) => {
  const [stats, setStats] = useState<BakerStats>({
    pendingOrders: 0,
    totalProducts: 0,
    averageRating: 0,
    totalCustomers: 0,
    todayEarnings: 0,
    monthlyEarnings: 0
  });

  useEffect(() => {
    calculateStats();
  }, [orders, cakes]);

  const calculateStats = () => {
    const pendingOrders = orders.filter(order => 
      ['accepted', 'preparing'].includes(order.status)
    ).length;

    const totalProducts = cakes.length;
    const averageRating = cakes.length > 0 
      ? Math.round((cakes.reduce((sum, cake) => sum + (cake.rating || 0), 0) / cakes.length) * 10) / 10
      : 0;

    const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => 
      order.createdAt >= today && order.status === 'delivered'
    );
    const todayEarnings = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => 
      order.createdAt >= monthStart && order.status === 'delivered'
    );
    const monthlyEarnings = monthlyOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    setStats({
      pendingOrders,
      totalProducts,
      averageRating,
      totalCustomers: uniqueCustomers,
      todayEarnings,
      monthlyEarnings
    });
  };

  return stats;
};
