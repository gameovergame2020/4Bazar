
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
  Target
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
    successRate: 0
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
      // Courier yetkazish statistikasini hisoblash (demo data)
      const allOrders = await dataService.getOrders();
      
      // Simulatsiya: ba'zi buyurtmalar ushbu kuryerga tegishli deb faraz qilamiz
      const courierDeliveries = allOrders.filter(order => 
        ['delivering', 'delivered'].includes(order.status)
      ).slice(0, Math.floor(Math.random() * 20) + 5); // Random 5-25 ta

      const completedDeliveries = courierDeliveries.filter(order => order.status === 'delivered');
      const totalEarnings = completedDeliveries.length * 15000; // 15k per delivery
      const successRate = courierDeliveries.length > 0 ? (completedDeliveries.length / courierDeliveries.length) * 100 : 0;
      const workingDays = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));

      setStats({
        totalDeliveries: courierDeliveries.length,
        completedDeliveries: completedDeliveries.length,
        totalEarnings,
        averageRating: 4.7, // Fixed rating for demo
        totalDistance: completedDeliveries.length * 8.5, // Average 8.5km per delivery
        workingDays,
        successRate: Math.round(successRate)
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
    { value: 'bike', label: 'Velosiped', icon: '🚴' },
    { value: 'motorcycle', label: 'Mototsikl', icon: '🏍️' },
    { value: 'car', label: 'Avtomobil', icon: '🚗' },
    { value: 'scooter', label: 'Skuter', icon: '🛵' }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.5) return 'text-orange-600';
    return 'text-red-600';
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
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Kuryer profili</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
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
          <div className="h-32 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
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
                    <Truck size={40} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                )}
                <div className="absolute -bottom-2 -right-2 p-2 bg-purple-500 text-white rounded-full">
                  <Truck size={16} />
                </div>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none"
                      placeholder="Ismingiz"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="O'zingiz haqida..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <h2 className="text-lg text-purple-600 font-medium">Professional Kuryer</h2>
                    <p className="text-gray-600 mt-1">{user.bio || 'Tez va xavfsiz yetkazib beraman'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan faoliyat</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star size={14} className={`fill-current ${getRatingColor(stats.averageRating)}`} />
                        <span className={getRatingColor(stats.averageRating)}>{stats.averageRating} reyting</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</div>
            <div className="text-sm text-gray-600">Jami yetkazish</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target size={24} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.successRate}%</div>
            <div className="text-sm text-gray-600">Muvaffaqiyat</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{Math.round(stats.totalEarnings / 1000)}K</div>
            <div className="text-sm text-gray-600">Jami daromad</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Navigation size={24} className="text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(stats.totalDistance)}</div>
            <div className="text-sm text-gray-600">Km bosib o'tdi</div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ish ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transport turi</label>
              {isEditing ? (
                <select
                  value={editForm.vehicleType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">
                    {vehicleTypes.find(type => type.value === user.vehicleType)?.icon || '🚴'}
                  </span>
                  <span>
                    {vehicleTypes.find(type => type.value === user.vehicleType)?.label || 'Belgilanmagan'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yetkazish hududi</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.deliveryZone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deliveryZone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masalan: Toshkent shahar markazi"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{user.deliveryZone || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ish tajribasi</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masalan: 2 yil"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span>{user.experience || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ishlagan kunlar</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span>{stats.workingDays} kun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aloqa ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqam</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-gray-400" />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={16} className="text-gray-400" />
                  <span>{user.email || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Manzil</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Yashash manzilingiz"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{user.address || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ish samaradorligi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{stats.completedDeliveries}</div>
              <div className="text-sm text-blue-700">Tugallangan</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
              <div className="text-sm text-green-700">Muvaffaqiyat</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalDistance / stats.completedDeliveries || 0)}</div>
              <div className="text-sm text-orange-700">O'rtacha km</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{Math.round(stats.totalEarnings / stats.completedDeliveries || 0 / 1000)}K</div>
              <div className="text-sm text-purple-700">O'rtacha daromad</div>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yutuqlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Truck size={32} className="text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">Yangi kuryer</div>
              <div className="text-xs text-gray-600">Birinchi yetkazish</div>
            </div>
            
            {stats.totalDeliveries >= 10 && (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Package size={32} className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Faol kuryer</div>
                <div className="text-xs text-gray-600">10+ yetkazish</div>
              </div>
            )}

            {stats.successRate >= 95 && (
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Target size={32} className="text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Ishonchli</div>
                <div className="text-xs text-gray-600">95%+ muvaffaqiyat</div>
              </div>
            )}

            {stats.averageRating >= 4.5 && (
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <Star size={32} className="text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">5 yulduzli</div>
                <div className="text-xs text-gray-600">4.5+ reyting</div>
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
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
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
