
import React from 'react';
import { Users, Activity } from 'lucide-react';

interface UserStats {
  customers: number;
  bakers: number;
  shops: number;
  couriers: number;
  operators: number;
  admins: number;
}

interface UserStatsCardProps {
  userStats: UserStats;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ userStats }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customers': return 'bg-blue-100 text-blue-600';
      case 'bakers': return 'bg-orange-100 text-orange-600';
      case 'shops': return 'bg-green-100 text-green-600';
      case 'couriers': return 'bg-purple-100 text-purple-600';
      case 'operators': return 'bg-yellow-100 text-yellow-600';
      case 'admins': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'customers': return 'Mijozlar';
      case 'bakers': return 'Oshpazlar';
      case 'shops': return 'Do\'konlar';
      case 'couriers': return 'Kuryerlar';
      case 'operators': return 'Operatorlar';
      case 'admins': return 'Adminlar';
      default: return role;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Foydalanuvchilar taqsimoti</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(userStats).map(([role, count]) => (
          <div key={role} className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${getRoleColor(role)}`}>
              <span className="text-2xl font-bold">{count}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{getRoleText(role)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStatsCard;
