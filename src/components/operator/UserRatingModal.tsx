
import React, { useState, useEffect } from 'react';
import { X, Star, TrendingUp, TrendingDown, User, Award, AlertTriangle } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface UserRating {
  userId: string;
  userName: string;
  userEmail: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  averageRating: number;
  totalSpent: number;
  lastOrderDate: Date;
  userType: 'VIP' | 'Regular' | 'New' | 'Problem';
}

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserRatingModal: React.FC<UserRatingModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRating[]>([]);
  const [sortBy, setSortBy] = useState<'orders' | 'cancelled' | 'rating' | 'spent'>('orders');
  const [filter, setFilter] = useState<'all' | 'vip' | 'problem'>('all');

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      const [allOrders, allUsers] = await Promise.all([
        dataService.getOrders(),
        dataService.getUsers()
      ]);

      const userRatings: UserRating[] = allUsers.map(user => {
        const userOrders = allOrders.filter(order => order.customerId === user.id);
        const completedOrders = userOrders.filter(order => order.status === 'delivered');
        const cancelledOrders = userOrders.filter(order => order.status === 'cancelled');
        const pendingOrders = userOrders.filter(order => ['pending', 'accepted', 'preparing'].includes(order.status));
        
        const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const averageRating = completedOrders.length > 0 
          ? completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / completedOrders.length 
          : 0;

        const lastOrder = userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        
        let userType: UserRating['userType'] = 'New';
        if (userOrders.length >= 10 && totalSpent >= 500000) userType = 'VIP';
        else if (cancelledOrders.length > completedOrders.length && cancelledOrders.length >= 3) userType = 'Problem';
        else if (userOrders.length >= 3) userType = 'Regular';

        return {
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          totalOrders: userOrders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: pendingOrders.length,
          averageRating: Math.round(averageRating * 10) / 10,
          totalSpent,
          lastOrderDate: lastOrder?.createdAt || new Date(),
          userType
        };
      });

      setUsers(userRatings);
    } catch (error) {
      console.error('Foydalanuvchi reytinglarini yuklashda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserRatings();
    }
  }, [isOpen]);

  const filteredAndSortedUsers = users
    .filter(user => {
      if (filter === 'vip') return user.userType === 'VIP';
      if (filter === 'problem') return user.userType === 'Problem';
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
        default:
          return 0;
      }
    });

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Foydalanuvchilar reytingi</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Barcha foydalanuvchilar
              </button>
              <button
                onClick={() => setFilter('vip')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'vip' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                VIP mijozlar
              </button>
              <button
                onClick={() => setFilter('problem')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'problem' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Muammoli mijozlar
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="orders">Eng ko'p buyurtma</option>
                <option value="cancelled">Eng ko'p bekor qilgan</option>
                <option value="rating">Eng yuqori reyting</option>
                <option value="spent">Eng ko'p sarflagan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-4">
                {filteredAndSortedUsers.map((user, index) => (
                  <div key={user.userId} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
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
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.userName}</h3>
                          <p className="text-sm text-gray-600">{user.userEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="text-green-500" size={16} />
                            <span className="text-lg font-bold text-gray-900">{user.totalOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600">Jami buyurtma</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <TrendingDown className="text-red-500" size={16} />
                            <span className="text-lg font-bold text-gray-900">{user.cancelledOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600">Bekor qilgan</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <Star className="text-yellow-500" size={16} />
                            <span className="text-lg font-bold text-gray-900">{user.averageRating || 0}</span>
                          </div>
                          <p className="text-xs text-gray-600">Reyting</p>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(user.totalSpent / 1000)}K
                          </div>
                          <p className="text-xs text-gray-600">Sarflagan</p>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{user.completedOrders}</div>
                          <p className="text-xs text-gray-600">Yakunlangan</p>
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
      </div>
    </div>
  );
};

export default UserRatingModal;
