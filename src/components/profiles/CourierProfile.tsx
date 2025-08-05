import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Package,
  Clock,
  Edit2,
  Save,
  User,
  Award,
  TrendingUp,
  Navigation,
  DollarSign,
  Target,
  Shield,
  Activity,
  Camera,
  CheckCircle,
  Trophy,
  Settings,
  Bell,
  Lock,
  CreditCard,
  BarChart3,
  MessageCircle,
  HelpCircle,
  Briefcase,
  Globe,
  ChevronRight,
  AlertCircle,
  Home,
  Zap,
  Calendar
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface CourierProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const CourierProfile: React.FC<CourierProfileProps> = ({ user, onBack, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    successRate: 0,
    workingDays: 0
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    vehicleType: user.vehicleType || 'bike',
    deliveryZone: user.deliveryZone || '',
    avatar: null as File | null
  });

  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    language: 'uz',
    theme: 'light'
  });

  // Statistikalarni yuklash
  useEffect(() => {
    loadStats();
  }, [user.id]);

  const loadStats = async () => {
    try {
      const allOrders = await dataService.getOrders();
      const courierDeliveries = allOrders.filter(order => 
        ['delivering', 'delivered'].includes(order.status)
      ).slice(0, Math.floor(Math.random() * 50) + 15);

      const completedDeliveries = courierDeliveries.filter(order => order.status === 'delivered');
      const totalEarnings = completedDeliveries.length * 18000;
      const successRate = courierDeliveries.length > 0 ? (completedDeliveries.length / courierDeliveries.length) * 100 : 0;
      const workingDays = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));
      const todayDeliveries = Math.floor(Math.random() * 8) + 3;
      const todayEarnings = todayDeliveries * 18000;

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.8,
        todayDeliveries,
        todayEarnings,
        successRate: Math.round(successRate),
        workingDays
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
        const imagePath = `avatars/couriers/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        vehicleType: editForm.vehicleType,
        deliveryZone: editForm.deliveryZone,
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

  const vehicleTypes = [
    { value: 'bike', label: 'Velosiped', icon: '🚴' },
    { value: 'motorcycle', label: 'Mototsikl', icon: '🏍️' },
    { value: 'car', label: 'Avtomobil', icon: '🚗' },
    { value: 'scooter', label: 'Skuter', icon: '🛵' }
  ];

  const getPerformanceLevel = () => {
    if (stats.successRate >= 95) return { level: 'Elite', color: 'from-yellow-400 to-yellow-600' };
    if (stats.successRate >= 90) return { level: 'Pro', color: 'from-purple-400 to-purple-600' };
    if (stats.successRate >= 80) return { level: 'Expert', color: 'from-blue-400 to-blue-600' };
    return { level: 'Standard', color: 'from-gray-400 to-gray-600' };
  };

  const performanceLevel = getPerformanceLevel();

  // Asosiy Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Performance Banner */}
      <div className={`bg-gradient-to-r ${performanceLevel.color} rounded-3xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Trophy size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{performanceLevel.level} Kuryer</h3>
              <p className="text-white/80">Professional darajangiz</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <div className="text-sm text-white/80">Jami yetkazish</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <div className="text-sm text-white/80">Reyting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-sm text-white/80">Muvaffaqiyat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package size={24} className="text-blue-600" />
            </div>
            <span className="text-blue-600 text-sm font-medium">Bugun</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.todayDeliveries}</p>
          <p className="text-slate-600 text-sm">Yetkazish</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <span className="text-green-600 text-sm font-medium">Bugun</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{Math.round(stats.todayEarnings / 1000)}K</p>
          <p className="text-slate-600 text-sm">Daromad</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Star size={24} className="text-purple-600" />
            </div>
            <span className="text-purple-600 text-sm font-medium">O'rtacha</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.averageRating}</p>
          <p className="text-slate-600 text-sm">Reyting</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Target size={24} className="text-orange-600" />
            </div>
            <span className="text-orange-600 text-sm font-medium">Natija</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.successRate}%</p>
          <p className="text-slate-600 text-sm">Samarali</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <button className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Navigation size={28} className="text-blue-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1">Xarita</h4>
          <p className="text-sm text-slate-500">Yo'nalish ko'rish</p>
        </button>

        <button className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle size={28} className="text-green-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1">Aloqa</h4>
          <p className="text-sm text-slate-500">Mijozlar bilan</p>
        </button>

        <button className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 size={28} className="text-purple-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1">Hisobot</h4>
          <p className="text-sm text-slate-500">Ish natijasi</p>
        </button>

        <button className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Award size={28} className="text-orange-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1">Mukofotlar</h4>
          <p className="text-sm text-slate-500">Yutuqlarim</p>
        </button>
      </div>
    </div>
  );

  // Profil Ma'lumotlari
  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
          <div className="relative mx-auto md:mx-0">
            {isEditing ? (
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center cursor-pointer hover:shadow-2xl transition-all duration-300">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Camera size={24} className="text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500">Rasm yuklash</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={user.name}
                  className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
                  <Truck size={18} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-bold bg-white border-2 border-slate-300 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none w-full"
                  placeholder="Ismingiz"
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{user.name}</h2>
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${performanceLevel.color}`}>
                    {performanceLevel.level}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="fill-current text-yellow-500" />
                    <span className="font-bold text-yellow-600">{stats.averageRating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Shield size={14} />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isEditing 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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

      {/* Contact Information */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 mt-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Ma'lumotlarni yangilash</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Telefon raqam</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email manzil</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Yashash manzili</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="To'liq yashash manzilingiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Transport turi</label>
              <select
                value={editForm.vehicleType}
                onChange={(e) => setEditForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {vehicleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Yetkazish hududi</label>
              <input
                type="text"
                value={editForm.deliveryZone}
                onChange={(e) => setEditForm(prev => ({ ...prev, deliveryZone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Masalan: Toshkent shahar markazi"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Sozlamalar
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Sozlamalar</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Bildirishnomalar</div>
              <div className="text-sm text-slate-500">Yangi buyurtmalar haqida xabarnoma</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, notifications: !prev.notifications}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Ovoz signallari</div>
              <div className="text-sm text-slate-500">Bildirishnomalar uchun ovoz</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Til</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({...prev, language: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="uz">O'zbek tili</option>
              <option value="ru">Rus tili</option>
              <option value="en">Ingliz tili</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mavzu</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({...prev, theme: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Yorqin</option>
              <option value="dark">Qorong'u</option>
              <option value="auto">Avtomatik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 mt-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Yordam</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <Phone size={20} className="text-slate-600" />
              <span className="text-slate-700">Qo'llab-quvvatlash</span>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <HelpCircle size={20} className="text-slate-600" />
              <span className="text-slate-700">FAQ</span>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <Globe size={20} className="text-slate-600" />
              <span className="text-slate-700">Qo'llanma</span>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const navigationSections = [
    { id: 'dashboard', label: 'Asosiy', icon: Home },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'settings', label: 'Sozlamalar', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="group p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Kuryer Profili
                </h1>
                <p className="text-sm text-slate-500">Professional dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-40">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navigationSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <section.icon size={20} />
              <span className="text-xs mt-1">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 min-h-screen p-6">
          <div className="space-y-2">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <section.icon size={20} />
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Summary */}
          <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center space-x-3 mb-3">
              <img 
                src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-sm text-slate-600">{performanceLevel.level} Kuryer</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-lg font-bold text-indigo-600">{stats.todayDeliveries}</div>
                <div className="text-xs text-slate-600">Bugun</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-lg font-bold text-purple-600">{stats.averageRating}</div>
                <div className="text-xs text-slate-600">Reyting</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pb-20 md:pb-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default CourierProfile;