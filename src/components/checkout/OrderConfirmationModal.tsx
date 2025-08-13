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
  // Modal state'ini kuzatish
  useEffect(() => {
    console.log('🔄 Modal useEffect - isVisible o\'zgardi:', isVisible);
    console.log('🔄 Modal useEffect - orderDetails:', orderDetails);
  }, [isVisible, orderDetails]);

  console.log('🔍 Modal render - holati:', { isVisible, orderDetails: !!orderDetails });
  console.log('🔍 Modal render - orderDetails tafsiloti:', orderDetails);
  
  // Batafsil debug ma'lumotlari
  console.log('🔍 Modal render - batafsil tekshiruv:', {
    isVisible,
    orderDetails,
    hasOrderDetails: !!orderDetails,
    orderDetailsType: typeof orderDetails,
    orderId: orderDetails?.orderId,
    operatorPhone: orderDetails?.operatorPhone
  });
  
  // Test rejimi - agar URL da test=true bo'lsa, majburiy ko'rsatish
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'true';
  
  if (isTestMode) {
    console.log('🧪 TEST REJIMI: Modal majburiy ko\'rsatilmoqda');
    // Test uchun fake orderDetails yaratish
    const testOrderDetails = orderDetails || {
      orderId: 'TEST-' + Date.now(),
      operatorPhone: '+998 90 123 45 67'
    };
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              🧪 TEST REJIMI - Modal ishlayapti!
            </h3>
            <p className="text-gray-600 mb-6">
              Modal komponenti to'g'ri ishlayapti. URL dan ?test=true ni olib tashlang.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Soddalashtirilgan shart - ikkala shart ham bajarilishi kerak
  if (!isVisible || !orderDetails) {
    console.log('❌ Modal ko\'rsatilmaydi:', { 
      isVisible, 
      hasOrderDetails: !!orderDetails,
      sebab: !isVisible ? 'isVisible=false' : 'orderDetails yo\'q',
      orderDetails
    });
    return null;
  }

  console.log('✅ Modal ko\'rsatilmoqda - isVisible:', isVisible, 'orderDetails:', !!orderDetails);

  // CSS animatsiyalari uchun style tag qo'shish
  const animationStyles = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
    .animate-slideUp { animation: slideUp 0.4s ease-out; }
    .animate-slideDown { animation: slideDown 0.3s ease-out; }
  `;

  // Style tag ni head ga qo'shish
  if (typeof document !== 'undefined' && !document.getElementById('confirmation-animations')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'confirmation-animations';
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
        <div className="text-center">
          {/* Animated Success Icon */}
          <div className="relative w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs">🎉</span>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Buyurtma muvaffaqiyatli qabul qilindi!
          </h3>

          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Sizning buyurtmangiz muvaffaqiyatli rasmiylashtirildi va operatorimizga yuborildi. 
            Tez orada siz bilan bog'lanishadi.
          </p>

          {/* Order Summary Card */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 mb-6 border border-orange-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-bold">#</span>
                  </div>
                  <span className="text-sm text-gray-600">Buyurtma raqami:</span>
                </div>
                <span className="font-mono font-bold text-orange-600 text-lg">{orderDetails.orderId}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">💰</span>
                  </div>
                  <span className="text-sm text-gray-600">Jami summa:</span>
                </div>
                <span className="font-bold text-green-600 text-lg">{totalPrice.toLocaleString()} so'm</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🚚</span>
                  </div>
                  <span className="text-sm text-gray-600">Yetkazib berish:</span>
                </div>
                <span className="font-medium text-blue-600 text-sm">
                  {userInfo.deliveryTime === 'asap' ? 'Tez (2-3 soat)' :
                   userInfo.deliveryTime === 'today' ? 'Bugun (09:00-22:00)' :
                   userInfo.deliveryTime === 'tomorrow' ? 'Ertaga (09:00-22:00)' :
                   userInfo.deliveryTime === 'custom' ? `${userInfo.customDeliveryDate ? new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : 'Kun tanlanmagan'} ${userInfo.customDeliveryTime || ''}` :
                   userInfo.deliveryTime}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">💳</span>
                  </div>
                  <span className="text-sm text-gray-600">To'lov usuli:</span>
                </div>
                <span className="font-medium text-purple-600 text-sm">
                  {userInfo.paymentMethod === 'cash' ? '💵 Naqd pul' :
                   userInfo.paymentType === 'click' ? '🔵 Click' :
                   userInfo.paymentType === 'payme' ? '🟢 Payme' :
                   userInfo.paymentType === 'visa' ? '💳 Visa/MC' : 
                   '💳 Bank kartasi'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">📞</span>
              </div>
              <span className="text-sm font-medium text-blue-800">Operator bilan bog'lanish</span>
            </div>
            <a 
              href={`tel:${orderDetails.operatorPhone}`}
              className="font-bold text-blue-600 text-lg hover:text-blue-800 transition-colors"
            >
              {orderDetails.operatorPhone}
            </a>
            <p className="text-xs text-blue-600 mt-1">Savollaringiz bo'lsa, qo'ng'iroq qiling</p>
          </div>

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Keyingi qadamlar:</h4>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Operator bog'lanadi</p>
                  <p className="text-xs text-gray-600">5-10 daqiqa ichida</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Buyurtma tasdiqlash</p>
                  <p className="text-xs text-gray-500">Ma'lumotlarni tekshirish</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tayyorlash boshlash</p>
                  <p className="text-xs text-gray-500">SMS xabar yuboramiz</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onBackToHome}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              📋 Buyurtmalar
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              Buyurtma holatini Profile bo'limida kuzatib borishingiz mumkin. 
              Muammolar bo'lsa, yuqoridagi raqamga qo'ng'iroq qiling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;