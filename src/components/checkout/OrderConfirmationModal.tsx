import React, { useEffect } from 'react';

interface OrderDetails {
  orderId: string;
  operatorPhone: string;
}

interface UserInfo {
  deliveryTime: string;
  customDeliveryDate: string;
  customDeliveryTime: string;
  paymentMethod: string;
  paymentType: string;
}

interface OrderConfirmationModalProps {
  isVisible: boolean;
  orderDetails: OrderDetails | null;
  totalPrice: number;
  userInfo: UserInfo;
  onClose: () => void;
  onBackToHome: () => void;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isVisible,
  orderDetails,
  totalPrice,
  userInfo,
  onClose,
  onBackToHome
}) => {
  // Modal ko'rsatish shartini tekshirish
  if (!isVisible || !orderDetails) {
    return null;
  }

  // Body scroll'ni to'xtatish
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isVisible]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Buyurtma qabul qilindi!
          </h3>

          <p className="text-gray-600 mb-4 text-sm">
            Sizning buyurtmangiz muvaffaqiyatli rasmiylashtirildi. Operator tez orada siz bilan bog'lanadi.
          </p>

          {/* Order Details */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-100">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Buyurtma raqami:</span>
                <span className="font-mono font-bold text-orange-600">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Jami summa:</span>
                <span className="font-bold text-green-600">{totalPrice.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Yetkazib berish:</span>
                <span className="text-sm font-medium text-blue-600">
                  {userInfo.deliveryTime === 'asap' ? 'Tez (2-3 soat)' :
                   userInfo.deliveryTime === 'today' ? 'Bugun' :
                   userInfo.deliveryTime === 'tomorrow' ? 'Ertaga' :
                   userInfo.deliveryTime === 'custom' ?
                     `${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ') : ''} ${userInfo.customDeliveryTime || ''}` :
                   userInfo.deliveryTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">To'lov:</span>
                <span className="text-sm font-medium text-purple-600">
                  {userInfo.paymentMethod === 'cash' ? '💵 Naqd pul' :
                   userInfo.paymentType === 'click' ? '🔵 Click' :
                   userInfo.paymentType === 'payme' ? '🟢 Payme' :
                   userInfo.paymentType === 'visa' ? '💳 Visa/MC' :
                   '💳 Bank kartasi'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
            <div className="text-center">
              <span className="text-sm font-medium text-blue-800">Operator raqami</span>
              <div>
                <a
                  href={`tel:${orderDetails.operatorPhone}`}
                  className="font-bold text-blue-600 text-lg hover:text-blue-800"
                >
                  {orderDetails.operatorPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onBackToHome}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Bosh sahifaga qaytish
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;