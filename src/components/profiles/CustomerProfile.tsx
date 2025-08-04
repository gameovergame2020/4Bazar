
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
  TrendingUp
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

  const { favoriteCount } = useFavorites(user.id);

  useEffect(() => {
    loadStats();
  }, [user.id]);

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
      </div>
    </div>
  );
};

export default CustomerProfile;
