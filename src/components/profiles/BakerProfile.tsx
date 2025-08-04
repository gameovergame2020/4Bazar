
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChefHat, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Trophy,
  Package,
  Clock,
  Calendar,
  Edit2,
  Save,
  User,
  Award,
  TrendingUp,
  Users,
  Cake
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface BakerProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const BakerProfile: React.FC<BakerProfileProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalCustomers: 0,
    successRate: 0
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    bio: user.bio || '',
    bakeryName: user.bakeryName || '',
    specialties: user.specialties || [],
    experience: user.experience || '',
    avatar: null as File | null
  });

  useEffect(() => {
    loadStats();
  }, [user.id]);

  const loadStats = async () => {
    try {
      // Baker mahsulotlarini olish
      const products = await dataService.getCakes({ bakerId: user.id });
      
      // Baker buyurtmalarini olish
      const allOrders = await dataService.getOrders();
      const bakerOrders = allOrders.filter(order => 
        products.some(product => product.id === order.cakeId)
      );

      const completedOrders = bakerOrders.filter(order => order.status === 'delivered');
      const totalEarnings = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const uniqueCustomers = new Set(bakerOrders.map(order => order.customerId)).size;
      const successRate = bakerOrders.length > 0 ? (completedOrders.length / bakerOrders.length) * 100 : 0;
      
      // Rating calculation
      const totalRating = products.reduce((sum, product) => sum + (product.rating * product.reviewCount), 0);
      const totalReviews = products.reduce((sum, product) => sum + product.reviewCount, 0);
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      setStats({
        totalOrders: bakerOrders.length,
        completedOrders: completedOrders.length,
        totalProducts: products.length,
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalCustomers: uniqueCustomers,
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
        const imagePath = `avatars/bakers/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        bio: editForm.bio,
        bakeryName: editForm.bakeryName,
        specialties: editForm.specialties,
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

  const specialtyOptions = [
    'Shokoladli tortlar',
    'Mevali tortlar',
    'Krem tortlar',
    'Tiramisu',
    'Cheesecake',
    'Cupcake',
    'Nikoh tortlari',
    "Tug'ilgan kun tortlari",
    'Custom dizayn',
    'Gluten-free'
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
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Baker profili</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
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
          <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500"></div>
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
                    <ChefHat size={40} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                )}
                <div className="absolute -bottom-2 -right-2 p-2 bg-orange-500 text-white rounded-full">
                  <ChefHat size={16} />
                </div>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold bg-transparent border-b-2 border-orange-300 focus:border-orange-500 outline-none"
                      placeholder="Ismingiz"
                    />
                    <input
                      type="text"
                      value={editForm.bakeryName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bakeryName: e.target.value }))}
                      className="text-lg bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none"
                      placeholder="Nonvoyxona nomi"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="O'zingiz va nonvoyxonangiz haqida..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <h2 className="text-lg text-orange-600 font-medium">{user.bakeryName || 'Professional Baker'}</h2>
                    <p className="text-gray-600 mt-1">{user.bio || 'Eng mazali tortlarni tayyorlayman'}</p>
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
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <div className="text-sm text-gray-600">Jami mahsulotlar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            <div className="text-sm text-gray-600">Jami buyurtmalar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{Math.round(stats.totalEarnings / 1000)}K</div>
            <div className="text-sm text-gray-600">Jami daromad</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <div className="text-sm text-gray-600">Mijozlar</div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional ma'lumotlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tajriba (yil)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Masalan: 5 yil"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span>{user.experience || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Muvaffaqiyat darajasi</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.successRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.successRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mutaxassislik sohalari</label>
            {isEditing ? (
              <div className="space-y-2">
                {specialtyOptions.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditForm(prev => ({ 
                            ...prev, 
                            specialties: [...prev.specialties, specialty] 
                          }));
                        } else {
                          setEditForm(prev => ({ 
                            ...prev, 
                            specialties: prev.specialties.filter(s => s !== specialty) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user.specialties || []).map((specialty, index) => (
                  <span key={index} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                    {specialty}
                  </span>
                ))}
                {(!user.specialties || user.specialties.length === 0) && (
                  <span className="text-gray-500 italic">Mutaxassislik sohalari belgilanmagan</span>
                )}
              </div>
            )}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nonvoyxona manzili"
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

        {/* Recent Activity & Notifications */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi faoliyat</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">#{order.id.slice(-6)} - {order.cakeName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('uz-UZ')} - {formatPrice(order.totalPrice)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">Hozircha faoliyat yo'q</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yutuqlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Cake size={32} className="text-orange-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">Birinchi tort</div>
              <div className="text-xs text-gray-600">Ilk mahsulotingiz</div>
            </div>
            
            {stats.totalOrders >= 10 && (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Trophy size={32} className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Faol baker</div>
                <div className="text-xs text-gray-600">10+ buyurtma</div>
              </div>
            )}

            {stats.averageRating >= 4.5 && (
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <Star size={32} className="text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">5 yulduzli</div>
                <div className="text-xs text-gray-600">4.5+ reyting</div>
              </div>
            )}

            {stats.totalCustomers >= 20 && (
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Users size={32} className="text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Mashhur baker</div>
                <div className="text-xs text-gray-600">20+ mijoz</div>
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
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              Saqlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BakerProfile;
