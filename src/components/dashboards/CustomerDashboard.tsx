import React from 'react';
import { ShoppingBag, Heart, Clock, Star, Gift, Truck } from 'lucide-react';

const CustomerDashboard = () => {
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