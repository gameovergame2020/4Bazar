import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Database,
  Server,
  Lock,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Order, Cake } from '../../services/dataService';
import { authService, UserData } from '../../services/authService';

interface SystemMetrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeUsers: number;
  systemUptime: number;
  serverLoad: number;
  databaseSize: number;
}

interface UserStats {
  customers: number;
  bakers: number;
  shops: number;
  couriers: number;
  operators: number;
  admins: number;
}

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeUsers: 0,
    systemUptime: 99.9,
    serverLoad: 45,
    databaseSize: 2.4
  });

  const [userStats, setUserStats] = useState<UserStats>({
    customers: 0,
    bakers: 0,
    shops: 0,
    couriers: 0,
    operators: 0,
    admins: 0
  });

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [ordersData, cakesData] = await Promise.all([
        dataService.getOrders(),
        dataService.getCakes() // Barcha mahsulotlar (baker va shop)
      ]);
      
      setOrders(ordersData);
      setCakes(cakesData);
      
      // Calculate metrics
      const totalOrders = ordersData.length;
      const totalRevenue = ordersData
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalPrice, 0);
      const totalProducts = cakesData.length;
      
      // Simulate user data (in real app, you'd fetch from users collection)
      const mockUsers: UserData[] = [
        { id: '1', name: 'Aziza Karimova', email: 'aziza@example.com', phone: '+998901234567', role: 'customer', joinDate: '2024-01-15' },
        { id: '2', name: 'Bobur Saidov', email: 'bobur@example.com', phone: '+998901234568', role: 'baker', joinDate: '2024-01-10' },
        { id: '3', name: 'Malika Ahmedova', email: 'malika@example.com', phone: '+998901234569', role: 'courier', joinDate: '2024-01-20' },
        { id: '4', name: 'Sardor Mirzayev', email: 'sardor@example.com', phone: '+998901234570', role: 'shop', joinDate: '2024-01-05' },
        { id: '5', name: 'Nigora Tosheva', email: 'nigora@example.com', phone: '+998901234571', role: 'operator', joinDate: '2024-01-12' }
      ];
      setUsers(mockUsers);
      
      // Calculate user stats
      const stats = mockUsers.reduce((acc, user) => {
        acc[user.role]++;
        return acc;
      }, {
        customers: 0,
        bakers: 0,
        shops: 0,
        couriers: 0,
        operators: 0,
        admins: 1 // Current admin
      });
      setUserStats(stats);
      
      setMetrics({
        totalUsers: mockUsers.length + 1,
        totalOrders,
        totalRevenue,
        totalProducts,
        activeUsers: Math.floor(mockUsers.length * 0.7),
        systemUptime: 99.9,
        serverLoad: 45,
        databaseSize: 2.4
      });
      
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-600';
      case 'baker': return 'bg-orange-100 text-orange-600';
      case 'shop': return 'bg-green-100 text-green-600';
      case 'courier': return 'bg-purple-100 text-purple-600';
      case 'operator': return 'bg-yellow-100 text-yellow-600';
      case 'admin': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'customer': return 'Mijoz';
      case 'baker': return 'Oshpaz';
      case 'shop': return 'Do\'kon';
      case 'courier': return 'Kuryer';
      case 'operator': return 'Operator';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Administrator paneli</h2>
        <p className="text-red-100">Butun tizimni boshqaring va nazorat qiling</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-gray-100">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Umumiy ko\'rinish', icon: BarChart3 },
            { id: 'users', label: 'Foydalanuvchilar', icon: Users },
            { id: 'orders', label: 'Buyurtmalar', icon: Package },
            { id: 'system', label: 'Tizim', icon: Server },
            { id: 'settings', label: 'Sozlamalar', icon: Settings }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <IconComponent size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                  <p className="text-sm text-gray-600">Foydalanuvchilar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
                  <p className="text-sm text-gray-600">Buyurtmalar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{Math.round(metrics.totalRevenue / 1000000)}M</p>
                  <p className="text-sm text-gray-600">Daromad</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
                  <p className="text-sm text-gray-600">Mahsulotlar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Activity size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
                  <p className="text-sm text-gray-600">Faol</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.systemUptime}%</p>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Server size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.serverLoad}%</p>
                  <p className="text-sm text-gray-600">Server yuki</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Database size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.databaseSize}GB</p>
                  <p className="text-sm text-gray-600">Ma'lumotlar</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Foydalanuvchilar taqsimoti</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(userStats).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${getRoleColor(role)}`}>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{getRoleText(role)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi buyurtmalar</h3>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-medium text-gray-900">#{order.id?.slice(-6)}</h4>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatPrice(order.totalPrice)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status === 'delivered' ? 'Yetkazildi' :
                         order.status === 'preparing' ? 'Tayyorlanmoqda' : 'Kutilmoqda'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top mahsulotlar</h3>
              <div className="space-y-3">
                {cakes.slice(0, 5).map((cake) => (
                  <div key={cake.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <img 
                      src={cake.image}
                      alt={cake.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cake.name}</h4>
                      <p className="text-sm text-gray-600">
                        {cake.productType === 'baked' ? cake.bakerName : cake.shopName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatPrice(cake.price)}</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">{cake.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Foydalanuvchilar boshqaruvi</h3>
            <button className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
              <Plus size={16} />
              <span>Yangi foydalanuvchi</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Foydalanuvchi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Telefon</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Qo'shildi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{user.email}</td>
                    <td className="py-3 px-4 text-gray-700">{user.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.joinDate).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-700">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-700">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-yellow-600 hover:text-yellow-700">
                          <Lock size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {selectedTab === 'orders' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Buyurtmalar boshqaruvi</h3>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Download size={16} />
              <span>Eksport</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">#{order.id?.slice(-8)} - {order.cakeName}</h4>
                    <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                  </div>
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
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Miqdor: {order.quantity}</span>
                  <span>Narx: {formatPrice(order.totalPrice)}</span>
                  <span>Sana: {order.createdAt.toLocaleDateString('uz-UZ')}</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye size={16} />
                    </button>
                    <button className="text-green-600 hover:text-green-700">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Tab */}
      {selectedTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Server holati</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">CPU yuki</span>
                  <span className="font-medium text-gray-900">{metrics.serverLoad}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${metrics.serverLoad}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Xotira</span>
                  <span className="font-medium text-gray-900">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Disk</span>
                  <span className="font-medium text-gray-900">34%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '34%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ma'lumotlar bazasi</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hajmi</span>
                  <span className="font-medium text-gray-900">{metrics.databaseSize} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Jadvallar</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Yozuvlar</span>
                  <span className="font-medium text-gray-900">45,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Oxirgi backup</span>
                  <span className="font-medium text-gray-900">2 soat oldin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tizim loglari</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[
                { time: '14:32:15', level: 'INFO', message: 'Yangi foydalanuvchi ro\'yhatdan o\'tdi' },
                { time: '14:28:42', level: 'WARN', message: 'Server yuki yuqori' },
                { time: '14:25:18', level: 'INFO', message: 'Buyurtma muvaffaqiyatli yaratildi' },
                { time: '14:22:03', level: 'ERROR', message: 'To\'lov xatoligi' },
                { time: '14:18:55', level: 'INFO', message: 'Tizim backup yakunlandi' }
              ].map((log, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-500 font-mono">{log.time}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    log.level === 'ERROR' ? 'bg-red-100 text-red-600' :
                    log.level === 'WARN' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-700">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tizim sozlamalari</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Umumiy sozlamalar</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ro'yhatdan o'tishga ruxsat</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email tasdiqlash</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Maintenance rejimi</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Xavfsizlik</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">2FA majburiy</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Session timeout</span>
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                      <option>30 daqiqa</option>
                      <option>1 soat</option>
                      <option>2 soat</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">IP whitelist</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors">
                O'zgarishlarni saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;