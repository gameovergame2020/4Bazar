
import React from 'react';
import { Monitor, Clock, AlertTriangle, CheckCircle, TrendingUp, Users, MessageCircle, UserCheck, UserX, Star } from 'lucide-react';

interface OperatorStats {
  totalOrders: number;
  pendingOrders: number;
  activeIssues: number;
  resolvedToday: number;
  avgResponseTime: number;
  activeUsers: number;
  customerSatisfaction: number;
  userStats: {
    acceptedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

interface StatsCardsProps {
  stats: OperatorStats;
  onActiveIssuesClick?: () => void;
  onUserRatingClick?: () => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, onActiveIssuesClick, onUserRatingClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-11 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Monitor size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-sm text-gray-600">Jami buyurtmalar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-600">Kutilmoqda</p>
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onActiveIssuesClick}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeIssues}</p>
            <p className="text-sm text-gray-600">Faol muammolar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
            <p className="text-sm text-gray-600">Bugun hal qilindi</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
            <p className="text-sm text-gray-600">O'rt. javob vaqti</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Users size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            <p className="text-sm text-gray-600">Faol foydalanuvchilar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <MessageCircle size={20} className="text-pink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction || 0}</p>
            <p className="text-sm text-gray-600">Mijoz mamnuniyati</p>
          </div>
        </div>
      </div>

      {/* Foydalanuvchilar statistikasi */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <UserCheck size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.userStats?.acceptedOrders || 0}</p>
            <p className="text-sm text-gray-600">Qabul qilingan</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <UserX size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.userStats?.cancelledOrders || 0}</p>
            <p className="text-sm text-gray-600">Bekor qilingan</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.userStats?.pendingOrders || 0}</p>
            <p className="text-sm text-gray-600">Kutilmoqda (foydalanuvchilar)</p>
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onUserRatingClick}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Star size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction || 0}</p>
            <p className="text-sm text-gray-600">Foydalanuvchilar reytingi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
