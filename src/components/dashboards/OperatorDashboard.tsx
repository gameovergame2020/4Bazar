import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Activity,
  Phone,
  Mail,
  Eye,
  Filter,
  Search,
  RefreshCw,
  MapPin,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Order, SupportTicket } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}



const OperatorDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeIssues: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    activeUsers: 0,
    customerSatisfaction: 0
  });

  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<{[cakeId: string]: number}>({});
  const [availableCakes, setAvailableCakes] = useState<any[]>([]);
  const [newProductSearchQuery, setNewProductSearchQuery] = useState('');
  const [editingCustomerInfo, setEditingCustomerInfo] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: ''
  });
  const [searchOrderId, setSearchOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult: any] = useState<{ type: 'success' | 'error' | null; message: string; count: number }>({
    type: null,
    message: '',
    count: 0
  });

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
  }, [userData]);

  // Buyurtma holatini o'zgartirish
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await dataService.updateOrderStatus(orderId, newStatus as any);

      // Ma'lumotlarni qayta yuklash
      await loadData();

      // Modalini yopish
      setSelectedOrderForDetails(null);

      // Muvaffaqiyat xabari
      alert(`Buyurtma holati "${getOrderStatusText(newStatus)}" ga o'zgartirildi`);

      // Mijozga bildirishnoma yuborish
      try {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const { notificationService } = await import('../../services/notificationService');
          await notificationService.createOrderNotification(
            order.customerId,
            orderId,
            newStatus,
            order.cakeName
          );
        }
      } catch (notifError) {
        console.warn('Mijoz bildirishnomasi yuborishda xato:', notifError);
      }

    } catch (error) {
      console.error('Buyurtma holatini o\'zgartirishda xato:', error);
      alert('Xato yuz berdi. Qaytadan urinib ko\'ring.');
    }
  };

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
        avgResponseTime: Math.round(avgResponseTime * 10) / 10, // 1 xona aniqlik
        activeUsers,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10 // 1 xona aniqlik
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
      await dataService.updateSupportTicketStatus(ticketId, status, userData?.id);

      // Local state'ni yangilash
      setSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { 
            ...ticket, 
            status, 
            lastReply: new Date(),
            assignedTo: userData?.id,
            updatedAt: new Date()
          } : ticket
        )
      );

      // Statistikani yangilash
      loadData();
    } catch (error) {
      console.error('Ticket holatini yangilashda xatolik:', error);
      alert('Ticket holatini yangilashda xatolik yuz berdi');
    }
  };

  // Buyurtma holatini yangilash
  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);

      // Agar buyurtma bekor qilinayotgan bo'lsa, avval mahsulot sonini qaytarish
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
          return; // Xato bo'lsa, buyurtma holatini o'zgartirmaslik
        }
      }

      // Buyurtma holatini yangilash
      await dataService.updateOrderStatus(orderId, status);

      // Buyurtma holatini local state'da yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        )
      );

      // Bildirishnoma yuborish
      if (order) {
        await notificationService.createOrderNotification(
          order.customerId,
          orderId,
          status,
          order.cakeName
        );
      }

      // Statistikani yangilash
      loadData();
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      alert('Buyurtma holatini o\'zgartirishda xato yuz berdi');
    }
  };

  const handleRemoveOrderItem = async (orderId: string) => {
    if (confirm('Bu buyurtmani o\'chirishni tasdiqlaysizmi?')) {
      try {
        // Buyurtmani bekor qilish holati bilan yangilash
        await handleOrderStatusUpdate(orderId, 'cancelled');

        // Buyurtmani ro'yxatdan olib tashlash
        setOrders(prev => prev.filter(order => order.id !== orderId));

        // Statistikani yangilash 
        loadData();
      } catch (error) {
        console.error('Buyurtmani o\'chirishda xatolik:', error);
        alert('Buyurtmani o\'chirishda xatolik yuz berdi');
      }
    }
  };

  const handleAddOrderNote = async (orderId: string, note: string) => {
    try {
      // Buyurtmaga eslatma qo'shish
      await dataService.updateOrder(orderId, { notes: note });

      // Local state'ni yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, notes: note, updatedAt: new Date() } : order
        )
      );
    } catch (error) {
      console.error('Eslatma qo\'shishda xatolik:', error);
      alert('Eslatma qo\'shishda xatolik yuz berdi');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    // Buyurtmadagi mahsulotlarni orderItems'ga ko'chirish
    setOrderItems({ [order.cakeId]: order.quantity });
    // Mijoz ma'lumotlarini tahrirlash uchun tayyorlash
    setEditingCustomerInfo({
      customerId: '',
      customerName: '',
      customerPhone: '',
      deliveryAddress: ''
    });
    // Qidiruv maydonini tozalash
    setNewProductSearchQuery('');
  };

  const handleAddItemToOrder = (cakeId: string) => {
    const cake = availableCakes.find(c => c.id === cakeId);
    if (!cake) return;

    setOrderItems(prev => {
      const currentQuantity = prev[cakeId] || 0;

      // Mahsulot miqdori cheklovini tekshirish
      if (cake.quantity !== undefined && currentQuantity >= cake.quantity) {
        alert(`Bu mahsulotdan faqat ${cake.quantity} ta mavjud`);
        return prev;
      }

      return {
        ...prev,
        [cakeId]: currentQuantity + 1
      };
    });
  };

  const handleRemoveItemFromOrder = (cakeId: string) => {
    setOrderItems(prev => {
      const newItems = { ...prev };
      if (newItems[cakeId] > 1) {
        newItems[cakeId]--;
      } else {
        delete newItems[cakeId];
      }
      return newItems;
    });
  };

  const handleSaveOrderChanges = async () => {
    if (!editingOrder) return;

    // Validatsiya
    if (Object.keys(orderItems).length === 0) {
      alert('Buyurtmada kamida bitta mahsulot bo\'lishi kerak');
      return;
    }

    if (!editingCustomerInfo.customerName.trim()) {
      alert('Mijoz ismini kiriting');
      return;
    }

    if (!editingCustomerInfo.customerPhone.trim()) {
      alert('Telefon raqamini kiriting');
      return;
    }

    if (!editingCustomerInfo.deliveryAddress.trim()) {
      alert('Yetkazib berish manzilini kiriting');
      return;
    }

    try {
      // Yangi jami summa va miqdorni hisoblash
      let totalPrice = 0;
      let totalQuantity = 0;
      const itemNames: string[] = [];

      Object.entries(orderItems).forEach(([cakeId, quantity]) => {
        const cake = availableCakes.find(c => c.id === cakeId);
        if (cake) {
          const itemPrice = cake.discount 
            ? cake.price * (1 - cake.discount / 100) 
            : cake.price;
          totalPrice += itemPrice * quantity;
          totalQuantity += quantity;
          itemNames.push(`${cake.name} (${quantity}x)`);
        }
      });

      // Agar bitta mahsulot bo'lsa, faqat cakeId va cakeName ni yangilash
      const isSimpleOrder = Object.keys(orderItems).length === 1;
      const firstCakeId = Object.keys(orderItems)[0];

      const updates: any = {
        quantity: totalQuantity,
        totalPrice: totalPrice,
        customerName: editingCustomerInfo.customerName.trim(),
        customerPhone: editingCustomerInfo.customerPhone.trim(),
        deliveryAddress: editingCustomerInfo.deliveryAddress.trim(),
        updatedAt: new Date()
      };

      if (isSimpleOrder) {
        updates.cakeId = firstCakeId;
        updates.cakeName = itemNames[0];
      } else {
        updates.cakeName = itemNames.join(', ');
      }

      await dataService.updateOrder(editingOrder.id!, updates);

      // Local state'ni yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === editingOrder.id 
            ? { ...order, ...updates }
            : order
        )
      );

      // Modal yopish va state'ni tozalash
      setEditingOrder(null);
      setOrderItems({});
      setNewProductSearchQuery('');
      setEditingCustomerInfo({
        customerId: '',
        customerName: '',
        customerPhone: '',
        deliveryAddress: ''
      });

      alert('Buyurtma muvaffaqiyatli yangilandi');
    } catch (error) {
      console.error('Buyurtmani yangilashda xatolik:', error);
      alert('Buyurtmani yangilashda xatolik yuz berdi');
    }
  };

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'accepted': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-purple-100 text-purple-600';
      case 'ready': return 'bg-green-100 text-green-600';
      case 'delivering': return 'bg-indigo-100 text-indigo-600';
      case 'delivered': return 'bg-gray-100 text-gray-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getOrderStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'accepted': return 'Qabul qilindi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yetkazilmoqda';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return status;
    }
  };

  // orderUniqueId bo'yicha buyurtmalarni qidirish
  const handleSearchByOrderId = async () => {
    if (!searchOrderId.trim()) {
      setSearchResult({ type: 'error', message: 'Buyurtma ID sini kiriting', count: 0 });
      return;
    }

    try {
      setIsSearching(true);

      // # belgisini olib tashlash va tozalash
      const cleanSearchId = searchOrderId.trim().replace(/^#/, '').toUpperCase();
      console.log('🔍 Order ID bo\'yicha qidiruv:', cleanSearchId);

      // Barcha buyurtmalarni olish va orderUniqueId bo'yicha filtrlash
      const allOrders = await dataService.getOrders();
      const foundOrders = allOrders.filter(order => {
        const orderUniqueId = order.orderUniqueId?.toUpperCase() || '';
        const orderId = order.id?.toUpperCase() || '';

        return orderUniqueId.includes(cleanSearchId) || 
               orderId.includes(cleanSearchId) ||
               orderUniqueId === cleanSearchId ||
               orderId.slice(-6) === cleanSearchId;
      });

      if (foundOrders.length > 0) {
        console.log(`✅ ${foundOrders.length} ta buyurtma topildi`);
        // Update the main orders list with found orders
        setOrders(foundOrders);
        setSearchResult({ 
          type: 'success', 
          message: 'Topildi', 
          count: foundOrders.length 
        });
      } else {
        setSearchResult({ 
          type: 'error', 
          message: 'Topilmadi', 
          count: 0 
        });
      }
    } catch (error) {
      console.error('❌ Qidirishda xato:', error);
      setSearchResult({ type: 'error', message: 'Xatolik yuz berdi', count: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedOrderFilter === 'all') return true;
    return order.status === selectedOrderFilter;
  });

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-600 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTicketStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTicketStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'Ochiq';
      case 'in_progress': return 'Jarayonda';
      case 'resolved': return 'Hal qilindi';
      case 'closed': return 'Yopildi';
      default: return status;
    }
  };

  const getPriorityText = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'Yuqori';
      case 'medium': return 'O\'rta';
      case 'low': return 'Past';
      default: return priority;
    }
  };

  const getCategoryText = (category: SupportTicket['category']) => {
    switch (category) {
      case 'delivery': return 'Yetkazib berish';
      case 'payment': return 'To\'lov';
      case 'quality': return 'Sifat';
      case 'technical': return 'Texnik';
      case 'other': return 'Boshqa';
      default: return category;
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesFilter = selectedFilter === 'all' || ticket.status === selectedFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // Buyurtma ma'lumotlarini olish
      const order = orders.find(o => o.id === orderId);

      // Agar buyurtma rad etilsa, mahsulot quantity/amount ni qaytarish
      if (status === 'cancelled' && order) {
        console.log('🚫 Operator buyurtmani rad etdi, mahsulot sonini qaytarish:', {
          orderId,
          cakeId: order.cakeId,
          quantity: order.quantity,
          cakeName: order.cakeName,
          fromStock: order.fromStock
        });

        try {
          await dataService.revertOrderQuantity(order.cakeId, order.quantity, order.fromStock || false);
          console.log('✅ Mahsulot soni muvaffaqiyatli qaytarildi');

          // Real-time yangilanishni kuchaytirish uchun qo'shimcha trigger
          setTimeout(async () => {
            try {
              const updatedCake = await dataService.getCakeById(order.cakeId);
              if (updatedCake) {
                console.log('🔄 Mahsulot holati tekshirildi:', {
                  id: updatedCake.id,
                  name: updatedCake.name,
                  available: updatedCake.available,
                  quantity: updatedCake.quantity
                });
              }
            } catch (checkError) {
              console.warn('⚠️ Mahsulot holati tekshirishda xato:', checkError);
            }
          }, 1000);

        } catch (revertError) {
          console.error('❌ Mahsulot sonini qaytarishda xato:', revertError);
          // Xatoga qaramay order status ni yangilashni davom ettiramiz
        }
      }

      await dataService.updateOrderStatus(orderId, status);
      await loadData();
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      alert('Buyurtma holatini yangilashda xatolik yuz berdi');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Buyurtmani rad etishni xohlaysizmi?')) return;

    try {
      setLoading(true);

      // Buyurtma ma'lumotlarini olish
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Buyurtma topilmadi');
      }

      console.log('🔄 Buyurtmani rad etish boshlandi:', {
        orderId: order.id,
        cakeId: order.cakeId,
        cakeName: order.cakeName,
        quantity: order.quantity
      });

      // Buyurtma holatini cancelled ga o'zgartirish
      await dataService.updateOrderStatus(orderId, 'cancelled');

      // Mahsulot quantity'ni qaytarish
      await dataService.revertOrderQuantity(order.cakeId, order.quantity);

      console.log('✅ Buyurtma rad etildi va mahsulot quantity qaytarildi');

      await loadData();
    } catch (error) {
      console.error('❌ Buyurtmani rad etishda xatolik:', error);
      alert('Buyurtmani rad etishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Operator paneli</h2>
        <p className="text-yellow-100">Tizimni nazorat qiling va muammolarni hal qiling</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600">Jami buyurtmalar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-600">Kutilmoqda</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            const supportSection = document.getElementById('support-tickets-section');
            if (supportSection) {
              supportSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeIssues}</p>
              <p className="text-sm text-gray-600">Faol muammolar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
              <p className="text-sm text-gray-600">Bugun hal qilindi</p>
            </div>
          </div>
        </div>



        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
              <p className="text-sm text-gray-600">O'rt. javob vaqti</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-sm text-gray-600">Faol foydalanuvchilar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <MessageCircle size={20} className="text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction || 0}</p>
              <p className="text-sm text-gray-600">Mijoz mamnuniyati</p>
            </div>
          </div>
        </div>
      </div>



      {/* Support Tickets */}
      <div id="support-tickets-section" className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Qo'llab-quvvatlash so'rovlari</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search```text
size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">Barchasi</option>
              <option value="open">Ochiq</option>
              <option value="in_progress">Jarayonda</option>
              <option value="resolved">Hal qilindi</option>
              <option value="closed">Yopildi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Mijoz</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Mavzu</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kategoriya</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Muhimlik</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Yaratildi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Manzil</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">#{ticket.id?.slice(-6)}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{ticket.customerName}</p>
                      <p className="text-sm text-gray-600">{ticket.customerPhone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={ticket.subject}>
                    {ticket.subject}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {getCategoryText(ticket.category)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityText(ticket.priority)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                      {getTicketStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {ticket.createdAt.toLocaleDateString('uz-UZ')}
                    <br />
                    <span className="text-xs text-gray-500">
                      {ticket.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2 flex-wrap">
                      <button 
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Tafsilotlar"
                      >
                        <Eye size={16} />
                      </button>
                      {ticket.customerPhone && (
                        <button 
                          onClick={() => window.open(`tel:${ticket.customerPhone}`, '_self')}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          title="Qo'ng'iroq qilish"
                        >
                          <Phone size={16} />
                        </button>
                      )}
                      {ticket.customerEmail && (
                        <button 
                          onClick={() => window.open(`mailto:${ticket.customerEmail}`, '_self')}
                          className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                          title="Email yuborish"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleTicketStatusUpdate(ticket.id!, 'in_progress')}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          Olish
                        </button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <button
                          onClick={() => handleTicketStatusUpdate(ticket.id!, 'resolved')}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          Hal qilish
                        </button>
                      )}
                      {ticket.status === 'resolved' && (
                        <button
                          onClick={() => handleTicketStatusUpdate(ticket.id!, 'closed')}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                        >
                          Yopish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery || selectedFilter !== 'all' 
                  ? 'Hech qanday so\'rov topilmadi' 
                  : 'Hozircha qo\'llab-quvvatlash so\'rovlari yo\'q'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Orders Management */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Buyurtmalar boshqaruvi</h3>
          <div className="flex items-center space-x-3">
            <select
              value={selectedOrderFilter}
              onChange={(e) => setSelectedOrderFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">Barchasi</option>
              <option value="pending">Kutilmoqda</option>
              <option value="accepted">Qabul qilindi</option>
              <option value="preparing">Tayyorlanmoqda</option>
              <option value="ready">Tayyor</option>
              <option value="delivering">Yetkazilmoqda</option>
              <option value="delivered">Yetkazildi</option>
              <option value="cancelled">Bekor qilindi</option>
            </select>
            <button
              onClick={loadData}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>
        {/* Search Orders */}
        <div className="mb-4 flex items-center space-x-2">
          <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="Buyurtma ID sini kiriting (masalan: D9OAHZ7Z)..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByOrderId()}
              />
              <button
                onClick={handleSearchByOrderId}
                disabled={isSearching}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Qidirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>ID bo'yicha qidirish</span>
                  </>
                )}
              </button>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                title="Barcha buyurtmalarni ko'rsatish"
              >
                <RefreshCw size={16} />
                <span>Barchasi</span>
              </button>
        </div>

        {/* Search Result Message */}
        {searchResult.type && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            searchResult.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {searchResult.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span className="text-sm font-medium">{searchResult.message}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Mijoz</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tort</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Summa</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sana</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Manzil</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">#{order.orderUniqueId || order.id?.slice(-6)}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.cakeName}</p>
                      <p className="text-sm text-gray-600">Miqdor: {order.quantity}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {order.totalPrice.toLocaleString('uz-UZ')} so'm
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {order.createdAt.toLocaleDateString('uz-UZ')}
                    <br />
                    <span className="text-xs text-gray-500">
                      {order.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                      {order.deliveryAddress}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Tafsilotlar"
                      >
                        <Eye size={16} />
                      </button>

                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id!, 'preparing')}
                          className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                        >
                          Tayyorlashga yuborish
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id!, 'delivering')}
                          className="px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors"
                        >
                          Yetkazishga yuborish
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const note = prompt('Buyurtmaga eslatma qo\'shing:');
                          if (note && note.trim()) {
                            handleAddOrderNote(order.id!, note.trim());
                          }
                        }}
                        className="p-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors"
                        title="Eslatma qo'shish"
                      >
                        <MessageCircle size={16} />
                      </button>

                      {['pending', 'accepted', 'preparing'].includes(order.status) && (
                        <button
                          onClick={() => handleRemoveOrderItem(order.id!)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Buyurtmani o'chirish"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Monitor size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedOrderFilter !== 'all' 
                  ? `${getOrderStatusText(selectedOrderFilter as Order['status'])} buyurtmalar topilmadi` 
                  : 'Hozircha buyurtmalar yo\'q'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Buyurtma tafsilotlari</h3>
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedOrderForDetails.cakeName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyurtma ID:</span>
                    <span className="font-medium">#{selectedOrderForDetails.orderUniqueId || selectedOrderForDetails.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mijoz:</span>
                    <span className="font-medium">{selectedOrderForDetails.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">{selectedOrderForDetails.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Miqdor:</span>
                    <span className="font-medium">{selectedOrderForDetails.quantity} dona</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jami summa:</span>
                    <span className="font-medium">{selectedOrderForDetails.totalPrice.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Holat:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrderForDetails.status)}`}>
                      {getOrderStatusText(selectedOrderForDetails.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yaratildi:</span>
                    <span className="font-medium">
                      {selectedOrderForDetails.createdAt.toLocaleDateString('uz-UZ')} {selectedOrderForDetails.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Yetkazib berish manzili:</h5>
                  {selectedOrderForDetails.coordinates && (
                    <button
                      onClick={() => {
                        const coords = selectedOrderForDetails.coordinates;
                        if (coords && coords.lat && coords.lng) {
                          window.open(`https://yandex.uz/maps/?pt=${coords.lng},${coords.lat}&z=16&l=map`, '_blank');
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                      title="Xaritada ko'rish"
                    >
                      <MapPin size={14} />
                      <span>Xaritada ko'rish</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedOrderForDetails.deliveryAddress}
                </p>
                {selectedOrderForDetails.coordinates && (
                  <div className="mt-2 text-xs text-gray-500">
                    📍 Koordinatalar: {selectedOrderForDetails.coordinates.lat?.toFixed(6)}, {selectedOrderForDetails.coordinates.lng?.toFixed(6)}
                  </div>
                )}
              </div>

              {selectedOrderForDetails.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Qo'shimcha eslatma:</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrderForDetails.notes}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-4">
                {/* Pending holatidagi buyurtmalar uchun */}
                {selectedOrderForDetails.status === 'pending' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleEditOrder(selectedOrderForDetails);
                        setSelectedOrderForDetails(null);
                      }}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      ✎ Buyurtmani tahrirlash
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          handleOrderStatusUpdate(selectedOrderForDetails.id!, 'accepted');
                          setSelectedOrderForDetails(null);
                        }}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Tasdiqlash</span>
                      </button>
                      <button
                        onClick={() => {
                          handleOrderStatusUpdate(selectedOrderForDetails.id!, 'cancelled');
                          setSelectedOrderForDetails(null);
                        }}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Rad etish</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Accepted holatidagi buyurtmalar uchun */}
                {selectedOrderForDetails.status === 'accepted' && (
                  <button 
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrderForDetails.id!, 'preparing');
                      setSelectedOrderForDetails(null);
                    }}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Tayyorlanishga yuborish
                  </button>
                )}

                {/* Preparing holatidagi buyurtmalar uchun */}
                {selectedOrderForDetails.status === 'preparing' && (
                  <button 
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrderForDetails.id!, 'ready');
                      setSelectedOrderForDetails(null);
                    }}
                    className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Tayyor deb belgilash
                  </button>
                )}

                {/* Ready holatidagi buyurtmalar uchun */}
                {selectedOrderForDetails.status === 'ready' && (
                  <button 
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrderForDetails.id!, 'delivering');
                      setSelectedOrderForDetails(null);
                    }}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Yetkazib berishga yuborish
                  </button>
                )}

                {/* Qo'ng'iroq tugmasi - barcha holatlar uchun */}
                <button 
                  onClick={() => window.open(`tel:${selectedOrderForDetails.customerPhone}`, '_self')}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Phone size={16} />
                  <span>Qo'ng'iroq</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Buyurtmani tahrirlash</h3>
              <button
                onClick={() => {
                  // Modal yopishdan oldin tasdiqlash
                  const hasChanges = Object.keys(orderItems).length > 0 || 
                    editingCustomerInfo.customerName !== editingOrder?.customerName ||
                    editingCustomerInfo.customerPhone !== editingOrder?.customerPhone ||
                    editingCustomerInfo.deliveryAddress !== editingOrder?.deliveryAddress;

                  if (hasChanges && !confirm('O\'zgarishlar saqlanmaydi. Davom etishni xohlaysizmi?')) {
                    return;
                  }

                  setEditingOrder(null);
                  setOrderItems({});
                  setNewProductSearchQuery('');
                  setEditingCustomerInfo({
                    customerId: '',
                    customerName: '',
                    customerPhone: '',
                    deliveryAddress: ''
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Buyurtma ma'lumotlari */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Buyurtma ma'lumotlari</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-600 text-sm">Buyurtma ID:</span>
                    <span className="ml-2 font-medium">#{editingOrder.orderUniqueId || editingOrder.id?.slice(-8)}</span>
                  </div>

                  {/* Mijoz ma'lumotlarini tahrirlash */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foydalanuvchi ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingCustomerInfo.userId || ''}
                          onChange={(e) => setEditingCustomerInfo(prev => ({
                            ...prev,
                            userId: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="user-12345"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mijoz ismi
                        </label>
                        <input
                          type="text"
                          value={editingCustomerInfo.customerName}
                          onChange={(e) => setEditingCustomerInfo(prev => ({
                            ...prev,
                            customerName: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Mijoz ismini kiriting"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon raqam
                        </label>
                        <input
                          type="tel"
                          value={editingCustomerInfo.customerPhone}
                          onChange={(e) => setEditingCustomerInfo(prev => ({
                            ...prev,
                            customerPhone: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yetkazib berish manzili
                      </label>
                      <textarea
                        value={editingCustomerInfo.deliveryAddress}
                        onChange={(e) => setEditingCustomerInfo(prev => ({
                          ...prev,
                          deliveryAddress: e.target.value
                        }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        placeholder="To'liq manzilni kiriting"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Joriy mahsulotlar */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Buyurtmadagi mahsulotlar</h4>
                <div className="space-y-3">
                  {Object.entries(orderItems).map(([cakeId, quantity]) => {
                    const cake = availableCakes.find(c => c.id === cakeId);
                    if (!cake) return null;

                    const itemPrice = cake.discount 
                      ? cake.price * (1 - cake.discount / 100) 
                      : cake.price;

                    return (
                      <div key={cakeId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{cake.name}</h5>
                          <p className="text-sm text-gray-600">
                            {itemPrice.toLocaleString('uz-UZ')} so'm / dona
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemoveItemFromOrder(cakeId)}
                              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              -
                            </button>
                            <span className="font-medium min-w-[30px] text-center">{quantity}</span>
                            <button
                              onClick={() => handleAddItemToOrder(cakeId)}
                              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {(itemPrice * quantity).toLocaleString('uz-UZ')} so'm
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Yangi mahsulot qo'shish */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Yangi mahsulot qo'shish</h4>

                {/* Qidiruv maydoni */}
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Mahsulot nomini qidiring..."
                    value={newProductSearchQuery}
                    onChange={(e) => setNewProductSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                  {availableCakes
                    .filter(cake => !orderItems[cake.id!])
                    .filter(cake => 
                      cake.name.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      cake.description.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      cake.bakerName.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      (cake.shopName && cake.shopName.toLowerCase().includes(newProductSearchQuery.toLowerCase()))
                    )
                    .map((cake) => {
                      const itemPrice = cake.discount 
                        ? cake.price * (1 - cake.discount / 100) 
                        : cake.price;

                      return (
                        <div key={cake.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{cake.name}</h5>
                            <p className="text-sm text-gray-600">
                              {itemPrice.toLocaleString('uz-UZ')} so'm / dona
                            </p>
                            {cake.discount && (
                              <span className="text-xs text-red-600">
                                -{cake.discount}% chegirma
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddItemToOrder(cake.id!)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            + Qo'shish
                          </button>
                        </div>
                      );
                    })
                  }

                  {/* Qidiruv natijasi yo'q bo'lsa */}
                  {availableCakes
                    .filter(cake => !orderItems[cake.id!])
                    .filter(cake => 
                      cake.name.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      cake.description.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      cake.bakerName.toLowerCase().includes(newProductSearchQuery.toLowerCase()) ||
                      (cake.shopName && cake.shopName.toLowerCase().includes(newProductSearchQuery.toLowerCase()))
                    ).length === 0 && newProductSearchQuery.trim() !== '' && (
                    <div className="text-center py-4 text-gray-500">
                      <Search size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">"{newProductSearchQuery}" bo'yicha mahsulot topilmadi</p>
                    </div>
                  )}

                  {/* Barcha mahsulotlar buyurtmada bo'lsa */}
                  {availableCakes.filter(cake => !orderItems[cake.id!]).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Plus size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Barcha mavjud mahsulotlar buyurtmaga qo'shilgan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Jami summa */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Jami summa:</span>
                  <span className="text-xl font-bold text-green-600">
                    {Object.entries(orderItems).reduce((total, [cakeId, quantity]) => {
                      const cake = availableCakes.find(c => c.id === cakeId);
                      if (!cake) return total;
                      const itemPrice = cake.discount 
                        ? cake.price * (1 - cake.discount / 100) 
                        : cake.price;
                      return total + (itemPrice * quantity);
                    }, 0).toLocaleString('uz-UZ')} so'm
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Jami miqdor:</span>
                  <span className="font-medium text-gray-900">
                    {Object.values(orderItems).reduce((sum, qty) => sum + qty, 0)} dona
                  </span>
                </div>
              </div>              {/* Amallar */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setEditingOrder(null);
                    setOrderItems({});
                    setNewProductSearchQuery('');
                    setEditingCustomerInfo({
                      customerId: '',
                      customerName: '',
                      customerPhone: '',
                      deliveryAddress: ''
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveOrderChanges}
                  disabled={
                    Object.keys(orderItems).length === 0 || 
                    !editingCustomerInfo.customerName.trim() ||
                    !editingCustomerInfo.customerPhone.trim() ||
                    !editingCustomerInfo.deliveryAddress.trim()
                  }
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;