
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
  Map
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface CourierProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const CourierProfile: React.FC<CourierProfileProps> = ({ user, onBack, onUpdate }) => {
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
    customerSatisfaction: 0
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
    avatar: null as File | null
  });

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

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.8,
        totalDistance: completedDeliveries.length * 12.3,
        workingDays,
        successRate: Math.round(successRate),
        onTimeDeliveries,
        customerSatisfaction
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="group p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Professional Kuryer
                </h1>
                <p className="text-sm text-slate-500">Profil va ish ko'rsatkichlari</p>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                isEditing 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-md'
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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Profile Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${performanceLevel.color}`}>
                {performanceLevel.level} Kuryer
              </div>
            </div>
          </div>
          <div className="px-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-8 -mt-20">
              <div className="relative mb-6 lg:mb-0">
                {isEditing ? (
                  <div className="relative group">
                    <div className="w-36 h-36 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center cursor-pointer hover:shadow-2xl transition-all duration-300">
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
                      className="w-36 h-36 rounded-2xl border-4 border-white object-cover shadow-xl hover:shadow-2xl transition-all duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
                      <Truck size={18} />
                    </div>
                    <div className="absolute -top-2 -left-2 px-3 py-1 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                      Online
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-6">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-3xl font-bold bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none text-slate-900 placeholder-slate-400"
                      placeholder="Ismingiz"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-4 border border-slate-200 rounded-xl resize-none bg-slate-50 focus:bg-white focus:border-indigo-300 transition-all"
                      rows={3}
                      placeholder="Professional bio va tajribangiz haqida..."
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">{user.name}</h1>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${performanceLevel.color} text-white`}>
                          {performanceLevel.level} Darajasi
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star size={16} className={`fill-current ${getRatingColor(stats.averageRating)}`} />
                          <span className={`font-bold ${getRatingColor(stats.averageRating)}`}>{stats.averageRating}</span>
                          <span className="text-slate-500 text-sm">({stats.completedDeliveries} baholash)</span>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{user.bio || 'Professional kuryer. Tez, xavfsiz va ishonchli yetkazib berish xizmati.'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan beri faol</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} />
                        <span>{user.deliveryZone || 'Toshkent shahri'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield size={14} />
                        <span>Tasdiqlangan kuryer</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalDeliveries}</div>
            <div className="text-sm text-slate-600 font-medium">Jami yetkazish</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.successRate}%</div>
            <div className="text-sm text-slate-600 font-medium">Muvaffaqiyat</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{Math.round(stats.totalEarnings / 1000)}K</div>
            <div className="text-sm text-slate-600 font-medium">Jami daromad</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Navigation size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{Math.round(stats.totalDistance)}</div>
            <div className="text-sm text-slate-600 font-medium">Km bosib o'tdi</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.onTimeDeliveries}</div>
            <div className="text-sm text-slate-600 font-medium">Vaqtida yetkazildi</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.customerSatisfaction}%</div>
            <div className="text-sm text-slate-600 font-medium">Mijoz memnuniyati</div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Truck size={24} className="mr-3 text-indigo-600" />
            Ish ma'lumotlari
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Transport turi</label>
              {isEditing ? (
                <select
                  value={editForm.vehicleType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className={`p-3 rounded-xl ${vehicleTypes.find(type => type.value === user.vehicleType)?.color || 'bg-gray-100'}`}>
                    <span className="text-2xl">
                      {vehicleTypes.find(type => type.value === user.vehicleType)?.icon || '🚴'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {vehicleTypes.find(type => type.value === user.vehicleType)?.label || 'Belgilanmagan'}
                    </div>
                    <div className="text-sm text-slate-500">Asosiy transport vositasi</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Yetkazish hududi</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.deliveryZone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deliveryZone: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Masalan: Toshkent shahar markazi"
                />
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                    <Map size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.deliveryZone || 'Belgilanmagan'}</div>
                    <div className="text-sm text-slate-500">Faoliyat hududi</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Ish tajribasi</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Masalan: 3 yil professional tajriba"
                />
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.experience || 'Belgilanmagan'}</div>
                    <div className="text-sm text-slate-500">Professional tajriba</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Ishlagan muddat</label>
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="p-3 bg-green-100 text-green-700 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{stats.workingDays} kun</div>
                  <div className="text-sm text-slate-500">Umumiy faoliyat</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Phone size={24} className="mr-3 text-indigo-600" />
            Aloqa ma'lumotlari
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Telefon raqam</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.phone}</div>
                    <div className="text-sm text-slate-500">Asosiy telefon</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Email manzil</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 bg-green-100 text-green-700 rounded-xl">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.email || 'Belgilanmagan'}</div>
                    <div className="text-sm text-slate-500">Email manzil</div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Yashash manzili</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="To'liq yashash manzilingiz"
                />
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 bg-orange-100 text-orange-700 rounded-xl">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.address || 'Belgilanmagan'}</div>
                    <div className="text-sm text-slate-500">Yashash manzili</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Activity size={24} className="mr-3 text-indigo-600" />
              Ish samaradorligi
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{stats.completedDeliveries}</div>
                <div className="text-sm text-blue-700 font-medium">Tugallangan</div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
                <div className="text-sm text-green-700 font-medium">Muvaffaqiyat</div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{Math.round(stats.totalDistance / stats.completedDeliveries || 0)}</div>
                <div className="text-sm text-orange-700 font-medium">O'rtacha km</div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{Math.round(stats.totalEarnings / stats.completedDeliveries || 0 / 1000)}K</div>
                <div className="text-sm text-purple-700 font-medium">O'rtacha daromad</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Trophy size={24} className="mr-3 text-indigo-600" />
              Yutuqlar va badglar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <Truck size={32} className="text-purple-600 mx-auto mb-3" />
                <div className="font-bold text-slate-900 text-sm">Yangi kuryer</div>
                <div className="text-xs text-slate-600">Birinchi yetkazish</div>
              </div>
              
              {stats.totalDeliveries >= 25 && (
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <Package size={32} className="text-blue-600 mx-auto mb-3" />
                  <div className="font-bold text-slate-900 text-sm">Faol kuryer</div>
                  <div className="text-xs text-slate-600">25+ yetkazish</div>
                </div>
              )}

              {stats.successRate >= 90 && (
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <Target size={32} className="text-green-600 mx-auto mb-3" />
                  <div className="font-bold text-slate-900 text-sm">Ishonchli</div>
                  <div className="text-xs text-slate-600">90%+ muvaffaqiyat</div>
                </div>
              )}

              {stats.averageRating >= 4.7 && (
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200">
                  <Star size={32} className="text-yellow-600 mx-auto mb-3" />
                  <div className="font-bold text-slate-900 text-sm">5 yulduzli</div>
                  <div className="text-xs text-slate-600">4.7+ reyting</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Route & Recent Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Navigation size={24} className="mr-3 text-indigo-600" />
            Bugungi faoliyat
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-700 mb-4">Faol yetkazishlar</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-l-4 border-orange-500">
                  <div>
                    <p className="font-semibold text-slate-900">Buyurtma #12847</p>
                    <p className="text-sm text-slate-600">Yunusobod - 15:30 gacha</p>
                    <p className="text-xs text-orange-600 mt-1 flex items-center">
                      <Navigation size={12} className="mr-1" />
                      2.8 km qoldi
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                      Yo'lda
                    </span>
                    <p className="text-sm text-slate-600 mt-1">18K so'm</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500">
                  <div>
                    <p className="font-semibold text-slate-900">Buyurtma #12848</p>
                    <p className="text-sm text-slate-600">Mirzo Ulug'bek - 16:00 gacha</p>
                    <p className="text-xs text-blue-600 mt-1">Navbatda</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                      Navbat
                    </span>
                    <p className="text-sm text-slate-600 mt-1">22K so'm</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-4">Bugun tugallangan</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">Buyurtma #12845</p>
                    <p className="text-sm text-slate-600">Chilonzor</p>
                  </div>
                  <div className="text-right">
                    <CheckCircle size={16} className="text-green-600 inline mr-1" />
                    <span className="text-green-600 font-semibold">+18K</span>
                    <p className="text-xs text-slate-500">14:20</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">Buyurtma #12846</p>
                    <p className="text-sm text-slate-600">Shayxontohur</p>
                  </div>
                  <div className="text-right">
                    <CheckCircle size={16} className="text-green-600 inline mr-1" />
                    <span className="text-green-600 font-semibold">+15K</span>
                    <p className="text-xs text-slate-500">12:45</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-8 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium shadow-lg"
            >
              Saqlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourierProfile;
