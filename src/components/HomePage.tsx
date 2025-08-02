import React, { useState, useEffect } from 'react';
import { Search, Star, Heart, Clock, ChefHat, Gift, Cake, Cookie, ShoppingCart, Plus, Minus, ShoppingBasket } from 'lucide-react';
import { dataService, Cake as CakeType } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';
import CheckoutPage from './CheckoutPage';

const HomePage = () => {
  const { userData, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hammasi');
  const [cakes, setCakes] = useState<CakeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [currentView, setCurrentView] = useState<'home' | 'checkout'>('home');
  const [filteredCakes, setFilteredCakes] = useState<CakeType[]>([]);

  const categories = [
    { name: 'Hammasi', icon: Cake, value: '' },
    { name: "Tug'ilgan kun", icon: Gift, value: 'birthday' },
    { name: 'Nikoh', icon: Heart, value: 'wedding' },
    { name: 'Cupcake', icon: Cookie, value: 'cupcake' },
    { name: 'Cheesecake', icon: ChefHat, value: 'cheesecake' },
  ];

  useEffect(() => {
    loadCakes();
  }, [selectedCategory]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, cakes]);

  const loadCakes = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = { 
        // Bosh sahifada barcha mahsulotlar ko'rsatiladi (baker va shop)
        // Baker mahsulotlari available: false bo'lsa ham ko'rsatiladi
      };
      if (selectedCategory !== 'Hammasi') {
        const category = categories.find(cat => cat.name === selectedCategory);
        if (category?.value) {
          filters.category = category.value;
        }
      }

      const cakesData = await dataService.getCakes(filters);

      // Barcha buyurtmalarni yuklash (Baker mahsulotlari uchun buyurtma sonini hisoblash uchun)
      const allOrders = await dataService.getOrders();

      // Filtrlash: faqat available tortlar yoki Baker mahsulotlari
      const filteredCakes = cakesData.filter(cake => {
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
          const orderedQuantity = allOrders
            .filter(order => 
              order.cakeId === cake.id && 
              !['cancelled', 'ready', 'delivering', 'delivered'].includes(order.status)
            )
            .reduce((total, order) => total + order.quantity, 0);

          return {
            ...cake,
            orderedQuantity: orderedQuantity
          };
        }

        return cake;
      });

      setCakes(filteredCakes);
      if (!searchQuery) {
        setFilteredCakes(filteredCakes);
      }
    } catch (err) {
      console.error('Tortlarni yuklashda xatolik:', err);
      setError('Tortlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCakes();

    // Real-time tortlar va buyurtmalar holatini kuzatish
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
          const orderedQuantity = allOrders
            .filter(order => 
              order.cakeId === cake.id && 
              !['cancelled', 'ready', 'delivering', 'delivered'].includes(order.status)
            )
            .reduce((total, order) => total + order.quantity, 0);

          return {
            ...cake,
            orderedQuantity: orderedQuantity
          };
        }
        return cake;
      });

      setCakes(processedCakes);
      setFilteredCakes(processedCakes);
    });

    // Buyurtmalar holatini ham kuzatish
    const unsubscribeOrders = dataService.subscribeToOrders(async () => {
      // Buyurtmalar o'zgarganda tortlarni qayta yuklash
      loadCakes();
    });

    return () => {
      if (typeof unsubscribeCakes === 'function') {
        unsubscribeCakes();
      }
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
    };
  }, []);

  const handleSearch = (query: string) => {
    if (query) {
        setFilteredCakes(cakes.filter(cake =>
            cake.name.toLowerCase().includes(query.toLowerCase()) ||
            cake.description.toLowerCase().includes(query.toLowerCase()) ||
            cake.bakerName.toLowerCase().includes(query.toLowerCase()) ||
            (cake.shopName && cake.shopName.toLowerCase().includes(query.toLowerCase()))
        ));
    } else {
        setFilteredCakes(cakes);
    }
  };

  const recommendedCakes = filteredCakes.slice(0, 6);
  const topRatedCakes = filteredCakes
    .filter(cake => cake.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

const addToCart = (cakeId: string) => {
    console.log('Adding to cart:', cakeId);
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    // Baker mahsulotlari uchun
    const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
    if (isBakerProduct) {
      // Agar mavjud bo'lsa va quantity belgilangan bo'lsa, qoldiq miqdorigacha cheklash
      if (cake.available && cake.quantity !== undefined) {
        const currentCartQty = cart[cakeId] || 0;
        if (currentCartQty < cake.quantity) {
          setCart(prev => {
            const newCart = {
              ...prev,
              [cakeId]: currentCartQty + 1
            };
            console.log('New cart state:', newCart);
            return newCart;
          });
        }
      } else {
        // Buyurtma uchun yoki cheklanmagan miqdor
        setCart(prev => {
          const newCart = {
            ...prev,
            [cakeId]: (prev[cakeId] || 0) + 1
          };
          console.log('New cart state:', newCart);
          return newCart;
        });
      }
      return;
    }

    // Shop mahsulotlari uchun miqdor cheklovi
    if (cake.productType === 'ready' && cake.quantity !== undefined) {
      const currentCartQty = cart[cakeId] || 0;
      if (currentCartQty < cake.quantity) {
        setCart(prev => {
          const newCart = {
            ...prev,
            [cakeId]: currentCartQty + 1
          };
          console.log('New cart state:', newCart);
          return newCart;
        });
      }
    } else {
      setCart(prev => {
        const newCart = {
          ...prev,
          [cakeId]: (prev[cakeId] || 0) + 1
        };
        console.log('New cart state:', newCart);
        return newCart;
      });
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

  const getCartQuantity = (cakeId: string) => cart[cakeId] || 0;

  const clearCart = () => {
    setCart({});
  };

  const handleCheckout = () => {
    console.log('Checkout clicked, cart:', cart, 'keys length:', Object.keys(cart).length);

    // Avval tizimga kirganligini tekshirish
    if (!isAuthenticated) {
      alert('Buyurtma berish uchun avval tizimga kirishingiz kerak!');
      // Login sahifasiga yo'naltirish (kerak bo'lsa)
      return;
    }

    if (Object.keys(cart).length > 0) {
      console.log('Switching to checkout view');
      // Force React to re-render by temporarily changing view
      setCurrentView('home');
      setTimeout(() => {
        setCurrentView('checkout');
        console.log('View switched to checkout');
      }, 50);
    } else {
      console.log('Cart is empty, not showing checkout');
      alert('Savat bo\'sh! Avval mahsulot qo\'shing.');
    }
  };

  const handleBackFromCheckout = () => {
    setCurrentView('home');
  };

  const handleOrderComplete = () => {
    clearCart();
    setCurrentView('home');
  };

  // Handle remove from cart event
  useEffect(() => {
    const handleRemoveFromCart = (event: any) => {
      const { cakeId } = event.detail;
      const newCart = { ...cart };
      delete newCart[cakeId];
      setCart(newCart);
    };

    const handleRemoveFromCartCompletely = (event: any) => {
      const { cakeId } = event.detail;
      const newCart = { ...cart };
      delete newCart[cakeId];
      setCart(newCart);
    };

    window.addEventListener('removeFromCart', handleRemoveFromCart);
    window.addEventListener('removeFromCartCompletely', handleRemoveFromCartCompletely);

    return () => {
      window.removeEventListener('removeFromCart', handleRemoveFromCart);
      window.removeEventListener('removeFromCartCompletely', handleRemoveFromCartCompletely);
    };
  }, [cart]);

  const formatPrice = (price: number, discount?: number) => {
    const discountedPrice = discount ? price * (1 - discount / 100) : price;
    return new Intl.NumberFormat('uz-UZ').format(discountedPrice) + ' so\'m';
  };

  const getOriginalPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (loading && cakes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Tortlar yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadCakes}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  console.log('Render: currentView =', currentView, 'cart keys:', Object.keys(cart).length);

  // CheckoutPage'ni ko'rsatish
  if (currentView === 'checkout') {
    console.log('Rendering CheckoutPage with cart:', cart);
    return (
      <div key="checkout-page" className="min-h-screen">
        <CheckoutPage
          cart={cart}
          cakes={cakes}
          onBack={handleBackFromCheckout}
          onOrderComplete={handleOrderComplete}
          removeFromCart={removeFromCart}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-6">
      {/* Promotional Banner */}
      <div className="relative bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Eng mazali tortlar!</h2>
          <p className="text-orange-100 mb-3 sm:mb-4 text-sm sm:text-base">Professional oshpazlarimizdan buyurtma qiling</p>
          <button className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base">
            Hoziroq buyurtma bering
          </button>
        </div>
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
        <div className="absolute bottom-0 right-4 sm:right-8 w-16 sm:w-20 h-16 sm:h-20 bg-white/5 rounded-full"></div>
      </div>

      {/* Search Panel */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3">
          <Search size={18} className="text-gray-400 mr-2 sm:mr-3" />
          <input
            type="text"
            placeholder="Tort nomi, tavsif yoki oshpaz ismini qidiring..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Kategoriyalar</h3>
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full whitespace-nowrap transition-all text-sm sm:text-base ${
                  selectedCategory === category.name
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-100'
                }`}
              >
                <IconComponent size={16} />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Recommended Cakes */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Tavsiya etilgan tortlar
          {loading && <span className="ml-2 text-sm text-gray-500">(Yuklanmoqda...)</span>}
        </h3>

        {recommendedCakes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommendedCakes.map((cake) => (
              <div key={cake.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={cake.image} 
                    alt={cake.name}
                    className="w-full h-40 sm:h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                  <button className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                    <Heart size={16} className="text-gray-600" />
                  </button>
                  {cake.discount && cake.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      -{cake.discount}%
                    </div>
                  )}
                  {cake.productType === 'ready' && !cake.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">Tugagan</span>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{cake.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {cake.productType === 'baked' ? `Oshpaz: ${cake.bakerName}` : `Do'kon: ${cake.shopName}`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{cake.description}</p>

                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{cake.rating}</span>
                      <span className="text-xs sm:text-sm text-gray-500">({cake.reviewCount})</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {cake.productType === 'baked' 
                        ? cake.available
                          ? cake.quantity !== undefined 
                            ? `Qoldi: ${cake.quantity} ta`
                            : 'Miqdor: cheklanmagan'
                          : (cake as any).orderedQuantity !== undefined 
                            ? `Buyurtma qilingan: ${(cake as any).orderedQuantity} ta`
                            : 'Buyurtma yo\'q'
                        : cake.quantity !== undefined 
                          ? `Qoldi: ${cake.quantity} ta`
                          : 'Miqdor: cheklanmagan'
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm sm:text-lg font-bold text-gray-900">
                        {formatPrice(cake.price, cake.discount)}
                      </span>
                      {cake.discount && cake.discount > 0 && (
                        <span className="text-xs text-gray-500 line-through ml-2">
                          {getOriginalPrice(cake.price)}
                        </span>
                      )}
                    </div>

                    {getCartQuantity(cake.id!) > 0 ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(cake.id!)}
                          className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-medium text-gray-900">{getCartQuantity(cake.id!)}</span>
                        <button
                          onClick={() => addToCart(cake.id!)}
                          disabled={
                            (cake.productType === 'ready' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity) ||
                            (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity)
                          }
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          ((cake.productType === 'ready' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity) ||
                           (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(cake.id!)}
                        disabled={
                          cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                        }
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm flex items-center space-x-1 ${
                          cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : cake.productType === 'baked'
                              ? cake.available 
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        <ShoppingBasket size={14} />
                        <span>
                          {cake.productType === 'baked' ? 
                            cake.available ? 'Savatga qo\'shish' : 'Buyurtma berish'
                            : cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                              ? 'Tugagan' 
                              : 'Savatchaga qo\'shish'
                          }
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Cake size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'Qidiruv bo\'yicha tortlar topilmadi' : 'Hozircha tortlar mavjud emas'}
            </p>
          </div>
        )}
      </div>

      {/* Top Rated Cakes */}
      {topRatedCakes.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reytingi yuqori tortlar</h3>
          <div className="space-y-3 sm:space-y-4">
            {topRatedCakes.map((cake) => (
              <div key={cake.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative">
                    <img 
                      src={cake.image} 
                      alt={cake.name}
                      className="w-16 sm:w-20 h-16 sm:h-20 rounded-lg sm:rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=150';
                      }}
                    />
                    {cake.discount && cake.discount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs font-medium">
                        -{cake.discount}%
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{cake.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      {cake.productType === 'baked' ? `Oshpaz: ${cake.bakerName}` : `Do'kon: ${cake.shopName}`}
                    </p>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{cake.rating}</span>
                        <span className="text-xs sm:text-sm text-gray-500">({cake.reviewCount} sharh)</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {cake.productType === 'baked' 
                          ? cake.available
                            ? cake.quantity !== undefined 
                              ? `Qoldi: ${cake.quantity} ta`
                              : 'Miqdor: cheklanmagan'
                            : (cake as any).orderedQuantity !== undefined 
                              ? `Buyurtma qilingan: ${(cake as any).orderedQuantity} ta`
                              : 'Buyurtma yo\'q'
                          : cake.quantity !== undefined 
                            ? `Qoldi: ${cake.quantity} ta`
                            : 'Miqdor: cheklanmagan'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 sm:mb-2">
                      <p className="text-sm sm:text-lg font-bold text-gray-900">
                        {formatPrice(cake.price, cake.discount)}
                      </p>
                      {cake.discount && cake.discount > 0 && (
                        <p className="text-xs text-gray-500 line-through">
                          {getOriginalPrice(cake.price)}
                        </p>
                      )}
                    </div>

                    {getCartQuantity(cake.id!) > 0 ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => removeFromCart(cake.id!)}
                          className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium text-gray-900 min-w-[20px] text-center">
                          {getCartQuantity(cake.id!)}
                        </span>
                        <button
                           onClick={() => addToCart(cake.id!)}
                          disabled={
                            (cake.productType === 'ready' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity) ||
                            (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity)
                          }
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            ((cake.productType === 'ready' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity) ||
                             (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && getCartQuantity(cake.id!) >= cake.quantity))
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(cake.id!)}
                        disabled={
                          cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                        }
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm flex items-center space-x-1 ${
                          cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : cake.productType === 'baked'
                              ? cake.available 
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        <ShoppingBasket size={14} />
                        <span className="hidden sm:inline">
                          {cake.productType === 'baked' ? 
                            cake.available ? 'Savatga' : 'Buyurtma'
                            : cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                              ? 'Tugagan' 
                              : 'Savatchaga'
                          }
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Icon */}
      {Object.keys(cart).length > 0 && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
handleCheckout();
          }}
          className="fixed bottom-6 right-4 z-[9999] bg-orange-500 text-white rounded-full p-3 shadow-lg hover:bg-orange-600 transition-colors focus:outline-none"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default HomePage;
```

```
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { userData, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.id) {
        console.warn("Foydalanuvchi IDsi topilmadi.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/orders?customerId=${userData.id}`);
        if (!response.ok) {
          throw new Error(`HTTP xato! status: ${response.status}`);
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && userData) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userData]);

  if (!isAuthenticated) {
    return <p>Iltimos, avtorizatsiyadan o'ting.</p>;
  }

  if (loading) {
    return <p>Buyurtmalar yuklanmoqda...</p>;
  }

  if (error) {
    return <p>Xatolik yuz berdi: {error}</p>;
  }

  return (
    <div>
      <h2>Sizning buyurtmalaringiz</h2>
      {orders.length > 0 ? (
        <ul>
          {orders.map(order => (
            <li key={order.id}>
              Buyurtma ID: {order.id}, Sana: {order.orderDate}, Miqdor: {order.totalAmount}
            </li>
          ))}
        </ul>
      ) : (
        <p>Sizda buyurtmalar yo'q.</p>
      )}
    </div>
  );
};

export default ProfilePage;
```

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextProps {
  user: any;
  setUser: (user: any) => void;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  userData: any;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Store user data separately

  // Foydalanuvchi ma'lumotlarini localStorage dan yuklash
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('✅ Foydalanuvchi ma\'lumotlari localStorage dan yuklandi:', userData);

        // Agar user ID mavjud bo'lmasa, yaratish
        let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!userId && userData.phone) {
          const normalizedPhone = userData.phone.replace(/\D/g, '');
          userId = `customer_${normalizedPhone}_${Date.now()}`;
          localStorage.setItem('userId', userId);
          sessionStorage.setItem('userId', userId);

          // User object ga ID qo'shish
          userData.id = userId;
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setUser(userData);

          console.log('🆔 User uchun yangi ID yaratildi:', userId);
        } else if (userId && !userData.id) {
          // Agar ID mavjud bo'lsa, lekin user object da yo'q bo'lsa
          userData.id = userId;
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setUser(userData);
          console.log('🔗 Mavjud ID user object ga bog\'landi:', userId);
        }

      } catch (error) {
        console.error('❌ Foydalanuvchi ma\'lumotlarini parse qilishda xato:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      setUserData(user); // Set user data when user changes
    }
  }, [user]);

  const login = (userData: any) => {
    setUser(userData);
    setUserData(userData); // Set user data on login
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setUserData(null); // Clear user data on logout
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
  };

  const isAuthenticated = !!user;

  const value: AuthContextProps = {
    user,
    setUser,
    isAuthenticated,
    login,
    logout,
    userData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

```

```typescript
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

const CheckoutPage = ({ cart, cakes, onBack, onOrderComplete, removeFromCart }) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value,
    });
  };

  const calculateTotal = () => {
    let total = 0;
    for (const cakeId in cart) {
      const cake = cakes.find(c => c.id === cakeId);
      if (cake) {
        total += cake.price * cart[cakeId];
      }
    }
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get user ID from localStorage or sessionStorage
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
      alert('Foydalanuvchi identifikatori topilmadi. Iltimos, qaytadan kiring.');
      return;
    }

    const orderItems = Object.keys(cart).map(cakeId => {
      const cake = cakes.find(c => c.id === cakeId);
      return {
        cakeId: cakeId,
        quantity: cart[cakeId],
        price: cake.price,
      };
    });

    const orderData = {
      customerId: userId, // Use the retrieved user ID
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerAddress: customerInfo.address,
      items: orderItems,
      totalAmount: calculateTotal(),
      orderDate: new Date().toISOString(),
      status: 'pending',
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert('Buyurtma qabul qilindi!');
        onOrderComplete();
      } else {
        alert('Buyurtma berishda xatolik yuz berdi.');
      }
    } catch (error) {
      console.error('Buyurtma berishda xatolik:', error);
      alert('Buyurtma berishda xatolik yuz berdi.');
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Buyurtma rasmiylashtirish</h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Ism Familya:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={customerInfo.name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
            Telefon raqam:
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customerInfo.phone}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
            Manzil:
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={customerInfo.address}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <h3 className="text-xl font-semibold mb-3">Savatdagi mahsulotlar:</h3>
        {Object.keys(cart).length > 0 ? (
          <ul>
            {Object.keys(cart).map(cakeId => {
              const cake = cakes.find(c => c.id === cakeId);
              return (
                <li key={cakeId} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span>{cake?.name}</span>
                  <div className="flex items-center">
                    <span className="mr-2">Miqdori: {cart[cakeId]}</span>
                    <span className="font-semibold">Jami: {cake?.price * cart[cakeId]} so'm</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Savat bo'sh.</p>
        )}

        <div className="font-bold text-lg mt-4">
          Jami summa: {calculateTotal()} so'm
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Orqaga
          </button>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Buyurtma berish
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
```

```typescript
// DataService.ts
const API_BASE_URL = 'http://localhost:3000';

class DataService {
    private cakes: any[] = [];
    private orders: any[] = [];
    private cakesListeners: ((cakes: any[]) => void)[] = [];
    private ordersListeners: (() => void)[] = [];

    constructor() {
        this.loadInitialData();
    }

    private async loadInitialData() {
        try {
            this.cakes = await this.fetchCakes();
            this.orders = await this.fetchOrders();
        } catch (error) {
            console.error("Failed to load initial data:", error);
        }
    }

    async getCakes(filters: any = {}) {
        let url = `${API_BASE_URL}/cakes`;
        const params = new URLSearchParams();
    
        Object.keys(filters).forEach(key => {
            params.append(key, filters[key]);
        });
    
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
    
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching cakes:", error);
            throw error;
        }
    }

    async getCake(id: string): Promise<Cake | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/cakes/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching cake:", error);
            return null;
        }
    }

    async addCake(cakeData: any) {
        try {
            const response = await fetch(`${API_BASE_URL}/cakes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cakeData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newCake = await response.json();
            this.cakes.push(newCake);
            this.notifyCakesListeners();
            return newCake;
        } catch (error) {
            console.error("Error adding cake:", error);
            throw error;
        }
    }

    async updateCake(id: string, cakeData: any) {
        try {
            const response = await fetch(`${API_BASE_URL}/cakes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cakeData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedCake = await response.json();
            this.cakes = this.cakes.map(cake => cake.id === id ? updatedCake : cake);
            this.notifyCakesListeners();
            return updatedCake;
        } catch (error) {
            console.error("Error updating cake:", error);
            throw error;
        }
    }

    async deleteCake(id: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/cakes/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.cakes = this.cakes.filter(cake => cake.id !== id);
            this.notifyCakesListeners();
        } catch (error) {
            console.error("Error deleting cake:", error);
            throw error;
        }
    }

    async getOrders(filters: any = {}) {
        let url = `${API_BASE_URL}/orders`;
        const params = new URLSearchParams();

        Object.keys(filters).forEach(key => {
            params.append(key, filters[key]);
        });

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    }

    async getOrder(id: string): Promise<Order | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching order:", error);
            return null;
        }
    }

    async addOrder(orderData: any) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newOrder = await response.json();
            this.orders.push(newOrder);
            this.notifyOrdersListeners();
            return newOrder;
        } catch (error) {
            console.error("Error adding order:", error);
            throw error;
        }
    }

    async updateOrder(id: string, orderData: any) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedOrder = await response.json();
            this.orders = this.orders.map(order => order.id === id ? updatedOrder : order);
            this.notifyOrdersListeners();
            return updatedOrder;
        } catch (error) {
            console.error("Error updating order:", error);
            throw error;
        }
    }

    async deleteOrder(id: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.orders = this.orders.filter(order => order.id !== id);
            this.notifyOrdersListeners();
        } catch (error) {
            console.error("Error deleting order:", error);
            throw error;
        }
    }

    subscribeToRealtimeCakes(listener: (cakes: any[]) => void) {
        this.cakesListeners.push(listener);
        listener(this.cakes);
        return () => {
            this.cakesListeners = this.cakesListeners.filter(l => l !== listener);
        };
    }

    subscribeToOrders(listener: () => void) {
        this.ordersListeners.push(listener);
        listener();
        return () => {
            this.ordersListeners = this.ordersListeners.filter(l => l !== listener);
        };
    }

    private async fetchCakes() {
        try {
            const response = await fetch(`${API_BASE_URL}/cakes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching cakes:", error);
            throw error;
        }
    }

    private async fetchOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    }

    private notifyCakesListeners() {
        this.cakesListeners.forEach(listener => listener([...this.cakes]));
    }

    private notifyOrdersListeners() {
        this.ordersListeners.forEach(listener => listener());
    }
}

export const dataService = new DataService();

// Types
export interface Cake {
    id?: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    rating: number;
    reviewCount: number;
    available: boolean;
    quantity?: number;
    discount?: number;
    productType: string;
    bakerId?: string;
    shopId?: string;
    bakerName?: string;
    shopName?: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: OrderItem[];
    totalAmount: number;
    orderDate: string;
    status: string;
}

export interface OrderItem {
    cakeId: string;
    quantity: number;
    price: number;
}
```

```typescript
import React from 'react';
import { AuthProvider } from './src/hooks/useAuth';
import HomePage from './src/pages/HomePage';
import ProfilePage from './src/pages/ProfilePage';
import LoginPage from './src/pages/LoginPage';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <nav className="bg-gray-100 p-4">
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="hover:text-gray-500">Bosh sahifa</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-gray-500">Profil</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gray-500">Kirish</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

```typescript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Phone raqamni tekshirish
    if (!phone) {
      alert('Telefon raqamingizni kiriting');
      return;
    }

    // Parolni tekshirish
    if (!password) {
      alert('Parolni kiriting');
      return;
    }

    // Foydalanuvchi ma'lumotlarini tekshirish
    const userData = {
      phone: phone,
      password: password,
    };

    // Tizimga kirish
    login(userData);
    alert('Siz tizimga muvaffaqiyatli kirdingiz!');
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="block text-gray-700 text-sm font-bold mb-2">Tizimga kirish</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              Telefon raqam
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="phone"
              type="tel"
              placeholder="Telefon raqamingizni kiriting"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Parol
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Tizimga kirish
            </button>
            <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
              Parolni unutdingizmi?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;