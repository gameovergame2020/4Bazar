
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfileManager } from '../../hooks/useProfileManager';
import ProfileManager from '../ProfileManager';
import SettingsPage from '../SettingsPage';
import { dataService } from '../../services/dataService';
import {
  Package,
  MapPin,
  DollarSign,
  Star,
  Clock,
  TrendingUp,
  Navigation,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Play,
  Pause,
  Target,
  Award,
  Calendar,
  BarChart3,
  Zap,
  Bell,
  ArrowRight,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'ready' | 'delivering' | 'delivered';
  orderTime: string;
  estimatedDelivery?: string;
  priority: 'normal' | 'urgent';
  distance?: string;
  deliveryFee: number;
}

const CourierDashboard = () => {
  const { userData, logout } = useAuth();
  const { showProfile, openUserProfile, closeProfile } = useProfileManager();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [selectedView, setSelectedView] = useState<'active' | 'completed' | 'stats'>('active');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'delivering'>('all');

  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    weeklyDeliveries: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 4.8,
    totalDeliveries: 0,
    onTimePercentage: 95,
    activeOrders: 0,
    completedToday: 0
  });

  // Ma'lumotlarni yuklash
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const orders = await dataService.getOrders();
      
      // Demo ma'lumotlar - haqiqiy loyihada API dan keladi
      const mockActiveOrders: Order[] = [
        {
          id: 'ORD001',
          customerName: 'Aziz Karimov',
          customerPhone: '+998901234567',
          address: 'Toshkent sh., Yunusobod t., 15-mavze, 23-uy',
          items: [
            { id: '1', name: 'Shokoladli tort', quantity: 1, price: 250000 }
          ],
          total: 268000,
          status: 'ready',
          orderTime: new Date().toISOString(),
          priority: 'urgent',
          distance: '2.5 km',
          deliveryFee: 18000
        },
        {
          id: 'ORD002',
          customerName: 'Malika Toshmatova',
          customerPhone: '+998901234568',
          address: 'Toshkent sh., Mirzo Ulugbek t., 8-mavze, 45-uy',
          items: [
            { id: '2', name: 'Mevali tort', quantity: 2, price: 180000 }
          ],
          total: 378000,
          status: 'delivering',
          orderTime: new Date(Date.now() - 3600000).toISOString(),
          priority: 'normal',
          distance: '4.1 km',
          deliveryFee: 18000
        }
      ];

      const mockCompletedOrders: Order[] = [
        {
          id: 'ORD003',
          customerName: 'Bobur Umarov',
          customerPhone: '+998901234569',
          address: 'Toshkent sh., Chilonzor t., 12-mavze, 67-uy',
          items: [
            { id: '3', name: 'Muzqaymoqli tort', quantity: 1, price: 320000 }
          ],
          total: 338000,
          status: 'delivered',
          orderTime: new Date(Date.now() - 7200000).toISOString(),
          priority: 'normal',
          distance: '3.2 km',
          deliveryFee: 18000
        }
      ];

      setActiveOrders(mockActiveOrders);
      setCompletedOrders(mockCompletedOrders);

      // Statistikalarni hisoblash
      const todayDeliveries = mockCompletedOrders.length + 5;
      const todayEarnings = todayDeliveries * 18000;
      
      setStats({
        todayDeliveries,
        todayEarnings,
        weeklyDeliveries: todayDeliveries * 6,
        weeklyEarnings: todayEarnings * 6,
        monthlyEarnings: todayEarnings * 25,
        averageRating: 4.8,
        totalDeliveries: 157,
        onTimePercentage: 96,
        activeOrders: mockActiveOrders.length,
        completedToday: mockCompletedOrders.length
      });

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = () => {
    setIsOnline(!isOnline);
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedActiveOrders = activeOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setActiveOrders(updatedActiveOrders);

      if (newStatus === 'delivered') {
        const completedOrder = activeOrders.find(order => order.id === orderId);
        if (completedOrder) {
          setCompletedOrders(prev => [{ ...completedOrder, status: 'delivered' }, ...prev]);
          setActiveOrders(prev => prev.filter(order => order.id !== orderId));
        }
      }
    } catch (error) {
      console.error('Status yangilashda xatolik:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const filteredActiveOrders = activeOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Profil ko'rsatilsa
  if (showProfile && userData) {
    return (
      <ProfileManager
        user={userData}
        profileType="courier"
        onBack={closeProfile}
        onUpdate={() => {}}
      />
    );
  }

  // Sozlamalar ko'rsatilsa
  if (showSettings && userData) {
    return (
      <SettingsPage
        user={{
          id: userData.id,
          name: userData.name,
          email: userData.email || '',
          phone: userData.phone,
          avatar: userData.avatar || '',
          joinDate: userData.joinDate,
          totalOrders: stats.totalDeliveries,
          favoriteCount: 0
        }}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header - Online/Offline Status */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={userData?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={userData?.name}
                className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Salom, {userData?.name}!</h2>
              <p className="text-slate-600 text-sm sm:text-base">
                {isOnline ? 'Siz onlinesiz va buyurtmalar qabul qilishingiz mumkin' : 'Offlaynsiz - buyurtmalar to\'xtatilgan'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleStatusToggle}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all flex-1 sm:flex-none justify-center ${
                isOnline 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isOnline ? <Pause size={18} /> : <Play size={18} />}
              <span>{isOnline ? 'To\'xtatish' : 'Boshlash'}</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openUserProfile(userData)}
                className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <User size={20} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={logout}
                className="p-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
              <Package size={20} sm:size={24} className="text-blue-600" />
            </div>
            <span className="text-blue-600 text-xs sm:text-sm font-medium">Bugun</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.todayDeliveries}</p>
          <p className="text-slate-600 text-xs sm:text-sm">Yetkazish</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
              <DollarSign size={20} sm:size={24} className="text-green-600" />
            </div>
            <span className="text-green-600 text-xs sm:text-sm font-medium">Bugun</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{Math.round(stats.todayEarnings / 1000)}K</p>
          <p className="text-slate-600 text-xs sm:text-sm">Daromad</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-xl">
              <Star size={20} sm:size={24} className="text-yellow-600" />
            </div>
            <span className="text-yellow-600 text-xs sm:text-sm font-medium">Reyting</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.averageRating}</p>
          <p className="text-slate-600 text-xs sm:text-sm">O'rtacha</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
              <Target size={20} sm:size={24} className="text-purple-600" />
            </div>
            <span className="text-purple-600 text-xs sm:text-sm font-medium">Samarali</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.onTimePercentage}%</p>
          <p className="text-slate-600 text-xs sm:text-sm">Vaqtida</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Navigation size={20} sm:size={28} className="text-blue-600" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">Xarita</h4>
          <p className="text-xs sm:text-sm text-slate-500">Yo'nalish ko'rish</p>
        </button>

        <button className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <MessageCircle size={20} sm:size={28} className="text-green-600" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">Aloqa</h4>
          <p className="text-xs sm:text-sm text-slate-500">Mijozlar bilan</p>
        </button>

        <button 
          onClick={() => setSelectedView('stats')}
          className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 size={20} sm:size={28} className="text-purple-600" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">Hisobot</h4>
          <p className="text-xs sm:text-sm text-slate-500">Ish natijasi</p>
        </button>

        <button className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Award size={20} sm:size={28} className="text-orange-600" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">Mukofotlar</h4>
          <p className="text-xs sm:text-sm text-slate-500">Yutuqlarim</p>
        </button>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
          <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1 w-full sm:w-auto">
            <button
              onClick={() => setSelectedView('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex-1 sm:flex-none ${
                selectedView === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faol ({stats.activeOrders})
            </button>
            <button
              onClick={() => setSelectedView('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex-1 sm:flex-none ${
                selectedView === 'completed'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tugallangan ({stats.completedToday})
            </button>
            <button
              onClick={() => setSelectedView('stats')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex-1 sm:flex-none ${
                selectedView === 'stats'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Statistika
            </button>
          </div>

          {selectedView === 'active' && (
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Qidiruv..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Barchasi</option>
                <option value="ready">Tayyor</option>
                <option value="delivering">Yetkazilmoqda</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Content based on selected view */}
        {selectedView === 'active' && (
          <div className="space-y-4">
            {filteredActiveOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg mb-2">Hozircha buyurtma yo'q</p>
                <p className="text-slate-400 text-sm">Yangi buyurtmalar kelganda bu yerda ko'rinadi</p>
              </div>
            ) : (
              filteredActiveOrders.map((order) => (
                <div key={order.id} className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${
                        order.priority === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Package size={24} className={
                          order.priority === 'urgent' ? 'text-red-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{order.customerName}</h4>
                          {order.priority === 'urgent' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Shoshilinch
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1">#{order.id}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs sm:text-sm text-slate-500">
                          <span className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{order.distance}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{new Date(order.orderTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end space-y-2">
                      <span className="text-lg sm:text-xl font-bold text-slate-900">{formatPrice(order.total)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        order.status === 'ready' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-slate-700 text-sm sm:text-base mb-3">
                      <MapPin size={16} className="inline mr-2 text-slate-400" />
                      {order.address}
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.quantity}x {item.name}</span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all flex-1"
                    >
                      <Phone size={18} />
                      <span>Qo'ng'iroq</span>
                    </a>
                    
                    <button
                      onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(order.address)}`, '_blank')}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all flex-1"
                    >
                      <Navigation size={18} />
                      <span>Yo'nalish</span>
                    </button>

                    {order.status === 'ready' ? (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'delivering')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all flex-1"
                      >
                        <Play size={18} />
                        <span>Boshlash</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all flex-1"
                      >
                        <CheckCircle size={18} />
                        <span>Tugallash</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedView === 'completed' && (
          <div className="space-y-4">
            {completedOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg mb-2">Tugallangan buyurtmalar yo'q</p>
                <p className="text-slate-400 text-sm">Buyurtmalarni tugallagandan keyin bu yerda ko'rinadi</p>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div key={order.id} className="bg-green-50 rounded-2xl p-4 sm:p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle size={24} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{order.customerName}</h4>
                        <p className="text-slate-600 text-sm">#{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900">{formatPrice(order.total)}</span>
                      <p className="text-green-600 text-sm font-medium">Tugallangan</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedView === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Haftalik statistika */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Haftalik ko'rsatkichlar</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Yetkazishlar soni</span>
                    <span className="font-bold text-slate-900">{stats.weeklyDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Haftalik daromad</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.weeklyEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">O'rtacha kunlik</span>
                    <span className="font-bold text-blue-600">{formatPrice(stats.weeklyEarnings / 7)}</span>
                  </div>
                </div>
              </div>

              {/* Oylik statistika */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Oylik natijalar</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Oylik daromad</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.monthlyEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Jami yetkazishlar</span>
                    <span className="font-bold text-slate-900">{stats.totalDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Vaqtida yetkazish</span>
                    <span className="font-bold text-purple-600">{stats.onTimePercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourierDashboard;
