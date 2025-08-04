
import React from 'react';
import { User, Phone } from 'lucide-react';
import PaymentMethodSelector from './PaymentMethodSelector';

interface UserInfo {
  name: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentType: string;
  deliveryTime: string;
  customDeliveryDate: string;
  customDeliveryTime: string;
}

interface UserInfoFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (updates: Partial<UserInfo>) => void;
  deliveryFee: number;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  userInfo,
  onUserInfoChange,
  deliveryFee
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        Shaxsiy ma'lumotlar
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ism va familiya
          </label>
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => onUserInfoChange({ name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ismingizni kiriting"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefon raqam
          </label>
          <input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => onUserInfoChange({ phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="+998 90 123 45 67"
          />
        </div>
      </div>

      <PaymentMethodSelector
        userInfo={userInfo}
        onUserInfoChange={onUserInfoChange}
        deliveryFee={deliveryFee}
      />
    </div>
  );
};

export default UserInfoForm;
