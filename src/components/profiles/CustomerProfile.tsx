
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
  Plus
} from 'lucide-react';
import { UserData } from '../../services/authService';
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

  const { favoriteCount, favorites, loadFavorites, removeFromFavorites } = useFavorites(user.id);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);

  useEffect(() => {
    loadStats();
    loadUserOrders();
    loadFavorites();
  }, [user.id]);

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
        averageRating: 4.5, // Customer feedback rating
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

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-300 to-gray-500';
      default: return 'from-orange-400 to-orange-600';
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
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold bg-transparent border-b-2 border-blue-300 focus:border-blue-500 outline-none"
                      placeholder="Ismingiz"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="O'zingiz haqida qisqacha..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
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
                )}
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
        </div>

        {/* Orders and Favorites Management */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Buyurtmalar va Sevimlilar</h3>
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

        {/* Settings Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sozlamalar</h3>
          
          {/* Settings Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Profile Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <User size={18} className="text-blue-500" />
                <span>Profil sozlamalari</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profilni tahrirlash</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Parolni o'zgartirish</span>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Edit2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">2FA xavfsizlik</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Addresses & Payment */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <MapPin size={18} className="text-green-500" />
                <span>Manzillar va To'lov</span>
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Asosiy manzil</span>
                    <button className="text-green-600 hover:text-green-700">
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">{user.address || 'Manzil belgilanmagan'}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">To'lov usuli</span>
                    <button className="text-green-600 hover:text-green-700">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">Plastik karta qo'shish</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avtomatik to'lov</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Phone size={18} className="text-purple-500" />
                <span>Yordam va Qo'llab-quvvatlash</span>
              </h4>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="font-medium text-sm text-purple-900">Tez-tez so'raladigan savollar</div>
                  <p className="text-xs text-purple-600 mt-1">Eng ko'p so'raladigan savollar va javoblar</p>
                </button>
                
                <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="font-medium text-sm text-purple-900">Murojaat qilish</div>
                  <p className="text-xs text-purple-600 mt-1">Qo'llab-quvvatlash xizmatiga murojaat</p>
                </button>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm text-gray-900 mb-2">Bog'lanish ma'lumotlari</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>📞 +998 90 123 45 67</p>
                    <p>📧 support@tortbazar.uz</p>
                    <p>🕒 Har kuni 9:00-21:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <span className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600">🔔</span>
              </span>
              <span>Bildirishnoma sozlamalari</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Buyurtma holati</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Aksiyalar va chegirmalar</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Yangi mahsulotlar</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-500">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email bildirishnomalar</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Tezkor harakatlar</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                <div className="text-blue-600 mb-1">📊</div>
                <div className="text-xs font-medium text-blue-900">Statistika</div>
              </button>
              <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                <div className="text-green-600 mb-1">💳</div>
                <div className="text-xs font-medium text-green-900">To'lovlar</div>
              </button>
              <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                <div className="text-purple-600 mb-1">⭐</div>
                <div className="text-xs font-medium text-purple-900">Baholar</div>
              </button>
              <button className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
                <div className="text-orange-600 mb-1">🎁</div>
                <div className="text-xs font-medium text-orange-900">Bonuslar</div>
              </button>
            </div>
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
      </div>
    </div>
  );
};

export default CustomerProfile;
