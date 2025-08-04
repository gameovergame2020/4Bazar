
import React from 'react';
import { CreditCard } from 'lucide-react';

interface PaymentModalProps {
  isVisible: boolean;
  totalPrice: number;
  onPaymentTypeSelect: (paymentType: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isVisible,
  totalPrice,
  onPaymentTypeSelect,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            💳 To'lov turini tanlang
          </h3>

          <p className="text-gray-600 mb-6">
            Bank kartasi orqali to'lov qilish uchun quyidagi variantlardan birini tanlang:
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => onPaymentTypeSelect('click')}
              className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔵</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Click</h4>
                <p className="text-sm text-gray-600">Click orqali to'lov qilish</p>
              </div>
            </button>

            <button
              onClick={() => onPaymentTypeSelect('payme')}
              className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🟢</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Payme</h4>
                <p className="text-sm text-gray-600">Payme orqali to'lov qilish</p>
              </div>
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Jami to'lov:</span>
              <span className="font-bold text-orange-600 text-lg">{totalPrice.toLocaleString()} so'm</span>
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                ℹ️ <strong>Muhim:</strong> Bank kartasi orqali to'lov qilingan buyurtmalar bekor qilinganda xizmat haqi ushlab qolinadi:
              </p>
              <ul className="text-xs text-blue-600 mt-1 ml-4 space-y-0.5">
                <li>• Click: 2,000 so'm</li>
                <li>• Payme: 1,500 so'm</li>
                <li>• Visa/Mastercard: 3,000 so'm</li>
              </ul>
              <p className="text-xs text-blue-700 mt-1">
                Qolgan mablag' 3-5 ish kuni ichida qaytariladi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
