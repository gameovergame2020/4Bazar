import React, { useState, useEffect } from 'react';
import { dataService, Cake as CakeType } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useProfileManager } from '../hooks/useProfileManager';
import CheckoutPage from './CheckoutPage';
import ProductDetailModal from './ProductDetailModal';
import BakerProfile from './BakerProfile';
import ProfileManager from './ProfileManager';
import HeroBanner from './home/HeroBanner';
import SearchPanel from './home/SearchPanel';
import CategoriesSection from './home/CategoriesSection';
import ProductList from './home/ProductList';
import TopRatedList from './home/TopRatedList';
import CartModal from './home/CartModal';
import FloatingCartButton from './home/FloatingCartButton';

const HomePage = () => {
  const { userData, isAuthenticated, updateUser } = useAuth();
  const { 
    favoriteIds, 
    isFavorite, 
    toggleFavorite, 
    loadFavorites,
    loading: favoritesLoading 
  } = useFavorites(userData?.id?.toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hammasi');
  const [cakes, setCakes] = useState<CakeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [currentView, setCurrentView] = useState<'home' | 'checkout'>('home');
  const [filteredCakes, setFilteredCakes] = useState<CakeType[]>([]);
  const [selectedCake, setSelectedCake] = useState<CakeType | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [showBakerProfile, setShowBakerProfile] = useState(false);
  const [selectedBakerId, setSelectedBakerId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const { showProfile, profileType, openProfile, closeProfile } = useProfileManager();

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

      const filters: any = {};
      if (selectedCategory !== 'Hammasi') {
        const categories = [
          { name: 'Hammasi', value: '' },
          { name: "Tug'ilgan kun", value: 'birthday' },
          { name: 'Nikoh', value: 'wedding' },
          { name: 'Cupcake', value: 'cupcake' },
          { name: 'Cheesecake', value: 'cheesecake' },
        ];
        const category = categories.find(cat => cat.name === selectedCategory);
        if (category?.value) {
          filters.category = category.value;
        }
      }

      const cakesData = await dataService.getCakes(filters);
      const allOrders = await dataService.getOrders();

      const filteredCakes = cakesData.filter(cake => {
        const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
        const isShopProduct = cake.productType === 'ready' || (cake.shopId && !cake.bakerId);

        if (isBakerProduct) {
          return true;
        }
        if (isShopProduct) {
          return cake.available === true;
        }
        return cake.available === true;
      }).map(cake => {
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

    const unsubscribeCakes = dataService.subscribeToRealtimeCakes(async (updatedCakes) => {
      console.log('🔄 Real-time cakes yangilandi:', updatedCakes.length, 'ta mahsulot');

      const allOrders = await dataService.getOrders();
      console.log('📋 Fresh orders:', allOrders.length, 'ta buyurtma');

      const processedCakes = updatedCakes.filter(cake => {
        const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
        const isShopProduct = cake.productType === 'ready' || (cake.shopId && !cake.bakerId);

        if (isBakerProduct) {
          console.log(`🔍 Baker mahsulot: ${cake.name} - available: ${cake.available}, quantity: ${cake.quantity}`);

          if (cake.available === true && (cake.quantity || 0) > 0) {
            console.log(`✅ Baker mahsuloti "Hozir mavjud": ${cake.name}`);
          } else {
            console.log(`📋 Baker mahsuloti "Buyurtma uchun": ${cake.name}`);
          }

          return true;
        }
        if (isShopProduct) {
          return cake.available === true;
        }
        return cake.available === true;
      }).map(cake => {
        if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
          const orderedQuantity = allOrders
            .filter(order => 
              order.cakeId === cake.id && 
              !['cancelled', 'ready', 'delivering', 'delivered'].includes(order.status)
            )
            .reduce((total, order) => total + order.quantity, 0);

          console.log(`📦 ${cake.name}: available=${cake.available}, quantity=${cake.quantity}, orderedQuantity=${orderedQuantity}`);

          return {
            ...cake,
            orderedQuantity: orderedQuantity
          };
        }
        return cake;
      });

      console.log('✅ Processed cakes:', processedCakes.length, 'ta mahsulot');
      setCakes(processedCakes);
      if (!searchQuery) {
        setFilteredCakes(processedCakes);
      }
    });

    const unsubscribeOrders = dataService.subscribeToOrders(async (updatedOrders) => {
      console.log('🔄 Real-time orders yangilandi:', updatedOrders.length, 'ta buyurtma');

      try {
        const filters: any = {};
        if (selectedCategory !== 'Hammasi') {
          const categories = [
            { name: 'Hammasi', value: '' },
            { name: "Tug'ilgan kun", value: 'birthday' },
            { name: 'Nikoh', value: 'wedding' },
            { name: 'Cupcake', value: 'cupcake' },
            { name: 'Cheesecake', value: 'cheesecake' },
          ];
          const category = categories.find(cat => cat.name === selectedCategory);
          if (category?.value) {
            filters.category = category.value;
          }
        }

        const freshCakes = await dataService.getCakes(filters);

        const processedCakes = freshCakes.filter(cake => {
          const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
          const isShopProduct = cake.productType === 'ready' || (cake.shopId && !cake.bakerId);

          if (isBakerProduct) {
            return true;
          }
          if (isShopProduct) {
            return cake.available === true;
          }
          return cake.available === true;
        }).map(cake => {
          if (cake.productType === 'baked' || (cake.bakerId && !cake.shopId)) {
            const orderedQuantity = updatedOrders
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

        console.log('✅ Orders o\'zgarishi bilan tortlar yangilandi:', processedCakes.length);
        setCakes(processedCakes);
        if (!searchQuery) {
          setFilteredCakes(processedCakes);
        }
      } catch (error) {
        console.error('❌ Orders o\'zgarishi bilan tortlarni yangilashda xato:', error);
      }
    });

    return () => {
      console.log('🔚 HomePage subscriptions yopilmoqda...');
      if (typeof unsubscribeCakes === 'function') {
        unsubscribeCakes();
      }
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
    };
  }, [selectedCategory]);

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
    if (!isAuthenticated) {
      alert('Savatga qo\'shish uchun avval tizimga kirishingiz kerak!');
      return;
    }

    console.log('Adding to cart:', cakeId);
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    const isBakerProduct = cake.productType === 'baked' || (cake.bakerId && !cake.shopId);
    if (isBakerProduct) {
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
    if (!isAuthenticated) {
      alert('Savatni boshqarish uchun avval tizimga kirishingiz kerak!');
      return;
    }

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

  const handleToggleFavorite = async (cake: CakeType) => {
    if (!isAuthenticated) {
      alert('Sevimlilar ro\'yxatiga qo\'shish uchun avval tizimga kirishingiz kerak!');
      return;
    }

    try {
      await toggleFavorite(cake.id!, {
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

  const handleCartClick = () => {
    console.log('Cart clicked, cart:', cart, 'keys length:', Object.keys(cart).length);

    if (!isAuthenticated) {
      alert('Buyurtma berish uchun avval tizimga kirishingiz kerak!');
      return;
    }

    if (Object.keys(cart).length > 0) {
      console.log('Switching directly to checkout');
      setCurrentView('checkout');
    } else {
      alert('Savat bo\'sh! Avval mahsulot qo\'shing.');
    }
  };

  const handleCheckout = () => {
    setShowCartModal(false);
    console.log('Switching to checkout view');
    setCurrentView('home');
    setTimeout(() => {
      setCurrentView('checkout');
      console.log('View switched to checkout');
    }, 50);
  };

  const handleBackFromCheckout = () => {
    setCurrentView('home');
  };

  const handleOrderComplete = () => {
    clearCart();
    setCurrentView('home');
  };

  const handleProductClick = (cake: CakeType) => {
    setSelectedCake(cake);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedCake(null);
  };

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

  const handleProviderClick = (bakerId: string) => {
    setSelectedBakerId(bakerId);
    setShowBakerProfile(true);
  };

  const cartProducts = Object.keys(cart).map(cakeId => {
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return null;
    return {
      ...cake,
      quantity: cart[cakeId]
    };
  }).filter(Boolean) as (CakeType & { quantity: number })[];

  useEffect(() => {
    if (userData) {
      loadFavorites();
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.relative')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        cart={cart}
        cakes={cakes}
        onBack={handleBackFromCheckout}
        onOrderComplete={handleOrderComplete}
        removeFromCart={removeFromCart}
      />
    );
  }

  if (showBakerProfile && selectedBakerId) {
    return (
      <BakerProfile 
        bakerId={selectedBakerId} 
        onBack={() => {
          setShowBakerProfile(false);
          setSelectedBakerId(null);
        }}
      />
    );
  }

  if (showProfile && profileType && userData) {
    return (
      <ProfileManager
        user={userData}
        profileType={profileType}
        onBack={closeProfile}
        onUpdate={updateUser}
      />
    );
  }

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-6">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Search Panel */}
      <SearchPanel 
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          handleSearch(query);
        }}
      />

      {/* Categories */}
      <CategoriesSection 
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Recommended Cakes */}
      <ProductList
        title="Tavsiya etilgan tortlar"
        cakes={recommendedCakes}
        loading={loading}
        searchQuery={searchQuery}
        cartQuantities={cart}
        favoriteIds={favoriteIds}
        favoritesLoading={favoritesLoading}
        isAuthenticated={isAuthenticated}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onToggleFavorite={handleToggleFavorite}
        onProductClick={handleProductClick}
        formatPrice={formatPrice}
        getOriginalPrice={getOriginalPrice}
        isFavorite={isFavorite}
      />

      {/* Top Rated Cakes */}
      <TopRatedList
        cakes={topRatedCakes}
        cartQuantities={cart}
        isAuthenticated={isAuthenticated}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onProductClick={handleProductClick}
        formatPrice={formatPrice}
        getOriginalPrice={getOriginalPrice}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton
        isVisible={isAuthenticated && Object.keys(cart).length > 0}
        cartItemsCount={cartItemsCount}
        onClick={handleCartClick}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        cake={selectedCake}
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onToggleFavorite={handleToggleFavorite}
        cartQuantity={selectedCake ? getCartQuantity(selectedCake.id!) : 0}
        isFavorite={selectedCake ? isFavorite(selectedCake.id!) : false}
        favoritesLoading={favoritesLoading}
        onProviderClick={handleProviderClick}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        cartProducts={cartProducts}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onCheckout={handleCheckout}
        getCartQuantity={getCartQuantity}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default HomePage;