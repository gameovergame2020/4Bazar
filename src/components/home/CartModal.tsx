
import React from 'react';
import { X, ShoppingBasket, Plus, Minus } from 'lucide-react';
import { Cake } from '../../services/dataService';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartProducts: (Cake & { quantity: number })[];
  onAddToCart: (cakeId: string) => void;
  onRemoveFromCart: (cakeId: string) => void;
  onCheckout: () => void;
  getCartQuantity: (cakeId: string) => number;
  formatPrice: (price: number, discount?: number) => string;
}

const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartProducts,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  getCartQuantity,
  formatPrice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBasket size={24} className="text-orange-500" />
            Savatcha
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-96 mb-4">
          {cartProducts.length > 0 ? (
            <div className="space-y-3">
              {cartProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA0MEMzNS44MTcgNDAgMzIgNDMuODE3IDMyIDUzVjk3QzMyIDEwNi4xODMgMzUuODE3IDExMCA0NSAxMTBIOTVDMTA0LjE4MyAxMTAgMTA4IDEwNi4xODMgMTA4IDk3VjUzQzEwOCA0My44MTcgMTA0LjE4MyA0MCA5NSA0MEg3NVoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+Tm8gSW1hZ2U8L3A+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-gray-600">
                      {product.productType === 'baked' ? `Oshpaz: ${product.bakerName}` : `Do'kon: ${product.shopName}`}
                    </p>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatPrice(product.price, product.discount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRemoveFromCart(product.id!)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-medium text-gray-900 min-w-[20px] text-center">
                      {getCartQuantity(product.id!)}
                    </span>
                    <button
                      onClick={() => onAddToCart(product.id!)}
                      disabled={
                        (product.productType === 'ready' && product.available && product.quantity !== undefined && getCartQuantity(product.id!) >= product.quantity) ||
                        (product.productType === 'baked' && product.available && product.quantity !== undefined && getCartQuantity(product.id!) >= product.quantity)
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        ((product.productType === 'ready' && product.available && product.quantity !== undefined && getCartQuantity(product.id!) >= product.quantity) ||
                         (product.productType === 'baked' && product.available && product.quantity !== undefined && getCartQuantity(product.id!) >= product.quantity))
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBasket size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Savatcha bo'sh</p>
            </div>
          )}
        </div>

        {cartProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Jami:</span>
              <span className="text-xl font-bold text-orange-600">
                {cartProducts.reduce((sum, product) => sum + (product.price * getCartQuantity(product.id!)), 0).toLocaleString()} so'm
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Davom etish
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Buyurtma berish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
