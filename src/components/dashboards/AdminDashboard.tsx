import React, { useState, useEffect } from 'react';
import { Users, Package, ShoppingBag, TrendingUp, AlertTriangle, Settings, Shield, BarChart3, UserCheck, Clock, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProfileManager } from '../../hooks/useProfileManager';
import ProfileManager from '../ProfileManager';
import SettingsPage from '../SettingsPage';
import { dataService, Order, Cake } from '../../services/dataService';
import { UserData } from '../../services/authService';

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

interface Department {
  id?: string;
  name: string;
  description: string;
  color: string;
  managerId?: string;
  managerName?: string;
  memberCount: number;
  permissions: string[];
  budget?: number;
  location?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const AdminDashboard = () => {
  const { userData, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'orders' | 'system' | 'settings' | 'statistics' | 'departments'>('overview');
    const [showSettings, setShowSettings] = useState(false);

  // Bo'limlar uchun formalar
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    managerId: '',
    budget: '',
    location: '',
    phone: '',
    email: '',
    permissions: [] as string[]
  });
  const [statistics, setStatistics] = useState<{
    available: any;
    orderBased: any;
    business: any;
  } | null>(null);

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
      loadStatistics();
    }
  }, [userData]);

    const { openUserProfile } = useProfileManager();

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data
      const [ordersData, cakesData, departmentsData] = await Promise.all([
        dataService.getOrders(),
        dataService.getCakes(), // Barcha mahsulotlar (baker va shop)
        dataService.getDepartments()
      ]);

      setOrders(ordersData);
      setCakes(cakesData);
      setDepartments(departmentsData);

      // Calculate metrics
      const totalOrders = ordersData.length;
      const totalRevenue = ordersData
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalPrice, 0);
      const totalProducts = cakesData.length;

      // Firebase dan real foydalanuvchilarni olish
      try {
        const realUsers = await dataService.getUsers();
        console.log('Yuklangan foydalanuvchilar:', realUsers);
        setUsers(realUsers);
      } catch (error) {
        console.error('Foydalanuvchilarni yuklashda xato:', error);
        // Xato bo'lsa, bo'sh array
        setUsers([]);
      }

      // Real foydalanuvchi statistikasini hisoblash
      try {
        const realUsers = await dataService.getUsers();
        const stats = realUsers.reduce((acc, user) => {
          if (user.role === 'customer') acc.customers++;
          else if (user.role === 'baker') acc.bakers++;
          else if (user.role === 'shop') acc.shops++;
          else if (user.role === 'courier') acc.couriers++;
          else if (user.role === 'operator') acc.operators++;
          else if (user.role === 'admin') acc.admins++;
          return acc;
        }, {
          customers: 0,
          bakers: 0,
          shops: 0,
          couriers: 0,
          operators: 0,
          admins: 1 // Current admin + other admins
        });
        setUserStats(stats);
      } catch (error) {
        console.error('Foydalanuvchi statistikasi yuklashda xato:', error);
        // Default stats
        setUserStats({
          customers: 0,
          bakers: 0,
          shops: 0,
          couriers: 0,
          operators: 0,
          admins: 1
        });
      }

      // Real foydalanuvchilar soni
      let totalUsers = 1; // Current admin
      let activeUsers = 1;
      try {
        const realUsers = await dataService.getUsers();
        totalUsers = realUsers.length + 1;
        activeUsers = Math.floor(realUsers.length * 0.7) + 1;
      } catch (error) {
        console.warn('Foydalanuvchilar sonini olishda xato:', error);
      }

      setMetrics({
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts,
        activeUsers,
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

  const loadStatistics = async () => {
    try {
      const [available, orderBased, business] = await Promise.all([
        dataService.getAvailableProductsStats(),
        dataService.getOrderBasedProductsStats(),
        dataService.getBusinessStats()
      ]);

      setStatistics({ available, orderBased, business });
    } catch (error) {
      console.error('Statistikani yuklashda xatolik:', error);
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

  // Foydalanuvchini bloklash/blokdan chiqarish
  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await dataService.updateUserStatus(userId, { blocked: !isBlocked });
      // Ma'lumotlarni qayta yuklash
      loadData();
      alert(isBlocked ? 'Foydalanuvchi blokdan chiqarildi' : 'Foydalanuvchi bloklandi');
    } catch (error) {
      console.error('Foydalanuvchi holatini o\'zgartirishda xato:', error);
      alert('Xatolik yuz berdi');
    }
  };

  // Foydalanuvchini o'chirish
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`${userName} ni butunlay o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) {
      try {
        await dataService.deleteUser(userId);
        loadData();
        alert('Foydalanuvchi o\'chirildi');
      } catch (error) {
        console.error('Foydalanuvchini o\'chirishda xato:', error);
        alert('Xatolik yuz berdi');
      }
    }
  };

  // Foydalanuvchi rolini o'zgartirish
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await dataService.updateUserRole(userId, newRole);
      loadData();
      alert('Foydalanuvchi roli o\'zgartirildi');
    } catch (error) {
      console.error('Foydalanuvchi rolini o\'zgartirishda xato:', error);
      alert('Xatolik yuz berdi');
    }
  };

  // Bo'lim saqlash/yangilash
  const handleSaveDepartment = async () => {
    try {
      if (!departmentForm.name.trim()) {
        alert('Bo\'lim nomini kiriting');
        return;
      }

      const departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'> = {
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim(),
        color: departmentForm.color,
        managerId: departmentForm.managerId || undefined,
        managerName: departmentForm.managerId ? 
          users.find(u => u.id === departmentForm.managerId)?.name : undefined,
        memberCount: 0,
        permissions: departmentForm.permissions,
        budget: departmentForm.budget ? parseFloat(departmentForm.budget) : undefined,
        location: departmentForm.location.trim() || undefined,
        phone: departmentForm.phone.trim() || undefined,
        email: departmentForm.email.trim() || undefined,
        status: 'active'
      };

      if (editingDepartment) {
        await dataService.updateDepartment(editingDepartment.id!, departmentData);
        alert('Bo\'lim muvaffaqiyatli yangilandi');
      } else {
        await dataService.createDepartment(departmentData);
        alert('Bo\'lim muvaffaqiyatli yaratildi');
      }

      setShowDepartmentForm(false);
      setEditingDepartment(null);
      loadData();
    } catch (error) {
      console.error('Bo\'lim saqlashda xato:', error);
      alert('Xatolik yuz berdi');
    }
  };

  // Bo'limni o'chirish
  const handleDeleteDepartment = async (departmentId: string, departmentName: string) => {
    if (window.confirm(`"${departmentName}" bo'limini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) {
      try {
        await dataService.deleteDepartment(departmentId);
        alert('Bo\'lim o\'chirildi');
        loadData();
      } catch (error) {
        console.error('Bo\'limni o\'chirishda xato:', error);
        alert('Xatolik yuz berdi');
      }
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Admin paneli</h2>
            <p className="text-red-100">Tizimni boshqaring va nazorat qiling</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openUserProfile(userData)}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <User size={16} />
              <span>Profil</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Settings size={16} />
              <span>Sozlamalar</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-gray-100">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Umumiy ko\'rinish', icon: BarChart3 },
            { id: 'users', label: 'Foydalanuvchilar', icon: Users },
            { id: 'departments', label: 'Bo\'limlar', icon: Globe },
            { id: 'orders', label: 'Buyurtmalar', icon: Package },
            { id: 'statistics', label: 'Statistika', icon: PieChart },
            { id: 'system', label: 'Tizim', icon: Server },
            { id: 'settings', label: 'Sozlamalar', icon: Settings }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'users' | 'orders' | 'system' | 'settings' | 'statistics' | 'departments')}
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
                  <p className="text-lg font-bold text-gray-900">{Math.round((metrics.totalRevenue || 0) / 1000000)}M</p>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tug'ilgan kun</th>
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
                    <td className="py-3 px-4 text-gray-700">
                      {user.birthDate ? new Date(user.birthDate).toLocaleDateString('uz-UZ') : 'Ko\'rsatilmagan'}
                    </td>
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
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Ko'rish"
                          onClick={() => {
                            // Foydalanuvchi profili modalini ochish
                            alert(`${user.name} profili ko'rish`);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Rolni o'zgartirish"
                          onClick={() => {
                            const newRole = prompt(`${user.name} uchun yangi rol kiriting:`, user.role);
                            if (newRole && newRole !== user.role) {
                              handleChangeUserRole(user.id, newRole);
                            }
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-1 text-yellow-600 hover:text-yellow-700"
                          title={user.blocked ? "Blokdan chiqarish" : "Bloklash"}
                          onClick={() => handleBlockUser(user.id, user.blocked || false)}
                        >
                          <Lock size={16} />
                        </button>
                        <button 
                          className="p-1 text-red-600 hover:text-red-700"
                          title="O'chirish"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
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
                      <Edit size={16})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {selectedTab === 'statistics' && (
        <div className="space-y-6">
          {statistics ? (
            <>
              {/* Mavjud mahsulotlar statistikasi */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package size={24} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Mavjud mahsulotlar (Shop)</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.available.totalAvailable || 0}</div>
                    <div className="text-sm text-gray-600">Jami mavjud</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.available.totalQuantity || 0}</div>
                    <div className="text-sm text-gray-600">Umumiy miqdor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{statistics.available.lowStock || 0}</div>
                    <div className="text-sm text-gray-600">Kam qolgan (≤5)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{statistics.available.outOfStock || 0}</div>
                    <div className="text-sm text-gray-600">Tugagan</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Kategoriya bo'yicha taqsimlash</h4>
                  <div className="space-y-2">
                    {Object.entries(statistics.available.categoryBreakdown).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-medium text-gray-900">{count as number} ta</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buyurtma asosidagi mahsulotlar statistikasi */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Buyurtma asosidagi mahsulotlar (Baker)</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.orderBased.totalOrderBased || 0}</div>
                    <div className="text-sm text-gray-600">Jami mahsulot</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{statistics.orderBased.totalOrdered || 0}</div>
                    <div className="text-sm text-gray-600">Jami buyurtma</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{statistics.orderBased.activeOrders || 0}</div>
                    <div className="text-sm text-gray-600">Faol buyurtmalar</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.orderBased.completedOrders || 0}</div>
                    <div className="text-sm text-gray-600">Tugallangan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{statistics.orderBased.cancelledOrders || 0}</div>
                    <div className="text-sm text-gray-600">Bekor qilingan</div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <span className="text-gray-700">Oylik o'sish</span>
                    <span className={`font-bold ${
                      statistics.orderBased.monthlyOrdersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {statistics.orderBased.monthlyOrdersGrowth >= 0 ? '+' : ''}{statistics.orderBased.monthlyOrdersGrowth}%
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Kategoriya bo'yicha taqsimlash</h4>
                  <div className="space-y-2">
                    {Object.entries(statistics.orderBased.categoryBreakdown).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-medium text-gray-900">{count as number} ta</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biznes statistikasi */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Biznes ko'rsatkichlari</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(statistics.business.totalRevenue || 0).toLocaleString('uz-UZ')} so'm
                    </div>
                    <div className="text-sm text-gray-600">Jami daromad</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{statistics.business.totalOrders || 0}</div>
                    <div className="text-sm text-gray-600">Jami buyurtmalar</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(statistics.business.averageOrderValue || 0).toLocaleString('uz-UZ')} so'm
                    </div>
                    <div className="text-sm text-gray-600">O'rtacha buyurtma</div>
                  </div>
                </div>

                {/* Eng ko'p sotilgan mahsulotlar */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Eng ko'p sotilgan mahsulotlar</h4>
                  <div className="space-y-2">
                    {statistics.business.topSellingProducts.map((product: { cakeId: string; cakeName: string; totalSold: number; revenue: number }, index: number) => (
                      <div key={product.cakeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{product.cakeName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{product.totalSold} ta</div>
                          <div className="text-sm text-gray-600">
                            {product.revenue.toLocaleString('uz-UZ')} so'm
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Statistika yuklanmoqda...</p>
              </div>
            </div>
          )}
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

      {/* Departments Tab */}
      {selectedTab === 'departments' && (
        <div className="space-y-6">
          {/* Bo'limlar boshqaruvi */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Bo'limlar boshqaruvi</h3>
              <button 
                onClick={() => {
                  setEditingDepartment(null);
                  setDepartmentForm({
                    name: '',
                    description: '',
                    color: '#3B82F6',
                    managerId: '',
                    budget: '',
                    location: '',
                    phone: '',
                    email: '',
                    permissions: []
                  });
                  setShowDepartmentForm(true);
                }}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                <span>Yangi bo'lim</span>
              </button>
            </div>

            {/* Bo'limlar ro'yxati */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      ></div>
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dept.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {dept.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{dept.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Xodimlar:</span>
                      <span className="font-medium">{dept.memberCount} ta</span>
                    </div>
                    {dept.managerName && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Menejer:</span>
                        <span className="font-medium">{dept.managerName}</span>
                      </div>
                    )}
                    {dept.budget && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Byudjet:</span>
                        <span className="font-medium">{dept.budget.toLocaleString()} so'm</span>
                      </div>
                    )}
                    {dept.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Joylashuv:</span>
                        <span className="font-medium">{dept.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        setEditingDepartment(dept);
                        setDepartmentForm({
                          name: dept.name,
                          description: dept.description,
                          color: dept.color,
                          managerId: dept.managerId || '',
                          budget: dept.budget?.toString() || '',
                          location: dept.location || '',
                          phone: dept.phone || '',
                          email: dept.email || '',
                          permissions: dept.permissions
                        });
                        setShowDepartmentForm(true);
                      }}
                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Tahrirlash
                    </button>
                    <button 
                      onClick={() => handleDeleteDepartment(dept.id!, dept.name)}
                      className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {departments.length === 0 && (
              <div className="text-center py-12">
                <Globe size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bo'limlar mavjud emas</h3>
                <p className="text-gray-600 mb-4">Birinchi bo'limni yaratish uchun yuqoridagi tugmani bosing</p>
              </div>
            )}
          </div>

          {/* Bo'limlar statistikasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                  <p className="text-sm text-gray-600">Jami bo'limlar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {departments.filter(d => d.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Faol bo'limlar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {departments.reduce((sum, d) => sum + d.memberCount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Jami xodimlar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(departments.reduce((sum, d) => sum + (d.budget || 0), 0) / 1000000)}M
                  </p>
                  <p className="text-sm text-gray-600">Jami byudjet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bo'lim qo'shish/tahrirlash modali */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDepartment ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim qo\'shish'}
              </h2>
              <button 
                onClick={() => setShowDepartmentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Bo'lim nomi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bo'lim nomi *</label>
                <input
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masalan: IT bo'limi"
                  required
                />
              </div>

              {/* Tavsif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                <textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Bo'lim haqida qisqacha ma'lumot"
                />
              </div>

              {/* Rang */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rang</label>
                <input
                  type="color"
                  value={departmentForm.color}
                  onChange={(e) => setDepartmentForm({...departmentForm, color: e.target.value})}
                  className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Menejer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menejer</label>
                  <select
                    value={departmentForm.managerId}
                    onChange={(e) => setDepartmentForm({...departmentForm, managerId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Menejer tanlanmagan</option>
                    {users.filter(u => u.role === 'admin' || u.role === 'operator').map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                {/* Byudjet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Byudjet (so'm)</label>
                  <input
                    type="number"
                    value={departmentForm.budget}
                    onChange={(e) => setDepartmentForm({...departmentForm, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Joylashuv */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joylashuv</label>
                  <input
                    type="text"
                    value={departmentForm.location}
                    onChange={(e) => setDepartmentForm({...departmentForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masalan: 2-qavat, 201-xona"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={departmentForm.phone}
                    onChange={(e) => setDepartmentForm({...departmentForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+998 99 123 45 67"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={departmentForm.email}
                  onChange={(e) => setDepartmentForm({...departmentForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="department@company.com"
                />
              </div>

              {/* Ruxsatlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ruxsatlar</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'create_orders', 'manage_users', 'view_analytics', 
                    'manage_products', 'financial_access', 'system_settings'
                  ].map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={departmentForm.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartmentForm({
                              ...departmentForm, 
                              permissions: [...departmentForm.permissions, permission]
                            });
                          } else {
                            setDepartmentForm({
                              ...departmentForm, 
                              permissions: departmentForm.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">
                        {permission === 'create_orders' ? 'Buyurtma yaratish' :
                         permission === 'manage_users' ? 'Foydalanuvchilar' :
                         permission === 'view_analytics' ? 'Analitika' :
                         permission === 'manage_products' ? 'Mahsulotlar' :
                         permission === 'financial_access' ? 'Moliya' :
                         'Tizim sozlamalari'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDepartmentForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveDepartment}
                disabled={!departmentForm.name.trim()}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingDepartment ? 'Yangilash' : 'Saqlash'}
              </button>
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
                  <div className="flex items-center justify-between                    <span className="text-gray-600">2FA majburiy</span>
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
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                    <SettingsPage onClose={() => setShowSettings(false)} />
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;