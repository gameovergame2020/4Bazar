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

  // Firebase dan foydalanuvchi buyurtmalarini yuklash (optimallashtirilgan)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isActive = true;
    let loadingTimeout: NodeJS.Timeout | null = null;

    const loadOrdersOptimized = async () => {
      if (!user.phone && !user.name && !user.id) {
        setUserOrders([]);
        setIsLoadingOrders(false);
        return;
      }

      try {
        setIsLoadingOrders(true);
        
        // 10 soniya timeout - agar yuklanmasa xato ko'rsatish
        loadingTimeout = setTimeout(() => {
          if (isActive) {
            console.warn('⚠️ Buyurtmalar yuklash 10 soniyadan oshdi');
            setIsLoadingOrders(false);
          }
        }, 10000);

        let userOrders: Order[] = [];

        // Birinchi customer ID bo'yicha qidirish (eng tez)
        if (user.id) {
          try {
            userOrders = await dataService.getOrdersByCustomerId(user.id.toString());
            
            if (userOrders.length > 0) {
              console.log('✅ Customer ID bo\'yicha topildi:', userOrders.length, 'ta');
              
              if (isActive) {
                setUserOrders(userOrders.sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
                setIsLoadingOrders(false);
                if (loadingTimeout) clearTimeout(loadingTimeout);
              }
              return; // Muvaffaqiyatli topilsa, boshqa qidirish kerak emas
            }
          } catch (error) {
            console.warn('⚠️ Customer ID qidirishda xato:', error);
          }
        }

        // Agar Customer ID bo'yicha topilmasa, telefon bo'yicha qidirish
        if (userOrders.length === 0 && user.phone) {
          try {
            userOrders = await dataService.getOrdersByCustomerPhone(user.phone);
            
            if (userOrders.length > 0) {
              console.log('✅ Telefon bo\'yicha topildi:', userOrders.length, 'ta');
            }
          } catch (error) {
            console.warn('⚠️ Telefon qidirishda xato:', error);
          }
        }

        // Final result
        if (isActive) {
          const sortedOrders = userOrders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setUserOrders(sortedOrders);
          console.log('✅ Buyurtmalar yuklandi:', sortedOrders.length, 'ta');
        }

      } catch (error) {
        console.error('❌ Buyurtmalarni yuklashda xato:', error);
        if (isActive && userOrders.length === 0) {
          setUserOrders([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingOrders(false);
          if (loadingTimeout) clearTimeout(loadingTimeout);
        }
      }
    };

    // Real-time subscription (soddalashtirilgan)
    const setupRealTimeSubscription = () => {
      if (!user.id) {
        console.log('⚠️ Real-time subscription: Customer ID yo\'q');
        return;
      }

      try {
        // Faqat customer ID bo'yicha subscription
        unsubscribe = dataService.subscribeToOrders((allOrders) => {
          if (!isActive) return;

          try {
            const userOrders = allOrders.filter(order => 
              order.customerId === user.id.toString()
            );

            const sortedOrders = userOrders.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setUserOrders(sortedOrders);
          } catch (error) {
            console.error('❌ Real-time yangilanishda xato:', error);
          }
        }, { customerId: user.id.toString() });

      } catch (error) {
        console.error('❌ Real-time subscription xatosi:', error);
      }
    };

    // Ma'lumot yuklash
    loadOrdersOptimized().then(() => {
      if (isActive && user.id) {
        // Real-time ni 2 soniya kechiktirib boshlash
        setTimeout(() => {
          if (isActive) {
            setupRealTimeSubscription();
          }
        }, 2000);
      }
    });

    // Cleanup function
    return () => {
      isActive = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user.id, user.phone]); // Dependency list kamaytirildi

  // Buyurtmani bekor qilish uchun modal holatini boshqarish
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Buyurtmani bekor qilish modalini ochish
  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  // Buyurtmani bekor qilish funksiyasi
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrderId(orderToCancel.id!);
      console.log('🚫 Buyurtma bekor qilinmoqda:', orderToCancel.id);

      // Buyurtma holatini 'cancelled' qilib o'zgartirish
      await dataService.updateOrderStatus(orderToCancel.id!, 'cancelled');

      // Local state'ni yangilash
      setUserOrders(prev => 
        prev.map(order => 
          order.id === orderToCancel.id 
            ? { ...order, status: 'cancelled', updatedAt: new Date() }
            : order
        )
      );

      console.log('✅ Buyurtma muvaffaqiyatli bekor qilindi');
      setShowCancelModal(false);
      setOrderToCancel(null);

    } catch (error) {
      console.error('❌ Buyurtmani bekor qilishda xato:', error);
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
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mb-3"></div>
                    <span className="text-gray-300 text-sm mb-2">Buyurtmalar yuklanmoqda...</span>
                    <span className="text-gray-500 text-xs">Real-time yangilanish</span>
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

                              {/* Refund ma'lumotlari */}
                              {order.status === 'cancelled' && order.paymentMethod === 'card' && (order as any).refundAmount && (
                                <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                  <div className="text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-blue-400">💰 Qaytariladi:</span>
                                      <span className="text-blue-300 font-medium">{((order as any).refundAmount).toLocaleString()} so'm</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">Xizmat haqi:</span>
                                      <span className="text-red-300">{(order.totalPrice - (order as any).refundAmount).toLocaleString()} so'm</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">Holat:</span>
                                      <span className={`font-medium ${
                                        (order as any).refundStatus === 'processed' ? 'text-green-400' :
                                        (order as any).refundStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'
                                      }`}>
                                        {(order as any).refundStatus === 'processed' ? '✅ Qaytarildi' :
                                         (order as any).refundStatus === 'pending' ? '⏳ Kutilmoqda' : '❌ Xato'}
                                      </span>
                                    </div>
                                    {(order as any).refundStatus === 'pending' && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        💡 Pul 3-5 ish kuni ichida qaytariladi
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

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
                                    onClick={() => openCancelModal(order)}
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

        {/* Buyurtmani bekor qilish modal oynasi */}
        {showCancelModal && orderToCancel && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>Buyurtmani bekor qilish</span>
                </h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Buyurtma ma'lumotlari */}
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{orderToCancel.cakeName}</h4>
                    <p className="text-gray-400 text-xs">#{orderToCancel.id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Narx:</span>
                    <div className="text-orange-400 font-medium">{orderToCancel.totalPrice.toLocaleString()} so'm</div>
                  </div>
                  <div>
                    <span className="text-gray-400">To'lov:</span>
                    <div className="text-white font-medium">
                      {orderToCancel.paymentMethod === 'card' ? (
                        orderToCancel.paymentType === 'click' ? '🔵 Click' :
                        orderToCancel.paymentType === 'payme' ? '🟢 Payme' :
                        orderToCancel.paymentType === 'visa' ? '💳 Visa/MC' : '💳 Bank kartasi'
                      ) : '💵 Naqd pul'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ogohlantirish matni */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-lg">💡</span>
                  <div className="text-sm">
                    <h4 className="font-medium text-yellow-400 mb-2">Muhim ma'lumot:</h4>
                    <ul className="text-gray-300 space-y-1 text-xs">
                      <li>• Bu amalni ortga qaytarib bo'lmaydi</li>
                      <li>• Buyurtma bekor qilinadi va holati o'zgaradi</li>
                      {orderToCancel.paymentMethod === 'card' && (
                        <>
                          <li>• Bank kartasi orqali to'lov qilingan</li>
                          <li>• Xizmat haqi ushlab qolinadi</li>
                          <li>• Qolgan mablag' 3-5 ish kuni ichida qaytariladi</li>
                        </>
                      )}
                      {orderToCancel.paymentMethod === 'cash' && (
                        <li>• Naqd to'lov uchun qaytarish kerak emas</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Refund hisob-kitobi (agar bank kartasi bo'lsa) */}
              {orderToCancel.paymentMethod === 'card' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-blue-400 mb-3 text-sm">💰 To'lov qaytarish hisobi:</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyurtma summasi:</span>
                      <span className="text-white">{orderToCancel.totalPrice.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Xizmat haqi:</span>
                      <span className="text-red-300">
                        -{(orderToCancel.paymentType === 'click' ? 2000 : 
                           orderToCancel.paymentType === 'payme' ? 1500 :
                           orderToCancel.paymentType === 'visa' ? 3000 : 2500).toLocaleString()} so'm
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-blue-400">Qaytariladi:</span>
                        <span className="text-blue-300">
                          {(orderToCancel.totalPrice - (
                            orderToCancel.paymentType === 'click' ? 2000 : 
                            orderToCancel.paymentType === 'payme' ? 1500 :
                            orderToCancel.paymentType === 'visa' ? 3000 : 2500
                          )).toLocaleString()} so'm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasdiq soruvi */}
              <div className="mb-6">
                <p className="text-gray-300 text-sm text-center">
                  Haqiqatan ham bu buyurtmani bekor qilishni xohlaysizmi?
                </p>
              </div>

              {/* Action tugmalari */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                  }}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingOrderId === orderToCancel.id}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {cancellingOrderId === orderToCancel.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Bekor qilinmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>🚫</span>
                      <span>Ha, bekor qilish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;