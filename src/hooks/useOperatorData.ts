import { useState, useEffect } from 'react';
import { dataService, Order, SupportTicket } from '../services/dataService';
import { notificationService } from '../services/notificationService';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface OperatorStats {
  totalOrders: number;
  pendingOrders: number;
  activeIssues: number;
  resolvedToday: number;
  avgResponseTime: number;
  activeUsers: number;
  customerSatisfaction: number;
  userStats?: {
    acceptedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export const useOperatorData = (userId?: string) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [availableCakes, setAvailableCakes] = useState<any[]>([]);
  const [stats, setStats] = useState<OperatorStats>({
    totalOrders: 0,
    pendingOrders: 0,
    activeIssues: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    activeUsers: 0,
    customerSatisfaction: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);

      // Load orders
      const allOrders = await dataService.getOrders();
      setOrders(allOrders);

      // Load available cakes for editing
      const cakes = await dataService.getCakes({ available: true });
      setAvailableCakes(cakes);

      // Generate mock system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Yuqori server yuki',
          message: 'Server yuki 85% ga yetdi. Monitoring talab qilinadi.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          resolved: false
        },
        {
          id: '2',
          type: 'error',
          title: 'To\'lov tizimida xatolik',
          message: 'Ba\'zi to\'lovlar muvaffaqiyatsiz tugamoqda.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          resolved: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Tizim yangilanishi',
          message: 'Tizim muvaffaqiyatli yangilandi.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          resolved: true
        }
      ];
      setSystemAlerts(mockAlerts);

      // Load support tickets from Firebase
      const tickets = await dataService.getSupportTickets();
      setSupportTickets(tickets);

      // Load all cakes to calculate customer satisfaction from reviews
      const allCakes = await dataService.getCakes({});

      // Calculate stats
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(order => 
        ['pending', 'accepted', 'preparing'].includes(order.status)
      ).length;
      const activeIssues = tickets.filter(ticket => 
        ['open', 'in_progress'].includes(ticket.status)
      ).length;
      const resolvedToday = tickets.filter(ticket => 
        ticket.status === 'resolved' && 
        ticket.updatedAt && ticket.updatedAt.toDateString() === new Date().toDateString()
      ).length;

      // Calculate average response time from resolved tickets
      const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved');
      const avgResponseTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, ticket) => {
            const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
            return sum + (responseTime / (1000 * 60 * 60)); // Convert to hours
          }, 0) / resolvedTickets.length
        : 0;

      // Calculate customer satisfaction from cake ratings
      const cakesWithRatings = allCakes.filter(cake => cake.reviewCount > 0);
      const customerSatisfaction = cakesWithRatings.length > 0
        ? cakesWithRatings.reduce((sum, cake) => sum + cake.rating, 0) / cakesWithRatings.length
        : 0;

      // Calculate active users from unique customers in recent orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = allOrders.filter(order => order.createdAt >= thirtyDaysAgo);
      const uniqueCustomers = new Set(recentOrders.map(order => order.customerId));
      const activeUsers = uniqueCustomers.size;

      setStats({
        totalOrders,
        pendingOrders,
        activeIssues,
        resolvedToday,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        activeUsers,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
        userStats: {
          acceptedOrders: allOrders.filter(order => ['accepted', 'preparing', 'ready'].includes(order.status)).length,
          cancelledOrders: allOrders.filter(order => order.status === 'cancelled').length,
          pendingOrders: allOrders.filter(order => order.status === 'pending').length,
          completedOrders: allOrders.filter(order => order.status === 'delivered').length
        }
      });

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const handleTicketStatusUpdate = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await dataService.updateSupportTicketStatus(ticketId, status, userId);

      setSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { 
            ...ticket, 
            status, 
            lastReply: new Date(),
            assignedTo: userId,
            updatedAt: new Date()
          } : ticket
        )
      );

      loadData();
    } catch (error) {
      console.error('Ticket holatini yangilashda xatolik:', error);
      alert('Ticket holatini yangilashda xatolik yuz berdi');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);

      if (status === 'cancelled' && order) {
        console.log('🔄 Buyurtma bekor qilinmoqda, mahsulot sonini qaytarish:', {
          orderId,
          cakeId: order.cakeId,
          quantity: order.quantity
        });

        try {
          await dataService.revertOrderQuantity(order.cakeId, order.quantity);
          console.log('✅ Mahsulot soni muvaffaqiyatli qaytarildi');
        } catch (revertError) {
          console.error('❌ Mahsulot sonini qaytarishda xato:', revertError);
          alert('Mahsulot sonini qaytarishda xato yuz berdi');
          return;
        }
      }

      await dataService.updateOrderStatus(orderId, status);

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

      loadData();
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      alert('Buyurtma holatini o\'zgartirishda xato yuz berdi');
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  return {
    loading,
    orders,
    setOrders,
    systemAlerts,
    supportTickets,
    setSupportTickets,
    availableCakes,
    stats,
    loadData,
    handleResolveAlert,
    handleTicketStatusUpdate,
    handleOrderStatusUpdate
  };
};