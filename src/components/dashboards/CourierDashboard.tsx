
import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, MapPin, Clock, DollarSign, CheckCircle, AlertCircle, 
  Phone, User, LogOut, Settings, Navigation, Star, Users, TrendingUp,
  Calendar, BarChart3, Trophy, Target, Zap, Timer, ArrowUp, ArrowDown,
  Filter, Search, RefreshCw, Bell, Eye, MessageCircle, Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProfileManager } from '../../hooks/useProfileManager';
import ProfileManager from '../ProfileManager';
import SettingsPage from '../SettingsPage';
import { dataService, Order } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const CourierDashboard = () => {
  const { userData, logout } = useAuth();
  const { showProfile, openUserProfile, closeProfile } = useProfileManager();
  const [loading, setLoading] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
    averageRating: 4.8,
    totalDeliveries: 0,
    workingHours: 0,
    monthlyEarnings: 0,
    weeklyDeliveries: 0,
    onTimePercentage: 95,
    customerRating: 4.9
  });
  const [selectedView, setSelectedView] = useState<'active' | 'completed' | 'analytics'>('active');
  const [showSettings, setShowSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'delivering'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Demo haftalik ma'lumotlar
  const weeklyData = [
    { day: 'Dush', deliveries: 8, earnings: 144000 },
    { day: 'Sesh', deliveries: 12, earnings: 216000 },
    { day: 'Chor', deliveries: 10, earnings: 180000 },
    { day: 'Pay', deliveries: 15, earnings: 270000 },
    { day: 'Juma', deliveries: 18, earnings: 324000 },
    { day: 'Shan', deliveries: 20, earnings: 360000 },
    { day: 'Yak', deliveries: 14, earnings: 252000 }
  ];

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);

      const allOrders = await dataService.getOrders();
      const courierOrders = allOrders.filter(order => 
        ['delivering', 'ready'].includes(order.status)
      ).slice(0, 5);

      const active = courierOrders.filter(order => 
        ['delivering', 'ready'].includes(order.status)
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = allOrders.filter(order => 
        order.status === 'delivered' && 
        order.createdAt >= today
      ).slice(0, 8);

      setActiveDeliveries(active);
      setCompletedDeliveries(completedToday);

      const activeCount = active.length;
      const completedTodayCount = completedToday.length;
      const todayEarnings = completedToday.reduce((sum, order) => sum + (order.totalPrice * 0.12), 0);
      const monthlyEarnings = todayEarnings * 25;
      const weeklyDeliveries = weeklyData.reduce((sum, day) => sum + day.deliveries, 0);
      const totalDeliveries = weeklyDeliveries + 156;
      const workingHours = 8.5;

      setStats({
        activeDeliveries: activeCount,
        completedToday: completedTodayCount,
        totalEarnings: todayEarnings,
        averageRating: 4.8,
        totalDeliveries,
        workingHours,
        monthlyEarnings,
        weeklyDeliveries,
        onTimePercentage: 95,
        customerRating: 4.9
      });

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (orderId: string, status: Order['status']) => {
    try {
      await dataService.updateOrderStatus(orderId, status);

      const order = activeDeliveries.find(o => o.id === orderId);
      if (order) {
        await notificationService.createOrderNotification(
          order.customerId,
          orderId,
          status,
          order.cakeName
        );
      }

      await loadData();
    } catch (error) {
      console.error('Buyurtma holatini yangilashda xatolik:', error);
      alert('Buyurtma holatini yangilashda xatolik yuz berdi');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'ready': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivering': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yo\'lda';
      case 'delivered': return 'Yetkazildi';
      default: return 'Noma\'lum';
    }
  };

  const filteredDeliveries = activeDeliveries.filter(delivery => {
    const matchesSearch = delivery.cakeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && activeDeliveries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gradient-to-r from-purple-500 to-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-6">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="flex justify-between items-center py-4 px-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Kuryer Dashboard
            </h1>
            <p className="text-slate-600">Salom, {userData?.name || 'Kuryer'}! 👋</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => openUserProfile(userData)}
              className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <User size={18} />
              <span>Profil</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={logout}
              className="p-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Bugungi ish kuni</h2>
            <p className="text-purple-100 mb-4">Yetkazib berishlar va daromadingiz haqida ma'lumot</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Faol holat</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span className="text-sm">{stats.workingHours} soat ishladingiz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package size={24} className="text-purple-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +12%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.activeDeliveries}</p>
            <p className="text-slate-600 text-sm">Faol yetkazish</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +8%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.completedToday}</p>
            <p className="text-slate-600 text-sm">Bugun tugallandi</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarSign size={24} className="text-blue-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +15%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{Math.round(stats.totalEarnings / 1000)}K</p>
            <p className="text-slate-600 text-sm">Bugungi daromad</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star size={24} className="text-yellow-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +0.2
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.customerRating}</p>
            <p className="text-slate-600 text-sm">Mijoz reytingi</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Target size={24} className="text-indigo-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +3%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.onTimePercentage}%</p>
            <p className="text-slate-600 text-sm">O'z vaqtida</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +25
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalDeliveries}</p>
            <p className="text-slate-600 text-sm">Jami yetkazish</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200">
          <div className="flex space-x-1">
            {[
              { id: 'active', label: 'Faol buyurtmalar', icon: Truck, count: stats.activeDeliveries },
              { id: 'completed', label: 'Tugallangan', icon: CheckCircle, count: stats.completedToday },
              { id: 'analytics', label: 'Analitika', icon: BarChart3, count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedView === tab.id 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedView === tab.id ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Based on Selected View */}
        {selectedView === 'active' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none sm:w-80">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buyurtma yoki mijoz qidiring..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Barcha holatlar</option>
                    <option value="ready">Tayyor</option>
                    <option value="delivering">Yo'lda</option>
                  </select>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center space-x-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>Yangilash</span>
                </button>
              </div>
            </div>

            {/* Active Deliveries */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-semibold text-slate-900">Faol yetkazishlar</h3>
                <p className="text-slate-600 mt-1">{filteredDeliveries.length} ta buyurtma</p>
              </div>
              
              <div className="p-6 space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-slate-900 text-lg">#{delivery.id?.slice(-6)}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                            {getStatusText(delivery.status)}
                          </span>
                        </div>
                        <h5 className="font-medium text-slate-800 mb-1">{delivery.cakeName}</h5>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span className="flex items-center space-x-1">
                            <User size={14} />
                            <span>{delivery.customerName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Phone size={14} />
                            <span>{delivery.customerPhone}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{formatPrice(delivery.totalPrice)}</p>
                        <p className="text-sm text-green-600 font-medium">+{formatPrice(delivery.totalPrice * 0.12)} komissiya</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 mb-4 p-3 bg-slate-50 rounded-xl">
                      <MapPin size={18} className="text-slate-400 mt-1 flex-shrink-0" />
                      <p className="text-slate-700 flex-1">{delivery.deliveryAddress}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="flex items-center space-x-1 text-slate-600">
                          <Package size={14} />
                          <span>Miqdor: {delivery.quantity}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-slate-600">
                          <Clock size={14} />
                          <span>15:30 da tayyor</span>
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
                          <Phone size={16} />
                          <span>Qo'ng'iroq</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors">
                          <Navigation size={16} />
                          <span>Yo'nalish</span>
                        </button>
                        {delivery.status === 'ready' && (
                          <button 
                            onClick={() => handleUpdateDeliveryStatus(delivery.id!, 'delivering')}
                            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors"
                          >
                            <Truck size={16} />
                            <span>Oldim</span>
                          </button>
                        )}
                        {delivery.status === 'delivering' && (
                          <button 
                            onClick={() => handleUpdateDeliveryStatus(delivery.id!, 'delivered')}
                            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle size={16} />
                            <span>Yetkazdim</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredDeliveries.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={64} className="text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-600 mb-2">Faol buyurtmalar yo'q</h3>
                    <p className="text-slate-500">Yangi buyurtmalar kelishini kutib turing</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'completed' && (
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">Bugun tugallangan</h3>
              <p className="text-slate-600 mt-1">{completedDeliveries.length} ta buyurtma</p>
            </div>
            
            <div className="p-6 space-y-3">
              {completedDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">#{delivery.id?.slice(-6)} - {delivery.cakeName}</h4>
                      <p className="text-sm text-slate-600">{delivery.customerName}</p>
                      <p className="text-xs text-slate-500">{delivery.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">+{formatPrice(delivery.totalPrice * 0.12)}</p>
                    <p className="text-sm text-slate-500">Komissiya</p>
                  </div>
                </div>
              ))}

              {completedDeliveries.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle size={64} className="text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-600 mb-2">Bugun hali tugallanmagan</h3>
                  <p className="text-slate-500">Birinchi buyurtmangizni yetkazing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedView === 'analytics' && (
          <div className="space-y-6">
            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Haftalik statistika</h3>
              <div className="grid grid-cols-7 gap-4">
                {weeklyData.map((day, index) => {
                  const maxDeliveries = Math.max(...weeklyData.map(d => d.deliveries));
                  const height = (day.deliveries / maxDeliveries) * 150;
                  const isToday = index === 4; // Friday as today for demo
                  
                  return (
                    <div key={day.day} className="text-center">
                      <div className="bg-slate-100 rounded-xl mb-3 flex items-end justify-center p-2" style={{ height: '180px' }}>
                        <div 
                          className={`rounded-lg w-full transition-all hover:opacity-80 ${
                            isToday ? 'bg-gradient-to-t from-purple-500 to-indigo-500' : 'bg-gradient-to-t from-slate-400 to-slate-500'
                          }`}
                          style={{ height: `${height}px` }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{day.day}</p>
                      <p className="text-lg font-bold text-slate-700">{day.deliveries}</p>
                      <p className="text-xs text-slate-500">{Math.round(day.earnings / 1000)}K so'm</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Ish samaradorligi</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">O'z vaqtida yetkazish</span>
                      <span className="font-bold text-slate-900">{stats.onTimePercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.onTimePercentage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Mijoz mamnunligi</span>
                      <span className="font-bold text-slate-900">{stats.customerRating}/5.0</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.customerRating / 5) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Moliyaviy hisobot</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <span className="text-slate-600">Bugungi daromad</span>
                    <span className="font-bold text-blue-600">{formatPrice(stats.totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <span className="text-slate-600">Oylik daromad</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.monthlyEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                    <span className="text-slate-600">O'rtacha kunlik</span>
                    <span className="font-bold text-purple-600">{formatPrice(stats.monthlyEarnings / 25)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105">
            <Navigation size={32} className="mx-auto mb-3" />
            <span className="block font-medium text-lg">Xarita</span>
            <span className="block text-sm text-blue-100">Yo'lni ochish</span>
          </button>
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105">
            <Package size={32} className="mx-auto mb-3" />
            <span className="block font-medium text-lg">Buyurtmalar</span>
            <span className="block text-sm text-green-100">Yangi topshiriq</span>
          </button>
          <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105">
            <MessageCircle size={32} className="mx-auto mb-3" />
            <span className="block font-medium text-lg">Aloqa</span>
            <span className="block text-sm text-purple-100">Qo'llab-quvvatlash</span>
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105">
            <Trophy size={32} className="mx-auto mb-3" />
            <span className="block font-medium text-lg">Yutuqlar</span>
            <span className="block text-sm text-orange-100">Natijalarim</span>
          </button>
        </div>
      </div>

      {/* Profile Manager */}
      {showProfile && (
        <ProfileManager onClose={closeProfile} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <SettingsPage user={userData} onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Bildirishnomalar</h3>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900">Yangi buyurtma!</p>
              <p className="text-xs text-blue-700">5 daqiqa oldin</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-sm font-medium text-green-900">Yetkazish tugallandi</p>
              <p className="text-xs text-green-700">15 daqiqa oldin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;
