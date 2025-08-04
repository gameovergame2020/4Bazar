import React, { useState, useEffect } from 'react';
import { X, Star, Heart, ShoppingCart, Plus, Minus, Package, Clock, User, MapPin, MessageCircle, Send, ChevronRight, Phone, Mail, Award } from 'lucide-react';
import { Cake } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface BakerShopInfo {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  totalProducts: number;
  joinedDate: Date;
  specialties?: string[];
}

interface ProductDetailModalProps {
  cake: Cake | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cakeId: string) => void;
  onRemoveFromCart: (cakeId: string) => void;
  onToggleFavorite: (cake: Cake) => void;
  cartQuantity: number;
  isFavorite: boolean;
  favoritesLoading: boolean;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  cake,
  isOpen,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  cartQuantity,
  isFavorite,
  favoritesLoading
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'provider'>('details');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);

  const { isAuthenticated, userData } = useAuth();
  const [providerInfo, setProviderInfo] = useState<BakerShopInfo | null>(null);
  const [providerProducts, setProviderProducts] = useState<Cake[]>([]);

  useEffect(() => {
    if (isOpen && cake) {
      loadReviews();
      checkUserDeliveredOrder();
      loadProviderInfo();
    }
  }, [isOpen, cake, userData]);

  const checkUserDeliveredOrder = async () => {
    if (!userData || !cake) {
      setHasDeliveredOrder(false);
      return;
    }

    try {
      // Get user's orders for this specific product
      const orders = await dataService.getOrders();
      const userDeliveredOrder = orders.find(order => 
        order.customerId === userData.id?.toString() &&
        order.cakeId === cake.id &&
        order.status === 'delivered'
      );

      setHasDeliveredOrder(!!userDeliveredOrder);
    } catch (error) {
      console.error('Buyurtmalarni tekshirishda xatolik:', error);
      setHasDeliveredOrder(false);
    }
  };

  const loadReviews = async () => {
    if (!cake) return;

    // Mock reviews - bu yerda dataService orqali reviews yuklashingiz mumkin
    const mockReviews: Review[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Aziza Karimova',
        rating: 5,
        comment: 'Juda mazali tort edi! Oilam bilan birga yedik, hamma yoqtirdi. Oshpazga katta rahmat!',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Jasur Abdullayev',
        rating: 4,
        comment: 'Yaxshi tort, lekin biroz shirin edi menimcha. Umumiy holda tavsiya qilaman.',
        createdAt: new Date('2024-01-10')
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Malika Tosheva',
        rating: 5,
        comment: 'Eng yaxshi tort! Tug\'ilgan kunim uchun buyurtma qilgan edim, hamma mehmonlar hayratda qolishdi.',
        createdAt: new Date('2024-01-08')
      }
    ];
    setReviews(mockReviews);
  };

  const loadProviderInfo = async () => {
    if (!cake) return;

    // Mock provider info - bu yerda dataService orqali provider ma'lumotlarini yuklashingiz mumkin
    const mockProviderInfo: BakerShopInfo = {
      id: cake.productType === 'baked' ? cake.bakerId! : cake.shopId!,
      name: cake.productType === 'baked' ? cake.bakerName : cake.shopName!,
      description: cake.productType === 'baked' 
        ? 'Professional oshpaz. 10 yildan ortiq tajriba. Maxsus tortlar va milliy taomlar tayyorlash bo\'yicha mutaxassis.'
        : 'Sifatli mahsulotlar bilan ta\'minlovchi do\'kon. Har doim yangi va mazali tortlar.',
      phone: '+998 90 123 45 67',
      email: cake.productType === 'baked' ? 'baker@example.com' : 'shop@example.com',
      address: 'Toshkent, Chilonzor tumani',
      rating: 4.8,
      totalProducts: 25,
      joinedDate: new Date('2022-03-15'),
      specialties: cake.productType === 'baked' 
        ? ['Tug\'ilgan kun tortlari', 'Nikoh tortlari', 'Cupcake', 'Cheesecake']
        : ['Tortlar', 'Shirinliklar', 'Nonvoylar']
    };

    // Mock provider's other products
    const mockProviderProducts: Cake[] = [
      {
        id: 'p1',
        name: 'Shokoladli tort',
        image: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg',
        price: 150000,
        rating: 4.7,
        reviewCount: 15,
        description: 'Shirinlikning ajoyib ta\'mi',
        productType: cake.productType,
        available: true,
        quantity: 5,
        bakerName: cake.bakerName,
        shopName: cake.shopName,
        bakerId: cake.bakerId,
        shopId: cake.shopId
      },
      {
        id: 'p2',
        name: 'Mevali tort',
        image: 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg',
        price: 120000,
        rating: 4.5,
        reviewCount: 22,
        description: 'Yangi mevalar bilan',
        productType: cake.productType,
        available: true,
        quantity: 3,
        bakerName: cake.bakerName,
        shopName: cake.shopName,
        bakerId: cake.bakerId,
        shopId: cake.shopId
      }
    ];

    setProviderInfo(mockProviderInfo);
    setProviderProducts(mockProviderProducts);
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      alert('Izoh yozish uchun tizimga kirishingiz kerak!');
      return;
    }

    if (!newComment.trim()) {
      alert('Iltimos izoh yozing!');
      return;
    }

    setSubmittingComment(true);
    try {
      // Bu yerda dataService orqali izohni saqlashingiz mumkin
      const newReview: Review = {
        id: Date.now().toString(),
        userId: userData!.id!.toString(),
        userName: userData!.name || 'Foydalanuvchi',
        rating: newRating,
        comment: newComment,
        createdAt: new Date()
      };

      setReviews(prev => [newReview, ...prev]);
      setNewComment('');
      setNewRating(5);
      alert('Izohingiz muvaffaqiyatli qo\'shildi!');
    } catch (error) {
      console.error('Izoh qo\'shishda xatolik:', error);
      alert('Izoh qo\'shishda xatolik yuz berdi');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={16}
              className={`${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen || !cake) return null;

  const formatPrice = (price: number, discount?: number) => {
    const discountedPrice = discount ? price * (1 - discount / 100) : price;
    return new Intl.NumberFormat('uz-UZ').format(discountedPrice) + ' so\'m';
  };

  const getOriginalPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const discountedPrice = cake.discount ? cake.price * (1 - cake.discount / 100) : cake.price;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          <img 
            src={cake.image}
            alt={cake.name}
            className="w-full h-64 object-cover rounded-t-2xl"
            onError={(e) => {
              e.currentTarget.src = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => onToggleFavorite(cake)}
            disabled={favoritesLoading}
            className={`absolute top-4 left-4 p-2 rounded-full transition-all ${
              isFavorite 
                ? 'bg-pink-500 text-white shadow-lg hover:bg-pink-600' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-pink-500'
            } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
          </button>
          {cake.discount && cake.discount > 0 && (
            <div className="absolute top-4 right-16 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              -{cake.discount}%
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              cake.productType === 'ready' 
                ? 'bg-green-100 text-green-600' 
                : cake.available && cake.quantity !== undefined && cake.quantity > 0
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
            }`}>
              {cake.productType === 'ready' 
                ? 'Hozir mavjud' 
                : cake.available && cake.quantity !== undefined && cake.quantity > 0
                  ? 'Hozir mavjud'
                  : 'Buyurtma uchun'
              }
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Rating */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{cake.name}</h2>
              <div className="flex items-center space-x-4 mb-2">
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="font-medium text-gray-700">{cake.rating}</span>
                  <span className="text-gray-500">({cake.reviewCount} sharh)</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <User size={16} />
                  <span className="text-sm">
                    {cake.productType === 'baked' ? `Oshpaz: ${cake.bakerName}` : `Do'kon: ${cake.shopName}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(cake.price, cake.discount)}
              </div>
              {cake.discount && cake.discount > 0 && (
                <div className="text-lg text-gray-500 line-through">
                  {getOriginalPrice(cake.price)}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mahsulot haqida
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sharhlar ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('provider')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'provider'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cake.productType === 'baked' ? 'Oshpaz' : 'Do\'kon'}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tavsif</h3>
                <p className="text-gray-600 leading-relaxed">{cake.description}</p>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Mahsulot ma'lumotlari</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Kategoriya: {cake.category || 'Umumiy'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {cake.productType === 'baked' 
                          ? cake.available 
                            ? 'Darhol tayyor' 
                            : 'Buyurtma bo\'yicha 1-2 kun'
                          : 'Darhol tayyor'
                        }
                      </span>
                    </div>
                    {cake.weight && (
                      <div className="flex items-center space-x-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Og'irligi: {cake.weight} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Mavjudlik</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {cake.productType === 'baked' 
                        ? cake.available && (cake.inStockQuantity !== undefined ? cake.inStockQuantity : cake.quantity) > 0
                          ? `Hozir mavjud: ${cake.inStockQuantity !== undefined ? cake.inStockQuantity : cake.quantity} ta`
                          : `Buyurtma uchun: ${cake.amount || 0} ta`
                        : cake.quantity !== undefined 
                          ? `Qolgan: ${cake.quantity} ta`
                          : 'Miqdor: cheklanmagan'
                      }
                    </div>
                    {cake.ingredients && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tarkib: </span>
                        <span className="text-sm text-gray-600">{cake.ingredients}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {(cake.deliveryPrice !== undefined || cake.freeDeliveryAmount !== undefined) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Yetkazib berish</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {cake.deliveryPrice !== undefined && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Yetkazib berish narxi: {formatPrice(cake.deliveryPrice)}
                          </span>
                        </div>
                      )}
                      {cake.freeDeliveryAmount !== undefined && (
                        <div className="text-sm text-green-600">
                          {formatPrice(cake.freeDeliveryAmount)} dan yuqori buyurtmalarda bepul yetkazib berish
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Add Review */}
              {isAuthenticated && hasDeliveredOrder ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Izoh qoldiring</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Baho bering</label>
                      {renderStars(newRating, true, setNewRating)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Izohingiz</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Mahsulot haqida fikringizni yozing..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Yuborilmoqda...</span>
                        </>
                      ) : (
                        <>
                          <span>Izoh qoldirish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : isAuthenticated && !hasDeliveredOrder ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Izoh qoldirish uchun mahsulotni sotib olib, qabul qilib olishingiz kerak</p>
                    <p className="text-sm text-gray-500">Faqat yetkazib berilgan buyurtmalar uchun sharh yozish mumkin</p>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-600">Izoh qoldirish uchun tizimga kiring</p>
                  </div>
                </div>
              ) : null}

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Mijozlar sharhlari</h3>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{review.userName}</div>
                            <div className="flex items-center space-x-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-gray-500">
                                {review.createdAt.toLocaleDateString('uz-UZ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Hozircha sharhlar yo'q</p>
                    {!isAuthenticated && (
                      <p className="text-sm text-gray-400 mt-2">Birinchi sharh qoldirish uchun tizimga kiring</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'provider' && providerInfo && (
            <div className="space-y-6">
              {/* Provider Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{providerInfo.name}</h3>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-1">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-700">{providerInfo.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{providerInfo.totalProducts} mahsulot</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {providerInfo.joinedDate.getFullYear()} yildan beri
                        </span>
                      </div>
                    </div>
                    {providerInfo.description && (
                      <p className="text-gray-600 mb-3">{providerInfo.description}</p>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2">
                      {providerInfo.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{providerInfo.phone}</span>
                        </div>
                      )}
                      {providerInfo.email && (
                        <div className="flex items-center space-x-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{providerInfo.email}</span>
                        </div>
                      )}
                      {providerInfo.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{providerInfo.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Specialties */}
                    {providerInfo.specialties && providerInfo.specialties.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-1 mb-2">
                          <Award size={16} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Mutaxassisligi:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {providerInfo.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full"
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

              {/* Other Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Boshqa mahsulotlari</h3>
                {providerProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex space-x-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=150';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-1 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                              <div className="flex items-center space-x-1">
                                <Star size={12} className="text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">{product.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Boshqa mahsulotlar yo'q</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add to Cart Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <div className="text-sm text-gray-500">
              {cartQuantity > 0 && `Savatda: ${cartQuantity} ta`}
            </div>

            <div className="flex items-center space-x-4">
              {cartQuantity > 0 ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onRemoveFromCart(cake.id!)}
                    className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-medium text-gray-900 min-w-[30px] text-center text-lg">
                    {cartQuantity}
                  </span>
                  <button
                    onClick={() => onAddToCart(cake.id!)}
                    disabled={
                      (cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                      (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity)
                    }
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      ((cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                       (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity))
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(cake.id!)}
                  disabled={
                    cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                  }
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                    cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : cake.productType === 'baked'
                        ? cake.available 
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  <ShoppingCart size={20} />
                  <span>
                    {cake.productType === 'baked' ? 
                      cake.available ? 'Savatga qo\'shish' : 'Buyurtma berish'
                      : cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                        ? 'Tugagan' 
                        : 'Savatga qo\'shish'
                    }
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;