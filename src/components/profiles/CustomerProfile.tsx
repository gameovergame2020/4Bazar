
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Trophy,
  Heart,
  ShoppingBag,
  Calendar,
  Edit2,
  Save,
  X,
  Award,
  Target,
  TrendingUp,
  Plus,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Moon,
  Sun,
  Languages,
  DollarSign,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { UserData, authService } from '../../services/authService';
import { dataService } from '../../services/dataService';
import { useFavorites } from '../../hooks/useFavorites';

interface CustomerProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    favoriteCount: 0,
    averageRating: 0,
    membershipLevel: 'Bronze'
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    bio: user.bio || '',
    birthDate: user.birthDate || '',
    avatar: null as File | null
  });

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameRequests, setUsernameRequests] = useState<any[]>([]);
  const [loadingUsernameRequest, setLoadingUsernameRequest] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  });

  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: false,
      emailNotifications: false,
      pushNotifications: true,
      smsNotifications: true,
      soundEnabled: true
    },
    privacy: {
      profileVisibility: 'public',
      showOrderHistory: false,
      allowReviews: true,
      dataSharing: false,
      showOnlineStatus: true
    },
    preferences: {
      language: 'uz',
      currency: 'UZS',
      theme: 'light',
      autoSave: true,
      quickOrder: false,
      compactView: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      deviceTracking: true
    }
  });

  const { favoriteCount, favorites, loadFavorites, removeFromFavorites } = useFavorites(user.id);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadUserOrders();
    loadFavorites();
    loadUsernameRequests();
  }, [user.id]);

  const loadUsernameRequests = async () => {
    try {
      const requests = await authService.getUserUsernameRequests(user.id);
      setUsernameRequests(requests);
    } catch (error) {
      console.error('Username so\'rovlarini yuklashda xatolik:', error);
    }
  };

  const handleUsernameRequest = async () => {
    if (!newUsername.trim()) {
      alert('Username kiriting');
      return;
    }

    setLoadingUsernameRequest(true);
    try {
      await authService.requestUsernameChange(user.id, newUsername.toLowerCase().trim());
      setShowUsernameModal(false);
      setNewUsername('');
      await loadUsernameRequests();
      alert('Username o\'zgartirish so\'rovi yuborildi! Admin tasdiqini kuting.');
    } catch (error: any) {
      alert(error.message || 'Xatolik yuz berdi');
    } finally {
      setLoadingUsernameRequest(false);
    }
  };

  const loadUserOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const orders = await dataService.getOrdersByCustomerId(user.id);
      setUserOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await dataService.updateOrderStatus(orderId, 'cancelled');
      await loadUserOrders();
    } catch (error) {
      console.error('Buyurtmani bekor qilishda xatolik:', error);
      alert('Buyurtmani bekor qilishda xatolik yuz berdi');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleRemoveFromFavorites = async (cakeId: string) => {
    try {
      await removeFromFavorites(cakeId);
    } catch (error) {
      console.error('Sevimlilardan o\'chirishda xatolik:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivering': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'accepted': return 'Qabul qilindi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yetkazilmoqda';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return 'Noma\'lum';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const loadStats = async () => {
    try {
      const orders = await dataService.getOrdersByCustomerId(user.id);
      const completedOrders = orders.filter(order => order.status === 'delivered');
      const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

      let membershipLevel = 'Bronze';
      if (totalSpent > 5000000) membershipLevel = 'Platinum';
      else if (totalSpent > 2000000) membershipLevel = 'Gold';
      else if (totalSpent > 500000) membershipLevel = 'Silver';

      setStats({
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        totalSpent,
        favoriteCount,
        averageRating: 4.5,
        membershipLevel
      });
    } catch (error) {
      console.error('Statistikalarni yuklashda xatolik:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      if (editForm.avatar) {
        const imagePath = `avatars/customers/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        bio: editForm.bio,
        birthDate: editForm.birthDate,
        avatar: avatarUrl
      };

      await dataService.updateUser(user.id, updates);
      onUpdate(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Profilni yangilashda xatolik:', error);
      alert('Profilni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-300 to-gray-500';
      default: return 'from-orange-400 to-orange-600';
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Yangi parollar mos kelmaydi');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    try {
      // Parol o'zgartirish logikasi
      alert('Parol muvaffaqiyatli o\'zgartirildi');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false
      });
    } catch (error) {
      alert('Parolni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const mainTabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'orders', name: 'Buyurtmalar', icon: ShoppingBag, count: userOrders.length },
    { id: 'favorites', name: 'Sevimlilar', icon: Heart, count: favoriteCount },
    { id: 'settings', name: 'Sozlamalar', icon: Settings }
  ];

  const settingsTabs = [
    { id: 'account', name: 'Hisob', icon: User, color: 'blue' },
    { id: 'notifications', name: 'Bildirishnomalar', icon: Bell, color: 'yellow' },
    { id: 'privacy', name: 'Maxfiylik', icon: Shield, color: 'green' },
    { id: 'security', name: 'Xavfsizlik', icon: Lock, color: 'red' },
    { id: 'preferences', name: 'Afzalliklar', icon: Settings, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mening profilim</h1>
                <p className="text-sm text-gray-500">Shaxsiy ma'lumotlar va sozlamalar</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  <X size={16} />
                  <span>Bekor qilish</span>
                </button>
              )}
              
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isEditing 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                }`}
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : isEditing ? (
                  <Save size={16} />
                ) : (
                  <Edit2 size={16} />
                )}
                <span>{loading ? 'Saqlanmoqda...' : isEditing ? 'Saqlash' : 'Tahrirlash'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className={`h-40 bg-gradient-to-r ${getMembershipColor(stats.membershipLevel)} relative`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-6">
              <div className={`px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold text-sm border border-white/30`}>
                {stats.membershipLevel} A'zo
              </div>
            </div>
          </div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8 -mt-20">
              <div className="relative">
                <div className="relative group">
                  {isEditing ? (
                    <div className="w-36 h-36 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl border-6 border-white flex items-center justify-center cursor-pointer hover:from-gray-300 hover:to-gray-400 transition-all duration-200 shadow-xl">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <User size={48} className="text-gray-500" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                        <Plus size={24} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={user.name}
                      className="w-36 h-36 rounded-3xl border-6 border-white object-cover shadow-xl"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 mt-6 lg:mt-0 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg text-blue-600 font-semibold">@{user.username || 'username'}</span>
                    {user.isVerified && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check size={12} className="mr-1" />
                        Tasdiqlangan
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2 leading-relaxed">{user.bio || 'Tort sevuvchi mijoz'}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{new Date(user.joinDate || Date.now()).toLocaleDateString('uz-UZ')} dan a'zo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span>{stats.averageRating} reyting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>{user.address || 'Manzil belgilanmagan'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShoppingBag, label: 'Jami buyurtmalar', value: stats.totalOrders, color: 'blue', bg: 'from-blue-500 to-blue-600' },
            { icon: Trophy, label: 'Tugallangan', value: stats.completedOrders, color: 'green', bg: 'from-green-500 to-green-600' },
            { icon: TrendingUp, label: 'Sarflagan', value: `${Math.round(stats.totalSpent / 1000)}K`, color: 'purple', bg: 'from-purple-500 to-purple-600' },
            { icon: Heart, label: 'Sevimlilar', value: favoriteCount, color: 'pink', bg: 'from-pink-500 to-pink-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className={`w-14 h-14 bg-gradient-to-r ${stat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={28} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <div className="flex space-x-1 p-2">
              {mainTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 rounded-2xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shaxsiy ma'lumotlar</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To'liq ism</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <User size={18} className="text-gray-400" />
                            <span>{user.name}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <Phone size={18} className="text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <Mail size={18} className="text-gray-400" />
                            <span>{user.email || 'Belgilanmagan'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Qo'shimcha ma'lumotlar</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tug'ilgan kun</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <Calendar size={18} className="text-gray-400" />
                            <span>{user.birthDate ? new Date(user.birthDate).toLocaleDateString('uz-UZ') : 'Belgilanmagan'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manzil</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Yashash manzilingiz"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <MapPin size={18} className="text-gray-400" />
                            <span>{user.address || 'Belgilanmagan'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        {isEditing ? (
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            rows={3}
                            placeholder="O'zingiz haqida qisqacha..."
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl min-h-[100px]">
                            <span>{user.bio || 'Bio belgilanmagan'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username Section */}
                {user.isVerified && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <span className="text-blue-500">@</span>
                          <span>Username</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <Check size={14} className="mr-1" />
                            Tasdiqlangan
                          </span>
                        </h4>
                        <p className="text-gray-600 mt-1">
                          {user.username ? (
                            <span className="font-mono text-blue-600 text-lg">@{user.username}</span>
                          ) : (
                            <span>Username belgilanmagan</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUsernameModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg"
                      >
                        {user.username ? 'O\'zgartirish' : 'Qo\'shish'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Mening buyurtmalarim</h3>
                
                {isLoadingOrders ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Buyurtmalar yuklanmoqda...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={64} className="text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Buyurtmalar yo'q</h4>
                    <p className="text-gray-500">Hozircha buyurtmalaringiz yo'q</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userOrders.map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h5 className="font-semibold text-gray-900 text-lg">{order.cakeName}</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{order.note}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                              </span>
                              <span className="font-bold text-gray-900 text-lg">
                                {formatPrice(order.totalPrice)}
                              </span>
                            </div>
                          </div>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrderId === order.id}
                              className="ml-6 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all duration-200"
                            >
                              {cancellingOrderId === order.id ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Sevimli tortlarim</h3>
                
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart size={64} className="text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Sevimli tortlar yo'q</h4>
                    <p className="text-gray-500">Hozircha sevimli tortlaringiz yo'q</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((cake) => (
                      <div key={cake.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-all duration-200">
                        <div className="flex space-x-4">
                          <img
                            src={cake.image || 'https://via.placeholder.com/80x80'}
                            alt={cake.name}
                            className="w-20 h-20 rounded-xl object-cover"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">{cake.name}</h5>
                            <p className="text-lg font-bold text-gray-900 mb-2">{formatPrice(cake.price)}</p>
                            <button
                              onClick={() => handleRemoveFromFavorites(cake.id!)}
                              className="text-sm text-red-600 hover:text-red-700 transition-colors"
                            >
                              Olib tashlash
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Navigation */}
                <div className="flex flex-wrap gap-2">
                  {settingsTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeSettingsTab === tab.id
                            ? `bg-${tab.color}-500 text-white shadow-lg`
                            : `text-gray-600 hover:bg-${tab.color}-50 hover:text-${tab.color}-600`
                        }`}
                      >
                        <IconComponent size={18} />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Settings Content */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  {activeSettingsTab === 'account' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Hisob sozlamalari</h4>
                      
                      {/* Password Change */}
                      <div className="bg-white rounded-xl p-6">
                        <h5 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                          <Lock size={18} className="text-red-500" />
                          <span>Parolni o'zgartirish</span>
                        </h5>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Joriy parol</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showCurrent ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                                placeholder="Joriy parolingizni kiriting"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Yangi parol</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showNew ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                                placeholder="Yangi parolingizni kiriting"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Parolni tasdiqlang</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showConfirm ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                                placeholder="Yangi parolingizni takrorlang"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>

                          <button 
                            onClick={handlePasswordChange}
                            className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-medium"
                          >
                            Parolni yangilash
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'notifications' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Bildirishnoma sozlamalari</h4>
                      
                      <div className="grid gap-4">
                        {[
                          { key: 'orderUpdates', label: 'Buyurtma yangiliklari', desc: 'Buyurtma holati haqida xabarlar', icon: ShoppingBag },
                          { key: 'promotions', label: 'Aksiyalar', desc: 'Maxsus takliflar haqida xabarlar', icon: Trophy },
                          { key: 'emailNotifications', label: 'Email bildirishnomalar', desc: 'Email orqali xabarlar olish', icon: Mail },
                          { key: 'pushNotifications', label: 'Push bildirishnomalar', desc: 'Mobil qurilmaga xabarlar', icon: Smartphone },
                          { key: 'smsNotifications', label: 'SMS xabarlar', desc: 'Telefonga SMS orqali xabarlar', icon: Phone },
                          { key: 'soundEnabled', label: 'Ovozli bildirishnomalar', desc: 'Bildirishnoma ovozi', icon: Volume2 }
                        ].map((item) => (
                          <div key={item.key} className="bg-white rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <item.icon size={20} className="text-gray-400" />
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.label}</h5>
                                  <p className="text-sm text-gray-600">{item.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSettingChange('notifications', item.key, !settings.notifications[item.key])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settings.notifications[item.key] ? 'bg-yellow-500' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'privacy' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Maxfiylik sozlamalari</h4>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Profil ko'rinishi</h5>
                          <p className="text-sm text-gray-600 mb-3">Kim sizning profilingizni ko'ra oladi</p>
                          <select
                            value={settings.privacy.profileVisibility}
                            onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="public">Hammaga ochiq</option>
                            <option value="friends">Faqat do'stlar</option>
                            <option value="private">Maxfiy</option>
                          </select>
                        </div>

                        {[
                          { key: 'showOrderHistory', label: 'Buyurtmalar tarixini ko\'rsatish', desc: 'Boshqalar sizning buyurtmalaringizni ko\'ra oladi' },
                          { key: 'allowReviews', label: 'Sharh va baholarni qabul qilish', desc: 'Boshqalar sizga sharh qoldira oladi' },
                          { key: 'dataSharing', label: 'Ma\'lumotlarni ulashish', desc: 'Statistika va tahlil uchun anonim ma\'lumotlar' },
                          { key: 'showOnlineStatus', label: 'Online holatni ko\'rsatish', desc: 'Boshqalar sizning online ekanligingizni ko\'radi' }
                        ].map((item) => (
                          <div key={item.key} className="bg-white rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{item.label}</h5>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                              </div>
                              <button
                                onClick={() => handleSettingChange('privacy', item.key, !settings.privacy[item.key])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settings.privacy[item.key] ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  settings.privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'security' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Xavfsizlik sozlamalari</h4>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'twoFactorAuth', label: 'Ikki faktorli autentifikatsiya', desc: 'Qo\'shimcha xavfsizlik qatlami' },
                          { key: 'loginAlerts', label: 'Kirish ogohlantirishlari', desc: 'Yangi qurilmadan kirganda xabar olish' },
                          { key: 'deviceTracking', label: 'Qurilmalarni kuzatish', desc: 'Faol qurilmalarni nazorat qilish' }
                        ].map((item) => (
                          <div key={item.key} className="bg-white rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{item.label}</h5>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                              </div>
                              <button
                                onClick={() => handleSettingChange('security', item.key, !settings.security[item.key])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settings.security[item.key] ? 'bg-red-500' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  settings.security[item.key] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="bg-white rounded-xl p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Avtomatik chiqish vaqti</h5>
                          <p className="text-sm text-gray-600 mb-3">Faolsizlik vaqtida avtomatik chiqish (daqiqa)</p>
                          <select
                            value={settings.security.sessionTimeout}
                            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          >
                            <option value={15}>15 daqiqa</option>
                            <option value={30}>30 daqiqa</option>
                            <option value={60}>1 soat</option>
                            <option value={120}>2 soat</option>
                            <option value={0}>Hech qachon</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'preferences' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Afzalliklar</h4>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4">
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <Languages size={18} className="text-purple-500" />
                            <span>Interfeys tili</span>
                          </h5>
                          <select
                            value={settings.preferences.language}
                            onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="uz">O'zbek tili</option>
                            <option value="ru">Русский язык</option>
                            <option value="en">English</option>
                          </select>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <DollarSign size={18} className="text-purple-500" />
                            <span>Valyuta</span>
                          </h5>
                          <select
                            value={settings.preferences.currency}
                            onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="UZS">O'zbek so'mi (UZS)</option>
                            <option value="USD">AQSh dollari (USD)</option>
                            <option value="RUB">Rossiya rubli (RUB)</option>
                          </select>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            {settings.preferences.theme === 'light' ? <Sun size={18} className="text-purple-500" /> : <Moon size={18} className="text-purple-500" />}
                            <span>Mavzu</span>
                          </h5>
                          <select
                            value={settings.preferences.theme}
                            onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="light">Yorug'</option>
                            <option value="dark">Qorong'u</option>
                            <option value="auto">Avtomatik</option>
                          </select>
                        </div>

                        {[
                          { key: 'autoSave', label: 'Avtomatik saqlash', desc: 'O\'zgarishlarni avtomatik saqlash', icon: RotateCcw },
                          { key: 'quickOrder', label: 'Tezkor buyurtma', desc: 'Bir click orqali buyurtma berish', icon: Zap },
                          { key: 'compactView', label: 'Ixcham ko\'rinish', desc: 'Interfeysdagi elementlarni kichikroq ko\'rsatish', icon: Settings }
                        ].map((item) => (
                          <div key={item.key} className="bg-white rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <item.icon size={18} className="text-purple-500" />
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.label}</h5>
                                  <p className="text-sm text-gray-600">{item.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSettingChange('preferences', item.key, !settings.preferences[item.key])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settings.preferences[item.key] ? 'bg-purple-500' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  settings.preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Yutuqlar va mukofotlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
              <Award size={40} className="text-yellow-600 mx-auto mb-3" />
              <div className="font-bold text-gray-900 mb-1">Birinchi buyurtma</div>
              <div className="text-sm text-gray-600">Tizimga birinchi buyurtma</div>
            </div>

            {stats.totalOrders >= 5 && (
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <Target size={40} className="text-blue-600 mx-auto mb-3" />
                <div className="font-bold text-gray-900 mb-1">Doimiy mijoz</div>
                <div className="text-sm text-gray-600">5+ buyurtma</div>
              </div>
            )}

            {stats.membershipLevel === 'Gold' && (
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200">
                <Trophy size={40} className="text-yellow-600 mx-auto mb-3" />
                <div className="font-bold text-gray-900 mb-1">Oltin a'zo</div>
                <div className="text-sm text-gray-600">2M+ sarflagan</div>
              </div>
            )}

            {favoriteCount >= 10 && (
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl border border-pink-200">
                <Heart size={40} className="text-pink-600 mx-auto mb-3" />
                <div className="font-bold text-gray-900 mb-1">Tort sevuvchi</div>
                <div className="text-sm text-gray-600">10+ sevimli</div>
              </div>
            )}
          </div>
        </div>

        {/* Username Requests */}
        {usernameRequests.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Username o'zgartirish so'rovlarim</h3>
            <div className="space-y-4">
              {usernameRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg mb-1">
                        @{request.currentUsername} → @{request.requestedUsername}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(request.requestedAt).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? 'Kutilmoqda' :
                       request.status === 'approved' ? 'Tasdiqlandi' : 'Rad etildi'}
                    </span>
                  </div>
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-sm text-red-700 font-medium">Sabab: </span>
                      <span className="text-sm text-red-600">{request.rejectionReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Username o'zgartirish</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joriy username
              </label>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="font-mono text-blue-600">@{user.username || 'belgilanmagan'}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yangi username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-mono">@</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-8 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="yangi_username"
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Faqat kichik harflar, raqamlar va _ belgisi. 3-20 ta belgi.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Diqqat:</strong> Username o'zgartirish uchun admin tasdigi kerak. 
                So'rovingiz admin tomonidan ko'rib chiqiladi.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowUsernameModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUsernameRequest}
                disabled={loadingUsernameRequest || !newUsername.trim()}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 font-medium"
              >
                {loadingUsernameRequest ? 'Yuborilmoqda...' : 'So\'rov yuborish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
