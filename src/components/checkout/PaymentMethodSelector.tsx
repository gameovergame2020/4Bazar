
import React from 'react';
import { CreditCard, Truck } from 'lucide-react';

interface UserInfo {
  paymentMethod: string;
  deliveryTime: string;
  customDeliveryDate: string;
  customDeliveryTime: string;
}

interface PaymentMethodSelectorProps {
  userInfo: UserInfo;
  onUserInfoChange: (updates: Partial<UserInfo>) => void;
  deliveryFee: number;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  userInfo,
  onUserInfoChange,
  deliveryFee
}) => {
  return (
    <>
      {/* To'lov usuli */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          To'lov usuli
        </h3>

        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={userInfo.paymentMethod === 'cash'}
              onChange={(e) => onUserInfoChange({ paymentMethod: e.target.value })}
              className="text-orange-500"
            />
            <span>💵 Naqd pul</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={userInfo.paymentMethod === 'card'}
              onChange={(e) => onUserInfoChange({ paymentMethod: e.target.value })}
              className="text-orange-500"
            />
            <span>💳 Bank kartasi</span>
          </label>
        </div>
      </div>

      {/* Yetkazib berish muddati */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          Yetkazib berish muddati
        </h3>

        <select
          value={userInfo.deliveryTime}
          onChange={(e) => onUserInfoChange({ deliveryTime: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          <option value="asap">⚡ Tez yetkazish (2-3 soat)</option>
          <option value="today">🌅 Bugun yetkazish (09:00-22:00)</option>
          <option value="tomorrow">📅 Ertaga yetkazish (09:00-22:00)</option>
          <option value="custom">⏰ O'zi muddatini tanlash</option>
        </select>

        {/* Qo'shimcha haq eslatmasi */}
        {userInfo.deliveryTime === 'asap' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">⚡</span>
              <p className="text-sm text-blue-700 font-medium">
                Tez yetkazish uchun qo'shimcha 15,000 so'm to'lov olinadi
              </p>
            </div>
          </div>
        )}

        {/* Custom vaqt tanlash */}
        {userInfo.deliveryTime === 'custom' && (
          <div className="mt-4 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">
              📅 Yetkazib berish kun va vaqtini tanlang:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kunni tanlang
                </label>
                <input
                  type="date"
                  value={userInfo.customDeliveryDate}
                  onChange={(e) => onUserInfoChange({ customDeliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaqtni tanlang
                </label>
                <select
                  value={userInfo.customDeliveryTime}
                  onChange={(e) => onUserInfoChange({ customDeliveryTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="">Vaqt oralig'ini tanlang</option>
                  <option value="09:00-15:00">🌅 09:00-15:00 (Ertalab)</option>
                  <option value="15:00-22:00">🌆 15:00-22:00 (Kechqurun)</option>
                </select>
              </div>
            </div>

            {userInfo.customDeliveryDate && userInfo.customDeliveryTime && (
              <div className="bg-white p-3 rounded-lg border border-orange-300">
                <p className="text-sm text-green-700">
                  ✅ Tanlangan vaqt: <span className="font-semibold">
                    {new Date(userInfo.customDeliveryDate).toLocaleDateString('uz-UZ', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} soat {userInfo.customDeliveryTime}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentMethodSelector;
