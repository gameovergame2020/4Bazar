
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
  Calendar,
  Users,
  PlusCircle,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface CourierProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const CourierProfile: React.FC<CourierProfileProps> = ({ user, onBack, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('info');
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
    workingDays: 0,
    activeOrders: 0,
    weeklyDeliveries: 0,
    monthlyEarnings: 0
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
    theme: 'light',
    autoAcceptOrders: false,
    workingHours: '9:00-18:00'
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
      const activeOrders = Math.floor(Math.random() * 5) + 2;
      const weeklyDeliveries = todayDeliveries * 7;
      const monthlyEarnings = totalEarnings * 2;

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.8,
        todayDeliveries,
        todayEarnings,
        successRate: Math.round(successRate),
        workingDays,
        activeOrders,
        weeklyDeliveries,
        monthlyEarnings
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getPerformanceLevel = () => {
    if (stats.successRate >= 95) return { level: 'Elite', color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' };
    if (stats.successRate >= 90) return { level: 'Pro', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' };
    if (stats.successRate >= 80) return { level: 'Expert', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
    return { level: 'Standard', color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-600' };
  };

  const performanceLevel = getPerformanceLevel();

  // Asosiy Ma'lumotlar Bo'limi
  const renderInfo = () => (
    <div className="space-y-4">
      {/* Performance Header */}
      <div className={`bg-gradient-to-r ${performanceLevel.color} rounded-2xl p-4 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{performanceLevel.level} Kuryer</h3>
              <p className="text-white/80 text-sm">Professional darajangiz</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold">{stats.totalDeliveries}</div>
              <div className="text-xs text-white/80">Jami</div>
            </div>
            <div>
              <div className="text-lg font-bold">{stats.averageRating}</div>
              <div className="text-xs text-white/80">Reyting</div>
            </div>
            <div>
              <div className="text-lg font-bold">{stats.successRate}%</div>
              <div className="text-xs text-white/80">Muvaffaqiyat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            {isEditing ? (
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Camera size={20} className="text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-500">Rasm</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={user.name}
                  className="w-20 h-20 rounded-xl border-2 border-white object-cover shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg">
                  <Truck size={14} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none w-full"
                placeholder="Ismingiz"
              />
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
                  <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${performanceLevel.color}`}>
                    {performanceLevel.level}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="fill-current text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-600">{stats.averageRating}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar size={10} />
                    <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Shield size={10} />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isEditing 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {loading ? (
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
            ) : isEditing ? (
              <Save size={14} />
            ) : (
              <Edit2 size={14} />
            )}
            <span className="hidden sm:inline">{loading ? 'Saqlanmoqda...' : isEditing ? 'Saqlash' : 'Tahrirlash'}</span>
          </button>
        </div>
      </div>

      {/* Contact Information */}
      {isEditing && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Ma'lumotlarni yangilash</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email manzil</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yashash manzili</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="To'liq yashash manzilingiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transport turi</label>
              <select
                value={editForm.vehicleType}
                onChange={(e) => setEditForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {vehicleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yetkazish hududi</label>
              <input
                type="text"
                value={editForm.deliveryZone}
                onChange={(e) => setEditForm(prev => ({ ...prev, deliveryZone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Masalan: Toshkent shahar markazi"
              />
            </div>
          </div>
        </div>
      )}

      {/* Career Progress */}
      {!isEditing && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3">Martaba rivojlanishi</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Keyingi daraja</span>
              <span className="font-bold text-blue-600">Pro Kuryer</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>75% bajarildi</span>
              <span>25 ta yetkazish qoldi</span>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {!isEditing && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3">So'nggi yutuqlar</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award size={16} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">100+ Yetkazish</p>
                <p className="text-xs text-slate-500">Yuz martalik yutuq</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Tez Yetkazish</p>
                <p className="text-xs text-slate-500">15 daqiqada yetkazish</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Statistika Bo'limi
  const renderStats = () => (
    <div className="space-y-4">
      {/* Performance Stats */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Asosiy ko'rsatkichlar</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Package size={20} className="text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{stats.totalDeliveries}</p>
            <p className="text-xs text-slate-600">Jami yetkazish</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <DollarSign size={20} className="text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{formatPrice(stats.totalEarnings)}</p>
            <p className="text-xs text-slate-600">Jami daromad</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Clock size={20} className="text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{stats.workingDays}</p>
            <p className="text-xs text-slate-600">Ish kunlari</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Trophy size={20} className="text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{stats.successRate}%</p>
            <p className="text-xs text-slate-600">Samaradorlik</p>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Bugungi natijalar</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Bugungi yetkazish</span>
            <span className="font-bold text-slate-900">{stats.todayDeliveries}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Bugungi daromad</span>
            <span className="font-bold text-green-600">{formatPrice(stats.todayEarnings)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Faol buyurtmalar</span>
            <span className="font-bold text-blue-600">{stats.activeOrders}</span>
          </div>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Haftalik natijalar</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Haftalik yetkazish</span>
            <span className="font-bold text-slate-900">{stats.weeklyDeliveries}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">O'rtacha reyting</span>
            <div className="flex items-center space-x-1">
              <Star size={14} className="fill-current text-yellow-500" />
              <span className="font-bold text-yellow-600">{stats.averageRating}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Samaradorlik</span>
            <span className="font-bold text-green-600">{stats.successRate}%</span>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Oylik ko'rsatkichlar</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Oylik daromad</span>
            <span className="font-bold text-green-600">{formatPrice(stats.monthlyEarnings)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Bajarilgan buyurtmalar</span>
            <span className="font-bold text-slate-900">{stats.completedDeliveries}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">O'rtacha kunlik</span>
            <span className="font-bold text-slate-900">{Math.round(stats.totalDeliveries / Math.max(stats.workingDays, 1))}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Sozlamalar Bo'limi
  const renderSettings = () => (
    <div className="space-y-4">
      {/* Work Settings */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Ish sozlamalari</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Bildirishnomalar</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, notifications: !prev.notifications}))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Avtomatik qabul</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, autoAcceptOrders: !prev.autoAcceptOrders}))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.autoAcceptOrders ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.autoAcceptOrders ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ish vaqti</label>
            <input
              type="text"
              value={settings.workingHours}
              onChange={(e) => setSettings(prev => ({...prev, workingHours: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Masalan: 9:00-18:00"
            />
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Ilova sozlamalari</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Til</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({...prev, language: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mavzu</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({...prev, theme: e.target.value}))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="light">Yorug'</option>
              <option value="dark">Qorong'i</option>
              <option value="auto">Avtomatik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Yordam</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Qo'llab-quvvatlash</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-2">
              <HelpCircle size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">FAQ</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-2">
              <Download size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Ma'lumotlarni export qilish</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Xavfsizlik</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-2">
              <Lock size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Parolni o'zgartirish</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700">Xavfsizlik sozlamalari</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const navigationSections = [
    { id: 'info', label: 'Ma\'lumotlar', icon: User },
    { id: 'stats', label: 'Statistika', icon: BarChart3 },
    { id: 'settings', label: 'Sozlamalar', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-white/20 max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-1">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <section.icon size={16} />
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 max-w-7xl mx-auto">
        {activeSection === 'info' && renderInfo()}
        {activeSection === 'stats' && renderStats()}
        {activeSection === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default CourierProfile;
