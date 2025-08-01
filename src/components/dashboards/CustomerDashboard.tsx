import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Clock, Star, Gift, Truck, Plus, Minus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dataService, Cake, Order } from '../../services/dataService';

const CustomerDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<'all' | 'baked' | 'ready'>('all');

  useEffect(() => {
    if (userData) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Barcha tortlarni yuklash
      const allCakes = await dataService.getCakes();
      console.log('Jami yuklangan tortlar:', allCakes);

      // Baker va Shop tortlarini ajratish
      const bakerCakes = allCakes.filter(cake => 
        cake.productType === 'baked' || (cake.bakerId && !cake.shopId)
      );
      const shopCakes = allCakes.filter(cake => 
        cake.productType === 'ready' || (cake.shopId && !cake.bakerId)
      );
      const otherCakes = allCakes.filter(cake => 
        !bakerCakes.includes(cake) && !shopCakes.includes(cake)
      );
      
      console.log('Baker tortlari:', bakerCakes);
      console.log('Shop tortlari:', shopCakes);
      console.log('Boshqa tortlar:', otherCakes);
      console.log('Jami tortlar soni:', allCakes.length);
      
      setCakes(allCakes);

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
    setCart(prev => ({
      ...prev,
      [cakeId]: (prev[cakeId] || 0) + 1
    }));
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

  const toggleFavorite = (cakeId: string) => {
    setFavorites(prev => 
      prev.includes(cakeId) 
        ? prev.filter(id => id !== cakeId)
        : [...prev, cakeId]
    );
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
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
  const favoriteCakes = cakes.filter(cake => favorites.includes(cake.id!));
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
              <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
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
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
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
                    className="w-full h-32 rounded-lg object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(cake.id!)}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                      favorites.includes(cake.id!) 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-white text-gray-400 hover:text-pink-500'
                    }`}
                  >
                    <Heart size={16} className={favorites.includes(cake.id!) ? 'fill-current' : ''} />
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
                      cake.productType === 'ready' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {cake.productType === 'ready' ? 'Mavjud' : 'Buyurtma uchun'}
                    </span>
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-1">{cake.name}</h4>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{cake.description}</p>
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

                {cake.productType === 'ready' && cake.quantity !== undefined && cake.quantity <= 5 && cake.quantity > 0 && (
                  <p className="text-xs text-orange-600 mb-2">
                    Faqat {cake.quantity} ta qoldi!
                  </p>
                )}

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
                        disabled={cake.productType === 'ready' && cake.quantity !== undefined && cartQuantity >= cake.quantity}
                        className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(cake.id!)}
                      disabled={cake.productType === 'ready' && cake.quantity !== undefined && cake.quantity === 0}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Baker mahsulotlari uchun doimo "Buyurtma berish" */}
                      {cake.productType === 'baked' 
                        ? 'Buyurtma berish'
                        : cake.productType === 'ready' && cake.quantity !== undefined && cake.quantity === 0 
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
                    className="w-full h-32 rounded-lg object-cover mb-3"
                  />
                  <h4 className="font-medium text-gray-900 mb-1">{cake.name}</h4>
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
    </div>
  );
};

export default CustomerDashboard;