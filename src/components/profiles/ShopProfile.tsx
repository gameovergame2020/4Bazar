
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Package,
  TrendingUp,
  Clock,
  Calendar,
  Edit2,
  Save,
  User,
  Award,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { UserData } from '../../services/authService';
import { dataService } from '../../services/dataService';

interface ShopProfileProps {
  user: UserData;
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const ShopProfile: React.FC<ShopProfileProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalCustomers: 0,
    lowStockItems: 0
  });

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    address: user.address || '',
    bio: user.bio || '',
    shopName: user.shopName || '',
    shopType: user.shopType || 'bakery',
    workingHours: user.workingHours || '',
    avatar: null as File | null
  });

  useEffect(() => {
    loadStats();
  }, [user.id]);

  const loadStats = async () => {
    try {
      // Shop mahsulotlarini olish
      const products = await dataService.getCakes({ shopId: user.id });
      
      // Shop buyurtmalarini olish
      const allOrders = await dataService.getOrders();
      const shopOrders = allOrders.filter(order => 
        products.some(product => product.id === order.cakeId)
      );

      const completedOrders = shopOrders.filter(order => order.status === 'delivered');
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      const uniqueCustomers = new Set(shopOrders.map(order => order.customerId)).size;
      const lowStockItems = products.filter(product => (product.quantity || 0) < 5).length;
      
      // Rating calculation
      const totalRating = products.reduce((sum, product) => sum + (product.rating * product.reviewCount), 0);
      const totalReviews = products.reduce((sum, product) => sum + product.reviewCount, 0);
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      setStats({
        totalProducts: products.length,
        totalOrders: shopOrders.length,
        totalSales: completedOrders.length,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalCustomers: uniqueCustomers,
        lowStockItems
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
        const imagePath = `avatars/shops/${user.id}/${Date.now()}_${editForm.avatar.name}`;
        avatarUrl = await dataService.uploadImage(editForm.avatar, imagePath);
      }

      const updates = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        bio: editForm.bio,
        shopName: editForm.shopName,
        shopType: editForm.shopType,
        workingHours: editForm.workingHours,
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

  const shopTypes = [
    { value: 'bakery', label: 'Nonvoyxona' },
    { value: 'confectionery', label: 'Qandolatxona' },
    { value: 'cafe', label: 'Kafe' },
    { value: 'restaurant', label: 'Restoran' },
    { value: 'pastry_shop', label: 'Shirinlik do\'koni' }
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
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Do'kon profili</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
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
          <div className="h-32 bg-gradient-to-r from-green-400 to-teal-500"></div>
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
                    <Store size={40} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                )}
                <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 text-white rounded-full">
                  <Store size={16} />
                </div>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.shopName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, shopName: e.target.value }))}
                      className="text-2xl font-bold bg-transparent border-b-2 border-green-300 focus:border-green-500 outline-none"
                      placeholder="Do'kon nomi"
                    />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-lg bg-transparent border-b border-gray-300 focus:border-green-500 outline-none"
                      placeholder="Sizning ismingiz"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="Do'kon haqida ma'lumot..."
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.shopName || user.name}</h1>
                    <h2 className="text-lg text-green-600 font-medium">{user.name}</h2>
                    <p className="text-gray-600 mt-1">{user.bio || 'Eng sifatli mahsulotlarni taklif etamiz'}</p>
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
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <div className="text-sm text-gray-600">Mahsulotlar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSales}</div>
            <div className="text-sm text-gray-600">Sotuvlar</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={24} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">{Math.round(stats.totalRevenue / 1000)}K</div>
            <div className="text-sm text-gray-600">Daromad</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <div className="text-sm text-gray-600">Mijozlar</div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Biznes ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do'kon turi</label>
              {isEditing ? (
                <select
                  value={editForm.shopType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shopType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {shopTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span>{shopTypes.find(type => type.value === user.shopType)?.label || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ish vaqti</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.workingHours}
                  onChange={(e) => setEditForm(prev => ({ ...prev, workingHours: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masalan: 09:00 - 21:00"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Clock size={16} className="text-gray-400" />
                  <span>{user.workingHours || 'Belgilanmagan'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <div className="text-sm text-yellow-700">Kam qolgan mahsulotlar</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
              <div className="text-sm text-green-700">Jami buyurtmalar</div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Do'kon manzili"
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

        {/* Inventory Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zaxira holati</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Shokoladli tort</p>
                  <p className="text-sm text-red-600">Tugamoqda - 2 ta qoldi</p>
                </div>
              </div>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                To'ldirish
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mevali tort</p>
                  <p className="text-sm text-yellow-600">Kam - 4 ta qoldi</p>
                </div>
              </div>
              <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                To'ldirish
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Vanil tort</p>
                  <p className="text-sm text-green-600">Yetarli - 15 ta</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Yaxshi</span>
            </div>
          </div>
        </div>

        {/* Sales Analytics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sotuv analitikasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Eng ko'p sotilgan</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shokoladli tort</span>
                  <span className="font-medium">28 ta</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mevali tort</span>
                  <span className="font-medium">19 ta</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vanil tort</span>
                  <span className="font-medium">15 ta</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Haftalik daromad</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dushanba</span>
                  <span className="font-medium">1.2M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Seshanba</span>
                  <span className="font-medium">980K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chorshanba</span>
                  <span className="font-medium">1.5M</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm font-medium">Bugun</span>
                  <span className="font-bold">2.1M</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yutuqlar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Store size={32} className="text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-gray-900">Yangi do'kon</div>
              <div className="text-xs text-gray-600">Tizimga qo'shildi</div>
            </div>
            
            {stats.totalProducts >= 5 && (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Package size={32} className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Katta assortiment</div>
                <div className="text-xs text-gray-600">5+ mahsulot</div>
              </div>
            )}

            {stats.totalSales >= 10 && (
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <TrendingUp size={32} className="text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Faol savdogar</div>
                <div className="text-xs text-gray-600">10+ sotuv</div>
              </div>
            )}

            {stats.averageRating >= 4.5 && (
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <Star size={32} className="text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Sifat kafolati</div>
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
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Saqlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;
