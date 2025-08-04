
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
  Check
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
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
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

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: false,
      emailNotifications: false,
      pushNotifications: true,
      smsNotifications: true
    },
    privacy: {
      profileVisibility: 'public',
      showOrderHistory: false,
      allowReviews: true,
      dataSharing: false
    },
    preferences: {
      language: 'uz',
      currency: 'UZS',
      theme: 'light',
      autoSave: true,
      quickOrder: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      deviceTracking: true,
      autoLogout: false
    }
  });

  const { favoriteCount, favorites, loadFavorites, removeFromFavorites } = useFavorites(user.id);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);

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

      // Membership level calculation
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

  const settingsTabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Bildirishnomalar', icon: Bell },
    { id: 'security', name: 'Xavfsizlik', icon: Shield },
    { id: 'privacy', name: 'Maxfiylik', icon: Lock },
    { id: 'preferences', name: 'Sozlamalar', icon: Settings }
  ];

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Basic Profile Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User size={18} className="text-blue-500" />
                <span>Shaxsiy ma'lumotlar</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To'liq ism</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span>{user.name}</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail size={16} className="text-gray-400" />
                      <span>{user.email || 'Belgilanmagan'}</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone size={16} className="text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tug'ilgan kun</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{user.birthDate ? new Date(user.birthDate).toLocaleDateString('uz-UZ') : 'Belgilanmagan'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Manzil</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Yashash manzilingiz"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{user.address || 'Belgilanmagan'}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="O'zingiz haqida qisqacha..."
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span>{user.bio || 'Bio belgilanmagan'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Username Section */}
            {user.isVerified && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <span className="text-blue-500">@</span>
                  <span>Username</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Tasdiqlangan
                  </span>
                </h4>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username ? (
                        <span className="font-mono text-blue-600">@{user.username}</span>
                      ) : (
                        <span className="text-gray-500">Username belgilanmagan</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Username sizning noyob identifikatoringiz
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {user.username ? 'O\'zgartirish' : 'Qo\'shish'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Change */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Lock size={18} className="text-red-500" />
                  <span className="font-medium text-gray-900">Parolni o'zgartirish</span>
                </div>
                <span className={`transform transition-transform ${showPasswordForm ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {showPasswordForm && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joriy parol</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Joriy parolingizni kiriting"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yangi parol</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Yangi parolingizni kiriting"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors">
                      Parolni yangilash
                    </button>
                    <button 
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Bell size={18} className="text-yellow-500" />
                <span>Bildirishnoma turlari</span>
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Buyurtma yangiliklari</h5>
                    <p className="text-sm text-gray-600">Buyurtma holati haqida xabarlar</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', 'orderUpdates', !settings.notifications.orderUpdates)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.orderUpdates ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Aksiyalar va chegirmalar</h5>
                    <p className="text-sm text-gray-600">Maxsus takliflar haqida xabarlar</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', 'promotions', !settings.notifications.promotions)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.promotions ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.promotions ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <h5 className="font-medium text-gray-900">Email bildirishnomalar</h5>
                      <p className="text-sm text-gray-600">Email orqali xabarlar olish</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone size={16} className="text-gray-400" />
                    <div>
                      <h5 className="font-medium text-gray-900">Push bildirishnomalar</h5>
                      <p className="text-sm text-gray-600">Mobil qurilmaga xabarlar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-gray-400" />
                    <div>
                      <h5 className="font-medium text-gray-900">SMS xabarlar</h5>
                      <p className="text-sm text-gray-600">Telefonga SMS orqali xabarlar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', 'smsNotifications', !settings.notifications.smsNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications.smsNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Shield size={18} className="text-red-500" />
                <span>Xavfsizlik sozlamalari</span>
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Ikki faktorli autentifikatsiya</h5>
                    <p className="text-sm text-gray-600">Qo'shimcha xavfsizlik qatlami</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('security', 'twoFactorAuth', !settings.security.twoFactorAuth)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.security.twoFactorAuth ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Kirish ogohlantirishlari</h5>
                    <p className="text-sm text-gray-600">Yangi qurilmadan kirganda xabar olish</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('security', 'loginAlerts', !settings.security.loginAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.security.loginAlerts ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Qurilmalarni kuzatish</h5>
                    <p className="text-sm text-gray-600">Faol qurilmalarni nazorat qilish</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('security', 'deviceTracking', !settings.security.deviceTracking)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.security.deviceTracking ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.deviceTracking ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Avtomatik chiqish</h5>
                    <p className="text-sm text-gray-600">Faolsizlik vaqtida avtomatik chiqish</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('security', 'autoLogout', !settings.security.autoLogout)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.security.autoLogout ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.autoLogout ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Lock size={18} className="text-purple-500" />
                <span>Maxfiylik sozlamalari</span>
              </h4>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Profil ko'rinishi</h5>
                  <p className="text-sm text-gray-600 mb-3">Kim sizning profilingizni ko'ra oladi</p>
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="public">Hammaga ochiq</option>
                    <option value="friends">Faqat do'stlar</option>
                    <option value="private">Maxfiy</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Buyurtmalar tarixini ko'rsatish</h5>
                    <p className="text-sm text-gray-600">Boshqalar sizning buyurtmalaringizni ko'ra oladi</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('privacy', 'showOrderHistory', !settings.privacy.showOrderHistory)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.showOrderHistory ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.showOrderHistory ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Sharhlar va baholarni qabul qilish</h5>
                    <p className="text-sm text-gray-600">Boshqalar sizga sharh qoldira oladi</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('privacy', 'allowReviews', !settings.privacy.allowReviews)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.allowReviews ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.allowReviews ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Ma'lumotlarni ulashish</h5>
                    <p className="text-sm text-gray-600">Statistika va tahlil uchun anonim ma'lumotlar</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('privacy', 'dataSharing', !settings.privacy.dataSharing)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.dataSharing ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.dataSharing ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Settings size={18} className="text-green-500" />
                <span>Umumiy sozlamalar</span>
              </h4>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Til</h5>
                  <p className="text-sm text-gray-600 mb-3">Interfeys tili</p>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="uz">O'zbek tili</option>
                    <option value="ru">Русский язык</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Valyuta</h5>
                  <p className="text-sm text-gray-600 mb-3">Narxlarni ko'rsatish uchun valyuta</p>
                  <select
                    value={settings.preferences.currency}
                    onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="UZS">O'zbek so'mi (UZS)</option>
                    <option value="USD">AQSh dollari (USD)</option>
                    <option value="RUB">Rossiya rubli (RUB)</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Mavzu</h5>
                  <p className="text-sm text-gray-600 mb-3">Interfeys ko'rinishi</p>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="light">Yorug'</option>
                    <option value="dark">Qorong'u</option>
                    <option value="auto">Avtomatik</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Avtomatik saqlash</h5>
                    <p className="text-sm text-gray-600">O'zgarishlarni avtomatik saqlash</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('preferences', 'autoSave', !settings.preferences.autoSave)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.preferences.autoSave ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">Tezkor buyurtma</h5>
                    <p className="text-sm text-gray-600">Bir click orqali buyurtma berish</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('preferences', 'quickOrder', !settings.preferences.quickOrder)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.preferences.quickOrder ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.preferences.quickOrder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Mening profilim</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`h-32 bg-gradient-to-r ${getMembershipColor(stats.membershipLevel)}`}></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
              <div className="relative">
                {isEditing ? (
                  <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <User size={40} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                )}
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r ${getMembershipColor(stats.membershipLevel)} text-white rounded-full text-xs font-bold`}>
                  {stats.membershipLevel}
                </div>
              </div>

              <div className="flex-1 mt-4 md:mt-0">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <h2 className="text-lg text-blue-600 font-medium">@{user.username || 'username'}</h2>
                  <h3 className="text-base text-gray-500 font-medium">Tortbazar mijozi</h3>
                  <p className="text-gray-600 mt-1">{user.bio || 'Tort sevuvchi mijoz'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan a'zo</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span>{stats.averageRating} reyting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={24} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            <div className="text-sm text-gray-600">Jami buyurtmalar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy size={24} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completedOrders}</div>
            <div className="text-sm text-gray-600">Tugallangan</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{Math.round(stats.totalSpent / 1000)}K</div>
            <div className="text-sm text-gray-600">Jami sarflagan</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart size={24} className="text-pink-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{favoriteCount}</div>
            <div className="text-sm text-gray-600">Sevimlilar</div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Boshqaruv paneli</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'orders' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Buyurtmalar ({userOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'favorites' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sevimlilar ({favoriteCount})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sozlamalar
              </button>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Mening buyurtmalarim</h4>
                <button
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isOrdersExpanded ? 'Yashirish' : 'Barchasini ko\'rish'}
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2">Buyurtmalar yuklanmoqda...</p>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Hozircha buyurtmalaringiz yo'q</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(isOrdersExpanded ? userOrders : userOrders.slice(0, 3)).map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="font-medium text-gray-900">{order.cakeName}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{order.note}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(order.totalPrice)}
                            </span>
                          </div>
                        </div>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="ml-4 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
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

          {activeTab === 'favorites' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Sevimli tortlarim</h4>
                <button
                  onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                  className="text-sm text-pink-600 hover:text-pink-700"
                >
                  {isFavoritesExpanded ? 'Yashirish' : 'Barchasini ko\'rish'}
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Sevimli tortlaringiz yo'q</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isFavoritesExpanded ? favorites : favorites.slice(0, 4)).map((cake) => (
                    <div key={cake.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex space-x-3">
                        <img
                          src={cake.image || 'https://via.placeholder.com/80x80'}
                          alt={cake.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{cake.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{formatPrice(cake.price)}</p>
                          <button
                            onClick={() => handleRemoveFromFavorites(cake.id!)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Sevimlilardan o'chirish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              {/* Settings Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        activeSettingsTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent size={16} />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Settings Content */}
              {renderSettingsContent()}
            </div>
          )}
        </div>

        {/* Achievement Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yutuqlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <Award size={32} className="text-yellow-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">Birinchi buyurtma</div>
              <div className="text-xs text-gray-600">Tizimga birinchi buyurtma</div>
            </div>

            {stats.totalOrders >= 5 && (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Target size={32} className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Doimiy mijoz</div>
                <div className="text-xs text-gray-600">5+ buyurtma</div>
              </div>
            )}

            {stats.membershipLevel === 'Gold' && (
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <Trophy size={32} className="text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Oltin a'zo</div>
                <div className="text-xs text-gray-600">2M+ sarflagan</div>
              </div>
            )}

            {favoriteCount >= 10 && (
              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <Heart size={32} className="text-pink-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Tort sevuvchi</div>
                <div className="text-xs text-gray-600">10+ sevimli</div>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Saqlash
            </button>
          </div>
        )}

        {/* Username Requests Section */}
        {usernameRequests.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Username o'zgartirish so'rovlarim</h3>
            <div className="space-y-3">
              {usernameRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        @{request.currentUsername} → @{request.requestedUsername}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(request.requestedAt).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? 'Kutilmoqda' :
                       request.status === 'approved' ? 'Tasdiqlandi' : 'Rad etildi'}
                    </span>
                  </div>
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-2 text-sm text-red-600">
                      Sabab: {request.rejectionReason}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Username o'zgartirish</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joriy username: <span className="font-mono">@{user.username || 'belgilanmagan'}</span>
              </label>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yangi username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="yangi_username"
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Faqat kichik harflar, raqamlar va _ belgisi. 3-20 ta belgi.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Diqqat:</strong> Username o'zgartirish uchun admin tasdigi kerak. 
                So'rovingiz admin tomonidan ko'rib chiqiladi.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUsernameModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUsernameRequest}
                disabled={loadingUsernameRequest || !newUsername.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
