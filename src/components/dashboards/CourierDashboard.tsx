import React, { useState, useEffect } from 'react';
import { Navigation, Package, Clock, CheckCircle, MapPin, Phone, Truck, DollarSign, Star, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Order } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const CourierDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
    averageRating: 4.8,
    totalDeliveries: 0,
    workingHours: 0
  });

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all orders
      const allOrders = await dataService.getOrders();
      
      // Filter orders assigned to this courier (in real app, you'd have courierId field)
      // For demo, we'll simulate some orders
      const courierOrders = allOrders.filter(order => 
        ['delivering', 'ready'].includes(order.status)
      ).slice(0, 3); // Simulate assigned orders
      
      const active = courierOrders.filter(order => 
        ['delivering', 'ready'].includes(order.status)
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedToday = allOrders.filter(order => 
        order.status === 'delivered' && 
        order.createdAt >= today
      ).slice(0, 5); // Simulate completed deliveries
      
      setActiveDeliveries(active);
      setCompletedDeliveries(completedToday);
      
      // Calculate stats
      const activeCount = active.length;
      const completedTodayCount = completedToday.length;
      const totalEarnings = completedToday.reduce((sum, order) => sum + (order.totalPrice * 0.1), 0); // 10% commission
      const totalDeliveries = completedToday.length + 45; // Simulate total
      const workingHours = 8.5; // Simulate working hours
      
      setStats({
        activeDeliveries: activeCount,
        completedToday: completedTodayCount,
        totalEarnings,
        averageRating: 4.8,
        totalDeliveries,
        workingHours
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
      
      // Send notification to customer
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
      case 'ready': return 'bg-blue-100 text-blue-600';
      case 'delivering': return 'bg-purple-100 text-purple-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'ready': return 'Olib ketishga tayyor';
      case 'delivering': return 'Yo\'lda';
      case 'delivered': return 'Yetkazildi';
      default: return 'Noma\'lum';
    }
  };

  if (loading && activeDeliveries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Kuryer paneli</h2>
        <p className="text-purple-100">Buyurtmalarni yetkazib bering va daromad qiling</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeDeliveries}</p>
              <p className="text-sm text-gray-600">Faol yetkazish</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              <p className="text-sm text-gray-600">Bugun tugallandi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.workingHours}</p>
              <p className="text-sm text-gray-600">Soat ishladi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{Math.round(stats.totalEarnings / 1000)}K</p>
              <p className="text-sm text-gray-600">Bugungi daromad</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              <p className="text-sm text-gray-600">Reyting</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              <p className="text-sm text-gray-600">Jami yetkazish</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Faol yetkazishlar</h3>
          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
            {activeDeliveries.length} ta
          </span>
        </div>
        
        <div className="space-y-4">
          {activeDeliveries.map((delivery) => (
            <div key={delivery.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">#{delivery.id?.slice(-6)} - {delivery.cakeName}</h4>
                  <p className="text-sm text-gray-600">{delivery.customerName}</p>
                  <p className="text-sm text-gray-500">{delivery.customerPhone}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                  {getStatusText(delivery.status)}
                </span>
              </div>
              
              <div className="flex items-start space-x-3 mb-4">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-700 flex-1">{delivery.deliveryAddress}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Miqdor: {delivery.quantity}</span>
                  <span>Narx: {formatPrice(delivery.totalPrice)}</span>
                  <span>Komissiya: {formatPrice(delivery.totalPrice * 0.1)}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                    <Phone size={14} />
                    <span>Qo'ng'iroq</span>
                  </button>
                  <button className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors">
                    <Navigation size={14} />
                    <span>Yo'nalish</span>
                  </button>
                  {delivery.status === 'ready' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(delivery.id!, 'delivering')}
                      className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                    >
                      Olib ketdim
                    </button>
                  )}
                  {delivery.status === 'delivering' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(delivery.id!, 'delivered')}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      Yetkazildi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {activeDeliveries.length === 0 && (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Hozircha faol yetkazishlar yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Completed */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bugun tugallangan</h3>
        <div className="space-y-3">
          {completedDeliveries.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-900">#{delivery.id?.slice(-6)} - {delivery.cakeName}</h4>
                <p className="text-sm text-gray-600">{delivery.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+{formatPrice(delivery.totalPrice * 0.1)}</p>
                <p className="text-sm text-gray-500">{delivery.createdAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          
          {completedDeliveries.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Bugun hali yetkazish tugallanmagan</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 transition-colors">
          <Navigation size={24} className="mx-auto mb-2" />
          <span className="block font-medium">Xaritani ochish</span>
        </button>
        <button className="bg-green-500 text-white p-4 rounded-xl hover:bg-green-600 transition-colors">
          <Package size={24} className="mx-auto mb-2" />
          <span className="block font-medium">Yangi buyurtma</span>
        </button>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Haftalik statistika</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((day, index) => {
            const height = Math.random() * 60 + 20; // Random height for demo
            return (
              <div key={day} className="text-center">
                <div className="bg-gray-200 rounded-lg mb-2 flex items-end justify-center" style={{ height: '80px' }}>
                  <div 
                    className="bg-purple-500 rounded-lg w-full"
                    style={{ height: `${height}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourierDashboard;