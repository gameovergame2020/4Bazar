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

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi buyurtmalar</h3>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-900">#{order.id?.slice(-6)} - {order.cakeName}</h4>
                <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                  order.status === 'preparing' ? 'bg-yellow-100 text-yellow-600' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {order.status === 'delivered' ? 'Yetkazildi' :
                   order.status === 'preparing' ? 'Tayyorlanmoqda' :
                   order.status === 'cancelled' ? 'Bekor qilindi' : 'Kutilmoqda'}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {order.createdAt.toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;