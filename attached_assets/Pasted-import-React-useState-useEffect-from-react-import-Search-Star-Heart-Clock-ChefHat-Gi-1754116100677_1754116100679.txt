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
            quantity: orderedQuantity
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
            quantity: orderedQuantity
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

    window.addEventListener('removeFromCart', handleRemoveFromCart);
    return () => window.removeEventListener('removeFromCart', handleRemoveFromCart);
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
                          : cake.amount !== undefined 
                            ? `Buyurtma qilingan: ${cake.amount} ta`
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
                            : cake.amount !== undefined 
                              ? `Buyurtma qilingan: ${cake.amount} ta`
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