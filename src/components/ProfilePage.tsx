import React, { useState } from 'react';
import { 
  User, 
  Settings,
  Bell, 
  Heart, 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Star,
  Clock,
  Package,
  Truck
} from 'lucide-react';
import { UserData } from '../services/authService';
import SettingsPage from './SettingsPage';

interface ProfilePageProps {
  user: UserData;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOrdersStats, setShowOrdersStats] = useState(false);
  const [showFavoritesStats, setShowFavoritesStats] = useState(false);

  const recentOrders = [
    {
      id: 1,
      name: 'Shokoladli Torta',
      restaurant: 'Sweet Dreams',
      date: '2024-01-20',
      price: '250,000',
      status: 'delivered',
      paymentMethod: 'card',
      paymentType: 'click',
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 5,
    },
    {
      id: 2,
      name: 'Red Velvet Torta',
      restaurant: 'Royal Cakes',
      date: '2024-01-18',
      price: '320,000',
      status: 'delivered',
      paymentMethod: 'card',
      paymentType: 'payme',
      image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 4,
    },
    {
      id: 3,
      name: 'Tiramisu',
      restaurant: 'Italian Dreams',
      date: '2024-01-15',
      price: '280,000',
      status: 'cancelled',
      paymentMethod: 'cash',
      paymentType: '',
      image: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: null,
    },
  ];

  const favoriteCakes = [
    {
      id: 1,
      name: 'Qulupnayli Cheese Cake',
      restaurant: 'Cake Paradise',
      price: '180,000',
      image: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 4.9,
      available: true,
    },
    {
      id: 2,
      name: 'Napolyon Torta',
      restaurant: 'Classic Bakery',
      price: '220,000',
      image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 4.8,
      available: true,
    },
    {
      id: 3,
      name: 'Shokoladli Muffin',
      restaurant: 'Sweet Dreams',
      price: '45,000',
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 4.7,
      available: false,
    },
  ];

  const menuItems = [
    { icon: Settings, label: 'Sozlamalar', hasChevron: true, onClick: () => onNavigate('advanced-settings') },
    { icon: CreditCard, label: "To'lov va manzillar", hasChevron: true, onClick: () => onNavigate('payment-address') },
    { icon: HelpCircle, label: 'Yordam', hasChevron: true, onClick: () => onNavigate('help') },
    { icon: LogOut, label: 'Chiqish', hasChevron: false, isLogout: true, onClick: onLogout },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'preparing':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Yetkazildi';
      case 'preparing':
        return 'Tayyorlanmoqda';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return 'Noma\'lum';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return Package;
      case 'preparing':
        return Clock;
      case 'cancelled':
        return Package;
      default:
        return Package;
    }
  };

  if (showSettings) {
    return <SettingsPage user={user} onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Profile Header */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <img 
                src={user.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'}
                alt={user.name}
                className="w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 rounded-full object-cover border-2 border-orange-500"
              />
              <div className="absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 w-4 sm:w-6 h-4 sm:h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
            </div>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-0.5 sm:mb-1">{user.name}</h1>
              <p className="text-gray-300 text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">{user.phone}</p>
              <p className="text-gray-400 text-xs sm:text-sm">{new Date(user.joinDate).toLocaleDateString('uz-UZ')} dan a'zo</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
            <button 
              onClick={() => {
                setIsOrdersExpanded(!isOrdersExpanded);
                if (!isOrdersExpanded) {
                  setIsFavoritesExpanded(false);
                }
              }}
              className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-700/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-xl sm:text-2xl font-bold text-orange-400">{user.totalOrders || 0}</div>
              <div className="text-gray-400 text-xs sm:text-sm flex items-center justify-center space-x-1">
                <span>Buyurtmalar</span>
                <ChevronDown 
                  size={12} 
                  className={`transition-transform duration-300 ${
                    isOrdersExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
            <button 
              onClick={() => {
                setIsFavoritesExpanded(!isFavoritesExpanded);
                if (!isFavoritesExpanded) {
                  setIsOrdersExpanded(false);
                }
              }}
              className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-700/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-xl sm:text-2xl font-bold text-pink-400">{user.favoriteCount || 0}</div>
              <div className="text-gray-400 text-xs sm:text-sm flex items-center justify-center space-x-1">
                <span>Sevimlilar</span>
                <ChevronDown 
                  size={12} 
                  className={`transition-transform duration-300 ${
                    isFavoritesExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Expanded Orders Content */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isOrdersExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-600/30">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center space-x-2">
                <ShoppingBag size={16} className="text-orange-400" />
                <span>Oxirgi buyurtmalar</span>
              </h4>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {recentOrders.slice(0, 3).map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <div key={order.id} className="bg-gray-600/30 rounded-lg p-2 sm:p-3 hover:bg-gray-600/50 transition-colors">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <img 
                          src={order.image}
                          alt={order.name}
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-xs sm:text-sm truncate">{order.name}</h4>
                          <p className="text-gray-400 text-xs">{order.restaurant}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-orange-400 text-xs sm:text-sm font-medium">{order.price} so'm</span>
                            <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              <StatusIcon size={8} />
                              <span>{getStatusText(order.status)}</span>
                            </div>
                          </div>
                          {/* To'lov turi ko'rsatish */}
                          {order.paymentMethod === 'card' && order.paymentType && (
                            <div className="mt-1 flex items-center space-x-1">
                              <span className="text-xs text-gray-400">To'lov:</span>
                              <span className="text-xs font-medium text-blue-400">
                                {order.paymentType === 'click' ? '🔵 Click' :
                                 order.paymentType === 'payme' ? '🟢 Payme' :
                                 order.paymentType === 'visa' ? '💳 Visa/MC' : 
                                 '💳 Karta'}
                              </span>
                            </div>
                          )}
                          {order.paymentMethod === 'cash' && (
                            <div className="mt-1 flex items-center space-x-1">
                              <span className="text-xs text-gray-400">To'lov:</span>
                              <span className="text-xs font-medium text-green-400">💵 Naqd</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expanded Favorites Content */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isFavoritesExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-600/30">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center space-x-2">
                <Heart size={16} className="text-pink-400" />
                <span>Sevimli tortlar</span>
              </h4>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {favoriteCakes.slice(0, 3).map((cake) => (
                  <div key={cake.id} className="bg-gray-600/30 rounded-lg p-2 sm:p-3 hover:bg-gray-600/50 transition-colors">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="relative">
                        <img 
                          src={cake.image}
                          alt={cake.name}
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg object-cover"
                        />
                        {!cake.available && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">Tugagan</span>
                          </div>
                        )}
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
                  </div>
                ))}
              </div>
            </div>
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