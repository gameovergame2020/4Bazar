
import React from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartItemsListProps {
  cartProducts: CartItem[];
  onRemoveProduct: (cakeId: string) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({ cartProducts, onRemoveProduct }) => {
  return (
    <div className="space-y-3">
      {cartProducts.map((product) => (
        <div key={product.id} className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-600">{product.quantity} dona</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-semibold">{(product.price * product.quantity).toLocaleString()} so'm</p>
            <button
              onClick={() => onRemoveProduct(product.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Mahsulotni o'chirish"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartItemsList;
