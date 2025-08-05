
import React, { useState, useEffect } from 'react';
import { X, Star, TrendingUp, TrendingDown, User, Award, AlertTriangle, Download, Calendar, MapPin, Phone, Mail, Eye, Ban, CheckCircle, Clock, DollarSign, Package } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface UserRating {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userAddress?: string;
  registrationDate: Date;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  averageRating: number;
  totalSpent: number;
  lastOrderDate: Date;
  userType: 'VIP' | 'Regular' | 'New' | 'Problem';
  averageOrderValue: number;
  orderFrequency: number;
  favoriteProducts: string[];
  isBlocked: boolean;
}

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserRatingModal: React.FC<UserRatingModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRating[]>([]);
  const [sortBy, setSortBy] = useState<'orders' | 'cancelled' | 'rating' | 'spent' | 'frequency' | 'recent'>('orders');
  const [filter, setFilter] = useState<'all' | 'vip' | 'problem' | 'blocked' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRating | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week' | 'today'>('all');

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      const [allOrders, allUsers] = await Promise.all([
        dataService.getOrders(),
        dataService.getUsers()
      ]);

      const now = new Date();
      const filterDate = getFilterDate(timeFilter);

      const userRatings: UserRating[] = allUsers.map(user => {
        const userOrders = allOrders.filter(order => {
          const orderDate = order.createdAt;
          return order.customerId === user.id && 
                 (timeFilter === 'all' || orderDate >= filterDate);
        });

        const completedOrders = userOrders.filter(order => order.status === 'delivered');
        const cancelledOrders = userOrders.filter(order => order.status === 'cancelled');
        const pendingOrders = userOrders.filter(order => ['pending', 'accepted', 'preparing'].includes(order.status));
        
        const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const averageRating = completedOrders.length > 0 
          ? completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / completedOrders.length 
          : 0;

        const lastOrder = userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        
        // Foydalanuvchi turini aniqlash
        let userType: UserRating['userType'] = 'New';
        if (userOrders.length >= 15 && totalSpent >= 1000000) userType = 'VIP';
        else if (cancelledOrders.length > completedOrders.length && cancelledOrders.length >= 3) userType = 'Problem';
        else if (userOrders.length >= 5) userType = 'Regular';

        // Buyurtma chastotasini hisoblash (oylik)
        const joinDate = user.joinDate instanceof Date ? user.joinDate : new Date(user.joinDate || Date.now());
        const daysSinceRegistration = Math.max(1, (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        const orderFrequency = (userOrders.length / daysSinceRegistration) * 30; // oylik

        // O'rtacha buyurtma qiymati
        const averageOrderValue = userOrders.length > 0 ? totalSpent / userOrders.length : 0;

        // Sevimli mahsulotlar (eng ko'p buyurtma qilingan)
        const productCounts: { [key: string]: number } = {};
        userOrders.forEach(order => {
          order.items.forEach(item => {
            productCounts[item.cakeId] = (productCounts[item.cakeId] || 0) + item.quantity;
          });
        });
        const favoriteProducts = Object.entries(productCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([productId]) => productId);

        return {
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          userPhone: user.phone,
          userAddress: user.address,
          registrationDate: joinDate,
          totalOrders: userOrders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: pendingOrders.length,
          averageRating: Math.round(averageRating * 10) / 10,
          totalSpent,
          lastOrderDate: lastOrder?.createdAt || joinDate,
          userType,
          averageOrderValue,
          orderFrequency: Math.round(orderFrequency * 100) / 100,
          favoriteProducts,
          isBlocked: user.status === 'blocked'
        };
      });

      setUsers(userRatings);
    } catch (error) {
      console.error('Foydalanuvchi reytinglarini yuklashda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterDate = (filter: string): Date => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return new Date(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserRatings();
    }
  }, [isOpen, timeFilter]);

  const filteredAndSortedUsers = users
    .filter(user => {
      // Turga bo'yicha filtrlash
      if (filter === 'vip' && user.userType !== 'VIP') return false;
      if (filter === 'problem' && user.userType !== 'Problem') return false;
      if (filter === 'blocked' && !user.isBlocked) return false;
      if (filter === 'active' && user.isBlocked) return false;
      
      // Qidiruv bo'yicha filtrlash
      if (searchQuery && !user.userName.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !user.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'cancelled':
          return b.cancelledOrders - a.cancelledOrders;
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'frequency':
          return b.orderFrequency - a.orderFrequency;
        case 'recent':
          return b.lastOrderDate.getTime() - a.lastOrderDate.getTime();
        default:
          return 0;
      }
    });

  const exportToCSV = () => {
    const csvData = filteredAndSortedUsers.map(user => [
      user.userName,
      user.userEmail,
      user.userPhone || '',
      user.totalOrders,
      user.completedOrders,
      user.cancelledOrders,
      user.totalSpent,
      user.averageRating,
      user.userType,
      user.orderFrequency,
      user.registrationDate.toLocaleDateString(),
      user.lastOrderDate.toLocaleDateString()
    ].join(',')).join('\n');

    const headers = [
      'Ism', 'Email', 'Telefon', 'Jami buyurtma', 'Yakunlangan', 'Bekor qilingan', 
      'Jami sarflangan', 'Reyting', 'Tur', 'Chastota', 'Ro\'yxatdan o\'tgan', 'Oxirgi buyurtma'
    ].join(',');

    const csvContent = headers + '\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `foydalanuvchilar_reytingi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = currentStatus ? 'active' : 'blocked';
      await dataService.updateUserStatus(userId, newStatus);
      
      // Listni yangilash
      setUsers(prev => prev.map(user => 
        user.userId === userId 
          ? { ...user, isBlocked: !currentStatus }
          : user
      ));
      
      if (selectedUser?.userId === userId) {
        setSelectedUser(prev => prev ? { ...prev, isBlocked: !currentStatus } : null);
      }
    } catch (error) {
      console.error('Foydalanuvchi statusini o\'zgartirishda xato:', error);
    }
  };

  const getUserTypeIcon = (type: UserRating['userType']) => {
    switch (type) {
      case 'VIP':
        return <Award className="text-yellow-500" size={16} />;
      case 'Problem':
        return <AlertTriangle className="text-red-500" size={16} />;
      case 'Regular':
        return <User className="text-blue-500" size={16} />;
      case 'New':
        return <User className="text-gray-500" size={16} />;
    }
  };

  const getUserTypeColor = (type: UserRating['userType']) => {
    switch (type) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800';
      case 'Problem':
        return 'bg-red-100 text-red-800';
      case 'Regular':
        return 'bg-blue-100 text-blue-800';
      case 'New':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Foydalanuvchilar reytingi</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download size={16} />
                <span>Eksport</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Qidiruv va Filtrlash */}
          <div className="flex flex-wrap gap-4 mt-4">
            {/* Qidiruv */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Foydalanuvchini qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Vaqt filtri */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Barcha vaqt</option>
              <option value="month">Oxirgi oy</option>
              <option value="week">Oxirgi hafta</option>
              <option value="today">Bugun</option>
            </select>

            {/* Tur filtri */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Barchasi ({users.length})
              </button>
              <button
                onClick={() => setFilter('vip')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'vip' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                VIP ({users.filter(u => u.userType === 'VIP').length})
              </button>
              <button
                onClick={() => setFilter('problem')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'problem' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Muammoli ({users.filter(u => u.userType === 'Problem').length})
              </button>
              <button
                onClick={() => setFilter('blocked')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'blocked' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bloklangan ({users.filter(u => u.isBlocked).length})
              </button>
            </div>

            {/* Saralash */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="orders">Eng ko'p buyurtma</option>
              <option value="cancelled">Eng ko'p bekor qilgan</option>
              <option value="rating">Eng yuqori reyting</option>
              <option value="spent">Eng ko'p sarflagan</option>
              <option value="frequency">Eng faol</option>
              <option value="recent">Eng so'nggi faoliyat</option>
            </select>
          </div>
        </div>

        <div className="flex h-[calc(95vh-200px)]">
          {/* Foydalanuvchilar ro'yxati */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-3">
                  {filteredAndSortedUsers.map((user, index) => (
                    <div 
                      key={user.userId} 
                      className={`rounded-xl p-4 cursor-pointer transition-all ${
                        selectedUser?.userId === user.userId 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      } ${user.isBlocked ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold text-gray-500 w-8">
                            #{index + 1}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getUserTypeIcon(user.userType)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.userType)}`}>
                              {user.userType}
                            </span>
                            {user.isBlocked && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Bloklangan
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{user.userName}</h3>
                            <p className="text-sm text-gray-600">{user.userEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <Package className="text-blue-500" size={16} />
                              <span className="text-lg font-bold text-gray-900">{user.totalOrders}</span>
                            </div>
                            <p className="text-xs text-gray-600">Buyurtma</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <TrendingDown className="text-red-500" size={16} />
                              <span className="text-lg font-bold text-gray-900">{user.cancelledOrders}</span>
                            </div>
                            <p className="text-xs text-gray-600">Bekor</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <Star className="text-yellow-500" size={16} />
                              <span className="text-lg font-bold text-gray-900">{user.averageRating || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600">Reyting</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="text-green-500" size={16} />
                              <span className="text-lg font-bold text-gray-900">
                                {Math.round(user.totalSpent / 1000)}K
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">Sarflagan</p>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <Clock className="text-purple-500" size={16} />
                              <span className="text-lg font-bold text-gray-900">{user.orderFrequency}</span>
                            </div>
                            <p className="text-xs text-gray-600">Oylik</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAndSortedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Hech qanday foydalanuvchi topilmadi</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tafsilotli ma'lumotlar paneli */}
          {selectedUser && (
            <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Tafsilotlar</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Foydalanuvchi ma'lumotlari */}
                <div className="bg-white rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    {getUserTypeIcon(selectedUser.userType)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedUser.userName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(selectedUser.userType)}`}>
                        {selectedUser.userType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <span>{selectedUser.userEmail}</span>
                    </div>
                    {selectedUser.userPhone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>{selectedUser.userPhone}</span>
                      </div>
                    )}
                    {selectedUser.userAddress && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>{selectedUser.userAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>Ro'yxatdan o'tgan: {selectedUser.registrationDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Statistika */}
                <div className="bg-white rounded-xl p-4 mb-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Statistika</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedUser.totalOrders}</div>
                      <div className="text-xs text-blue-700">Jami buyurtma</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedUser.completedOrders}</div>
                      <div className="text-xs text-green-700">Yakunlangan</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{selectedUser.cancelledOrders}</div>
                      <div className="text-xs text-red-700">Bekor qilingan</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{selectedUser.pendingOrders}</div>
                      <div className="text-xs text-yellow-700">Kutilmoqda</div>
                    </div>
                  </div>
                </div>

                {/* Moliyaviy ma'lumotlar */}
                <div className="bg-white rounded-xl p-4 mb-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Moliyaviy ma'lumotlar</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami sarflangan:</span>
                      <span className="font-semibold">{formatMoney(selectedUser.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">O'rtacha buyurtma:</span>
                      <span className="font-semibold">{formatMoney(selectedUser.averageOrderValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Oylik chastota:</span>
                      <span className="font-semibold">{selectedUser.orderFrequency} ta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Oxirgi buyurtma:</span>
                      <span className="font-semibold">{selectedUser.lastOrderDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Harakat tugmalari */}
                <div className="bg-white rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Harakatlar</h5>
                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Eye size={16} />
                      <span>Buyurtmalarni ko'rish</span>
                    </button>
                    <button
                      onClick={() => toggleUserBlock(selectedUser.userId, selectedUser.isBlocked)}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedUser.isBlocked
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {selectedUser.isBlocked ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Blokni olib tashlash</span>
                        </>
                      ) : (
                        <>
                          <Ban size={16} />
                          <span>Foydalanuvchini bloklash</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRatingModal;
