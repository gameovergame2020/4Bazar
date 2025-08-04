import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Star, 
  Heart, 
  ShoppingCart, 
  Search, 
  Filter,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { dataService, Cake, Order } from '../../services/dataService';
import { UserData } from '../../services/authService';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../hooks/useAuth';
import ProductDetailModal from '../ProductDetailModal';
import { useProfileManager } from '../../hooks/useProfileManager';
import ProfileManager from '../ProfileManager';
import SettingsPage from '../SettingsPage';

const CustomerDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [productFilter, setProductFilter] = useState<'all' | 'baked' | 'ready'>('all');
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { openProfile, closeProfile } = useProfileManager(() => setShowProfile(true));
  const [selectedFavorite, setSelectedFavorite] = useState<Cake | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { 
    favorites: userFavorites, 
    favoriteIds, 
    isFavorite, 
    toggleFavorite: handleToggleFavorite, 
    loading: favoritesLoading,
    favoriteCount 
  } = useFavorites(userData?.id?.toString());

  useEffect(() => {
    if (userData) {
      loadData();

      // Real-time tortlar holatini kuzatish
      const unsubscribeCakes = dataService.subscribeToRealtimeCakes(async (updatedCakes) => {
        // Buyurtmalarni ham real-time yangilash
        const allOrders = await dataService.getOrders();

        const processedCakes = updatedCakes.filter(cake => {
          // Baker mahsulotlari - barcha holatda ko'rsatiladi
          const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
          // Shop mahsulotlari - faqat available: true bo'lganda
          const isShopProduct = cake.productType === 'ready' || (cake.shopId && !cake.bakerId);

          if (isBakerProduct) {
            return true;
          }
          if (isShopProduct) {
            return cake.available === true;
          }
          return cake.available === true;
        }).map(cake => {
          // Baker mahsulotlari uchun buyurtma qilingan miqdorni hisoblash
          if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
            // Faqat dastlab "Buyurtma uchun" yaratilgan mahsulotlar uchun buyurtma miqdorini ko'rsatish
            // "Hozir mavjud"dan "Buyurtma uchun"ga o'tgan mahsulotlarni chiqarib tashlash
            if (!cake.available && cake.quantity === undefined) {
              const orderedQuantity = allOrders
                .filter(order => 
                  order.cakeId === cake.id && 
                  !['cancelled', 'ready', 'delivering', 'delivered'].includes(order.status)
                )
                .reduce((total, order) => total + order.quantity, 0);

              return {
                ...cake,
                quantity: orderedQuantity
              };
            }
            // Available: true (hozir mavjud) yoki quantity mavjud bo'lgan mahsulotlar uchun real quantity ni saqlab qolish
            return cake;
          }

          return cake;
        });

        setCakes(processedCakes);
      });

      // Buyurtmalar holatini ham real-time kuzatish
      const unsubscribeOrders = dataService.subscribeToOrders((updatedOrders) => {
        if (userData?.id) {
          const customerOrders = updatedOrders.filter(order => 
            order.customerId === userData.id.toString()
          );
          setOrders(customerOrders);
        }
        // Buyurtmalar o'zgarganda tortlarni ham yangilash
        loadData();
      });

      return () => {
        if (typeof unsubscribeCakes === 'function') {
          unsubscribeCakes();
        }
        if (typeof unsubscribeOrders === 'function') {
          unsubscribeOrders();
        }
      };
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Barcha tortlarni yuklash
      const allCakes = await dataService.getCakes();
      console.log('Jami yuklangan tortlar:', allCakes);

      // Barcha buyurtmalarni yuklash (Baker mahsulotlari uchun buyurtma sonini hisoblash uchun)
      const allOrders = await dataService.getOrders();

      // Baker va Shop tortlarini filtrlash
      const filteredCakes = allCakes.filter(cake => {
        // Baker mahsulotlari - barcha holatda ko'rsatiladi (available: false ham)
        const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);

        // Shop mahsulotlari - faqat available: true bo'lganda
        const isShopProduct = cake.productType === 'ready' || (cake.shopId && !cake.bakerId);

        if (isBakerProduct) {
          return true; // Baker mahsulotlari doimo ko'rsatiladi
        }

        if (isShopProduct) {
          return cake.available === true; // Shop mahsulotlari faqat available bo'lganda
        }

        // Default: available bo'lganlarni ko'rsatish
        return cake.available === true;
      }).map(cake => {
          // Baker mahsulotlari uchun buyurtma qilingan miqdorni hisoblash
          if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
            // Faqat dastlab "Buyurtma uchun" yaratilgan mahsulotlar uchun buyurtma miqdorini ko'rsatish
            // "Hozir mavjud"dan "Buyurtma uchun"ga o'tgan mahsulotlarni chiqarib tashlash
            if (!cake.available && cake.quantity === undefined) {
              const orderedQuantity = allOrders
                .filter(order => 
                  order.cakeId === cake.id && 
                  !['cancelled', 'ready', 'delivering', 'delivered'].includes(order.status)
                )
                .reduce((total, order) => total + order.quantity, 0);

              return {
                ...cake,
                quantity: orderedQuantity
              };
            }
            // Available: true (hozir mavjud) yoki quantity mavjud bo'lgan mahsulotlar uchun real quantity ni saqlab qolish
            return cake;
          }

          return cake;
        });

      // Statistika uchun ajratish
      const bakerCakes = filteredCakes.filter(cake => 
        cake.productType === 'baked' || (cake.bakerId && !cake.shopId)
      );

      const shopCakes = filteredCakes.filter(cake => 
        cake.productType === 'ready' || (cake.shopId && !cake.bakerId)
      );

      console.log('Baker tortlari (barcha):', bakerCakes);
      console.log('Shop tortlari (faqat available):', shopCakes);
      console.log('Jami filtrlangan tortlar:', filteredCakes);
      console.log('Jami tortlar soni:', allCakes.length);

      setCakes(filteredCakes);

      // Customer buyurtmalarini yuklash
      if (userData?.id) {
        const customerOrders = await dataService.getOrders({ 
          customerId: userData.id.toString() 
        });
        setOrders(customerOrders);
      }

    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
      // Bo'sh array o'rnatish
      setCakes([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (cakeId: string) => {
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
    if (isBakerProduct) {
      if (cake.available && cake.quantity !== undefined && cake.quantity > 0) {
        // Baker mahsuloti mavjud va quantity belgilangan - quantity miqdorigacha cheklash
        const currentCartQty = cart[cakeId] || 0;
        console.log('Customer dashboard - Baker available product:', {
          cakeId,
          quantity: cake.quantity,
          currentCartQty,
          canAdd: currentCartQty < cake.quantity
        });

        if (currentCartQty < cake.quantity) {
          setCart(prev => ({
            ...prev,
            [cakeId]: currentCartQty + 1
          }));
        } else {
          console.log('Baker mahsulot chegarasiga yetdi:', cake.quantity);
        }
      } else {
        // Buyurtma uchun yoki cheklanmagan miqdor
        const currentCartQty = cart[cakeId] || 0;
        setCart(prev => ({
          ...prev,
          [cakeId]: currentCartQty + 1
        }));
      }
    } else if (cake.productType === 'ready') {
      const currentCartQty = cart[cakeId] || 0;
      if (cake.quantity !== undefined) {
        // Shop mahsuloti - miqdor cheklovi
        if (currentCartQty < cake.quantity) {
          setCart(prev => ({
            ...prev,
            [cakeId]: currentCartQty + 1
          }));
        }
      } else {
        // Cheklanmagan miqdor
        setCart(prev => ({
          ...prev,
          [cakeId]: currentCartQty + 1
        }));
      }
    }
  };

  const removeFromCart = (cakeId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cakeId] > 1) {
        newCart[cakeId]--;
      } else {
        delete newCart[cakeId];
      }
      return newCart;
    });
  };

  const handleFavoriteToggle = async (cake: Cake) => {
    try {
      await handleToggleFavorite(cake.id!, {
        name: cake.name,
        image: cake.image,
        price: cake.price,
        shopName: cake.productType === 'baked' ? cake.bakerName : cake.shopName
      });
    } catch (error) {
      console.error('Sevimlilar bilan ishlashda xatolik:', error);
      alert('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'accepted': return 'Qabul qilindi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return 'Yetkazilmoqda';
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return 'Noma\'lum';
    }
  };

  const getStatusColor = (status: Order['status']) => {    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'accepted': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-orange-100 text-orange-600';
      case 'ready': return 'bg-green-100 text-green-600';
      case 'delivering': return 'bg-purple-100 text-purple-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Buyurtmani bekor qilishni xohlaysizmi?')) return;

    try {
      setLoading(true);

      console.log('🚫 Foydalanuvchi buyurtmani bekor qilmoqda:', orderId);

      await dataService.cancelOrder(orderId);

      console.log('✅ Buyurtma muvaffaqiyatli bekor qilindi');

      // Real-time subscription orqali data avtomatik yangilanadi
      // Lekin qo'shimcha trigger uchun loadData chaqiramiz
      setTimeout(async () => {
        try {
          await loadData();
        } catch (loadError) {
          console.warn('⚠️ Ma\'lumotlarni qayta yuklashda xato:', loadError);
        }
      }, 1000);

      alert('Buyurtma muvaffaqiyatli bekor qilindi');
    } catch (error) {
      console.error('Buyurtmani bekor qilishda xatolik:', error);
      alert('Buyurtmani bekor qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (cake: Cake) => {
    setSelectedCake(cake);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedCake(null);
  };

  const handleRateOrder = (order: Order) => {
    setOrderToRate(order);
    setShowRatingModal(true);
    setRating(5);
    setReviewComment('');
  };

  const handleSubmitRating = async () => {
    if (!orderToRate || !userData) return;

    setSubmittingReview(true);
    try {
      // Find the cake to get more details
      const cake = cakes.find(c => c.id === orderToRate.cakeId);

      // Add review to the product
      await dataService.addReview(orderToRate.cakeId, {
        userId: userData.id!.toString(),
        userName: userData.name || 'Foydalanuvchi',
        rating: rating,
        comment: reviewComment.trim(),
        orderId: orderToRate.id
      });

      // Close modal and reset state
      setShowRatingModal(false);
      setOrderToRate(null);
      setRating(5);
      setReviewComment('');

      alert('Baho va izohingiz muvaffaqiyatli qo\'shildi!');

      // Refresh data to show updated rating
      await loadData();
    } catch (error) {
      console.error('Baho berishda xatolik:', error);
      alert('Baho berishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setOrderToRate(null);
    setRating(5);
    setReviewComment('');
  };

  const renderStars = (currentRating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={20}
              className={`${
                star <= currentRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);
  const favoriteCakes = cakes.filter(cake => isFavorite(cake.id!));
  const totalCartItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  // Filter cakes based on selected product type
  const filteredCakes = cakes.filter(cake => {
    if (productFilter === 'all') return true;
    return cake.productType === productFilter;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Xush kelibsiz, {userData?.name || 'Mijoz'}!</h2>
        <p className="text-blue-100">Eng mazali tortlarni buyurtma qiling</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-600">Buyurtmalar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Heart size={20} className="text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{favoriteCount}</p>
              <p className="text-sm text-gray-600">Sevimlilar</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600">Reyting</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingBag size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCartItems}</p>
              <p className="text-sm text-gray-600">Savatda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Oxirgi buyurtmalar</h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={24} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{order.cakeName}</h4>
                  <p className="text-sm text-gray-600">Miqdor: {order.quantity}</p>
                  <p className="text-sm text-gray-500">{order.createdAt.toLocaleDateString('uz-UZ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    {order.status === 'delivered' && !order.rated && (
                      <button
                        onClick={() => handleRateOrder(order)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-yellow-600 transition-colors flex items-center space-x-1"
                      >
                        <Star size={12} />
                        <span>Baho berish</span>
                      </button>
                    )}
                    {order.status === 'delivered' && order.rated && (
                      <div className="flex items-center space-x-1">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">Baholangan</span>
                      </div>
                    )}
                    {order.status !== 'delivered' && (
                      <div className="text-xs text-gray-400 italic">
                        Qabul qilingandan keyin baho bering
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Products */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Buyurtma uchun mavjud tortlar</h3>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setProductFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                productFilter === 'all'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setProductFilter('baked')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                productFilter === 'baked'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Baker tortlari
            </button>
            <button
              onClick={() => setProductFilter('ready')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                productFilter === 'ready'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shop tortlari
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCakes.map((cake) => {
            const discountedPrice = cake.discount ? cake.price * (1 - cake.discount / 100) : cake.price;
            const cartQuantity = cart[cake.id!] || 0;

            return (
              <div key={cake.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="relative mb-3">
                  <img 
                    src={cake.image}
                    alt={cake.name}
                    className="w-full h-32 rounded-lg object-cover cursor-pointer"
                    onClick={() => handleProductClick(cake)}
                  />
                  <button
                    onClick={() => handleFavoriteToggle(cake)}
                    disabled={favoritesLoading}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                      isFavorite(cake.id!) 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-white text-gray-400 hover:text-pink-500'
                    } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart size={16} className={isFavorite(cake.id!) ? 'fill-current' : ''} />
                  </button>
                  {cake.discount && cake.discount > 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        -{cake.discount}%
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cake.productType === 'ready' 
                        ? 'bg-green-100 text-green-600' 
                        : cake.available && cake.quantity !== undefined && cake.quantity > 0
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {cake.productType === 'ready' 
                        ? 'Mavjud' 
                        : cake.available && cake.quantity !== undefined && cake.quantity > 0
                          ? 'Hozir mavjud'
                          : 'Buyurtma uchun'
                      }
                    </span>
                  </div>
                </div>

                <h4 
                  className="font-medium text-gray-900 mb-1 cursor-pointer hover:text-orange-600 transition-colors"
                  onClick={() => handleProductClick(cake)}
                >
                  {cake.name}
                </h4>
                <p 
                  className="text-sm text-gray-600 mb-2 line-clamp-2 cursor-pointer hover:text-gray-800 transition-colors"
                  onClick={() => handleProductClick(cake)}
                >
                  {cake.description}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {cake.productType === 'baked' ? `Baker: ${cake.bakerName}` : `Shop: ${cake.shopName || 'Mahalliy do\'kon'}`}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    {cake.discount && cake.discount > 0 ? (
                      <>
                        <span className="font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
                        <span className="text-sm text-gray-500 line-through">{formatPrice(cake.price)}</span>
                      </>
                    ) : (
                      <span className="font-bold text-gray-900">{formatPrice(cake.price)}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{cake.rating}</span>
                    <span className="text-sm text-gray-500">({cake.reviewCount})</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                  {cake.productType === 'baked' 
                    ? cake.available && (cake.inStockQuantity !== undefined ? cake.inStockQuantity : cake.quantity) > 0
                      ? `Qoldi: ${cake.inStockQuantity !== undefined ? cake.inStockQuantity : cake.quantity} ta`
                      : `Buyurtma uchun: ${cake.amount || 0} ta`
                    : cake.quantity !== undefined 
                      ? `Qoldi: ${cake.quantity} ta`
                      : 'Miqdor: cheklanmagan'
                  }</p>
                </p>

                <div className="flex items-center justify-between">
                  {cartQuantity > 0 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(cake.id!)}
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-medium text-gray-900 min-w-[20px] text-center">
                        {cartQuantity}
                      </span>
                      <button
                        onClick={() => addToCart(cake.id!)}
                        disabled={
                          (cake.productType === 'baked' && cake.available &&
                          cake.quantity !== undefined &&
                          cartQuantity >= cake.quantity)
                      }
                      className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(cake.id!)}
                      disabled={
                            (cake.productType === 'ready' && 
                            cake.quantity !== undefined && 
                            cake.quantity <= 0) ||
                            (cake.productType === 'baked' && cake.available &&
                            cake.quantity !== undefined && 
                            cake.quantity <= 0)
                          }
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        cake.productType === 'baked'
                          ? cake.available && cake.quantity !== undefined && cake.quantity > 0
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {cake.productType === 'baked' 
                        ? cake.available && cake.quantity !== undefined && cake.quantity > 0
                          ? 'Savatga qo\'shish' 
                          : 'Buyurtma berish'
                        : cake.productType === 'ready' && cake.quantity !== undefined && cake.quantity <= 0 
                          ? 'Tugadi' 
                          : 'Savatga'
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredCakes.length === 0 && (
          <div className="text-center py-8">
            <ShoppingBag size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {productFilter === 'all' 
                ? 'Hozircha tortlar mavjud emas'
                : productFilter === 'baked'
                ? 'Baker tortlari mavjud emas'
                : 'Shop tortlari mavjud emas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Favorites */}
      {favoriteCakes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sevimli tortlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteCakes.map((cake) => {
              const discountedPrice = cake.discount ? cake.price * (1 - cake.discount / 100) : cake.price;

              return (
                <div key={cake.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <img 
                    src={cake.image}
                    alt={cake.name}
                    className="w-full h-32 rounded-lg object-cover mb-3 cursor-pointer"
                    onClick={() => handleProductClick(cake)}
                  />
                  <h4 
                    className="font-medium text-gray-900 mb-1 cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => handleProductClick(cake)}
                  >
                    {cake.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {cake.productType === 'baked' ? `Baker: ${cake.bakerName}` : `Shop: ${cake.shopName || 'Mahalliy do\'kon'}`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
                    <button
                      onClick={() => addToCart(cake.id!)}
                      className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      Savatga
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-4 right-4 bg-orange-500 text-white p-4 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ShoppingBag size={20} />
              <span className="font-medium">{totalCartItems} ta mahsulot</span>
            </div>
            <button
              onClick={() => {
                // Checkout sahifasiga o'tish logikasi
                console.log('Checkout:', cart);
              }}
              className="bg-white text-orange-500 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Ko'rish
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        cake={selectedCake}
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onToggleFavorite={handleFavoriteToggle}
        cartQuantity={selectedCake ? cart[selectedCake.id!] || 0 : 0}
        isFavorite={selectedCake ? isFavorite(selectedCake.id!) : false}
        favoritesLoading={favoritesLoading}
      />

      {/* Rating Modal */}
      {showRatingModal && orderToRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mahsulotni baholang</h3>
              <p className="text-gray-600">{orderToRate.cakeName}</p>
            </div>

            {/* Rating Stars */}
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Bahongizni bering:</p>
              {renderStars(rating, true, setRating)}
            </div>

            {/* Review Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Izohingiz (ixtiyoriy)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Mahsulot haqida fikringizni yozing..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewComment.length}/500 belgi
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCloseRatingModal}
                disabled={submittingReview}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingReview}
                className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submittingReview ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Star size={16} />
                    <span>Baho berish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
       {showProfile && (
        <ProfileManager onClose={closeProfile} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SettingsPage user={userData} onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;