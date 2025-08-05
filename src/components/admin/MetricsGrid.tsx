
import React from 'react';
import { Users, Package, DollarSign, Activity, Globe, Server, Database } from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeUsers: number;
  systemUptime: number;
  serverLoad: number;
  databaseSize: number;
}

interface MetricsGridProps {
  metrics: SystemMetrics;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            <p className="text-sm text-gray-600">Foydalanuvchilar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
            <p className="text-sm text-gray-600">Buyurtmalar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSign size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{Math.round((metrics.totalRevenue || 0) / 1000000)}M</p>
            <p className="text-sm text-gray-600">Daromad</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Package size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
            <p className="text-sm text-gray-600">Mahsulotlar</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Activity size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
            <p className="text-sm text-gray-600">Faol</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.systemUptime}%</p>
            <p className="text-sm text-gray-600">Uptime</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Server size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.serverLoad}%</p>
            <p className="text-sm text-gray-600">Server yuki</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Database size={20} className="text-pink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{metrics.databaseSize}GB</p>
            <p className="text-sm text-gray-600">Ma'lumotlar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsGrid;
