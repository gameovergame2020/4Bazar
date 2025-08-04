
import React from 'react';
import { Users, Package, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    activeUsers: number;
    pendingIssues: number;
    resolvedIssues: number;
  };
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tizim statistikasi</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <Users size={24} className="text-gray-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Jami foydalanuvchilar</div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <Package size={24} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
          <div className="text-sm text-blue-700">Jami buyurtmalar</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <DollarSign size={24} className="text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-600">
            {Math.round(stats.totalRevenue / 1000000)}M
          </div>
          <div className="text-sm text-green-700">Jami daromad</div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
          <div className="text-sm text-blue-700">Faol foydalanuvchilar</div>
        </div>

        <div className="text-center p-4 bg-yellow-50 rounded-xl">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingIssues}</div>
          <div className="text-sm text-yellow-700">Kutilayotgan muammolar</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600">{stats.resolvedIssues}</div>
          <div className="text-sm text-green-700">Hal qilingan muammolar</div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
