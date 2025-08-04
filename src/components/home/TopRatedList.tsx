
import React from 'react';
import { Star, Plus, Minus, ShoppingBasket } from 'lucide-react';
import { Cake } from '../../services/dataService';

interface TopRatedListProps {
  cakes: Cake[];
  cartQuantities: {[key: string]: number};
  isAuthenticated: boolean;
  onAddToCart: (cakeId: string) => void;
  onRemoveFromCart: (cakeId: string) => void;
  onProductClick: (cake: Cake) => void;
  formatPrice: (price: number, discount?: number) => string;
  getOriginalPrice: (price: number) => string;
}

const TopRatedList: React.FC<TopRatedListProps> = ({
  cakes,
  cartQuantities,
  isAuthenticated,
  onAddToCart,
  onRemoveFromCart,
  onProductClick,
  formatPrice,
  getOriginalPrice
}) => {
  if (cakes.length === 0) return null;

  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reytingi yuqori tortlar</h3>
      <div className="space-y-3 sm:space-y-4">
        {cakes.map((cake) => {
          const cartQuantity = cartQuantities[cake.id!] || 0;
          
          return (
            <div key={cake.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <img 
                    src={cake.image} 
                    alt={cake.name}
                    className="w-16 sm:w-20 h-16 sm:h-20 rounded-lg sm:rounded-xl object-cover cursor-pointer"
                    onClick={() => onProductClick(cake)}
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
                  <h4 
                    className="font-semibold text-gray-900 mb-1 text-sm sm:text-base cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => onProductClick(cake)}
                  >
                    {cake.name}
                  </h4>
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

                  {cartQuantity > 0 ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onRemoveFromCart(cake.id!)}
                        className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium text-gray-900 min-w-[20px] text-center">
                        {cartQuantity}
                      </span>
                      <button
                        onClick={() => onAddToCart(cake.id!)}
                        disabled={
                          (cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                          (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity)
                        }
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          ((cake.productType === 'ready' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity) ||
                           (cake.productType === 'baked' && cake.available && cake.quantity !== undefined && cartQuantity >= cake.quantity))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        <Plus size={12} />
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
                      <span className="hidden sm:inline">
                        {!isAuthenticated 
                          ? 'Kirish'
                          : cake.productType === 'baked' ? 
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
          );
        })}
      </div>
    </div>
  );
};

export default TopRatedList;
