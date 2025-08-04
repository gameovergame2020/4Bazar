import React from 'react';
import { Star, Heart, Plus, Minus, ShoppingBasket } from 'lucide-react';
import { Cake } from '../../services/dataService';

interface ProductCardProps {
  cake: Cake;
  cartQuantity: number;
  isFavorite: boolean;
  favoritesLoading: boolean;
  isAuthenticated: boolean;
  onAddToCart: (cakeId: string) => void;
  onRemoveFromCart: (cakeId: string) => void;
  onToggleFavorite: (cake: Cake) => void;
  onProductClick: (cake: Cake) => void;
  formatPrice: (price: number, discount?: number) => string;
  getOriginalPrice: (price: number) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  cake,
  cartQuantity,
  isFavorite,
  favoritesLoading,
  isAuthenticated,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  onProductClick,
  formatPrice,
  getOriginalPrice
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={cake.image} 
          alt={cake.name}
          className="w-full h-40 sm:h-48 object-cover cursor-pointer"
          onClick={() => onProductClick(cake)}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzBDMTE4IDcwIDExMCA3OCA4MCA5MEM4MCA5MCAxMDAgMTEwIDEzMCAxMjBIMTcwQzIwMCAxMTAgMjIwIDkwIDIyMCA5MEMyMTAgNzggMTgyIDcwIDE1MCA3MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+VG9ydCBSYXptaSAvcD4KPC9zdmc+';
          }}
        />
        <button 
          onClick={() => onToggleFavorite(cake)}
          disabled={favoritesLoading}
          className={`absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full transition-all ${
            isAuthenticated && isFavorite 
              ? 'bg-pink-500 text-white shadow-lg hover:bg-pink-600' 
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-pink-500'
          } ${favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart size={16} className={isAuthenticated && isFavorite ? 'fill-current' : ''} />
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
        <h4 
          className="font-semibold text-gray-900 mb-1 text-sm sm:text-base cursor-pointer hover:text-orange-600 transition-colors"
          onClick={() => onProductClick(cake)}
        >
          {cake.name}
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 mb-1">
          {cake.productType === 'baked' ? `Oshpaz: ${cake.bakerName}` : `Do'kon: ${cake.shopName}`}
        </p>
        <p 
          className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 cursor-pointer hover:text-gray-800 transition-colors"
          onClick={() => onProductClick(cake)}
        >
          {cake.description}
        </p>

        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-1">
            <Star size={12} className="text-yellow-400 fill-current" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">{cake.rating}</span>
            <span className="text-xs sm:text-sm text-gray-500">({cake.reviewCount})</span>
          </div>
          <span className="text-xs text-gray-500">
            {cake.productType === 'baked' 
              ? cake.available && cake.quantity !== undefined && cake.quantity > 0
                ? `Hozir mavjud: ${cake.quantity} ta`
                : cake.available && (cake.quantity === undefined || cake.quantity === 0)
                  ? 'Buyurtma uchun (miqdor cheklanmagan)'
                  : !cake.available
                    ? `Buyurtma uchun: ${cake.amount || 0} ta`
                    : 'Buyurtma uchun'
              : cake.quantity !== undefined 
                ? `Qoldi: ${cake.quantity} ta`
                : 'Mavjud'
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

          {cartQuantity > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onRemoveFromCart(cake.id!)}
                className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="font-medium text-gray-900">{cartQuantity}</span>
              <button
                onClick={() => onAddToCart(cake.id!)}
                disabled={
                  (cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                  (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity)
                }
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                ((cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                 (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(cake.id!)}
              disabled={
                cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
              }
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm flex items-center space-x-1 ${
                cake.productType === 'ready' && (!cake.available || (cake.quantity !== undefined && cake.quantity <= 0))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : !isAuthenticated
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : cake.productType === 'baked'
                      ? cake.available 
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <ShoppingBasket size={14} />
              <span>
                {!isAuthenticated 
                  ? 'Tizimga kirish'
                  : cake.productType === 'baked' ? 
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
  );
};

export default ProductCard;