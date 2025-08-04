
import React from 'react';
import { Clock, Package, Star, Users, DollarSign, TrendingUp } from 'lucide-react';

interface Stats {
  pendingOrders: number;
  totalProducts: number;
  averageRating: number;
  totalCustomers: number;
  todayEarnings: number;
  monthlyEarnings: number;
}

interface StatsGridProps {
  stats: Stats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-600">Kutilayotgan</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            <p className="text-sm text-gray-600">Tortlar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Star size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
            <p className="text-sm text-gray-600">Reyting</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            <p className="text-sm text-gray-600">Mijozlar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{Math.round(stats.todayEarnings / 1000)}K</p>
            <p className="text-sm text-gray-600">Bugungi</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{Math.round(stats.monthlyEarnings / 1000)}K</p>
            <p className="text-sm text-gray-600">Oylik</p>
          </div>
        </div>
      </div>
    </div>
  );
};
