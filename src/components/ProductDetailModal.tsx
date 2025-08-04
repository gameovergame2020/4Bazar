
import React from 'react';
import { X, Star, Heart, ShoppingCart, Plus, Minus, Package, Clock, User, MapPin } from 'lucide-react';
import { Cake } from '../services/dataService';

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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-start justify-between mb-4">
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

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tavsif</h3>
            <p className="text-gray-600 leading-relaxed">{cake.description}</p>
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <div className="mb-6">
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

          {/* Add to Cart Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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
