
import React from 'react';
import { Shield, Edit, Save, X } from 'lucide-react';
import { UserData } from '../../../services/shared/types';

interface AdminInfoCardProps {
  user: UserData;
  isEditing: boolean;
  editForm: {
    name: string;
    phone: string;
    email: string;
    avatar: File | null;
  };
  loading: boolean;
  onEditToggle: () => void;
  onFormChange: (field: string, value: string | File | null) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AdminInfoCard: React.FC<AdminInfoCardProps> = ({
  user,
  isEditing,
  editForm,
  loading,
  onEditToggle,
  onFormChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <Shield size={16} />
          </div>
        </div>

        <div className="flex-1 mt-4 md:mt-0">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => onFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFormChange('avatar', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onSave}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
                <button
                  onClick={onCancel}
                  className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  <span>Bekor qilish</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <button
                  onClick={onEditToggle}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                >
                  <Edit size={16} />
                  <span>Tahrirlash</span>
                </button>
              </div>
              <p className="text-gray-600 mb-1">{user.phone}</p>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <div className="flex items-center space-x-2 mt-3">
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                  Super Admin
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                  Faol
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInfoCard;
