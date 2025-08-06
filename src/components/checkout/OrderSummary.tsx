import React from 'react';
import { Truck } from 'lucide-react';
import CartItemsList from './CartItemsList';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderSummaryProps {
  cartProducts: CartItem[];
  cartSubtotal: number;
  deliveryFee: number;
  totalPrice: number;
  onRemoveProduct: (cakeId: string) => void;
  onSubmitOrder: () => void;
  isProcessing?: boolean; // Added prop
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartProducts,
  cartSubtotal,
  deliveryFee,
  totalPrice,
  onRemoveProduct,
  onSubmitOrder,
  isProcessing = false // Default value
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5" />
        Buyurtma xulasasi
      </h2>

      <CartItemsList 
        cartProducts={cartProducts}
        onRemoveProduct={onRemoveProduct}
      />

      <div className="mt-4 space-y-2">
        {/* Oraliq summa */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span>Mahsulotlar:</span>
          <span>{cartSubtotal.toLocaleString()} so'm</span>
        </div>

        {/* Yetkazib berish to'lovi */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Yetkazib berish:</span>
          <span>
            {deliveryFee > 0 ? `+${deliveryFee.toLocaleString()} so'm` : 'Bepul'}
          </span>
        </div>

        {/* Jami summa */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xl font-bold">
          <span>Jami:</span>
          <span className="text-orange-600">{totalPrice.toLocaleString()} so'm</span>
        </div>
      </div>

      <button
        onClick={onSubmitOrder}
        disabled={isProcessing} // Disable button while processing
        className={`w-full mt-6 text-white py-3 px-6 rounded-lg font-semibold transition-colors ${
          isProcessing ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
        }`}
      >
        {isProcessing ? 'Qayta ishlanmoqda...' : 'Buyurtmani rasmiylashtirish'}
      </button>
    </div>
  );
};

export default OrderSummary;