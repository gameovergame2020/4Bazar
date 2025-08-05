
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
    activeOrders: 0,
    completedToday: 0,
    averageRating: 4.8,
    onTimePercentage: 95,
    totalDeliveries: 0,
    weeklyDeliveries: 0,
    monthlyEarnings: 0
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

      // Bugungi ish statistikasi
      const todayDeliveries = mockCompletedOrders.length + 5;
      const todayEarnings = todayDeliveries * 18000;
      
      setStats({
        todayDeliveries,
        todayEarnings,
        activeOrders: mockActiveOrders.length,
        completedToday: mockCompletedOrders.length,
        averageRating: 4.8,
        onTimePercentage: 96
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
      {/* Optimized Header */}
      <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={userData?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={userData?.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                {isOnline && <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>}
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{userData?.name}</h2>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isOnline ? 'Faol' : 'Nofaol'}
                </span>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-slate-500 text-sm">{stats.todayDeliveries} ta yetkazildi</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStatusToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isOnline 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isOnline ? <Pause size={16} /> : <Play size={16} />}
              <span className="hidden sm:inline">{isOnline ? 'To\'xtatish' : 'Boshlash'}</span>
            </button>
            
            <button
              onClick={() => openUserProfile(userData)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <User size={18} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Optimized Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <AlertCircle size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">{stats.activeOrders}</p>
              <p className="text-orange-700 text-sm font-medium">Faol buyurtma</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.todayDeliveries}</p>
              <p className="text-blue-700 text-sm font-medium">Bugun yetkazildi</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-900">{Math.round(stats.todayEarnings / 1000)}K</p>
              <p className="text-green-700 text-sm font-medium">Bugungi daromad</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Star size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{stats.averageRating}</p>
              <p className="text-purple-700 text-sm font-medium">Reyting</p>
            </div>
          </div>
        </div>
      </div>

      

      {/* Buyurtmalar boshqaruvi */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('active')}
              className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                selectedView === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faol ({stats.activeOrders})
            </button>
            <button
              onClick={() => setSelectedView('completed')}
              className={`px-3 py-2 rounded-md font-medium transition-all text-sm ${
                selectedView === 'completed'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tugallangan ({stats.completedToday})
            </button>
          </div>

          {selectedView === 'active' && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Qidiruv..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-32 sm:w-40"
                />
              </div>
              <button
                onClick={loadDashboardData}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <RefreshCw size={16} />
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
                <div key={order.id} className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        order.priority === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Package size={20} className={
                          order.priority === 'urgent' ? 'text-red-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-slate-900">{order.customerName}</h4>
                          {order.priority === 'urgent' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Shoshilinch
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <MapPin size={12} />
                            <span>{order.distance}</span>
                          </span>
                          <span>#{order.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900">{formatPrice(order.total)}</span>
                      <div className={`text-xs font-medium mt-1 ${
                        order.status === 'ready' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {order.status === 'ready' ? 'Tayyor' : 'Yetkazilmoqda'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 mb-3 border">
                    <p className="text-slate-700 text-sm mb-2">
                      <MapPin size={14} className="inline mr-1 text-slate-400" />
                      {order.address}
                    </p>
                    <div className="text-xs text-slate-600">
                      {order.items.map((item, index) => (
                        <span key={item.id}>
                          {item.quantity}x {item.name}
                          {index < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all text-sm"
                    >
                      <Phone size={14} />
                      <span>Qo'ng'iroq</span>
                    </a>
                    
                    <button
                      onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(order.address)}`, '_blank')}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all text-sm"
                    >
                      <Navigation size={14} />
                      <span>Yo'nalish</span>
                    </button>

                    {order.status === 'ready' ? (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'delivering')}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all text-sm"
                      >
                        <Play size={14} />
                        <span>Boshlash</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all text-sm"
                      >
                        <CheckCircle size={14} />
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

        
      </div>
    </div>
  );
};

export default CourierDashboard;
