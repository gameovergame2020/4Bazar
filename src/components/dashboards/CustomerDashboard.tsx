import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Clock, Star, Gift, Truck, Plus, Minus } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../hooks/useAuth';

interface Cake {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  discount?: number;
  quantity: number;
  shopId: string;
  shopName?: string;
}

const CustomerDashboard = () => {
  const { userData } = useAuth();
  const [availableCakes, setAvailableCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'Hammasi' },
    { value: 'birthday', label: "Tug'ilgan kun" },
    { value: 'wedding', label: 'Nikoh' },
    { value: 'anniversary', label: 'Yubiley' },
    { value: 'custom', label: 'Maxsus' },
    { value: 'cupcake', label: 'Cupcake' },
    { value: 'cheesecake', label: 'Cheesecake' }
  ];

  useEffect(() => {
    loadAvailableCakes();
  }, []);

  const loadAvailableCakes = async () => {
    try {
      setLoading(true);
      const cakes = await dataService.getCakes();
      // Faqat mavjud tortlarni ko'rsatish (quantity > 0)
      const availableCakes = cakes.filter(cake => cake.quantity > 0);
      setAvailableCakes(availableCakes);
    } catch (error) {
      console.error('Tortlarni yuklashda xatolik:', error);
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

  const getCartItemCount = (cakeId: string) => {
    return cart[cakeId] || 0;
  };

  const getTotalCartItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const filteredCakes = selectedCategory === 'all' 
    ? availableCakes 
    : availableCakes.filter(cake => cake.category === selectedCategory);

  const recentOrders = [
    {
      id: 1,
      name: 'Shokoladli Torta',
      restaurant: 'Sweet Dreams',
      status: 'delivered',
      date: '2024-01-20',
      price: '250,000',
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: 2,
      name: 'Red Velvet',
      restaurant: 'Royal Cakes',
      status: 'preparing',
      date: '2024-01-22',
      price: '320,000',
      image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  ];

  const favorites = [
    {
      id: 1,
      name: 'Cheese Cake',
      restaurant: 'Cake Paradise',
      price: '180,000',
      image: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Xush kelibsiz!</h2>
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
              <p className="text-2xl font-bold text-gray-900">24</p>
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
              <p className="text-2xl font-bold text-gray-900">12</p>
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
              <Gift size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-sm text-gray-600">Bonuslar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Oxirgi buyurtmalar</h3>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <img 
                src={order.image}
                alt={order.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{order.name}</h4>
                <p className="text-sm text-gray-600">{order.restaurant}</p>
                <p className="text-sm text-gray-500">{order.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{order.price} so'm</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {order.status === 'delivered' ? 'Yetkazildi' : 'Tayyorlanmoqda'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Products */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Mavjud tortlar</h3>
          {getTotalCartItems() > 0 && (
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
              Savatda: {getTotalCartItems()} ta mahsulot
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Mahsulotlar yuklanmoqda...</span>
          </div>
        ) : filteredCakes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Hozircha bu kategoriyada mahsulot yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCakes.map((cake) => {
              const discountedPrice = cake.discount 
                ? cake.price * (1 - cake.discount / 100) 
                : cake.price;
              const cartCount = getCartItemCount(cake.id!);

              return (
                <div key={cake.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                  {cake.imageUrl ? (
                    <img 
                      src={cake.imageUrl}
                      alt={cake.name}
                      className="w-full h-48 rounded-lg object-cover mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-gray-500">Rasm yo'q</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-lg">{cake.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{cake.description}</p>
                    
                    {cake.shopName && (
                      <p className="text-xs text-blue-600 font-medium">
                        Do'kon: {cake.shopName}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {cake.discount ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-green-600 text-xl">
                              {discountedPrice.toLocaleString('uz-UZ')} so'm
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {cake.price.toLocaleString('uz-UZ')} so'm
                            </span>
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                              -{cake.discount}%
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900 text-xl">
                            {cake.price.toLocaleString('uz-UZ')} so'm
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          Mavjud: {cake.quantity} ta
                        </p>
                      </div>
                    </div>

                    {/* Add to cart controls */}
                    <div className="flex items-center justify-between pt-3">
                      {cartCount === 0 ? (
                        <button
                          onClick={() => addToCart(cake.id!)}
                          className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          Savatga qo'shish
                        </button>
                      ) : (
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={() => removeFromCart(cake.id!)}
                            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-lg min-w-[2rem] text-center">
                            {cartCount}
                          </span>
                          <button
                            onClick={() => addToCart(cake.id!)}
                            disabled={cartCount >= cake.quantity}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Favorites */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sevimli tortlar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((cake) => (
            <div key={cake.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <img 
                src={cake.image}
                alt={cake.name}
                className="w-full h-32 rounded-lg object-cover mb-3"
              />
              <h4 className="font-medium text-gray-900 mb-1">{cake.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{cake.restaurant}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{cake.price} so'm</span>
                <button className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                  Buyurtma
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;