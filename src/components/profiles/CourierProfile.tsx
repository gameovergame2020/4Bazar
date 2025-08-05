
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
  Calendar,
  Edit2,
  Save,
  User,
  Award,
  TrendingUp,
  Navigation,
  DollarSign,
  Target,
  Shield,
  Zap,
  Activity,
  Camera,
  CheckCircle,
  Upload,
  Trophy,
  Map,
  Settings,
  Bell,
  Eye,
  Lock,
  CreditCard,
  FileText,
  BarChart3,
  Users,
  MessageCircle,
  HelpCircle,
  Briefcase,
  MapPin as LocationIcon,
  Globe,
  Smartphone,
  Calendar as CalendarIcon,
  Clock as TimeIcon,
  ChevronRight,
  AlertCircle,
  Info,
  CheckSquare,
  Filter,
  Download,
  Share2,
  Bookmark,
  Heart,
  Home
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
    totalDistance: 0,
    workingDays: 0,
    successRate: 0,
    onTimeDeliveries: 0,
    customerSatisfaction: 0,
    monthlyEarnings: 0,
    weeklyDeliveries: 0,
    todayDeliveries: 0,
    todayEarnings: 0
  });

  const [settings, setSettings] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      paymentAlerts: true,
      promotions: false,
      weeklyReports: true
    },
    privacy: {
      showRating: true,
      showStats: true,
      shareLocation: true
    },
    preferences: {
      language: 'uz',
      currency: 'UZS',
      theme: 'light',
      soundEnabled: true
    }
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    bio: user.bio || '',
    vehicleType: user.vehicleType || 'bike',
    deliveryZone: user.deliveryZone || '',
    experience: user.experience || '',
    avatar: null as File | null,
    emergencyContact: user.emergencyContact || '',
    drivingLicense: user.drivingLicense || '',
    vehicleNumber: user.vehicleNumber || ''
  });

  // Navigation sections
  const navigationSections = [
    { id: 'dashboard', label: 'Asosiy', icon: Home, color: 'bg-blue-500' },
    { id: 'profile', label: 'Profil', icon: User, color: 'bg-green-500' },
    { id: 'statistics', label: 'Statistika', icon: BarChart3, color: 'bg-purple-500' },
    { id: 'work', label: 'Ish ma\'lumotlari', icon: Briefcase, color: 'bg-orange-500' },
    { id: 'settings', label: 'Sozlamalar', icon: Settings, color: 'bg-slate-500' },
    { id: 'help', label: 'Yordam', icon: HelpCircle, color: 'bg-red-500' }
  ];

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
      const onTimeDeliveries = Math.floor(completedDeliveries.length * 0.92);
      const customerSatisfaction = Math.floor(Math.random() * 15) + 85;

      // Today stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = Math.floor(Math.random() * 8) + 3;
      const todayEarnings = todayDeliveries * 18000;
      const monthlyEarnings = totalEarnings * 1.5;
      const weeklyDeliveries = Math.floor(Math.random() * 25) + 15;

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.8,
        totalDistance: completedDeliveries.length * 12.3,
        workingDays,
        successRate: Math.round(successRate),
        onTimeDeliveries,
        customerSatisfaction,
        monthlyEarnings,
        weeklyDeliveries,
        todayDeliveries,
        todayEarnings
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
        bio: editForm.bio,
        vehicleType: editForm.vehicleType,
        deliveryZone: editForm.deliveryZone,
        experience: editForm.experience,
        emergencyContact: editForm.emergencyContact,
        drivingLicense: editForm.drivingLicense,
        vehicleNumber: editForm.vehicleNumber,
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

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    // Save to backend
    try {
      await dataService.updateUser(user.id, { settings: newSettings });
    } catch (error) {
      console.error('Sozlamalarni saqlashda xatolik:', error);
    }
  };

  const vehicleTypes = [
    { value: 'bike', label: 'Velosiped', icon: '🚴', color: 'bg-green-100 text-green-700' },
    { value: 'motorcycle', label: 'Mototsikl', icon: '🏍️', color: 'bg-blue-100 text-blue-700' },
    { value: 'car', label: 'Avtomobil', icon: '🚗', color: 'bg-purple-100 text-purple-700' },
    { value: 'scooter', label: 'Skuter', icon: '🛵', color: 'bg-orange-100 text-orange-700' }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.7) return 'text-emerald-600';
    if (rating >= 4.3) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = () => {
    if (stats.successRate >= 95) return { level: 'Elite', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', textColor: 'text-yellow-700' };
    if (stats.successRate >= 90) return { level: 'Pro', color: 'bg-gradient-to-r from-purple-400 to-purple-600', textColor: 'text-purple-700' };
    if (stats.successRate >= 80) return { level: 'Expert', color: 'bg-gradient-to-r from-blue-400 to-blue-600', textColor: 'text-blue-700' };
    return { level: 'Standard', color: 'bg-gradient-to-r from-gray-400 to-gray-600', textColor: 'text-gray-700' };
  };

  const performanceLevel = getPerformanceLevel();

  // Render different sections
  const renderDashboardSection = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-lg sm:rounded-xl">
              <Package size={18} className="sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-blue-700 text-xs sm:text-sm font-medium">Bugun</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.todayDeliveries}</p>
          <p className="text-blue-700 text-xs sm:text-sm">Yetkazish</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-500 rounded-xl">
              <DollarSign size={24} className="text-white" />
            </div>
            <span className="text-green-700 text-sm font-medium">Bugun</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{Math.round(stats.todayEarnings / 1000)}K</p>
          <p className="text-green-700 text-sm">Daromad</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Star size={24} className="text-white" />
            </div>
            <span className="text-purple-700 text-sm font-medium">Reyting</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.averageRating}</p>
          <p className="text-purple-700 text-sm">O'rtacha</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Target size={24} className="text-white" />
            </div>
            <span className="text-orange-700 text-sm font-medium">Samarali</span>
          </div>
          <p className="text-3xl font-bold text-orange-900">{stats.successRate}%</p>
          <p className="text-orange-700 text-sm">Muvaffaqiyat</p>
        </div>
      </div>

      {/* Performance Level Banner */}
      <div className={`${performanceLevel.color} rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
            <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl">
              <Trophy size={24} className="sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">{performanceLevel.level} Kuryer</h3>
              <p className="text-white/80 text-sm sm:text-base">Professional darajangiz</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalDeliveries}</div>
              <div className="text-xs sm:text-sm text-white/80">Jami yetkazish</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold">{Math.round(stats.totalDistance)} km</div>
              <div className="text-xs sm:text-sm text-white/80">Bosib o'tilgan</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold">{stats.workingDays}</div>
              <div className="text-xs sm:text-sm text-white/80">Ish kunlari</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <button className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <Navigation size={20} className="sm:w-7 sm:h-7 text-blue-600" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Xarita</h4>
          <p className="text-xs sm:text-sm text-slate-500">Yo'nalishni ko'rish</p>
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
            <FileText size={28} className="text-purple-600" />
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

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <div className="flex items-start space-x-6">
          <div className="relative">
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
                <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-500 text-white rounded-xl shadow-lg">
                  <Upload size={16} />
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

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-bold bg-white border-2 border-slate-300 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none"
                  placeholder="Ismingiz"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full p-4 border border-slate-300 rounded-xl resize-none bg-white focus:border-indigo-500 transition-all"
                  rows={3}
                  placeholder="Professional bio va tajribangiz haqida..."
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{user.name}</h2>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${performanceLevel.color}`}>
                    {performanceLevel.level}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className={`fill-current ${getRatingColor(stats.averageRating)}`} />
                    <span className={`font-bold ${getRatingColor(stats.averageRating)}`}>{stats.averageRating}</span>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">{user.bio || 'Professional kuryer. Tez, xavfsiz va ishonchli yetkazib berish xizmati.'}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
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
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Phone size={20} className="mr-3 text-indigo-600" />
          Aloqa ma'lumotlari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Telefon raqam</label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Phone size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{user.phone}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email manzil</label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Mail size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{user.email || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Yashash manzili</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="To'liq yashash manzilingiz"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <MapPin size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{user.address || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Favqulodda aloqa</label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Favqulodda holat uchun telefon"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <AlertCircle size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{editForm.emergencyContact || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatisticsSection = () => (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Package size={32} className="text-white" />
            </div>
            <TrendingUp size={24} className="text-white/60" />
          </div>
          <div className="text-4xl font-bold mb-2">{stats.totalDeliveries}</div>
          <div className="text-blue-100">Jami yetkazish</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <DollarSign size={32} className="text-white" />
            </div>
            <TrendingUp size={24} className="text-white/60" />
          </div>
          <div className="text-3xl font-bold mb-2">{Math.round(stats.monthlyEarnings / 1000)}K</div>
          <div className="text-green-100">Oylik daromad</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Star size={32} className="text-white" />
            </div>
            <TrendingUp size={24} className="text-white/60" />
          </div>
          <div className="text-4xl font-bold mb-2">{stats.averageRating}</div>
          <div className="text-purple-100">O'rtacha reyting</div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Ish samaradorligi</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-600">O'z vaqtida yetkazish</span>
                <span className="font-bold text-slate-900">{stats.successRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${stats.successRate}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-600">Mijoz mamnunligi</span>
                <span className="font-bold text-slate-900">{stats.customerSatisfaction}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${stats.customerSatisfaction}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-600">Reyting darajasi</span>
                <span className="font-bold text-slate-900">{((stats.averageRating / 5) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Moliyaviy hisobot</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="text-slate-600">Bugungi daromad</span>
              <span className="font-bold text-blue-600">{Math.round(stats.todayEarnings / 1000)}K so'm</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="text-slate-600">Haftalik daromad</span>
              <span className="font-bold text-green-600">{Math.round(stats.todayEarnings * 7 / 1000)}K so'm</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
              <span className="text-slate-600">Oylik daromad</span>
              <span className="font-bold text-purple-600">{Math.round(stats.monthlyEarnings / 1000)}K so'm</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
              <span className="text-slate-600">O'rtacha kunlik</span>
              <span className="font-bold text-orange-600">{Math.round(stats.monthlyEarnings / 30 / 1000)}K so'm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation size={28} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{Math.round(stats.totalDistance)} km</div>
          <div className="text-sm text-slate-500">Bosib o'tilgan</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.onTimeDeliveries}</div>
          <div className="text-sm text-slate-500">Vaqtida yetkazildi</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.completedDeliveries}</div>
          <div className="text-sm text-slate-500">Tugallangan</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarIcon size={28} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stats.workingDays}</div>
          <div className="text-sm text-slate-500">Ish kunlari</div>
        </div>
      </div>
    </div>
  );

  const renderWorkSection = () => (
    <div className="space-y-6">
      {/* Vehicle Information */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Truck size={20} className="mr-3 text-indigo-600" />
          Transport ma'lumotlari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transport turi</label>
            {isEditing ? (
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
            ) : (
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                <div className={`p-3 rounded-xl ${vehicleTypes.find(type => type.value === user.vehicleType)?.color || 'bg-gray-100'}`}>
                  <span className="text-2xl">
                    {vehicleTypes.find(type => type.value === user.vehicleType)?.icon || '🚴'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {vehicleTypes.find(type => type.value === user.vehicleType)?.label || 'Belgilanmagan'}
                  </div>
                  <div className="text-sm text-slate-500">Asosiy transport</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transport raqami</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.vehicleNumber}
                onChange={(e) => setEditForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="01A123BC"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Truck size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{editForm.vehicleNumber || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Haydovchilik guvohnomasi</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.drivingLicense}
                onChange={(e) => setEditForm(prev => ({ ...prev, drivingLicense: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Guvohnoma raqami"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <CreditCard size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{editForm.drivingLicense || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Yetkazish hududi</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.deliveryZone}
                onChange={(e) => setEditForm(prev => ({ ...prev, deliveryZone: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Masalan: Toshkent shahar markazi"
              />
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Map size={18} className="text-slate-400" />
                <span className="font-medium text-slate-900">{user.deliveryZone || 'Belgilanmagan'}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Ish tajribasi</label>
            {isEditing ? (
              <textarea
                value={editForm.experience}
                onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder="Professional tajribangiz haqida ma'lumot bering..."
              />
            ) : (
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                <Award size={18} className="text-slate-400 mt-1" />
                <div>
                  <div className="font-medium text-slate-900">{user.experience || 'Belgilanmagan'}</div>
                  <div className="text-sm text-slate-500">Professional tajriba</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <TimeIcon size={20} className="mr-3 text-indigo-600" />
          Ish jadvali
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Haftalik jadval</h4>
            <div className="space-y-2">
              {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'].map((day, index) => (
                <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">{day}</span>
                  <span className="text-sm text-slate-500">
                    {index < 5 ? '09:00 - 18:00' : index === 5 ? '10:00 - 16:00' : 'Dam olish'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Ish natijasi</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TimeIcon size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-slate-700">Ish soatlari</span>
                </div>
                <span className="font-bold text-blue-600">{stats.workingDays * 8}h</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-slate-700">Samaradorlik</span>
                </div>
                <span className="font-bold text-green-600">{stats.successRate}%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Star size={16} className="text-white" />
                  </div>
                  <span className="font-medium text-slate-700">Reyting</span>
                </div>
                <span className="font-bold text-purple-600">{stats.averageRating}/5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Bell size={20} className="mr-3 text-indigo-600" />
          Bildirishnoma sozlamalari
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-medium text-slate-900">
                  {key === 'newOrders' && 'Yangi buyurtmalar'}
                  {key === 'orderUpdates' && 'Buyurtma yangilanishlari'}
                  {key === 'paymentAlerts' && 'To\'lov xabarlari'}
                  {key === 'promotions' && 'Aksiya va takliflar'}
                  {key === 'weeklyReports' && 'Haftalik hisobotlar'}
                </div>
                <div className="text-sm text-slate-500">
                  {key === 'newOrders' && 'Yangi buyurtma kelganda xabar berish'}
                  {key === 'orderUpdates' && 'Buyurtma holati o\'zgarganda'}
                  {key === 'paymentAlerts' && 'To\'lov haqida ma\'lumot'}
                  {key === 'promotions' && 'Yangi aksiya va bonuslar'}
                  {key === 'weeklyReports' && 'Haftalik ish natijasi'}
                </div>
              </div>
              <button
                onClick={() => updateSettings({
                  ...settings,
                  notifications: { ...settings.notifications, [key]: !value }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Lock size={20} className="mr-3 text-indigo-600" />
          Maxfiylik sozlamalari
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.privacy).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-medium text-slate-900">
                  {key === 'showRating' && 'Reytingni ko\'rsatish'}
                  {key === 'showStats' && 'Statistikani ko\'rsatish'}
                  {key === 'shareLocation' && 'Joylashuvni bo\'lishish'}
                </div>
                <div className="text-sm text-slate-500">
                  {key === 'showRating' && 'Boshqalar sizning reytingingizni ko\'rishi mumkin'}
                  {key === 'showStats' && 'Ish statistikasini ommaga ko\'rsatish'}
                  {key === 'shareLocation' && 'Mijozlar bilan joylashuvni bo\'lishish'}
                </div>
              </div>
              <button
                onClick={() => updateSettings({
                  ...settings,
                  privacy: { ...settings.privacy, [key]: !value }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Settings size={20} className="mr-3 text-indigo-600" />
          Ilova sozlamalari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Til</label>
            <select
              value={settings.preferences.language}
              onChange={(e) => updateSettings({
                ...settings,
                preferences: { ...settings.preferences, language: e.target.value }
              })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="uz">O'zbek tili</option>
              <option value="ru">Rus tili</option>
              <option value="en">Ingliz tili</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Valyuta</label>
            <select
              value={settings.preferences.currency}
              onChange={(e) => updateSettings({
                ...settings,
                preferences: { ...settings.preferences, currency: e.target.value }
              })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="UZS">O'zbek so'mi (UZS)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="EUR">Evro (EUR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mavzu</label>
            <select
              value={settings.preferences.theme}
              onChange={(e) => updateSettings({
                ...settings,
                preferences: { ...settings.preferences, theme: e.target.value }
              })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Yorqin</option>
              <option value="dark">Qorong'u</option>
              <option value="auto">Avtomatik</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Ovoz signallari</div>
              <div className="text-sm text-slate-500">Bildirishnomalar uchun ovoz</div>
            </div>
            <button
              onClick={() => updateSettings({
                ...settings,
                preferences: { ...settings.preferences, soundEnabled: !settings.preferences.soundEnabled }
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.preferences.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <User size={20} className="mr-3 text-indigo-600" />
          Hisob sozlamalari
        </h3>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <Lock size={18} className="text-slate-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">Parolni o'zgartirish</div>
                <div className="text-sm text-slate-500">Hisobingiz xavfsizligini ta'minlang</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <Download size={18} className="text-slate-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">Ma'lumotlarni yuklab olish</div>
                <div className="text-sm text-slate-500">Shaxsiy ma'lumotlaringizni eksport qiling</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
            <div className="flex items-center space-x-3">
              <AlertCircle size={18} className="text-red-600" />
              <div className="text-left">
                <div className="font-medium text-red-900">Hisobni o'chirish</div>
                <div className="text-sm text-red-600">Bu amalni bekor qilib bo'lmaydi</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpSection = () => (
    <div className="space-y-6">
      {/* FAQ */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <HelpCircle size={20} className="mr-3 text-indigo-600" />
          Tez-tez so'raladigan savollar
        </h3>
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="font-medium text-slate-900 mb-2">Qanday qilib buyurtmani qabul qilishim mumkin?</div>
            <div className="text-sm text-slate-600">Yangi buyurtma kelganda sizga bildirishnoma yuboriladi. Buyurtmani qabul qilish uchun "Qabul qilish" tugmasini bosing.</div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="font-medium text-slate-900 mb-2">To'lov qachon amalga oshiriladi?</div>
            <div className="text-sm text-slate-600">Buyurtmani muvaffaqiyatli yetkazib bergandan so'ng, to'lov avtomatik tarzda hisobingizga o'tkaziladi.</div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="font-medium text-slate-900 mb-2">Reyting qanday hisoblanadi?</div>
            <div className="text-sm text-slate-600">Reyting mijozlar tomonidan berilgan baholar asosida hisoblanadi. O'z vaqtida yetkazish va xizmat sifati muhim omillardir.</div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <MessageCircle size={20} className="mr-3 text-indigo-600" />
          Qo'llab-quvvatlash
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            <Phone size={20} className="text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-blue-900">Telefon orqali</div>
              <div className="text-sm text-blue-600">+998 90 123 45 67</div>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            <MessageCircle size={20} className="text-green-600" />
            <div className="text-left">
              <div className="font-medium text-green-900">Chat orqali</div>
              <div className="text-sm text-green-600">Tezkor javob</div>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
            <Mail size={20} className="text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-purple-900">Email orqali</div>
              <div className="text-sm text-purple-600">support@tortbazar.uz</div>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors">
            <FileText size={20} className="text-orange-600" />
            <div className="text-left">
              <div className="font-medium text-orange-900">Yo'riqnoma</div>
              <div className="text-sm text-orange-600">Qo'llanma yuklab olish</div>
            </div>
          </button>
        </div>
      </div>

      {/* Useful Links */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Globe size={20} className="mr-3 text-indigo-600" />
          Foydali havolalar
        </h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <span className="text-slate-700">Foydalanish shartlari</span>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <span className="text-slate-700">Maxfiylik siyosati</span>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <span className="text-slate-700">Xavfsizlik qoidalari</span>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <span className="text-slate-700">Kuryer qo'llanmasi</span>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={onBack}
                className="group p-2 sm:p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Kuryer Profili
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Professional dashboard va sozlamalar</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Online</span>
                <span className="sm:hidden">●</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-40">
        <div className="grid grid-cols-6 gap-1 p-2">
          {navigationSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <section.icon size={16} className={
                activeSection === section.id 
                  ? 'text-white' 
                  : section.color.replace('bg-', 'text-').replace('-500', '-600')
              } />
              <span className="text-xs mt-1 hidden xs:block">{section.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:block w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 min-h-screen p-6">
          <div className="space-y-2">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  activeSection === section.id 
                    ? 'bg-white/20' 
                    : `${section.color} bg-opacity-20`
                }`}>
                  <section.icon size={20} className={
                    activeSection === section.id 
                      ? 'text-white' 
                      : section.color.replace('bg-', 'text-').replace('-500', '-600')
                  } />
                </div>
                <span>{section.label}</span>
                {activeSection === section.id && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Profile Summary in Sidebar */}
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
        <div className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
          {activeSection === 'dashboard' && renderDashboardSection()}
          {activeSection === 'profile' && renderProfileSection()}
          {activeSection === 'statistics' && renderStatisticsSection()}
          {activeSection === 'work' && renderWorkSection()}
          {activeSection === 'settings' && renderSettingsSection()}
          {activeSection === 'help' && renderHelpSection()}
        </div>
      </div>
    </div>
  );
};

export default CourierProfile;
