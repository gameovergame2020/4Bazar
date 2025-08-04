
import React from 'react';
import { Download, RefreshCw, AlertTriangle, Settings, Users, Database } from 'lucide-react';

interface AdminActionsProps {
  onAction: (action: string) => void;
  loading: boolean;
}

const AdminActions: React.FC<AdminActionsProps> = ({ onAction, loading }) => {
  const actions = [
    {
      id: 'backup',
      label: 'Backup yaratish',
      icon: Database,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Tizim ma\'lumotlarini zaxiralash'
    },
    {
      id: 'export',
      label: 'Ma\'lumotlarni eksport',
      icon: Download,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Barcha ma\'lumotlarni yuklab olish'
    },
    {
      id: 'refresh',
      label: 'Tizimni yangilash',
      icon: RefreshCw,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Cache va ma\'lumotlarni yangilash'
    },
    {
      id: 'maintenance',
      label: 'Texnik ishlar',
      icon: AlertTriangle,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Tizimni texnik ishlarga qo\'yish'
    },
    {
      id: 'users',
      label: 'Foydalanuvchilar',
      icon: Users,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Foydalanuvchilarni boshqarish'
    },
    {
      id: 'settings',
      label: 'Tizim sozlamalari',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Asosiy tizim sozlamalari'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tezkor amallar</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              disabled={loading}
              className={`${action.color} text-white p-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex flex-col items-center space-y-2">
                <IconComponent size={24} />
                <span className="font-medium text-sm">{action.label}</span>
                <span className="text-xs opacity-90 text-center">{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActions;
