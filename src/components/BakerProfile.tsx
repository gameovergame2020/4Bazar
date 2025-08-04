
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Package, Award, Phone, Mail, MapPin, Clock, User } from 'lucide-react';
import { dataService, Cake } from '../services/dataService';

interface BakerInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  rating: number;
  totalProducts: number;
  joinedDate: Date;
  specialties?: string[];
  location?: string;
  bio?: string;
  totalOrders?: number;
}

interface BakerProfileProps {
  bakerId: string;
  onBack: () => void;
}

const BakerProfile: React.FC<BakerProfileProps> = ({ bakerId, onBack }) => {
  const [bakerInfo, setBakerInfo] = useState<BakerInfo | null>(null);
  const [bakerProducts, setBakerProducts] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  useEffect(() => {
    loadBakerData();
  }, [bakerId]);

  const loadBakerData = async () => {
    try {
      setLoading(true);

      // Oshpaz ma'lumotlarini yuklash
      const userData = await dataService.getUserById(bakerId);
      
      // Oshpaz mahsulotlarini yuklash
      const products = await dataService.getCakes({ 
        bakerId: bakerId,
        productType: 'baked'
      });

      const mockBakerInfo: BakerInfo = {
        id: bakerId,
        name: userData?.name || 'Noma\'lum oshpaz',
        email: userData?.email,
        phone: userData?.phone,
        avatar: userData?.avatar,
        rating: 4.8,
        totalProducts: products.length,
        joinedDate: userData?.joinDate ? new Date(userData.joinDate) : new Date(),
        specialties: userData?.specialties || ['Tug\'ilgan kun tortlari', 'Nikoh tortlari', 'Cupcake'],
        location: 'Toshkent, O\'zbekiston',
        bio: 'Professional oshpaz. 10 yildan ortiq tajriba. Maxsus tortlar va milliy taomlar tayyorlash bo\'yicha mutaxassis.',
        totalOrders: 150
      };

      setBakerInfo(mockBakerInfo);
      setBakerProducts(products);

    } catch (error) {
      console.error('Oshpaz ma\'lumotlarini yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Oshpaz ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!bakerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Oshpaz topilmadi</p>
          <button
            onClick={onBack}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Orqaga</span>
          </button>

          <div className="flex items-start space-x-6">
            <div className="relative">
              <img
                src={bakerInfo.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                alt={bakerInfo.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <Award size={16} className="text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{bakerInfo.name}</h1>
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="font-medium text-gray-700">{bakerInfo.rating}</span>
                  <span className="text-gray-500">({bakerInfo.totalOrders} buyurtma)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{bakerInfo.totalProducts} mahsulot</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {bakerInfo.joinedDate.getFullYear()} yildan beri
                  </span>
                </div>
              </div>

              {bakerInfo.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{bakerInfo.bio}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4">
                {bakerInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{bakerInfo.phone}</span>
                  </div>
                )}
                {bakerInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{bakerInfo.email}</span>
                  </div>
                )}
                {bakerInfo.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{bakerInfo.location}</span>
                  </div>
                )}
              </div>

              {/* Specialties */}
              {bakerInfo.specialties && bakerInfo.specialties.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center space-x-1 mb-2">
                    <Award size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Mutaxassisligi:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bakerInfo.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-600 text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mahsulotlar ({bakerProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Haqida
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <div>
            {bakerProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bakerProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      {product.discount && product.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          -{product.discount}%
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.available && product.quantity && product.quantity > 0
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {product.available && product.quantity && product.quantity > 0
                            ? 'Hozir mavjud'
                            : 'Buyurtma uchun'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                          <span className="text-xs text-gray-500">({product.reviewCount})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatPrice(product.discount ? product.price * (1 - product.discount / 100) : product.price)}
                          </div>
                          {product.discount && product.discount > 0 && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(product.price)}
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                        Ko'rish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Hozircha mahsulotlar yo'q</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oshpaz haqida</h3>
            <div className="space-y-4">
              <p className="text-gray-600">{bakerInfo.bio}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistika</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami mahsulotlar:</span>
                      <span className="font-medium">{bakerInfo.totalProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami buyurtmalar:</span>
                      <span className="font-medium">{bakerInfo.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reyting:</span>
                      <div className="flex items-center space-x-1">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="font-medium">{bakerInfo.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">A'zo bo'lgan:</span>
                      <span className="font-medium">{bakerInfo.joinedDate.getFullYear()} yil</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Aloqa ma'lumotlari</h4>
                  <div className="space-y-2">
                    {bakerInfo.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-600">{bakerInfo.phone}</span>
                      </div>
                    )}
                    {bakerInfo.email && (
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-600">{bakerInfo.email}</span>
                      </div>
                    )}
                    {bakerInfo.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-600">{bakerInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BakerProfile;
