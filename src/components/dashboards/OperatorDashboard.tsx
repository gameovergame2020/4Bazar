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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Order } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
  lastReply: Date;
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
    systemUptime: 99.8,
    avgResponseTime: 2.3,
    customerSatisfaction: 4.7,
    activeUsers: 1247
  });

  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<{[cakeId: string]: number}>({});
  const [availableCakes, setAvailableCakes] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
  }, [userData]);

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
      
      // Generate mock support tickets
      const mockTickets: SupportTicket[] = [
        {
          id: 'T001',
          customerId: 'user1',
          customerName: 'Aziza Karimova',
          subject: 'Buyurtma yetib kelmadi',
          priority: 'high',
          status: 'open',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          lastReply: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 'T002',
          customerId: 'user2',
          customerName: 'Bobur Saidov',
          subject: 'To\'lov muammosi',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          lastReply: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          id: 'T003',
          customerId: 'user3',
          customerName: 'Malika Ahmedova',
          subject: 'Tort sifati haqida',
          priority: 'low',
          status: 'resolved',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          lastReply: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
      setSupportTickets(mockTickets);
      
      // Calculate stats
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(order => 
        ['pending', 'accepted', 'preparing'].includes(order.status)
      ).length;
      const activeIssues = mockAlerts.filter(alert => !alert.resolved).length;
      const resolvedToday = mockTickets.filter(ticket => 
        ticket.status === 'resolved' && 
        ticket.lastReply.toDateString() === new Date().toDateString()
      ).length;
      
      setStats({
        totalOrders,
        pendingOrders,
        activeIssues,
        resolvedToday,
        systemUptime: 99.8,
        avgResponseTime: 2.3,
        customerSatisfaction: 4.7,
        activeUsers: 1247
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
    setSupportTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status, lastReply: new Date() } : ticket
      )
    );
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await dataService.updateOrderStatus(orderId, status);
      
      // Buyurtma holatini local state'da yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        )
      );

      // Bildirishnoma yuborish
      const order = orders.find(o => o.id === orderId);
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
  };

  const handleAddItemToOrder = (cakeId: string) => {
    setOrderItems(prev => ({
      ...prev,
      [cakeId]: (prev[cakeId] || 0) + 1
    }));
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

      // Buyurtmani yangilash
      const updates = {
        quantity: totalQuantity,
        totalPrice: totalPrice,
        cakeName: itemNames.join(', '),
        updatedAt: new Date()
      };

      await dataService.updateOrder(editingOrder.id!, updates);

      // Local state'ni yangilash
      setOrders(prev => 
        prev.map(order => 
          order.id === editingOrder.id 
            ? { ...order, ...updates }
            : order
        )
      );

      setEditingOrder(null);
      setOrderItems({});
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

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'resolved': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
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

        <div className="bg-white rounded-xl p-4 border border-gray-100">
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.systemUptime}%</p>
              <p className="text-sm text-gray-600">Tizim ishlashi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}s</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}</p>
              <p className="text-sm text-gray-600">Mijoz mamnuniyati</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tizim ogohlantirishlari</h3>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Yangilash</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {systemAlerts.filter(alert => !alert.resolved).map((alert) => (
            <div key={alert.id} className={`border rounded-xl p-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle size={16} />
                    <h4 className="font-medium">{alert.title}</h4>
                  </div>
                  <p className="text-sm mb-2">{alert.message}</p>
                  <p className="text-xs opacity-75">
                    {alert.timestamp.toLocaleString('uz-UZ')}
                  </p>
                </div>
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Hal qilish
                </button>
              </div>
            </div>
          ))}
          
          {systemAlerts.filter(alert => !alert.resolved).length === 0 && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">Barcha muammolar hal qilindi</p>
            </div>
          )}
        </div>
      </div>

      {/* Support Tickets */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Qo'llab-quvvatlash so'rovlari</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <th className="text-left py-3 px-4 font-medium text-gray-900">Muhimlik</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Holat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Yaratildi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{ticket.id}</td>
                  <td className="py-3 px-4 text-gray-700">{ticket.customerName}</td>
                  <td className="py-3 px-4 text-gray-700">{ticket.subject}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority === 'high' ? 'Yuqori' : 
                       ticket.priority === 'medium' ? 'O\'rta' : 'Past'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'open' ? 'Ochiq' :
                       ticket.status === 'in_progress' ? 'Jarayonda' : 'Hal qilindi'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {ticket.createdAt.toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-700">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-700">
                        <Phone size={16} />
                      </button>
                      <button className="p-1 text-purple-600 hover:text-purple-700">
                        <Mail size={16} />
                      </button>
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleTicketStatusUpdate(ticket.id, 'resolved')}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          Hal qilish
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
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">#{order.id?.slice(-6)}</td>
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
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Tafsilotlar"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                            title="Tahrirlash"
                          >
                            ✎ Tahrirlash
                          </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id!, 'accepted')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                            title="Tasdiqlash"
                          >
                            ✓ Tasdiqlash
                          </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id!, 'cancelled')}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                            title="Rad etish"
                          >
                            ✗ Rad etish
                          </button>
                        </>
                      )}
                      
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
                        onClick={() => window.open(`tel:${order.customerPhone}`, '_self')}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                        title="Qo'ng'iroq qilish"
                      >
                        <Phone size={16} />
                      </button>

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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                    <span className="font-medium">#{selectedOrderForDetails.id?.slice(-8)}</span>
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
                <h5 className="font-medium text-gray-900 mb-2">Yetkazib berish manzili:</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedOrderForDetails.deliveryAddress}
                </p>
              </div>

              {selectedOrderForDetails.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Qo'shimcha eslatma:</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrderForDetails.notes}
                  </p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Yopish
                </button>
                <button 
                  onClick={() => window.open(`tel:${selectedOrderForDetails.customerPhone}`, '_self')}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Phone size={16} />
                  <span>Qo'ng'iroq</span>
                </button>
              </div>

              {/* Quick Status Update Buttons */}
              {selectedOrderForDetails.status === 'pending' && (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrderForDetails.id!, 'accepted');
                      setSelectedOrderForDetails(null);
                    }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    ✓ Tasdiqlash
                  </button>
                  <button
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrderForDetails.id!, 'cancelled');
                      setSelectedOrderForDetails(null);
                    }}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ✗ Rad etish
                  </button>
                </div>
              )}
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
                  setEditingOrder(null);
                  setOrderItems({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Buyurtma ma'lumotlari */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Buyurtma ma'lumotlari</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-medium">#{editingOrder.id?.slice(-8)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Mijoz:</span>
                    <span className="ml-2 font-medium">{editingOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Telefon:</span>
                    <span className="ml-2 font-medium">{editingOrder.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Manzil:</span>
                    <span className="ml-2 font-medium">{editingOrder.deliveryAddress}</span>
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
                <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                  {availableCakes
                    .filter(cake => !orderItems[cake.id!])
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
              </div>

              {/* Amallar */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setEditingOrder(null);
                    setOrderItems({});
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveOrderChanges}
                  disabled={Object.keys(orderItems).length === 0}
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