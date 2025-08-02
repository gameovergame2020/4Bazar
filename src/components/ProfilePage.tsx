import React, { useState, useEffect } from 'react';
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
import { dataService, Order } from '../services/dataService';

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
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

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

  // Firebase dan foydalanuvchi buyurtmalarini yuklash
  useEffect(() => {
    const loadUserOrders = async () => {
      if (!user.phone) {
        console.log('❌ Foydalanuvchi telefon raqami yo\'q');
        setUserOrders([]);
        return;
      }
      
      try {
        setIsLoadingOrders(true);
        console.log('📱 Foydalanuvchi buyurtmalari yuklanmoqda:', user.phone);
        
        // Telefon raqamini turli formatlarda sinab ko'rish
        const phoneVariants = [
          user.phone,
          user.phone.startsWith('+') ? user.phone : `+${user.phone}`,
          user.phone.startsWith('+998') ? user.phone : `+998${user.phone.replace(/^\+?998?/, '')}`,
          user.phone.replace(/\D/g, ''), // faqat raqamlar
        ];
        
        console.log('🔍 Telefon raqami variantlari:', phoneVariants);
        
        let allOrders: any[] = [];
        
        // Har bir variant uchun buyurtmalarni qidirish
        for (const phoneVariant of phoneVariants) {
          try {
            const orders = await dataService.getOrdersByCustomerPhone(phoneVariant);
            console.log(`📞 ${phoneVariant} uchun topilgan buyurtmalar:`, orders.length);
            if (orders.length > 0) {
              allOrders = [...allOrders, ...orders];
            }
          } catch (variantError) {
            console.log(`⚠️ ${phoneVariant} uchun xato:`, variantError);
          }
        }
        
        // Duplikatlarni olib tashlash
        const uniqueOrders = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );
        
        console.log('✅ Jami noyob buyurtmalar:', uniqueOrders.length);
        
        // Barcha buyurtmalar (shu jumladan to'lov holatida turganlar ham)
        const sortedOrders = uniqueOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setUserOrders(sortedOrders);
        console.log('📊 Foydalanuvchi buyurtmalari o\'rnatildi:', sortedOrders.length, 'ta');
        
        // Agar buyurtmalar topilmasa, bazadan barcha buyurtmalarni tekshirish
        if (sortedOrders.length === 0) {
          console.log('🔍 Barcha buyurtmalarni tekshirmoqda...');
          const allOrdersInDb = await dataService.getOrders();
          console.log('📋 Bazadagi barcha buyurtmalar:', allOrdersInDb.length);
          
          // Foydalanuvchi nomi bo'yicha ham qidirish
          const ordersByName = allOrdersInDb.filter(order => 
            order.customerName?.toLowerCase().includes(user.name?.toLowerCase() || '') ||
            order.customerPhone?.includes(user.phone?.replace(/\D/g, '').slice(-7) || '')
          );
          
          console.log('👤 Nom bo\'yicha topilgan buyurtmalar:', ordersByName.length);
          
          if (ordersByName.length > 0) {
            setUserOrders(ordersByName.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
          }
        }
        
      } catch (error) {
        console.error('❌ Buyurtmalarni yuklashda xato:', error);
        console.error('❌ Xato tafsilotlari:', {
          message: error.message,
          phone: user.phone,
          name: user.name
        });
        setUserOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    // Dastlab yuklash
    loadUserOrders();
    
    // Har 15 soniyada buyurtmalarni yangilash
    const interval = setInterval(loadUserOrders, 15000);
    
    return () => clearInterval(interval);
  }, [user.phone, user.name]);

  // Buyurtmani bekor qilish funksiyasi
  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bu buyurtmani bekor qilishni tasdiqlaysizmi?')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      console.log('🚫 Buyurtma bekor qilinmoqda:', orderId);
      
      // Buyurtma holatini 'cancelled' qilib o'zgartirish
      await dataService.updateOrderStatus(orderId, 'cancelled');
      
      // Local state'ni yangilash
      setUserOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled', updatedAt: new Date() }
            : order
        )
      );
      
      console.log('✅ Buyurtma muvaffaqiyatli bekor qilindi');
      alert('Buyurtma muvaffaqiyatli bekor qilindi!');
      
    } catch (error) {
      console.error('❌ Buyurtmani bekor qilishda xato:', error);
      alert('Buyurtmani bekor qilishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setCancellingOrderId(null);
    }
  };

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
      case 'pending':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'confirmed':
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20';
      case 'preparing':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'ready':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
      case 'delivering':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
      case 'delivered':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'confirmed':
        return 'Tasdiqlandi';
      case 'preparing':
        return 'Tayyorlanmoqda';
      case 'ready':
        return 'Tayyor';
      case 'delivering':
        return 'Yetkazilmoqda';
      case 'delivered':
        return 'Yetkazildi';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return 'Noma\'lum';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
        return Package;
      case 'preparing':
        return Clock;
      case 'ready':
        return Package;
      case 'delivering':
        return Truck;
      case 'delivered':
        return Package;
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
              <div className="text-xl sm:text-2xl font-bold text-orange-400">
                {isLoadingOrders ? '...' : userOrders.length}
              </div>
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
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-gray-300 text-sm">Buyurtmalar yuklanmoqda...</span>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-600/30 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">Hozircha buyurtmalar yo'q</p>
                    <p className="text-gray-500 text-xs mt-1">Birinchi buyurtmangizni bering!</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 text-xs text-gray-400 text-center">
                      Jami {userOrders.length} ta buyurtma (so'nggi 5 tasi ko'rsatilgan)
                    </div>
                    {userOrders.slice(0, 5).map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="bg-gray-600/30 rounded-lg p-3 hover:bg-gray-600/50 transition-colors border border-gray-600/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-white text-sm truncate">{order.cakeName}</h4>
                                  <p className="text-gray-400 text-xs">#{order.id?.slice(-8).toUpperCase()}</p>
                                </div>
                                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)} ml-2`}>
                                  <StatusIcon size={10} />
                                  <span>{getStatusText(order.status)}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-400">Narx:</span>
                                  <span className="text-orange-400 font-medium ml-1">{order.totalPrice.toLocaleString()} so'm</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Miqdor:</span>
                                  <span className="text-white font-medium ml-1">{order.quantity} ta</span>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-400">
                                📅 {new Date(order.createdAt).toLocaleDateString('uz-UZ', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              
                              {/* To'lov turi ko'rsatish */}
                              <div className="mt-2 flex items-center space-x-1">
                                <span className="text-xs text-gray-400">To'lov:</span>
                                {order.paymentMethod === 'card' && order.paymentType ? (
                                  <span className="text-xs font-medium">
                                    {order.paymentType === 'click' ? '🔵 Click' :
                                     order.paymentType === 'payme' ? '🟢 Payme' :
                                     order.paymentType === 'visa' ? '💳 Visa/MC' : 
                                     '💳 Bank kartasi'}
                                  </span>
                                ) : order.paymentMethod === 'cash' ? (
                                  <span className="text-xs font-medium text-green-400">💵 Naqd pul</span>
                                ) : (
                                  <span className="text-xs font-medium text-yellow-400">⏳ Aniqlanmagan</span>
                                )}
                              </div>

                              {/* Yetkazib berish manzili */}
                              {order.deliveryAddress && (
                                <div className="mt-1 text-xs">
                                  <span className="text-gray-400">📍 Manzil:</span>
                                  <span className="text-gray-300 ml-1">{order.deliveryAddress}</span>
                                </div>
                              )}

                              {/* Buyurtmani bekor qilish tugmasi */}
                              {order.status === 'pending' && (
                                <div className="mt-3 pt-2 border-t border-gray-600/30">
                                  <button
                                    onClick={() => handleCancelOrder(order.id!)}
                                    disabled={cancellingOrderId === order.id}
                                    className="w-full bg-red-500/20 text-red-400 py-2 px-3 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                  >
                                    {cancellingOrderId === order.id ? (
                                      <>
                                        <div className="animate-spin h-3 w-3 border border-red-400 border-t-transparent rounded-full"></div>
                                        <span>Bekor qilinmoqda...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>🚫</span>
                                        <span>Buyurtmani bekor qilish</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {userOrders.length > 5 && (
                      <div className="text-center mt-3">
                        <p className="text-xs text-gray-500">Va yana {userOrders.length - 5} ta buyurtma...</p>
                      </div>
                    )}
                  </>
                )}
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