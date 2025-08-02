
import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { getUserOrders, cancelOrder } from '../services/dataService';

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

interface Order {
  id: string;
  cakeName: string;
  restaurant: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryAddress: string;
  paymentMethod: 'card' | 'cash';
  paymentType?: 'click' | 'payme' | 'visa';
  phone: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

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

  useEffect(() => {
    let isActive = true;
    let loadingTimeout: NodeJS.Timeout;
    let unsubscribe: (() => void) | undefined;

    const loadOrders = async () => {
      try {
        setLoading(true);
        
        loadingTimeout = setTimeout(() => {
          if (isActive) {
            setLoading(false);
          }
        }, 2000);

        const userOrders = await getUserOrders(user.id.toString());
        
        if (isActive) {
          clearTimeout(loadingTimeout);
          setOrders(userOrders);
          setLoading(false);
        }
      } catch (error) {
        console.error('Buyurtmalarni yuklashda xato:', error);
        if (isActive) {
          clearTimeout(loadingTimeout);
          setOrders([]);
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isActive = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user.id]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'confirmed': return 'text-blue-400 bg-blue-400/10';
      case 'preparing': return 'text-orange-400 bg-orange-400/10';
      case 'ready': return 'text-green-400 bg-green-400/10';
      case 'delivered': return 'text-green-400 bg-green-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'confirmed': return 'Tasdiqlangan';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivered': return 'Yetkazilgan';
      case 'cancelled': return 'Bekor qilingan';
      default: return 'Noma\'lum';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'preparing': return <Loader className="w-3 h-3 animate-spin" />;
      case 'ready': return <Package className="w-3 h-3" />;
      case 'delivered': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const canCancelOrder = (status: Order['status']) => {
    return ['pending', 'confirmed'].includes(status);
  };

  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrderId(orderToCancel.id);
      await cancelOrder(orderToCancel.id);
      
      setOrders(prev => prev.map(order => 
        order.id === orderToCancel.id 
          ? { ...order, status: 'cancelled' as const }
          : order
      ));
      
      setShowCancelModal(false);
      setOrderToCancel(null);
    } catch (error) {
      console.error('Buyurtmani bekor qilishda xato:', error);
    } finally {
      setCancellingOrderId(null);
    }
  };

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
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-400 text-sm">Buyurtmalar yuklanmoqda...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-400 text-sm">Hozircha buyurtmalar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-3 sm:p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm sm:text-base">{order.cakeName}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{order.restaurant}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusText(order.status)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-orange-400 font-medium">{order.totalPrice.toLocaleString()} so'm</span>
                    <span className="text-gray-400">{new Date(order.orderDate).toLocaleDateString('uz-UZ')}</span>
                  </div>

                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => handleCancelClick(order)}
                      className="mt-2 w-full py-2 px-3 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors border border-red-500/30"
                    >
                      Buyurtmani bekor qilish
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Items */}
        <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-colors duration-300 bg-gray-800/90 border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Sevimli tortlar</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {favoriteItems.map((cake) => (
                <div key={cake.id} className="relative group">
                  <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 border border-gray-600 hover:border-orange-400/50 transition-colors">
                    <div className="aspect-square bg-gray-600 rounded-lg mb-2 overflow-hidden">
                      <img 
                        src={cake.image} 
                        alt={cake.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-start justify-between">
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
                </div>
              ))}
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
