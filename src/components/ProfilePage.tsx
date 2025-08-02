import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Truck, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Star, 
  Heart, 
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  totalOrders: number;
  favoriteCount: number;
}

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onNavigateToPaymentAddress: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHelp: () => void;
  onNavigateToAdvancedSettings: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  onBack, 
  onNavigateToPaymentAddress, 
  onNavigateToSettings, 
  onNavigateToHelp, 
  onNavigateToAdvancedSettings, 
  onLogout 
}) => {

  const menuItems = [
    {
      icon: CreditCard,
      label: 'To\'lov va manzil',
      onClick: onNavigateToPaymentAddress,
      hasChevron: true,
      isLogout: false
    },
    {
      icon: Settings,
      label: 'Sozlamalar',
      onClick: onNavigateToSettings,
      hasChevron: true,
      isLogout: false
    },
    {
      icon: Phone,
      label: 'Yordam',
      onClick: onNavigateToHelp,
      hasChevron: true,
      isLogout: false
    },
    {
      icon: User,
      label: 'Qo\'shimcha sozlamalar',
      onClick: onNavigateToAdvancedSettings,
      hasChevron: true,
      isLogout: false
    },
    {
      icon: LogOut,
      label: 'Chiqish',
      onClick: onLogout,
      hasChevron: false,
      isLogout: true
    }
  ];

  const favoriteItems = [
    {
      id: 1,
      name: 'Shokoladli tort',
      restaurant: 'Sweet Dreams',
      price: 45000,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Vanilla krem tort',
      restaurant: 'Cake Paradise',
      price: 38000,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Mevali tort',
      restaurant: 'Fresh Bakery',
      price: 52000,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop'
    }
  ];

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800/50 text-white hover:bg-gray-700/50 transition-colors border border-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-white">Profil</h1>
          <div className="w-8 h-8 sm:w-10 sm:h-10"></div>
        </div>

        {/* Profile Card */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs sm:text-sm">{user.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-700/50">
              <div className="text-lg sm:text-xl font-bold text-orange-400">{user.totalOrders}</div>
              <div className="text-xs sm:text-sm text-gray-400">Buyurtmalar</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-700/50">
              <div className="text-lg sm:text-xl font-bold text-pink-400">{user.favoriteCount}</div>
              <div className="text-xs sm:text-sm text-gray-400">Sevimlilar</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">So'nggi buyurtmalar</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="p-3 sm:p-4 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm sm:text-base">Shokoladli tort</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Sweet Dreams</p>
                </div>
                <div className="px-2 py-1 rounded-full text-xs flex items-center space-x-1 text-green-400 bg-green-400/10">
                  <CheckCircle className="w-3 h-3" />
                  <span>Yetkazilgan</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-orange-400 font-medium">45,000 so'm</span>
                <span className="text-gray-400">12.01.2024</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm sm:text-base">Vanilla krem tort</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Cake Paradise</p>
                </div>
                <div className="px-2 py-1 rounded-full text-xs flex items-center space-x-1 text-blue-400 bg-blue-400/10">
                  <CheckCircle className="w-3 h-3" />
                  <span>Tasdiqlangan</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-orange-400 font-medium">38,000 so'm</span>
                <span className="text-gray-400">10.01.2024</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm sm:text-base">Mevali tort</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Fresh Bakery</p>
                </div>
                <div className="px-2 py-1 rounded-full text-xs flex items-center space-x-1 text-yellow-400 bg-yellow-400/10">
                  <Clock className="w-3 h-3" />
                  <span>Kutilmoqda</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-orange-400 font-medium">52,000 so'm</span>
                <span className="text-gray-400">08.01.2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Items */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Sevimli tortlar</h2>
          <div className="space-y-2 sm:space-y-3">
            {favoriteItems.map((cake) => (
              <div key={cake.id} className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-600 overflow-hidden">
                  <img 
                    src={cake.image} 
                    alt={cake.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-xs sm:text-sm truncate">{cake.name}</h4>
                  <p className="text-gray-400 text-xs">{cake.restaurant}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-orange-400 text-xs sm:text-sm font-medium">{cake.price} so'm</span>
                    <div className="flex items-center space-x-1">
                      <Star size={10} className="text-yellow-400 fill-current" />
                      <span className="text-gray-300 text-xs">{cake.rating}</span>
                    </div>
                  </div>
                </div>
                <button className="p-0.5 sm:p-1 text-pink-400 hover:text-pink-300 transition-colors">
                  <Heart size={12} className="fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700 mb-20">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Sozlamalar</h2>
          <div className="space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors ${
                    item.isLogout 
                      ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' 
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <IconComponent size={18} />
                    <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  </div>
                  {item.hasChevron && (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ProfilePage;