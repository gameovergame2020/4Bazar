import React, { useState } from 'react';
import { User, ChefHat, Store, Truck, Headphones, Shield } from 'lucide-react';
import { UserRole, ROLE_CONFIGS } from '../types/user';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  onContinue: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect, onContinue }) => {
  const getIcon = (iconName: string) => {
    const icons = {
      User,
      ChefHat,
      Store,
      Truck,
      Headphones,
      Shield
    };
    return icons[iconName] || User;
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      orange: isSelected ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      green: isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      purple: isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      yellow: isSelected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
      red: isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">TB</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tort Bazar</h1>
          <p className="text-gray-600 text-lg">Qaysi sifatda kirmoqchisiz?</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(ROLE_CONFIGS).map(([role, config]) => {
            const IconComponent = getIcon(config.icon);
            const isSelected = selectedRole === role;
            
            return (
              <button
                key={role}
                onClick={() => onRoleSelect(role as UserRole)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  getColorClasses(config.color, isSelected)
                } ${isSelected ? 'transform scale-105 shadow-lg' : 'hover:shadow-md'}`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-xl ${
                    isSelected ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <IconComponent size={24} className={isSelected ? 'text-white' : ''} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{config.displayName}</h3>
                  </div>
                </div>
                <p className={`text-sm mb-4 ${
                  isSelected ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {config.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.permissions.slice(0, 2).map((permission) => (
                    <span 
                      key={permission}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {permission.replace('_', ' ')}
                    </span>
                  ))}
                  {config.permissions.length > 2 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      +{config.permissions.length - 2}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={onContinue}
            disabled={!selectedRole}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-pink-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            Davom etish
          </button>
          {selectedRole && (
            <p className="mt-4 text-gray-600">
              <span className="font-medium">{ROLE_CONFIGS[selectedRole].displayName}</span> sifatida davom etasiz
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;