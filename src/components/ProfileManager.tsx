
import React from 'react';
import { UserData } from '../services/authService';
import CustomerProfile from './profiles/CustomerProfile';
import BakerProfile from './profiles/BakerProfile';
import ShopProfile from './profiles/ShopProfile';
import CourierProfile from './profiles/CourierProfile';
import AdminProfile from './profiles/AdminProfile';
import OperatorProfile from './profiles/OperatorProfile';

interface ProfileManagerProps {
  user: UserData;
  profileType: 'customer' | 'baker' | 'shop' | 'courier' | 'admin' | 'operator';
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ 
  user, 
  profileType, 
  onBack, 
  onUpdate 
}) => {
  // Foydalanuvchi rolini aniqlash - agar profileType berilmagan bo'lsa, user.role dan foydalanish
  const actualProfileType = profileType || user.role;

  switch (actualProfileType) {
    case 'customer':
      return (
        <CustomerProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    case 'baker':
      return (
        <BakerProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    case 'shop':
      return (
        <ShopProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    case 'courier':
      return (
        <CourierProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    case 'admin':
      return (
        <AdminProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    case 'operator':
      return (
        <OperatorProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
      
    default:
      // Agar rol noma'lum bo'lsa, customer profilini ko'rsatish
      console.warn(`Noma'lum rol: ${actualProfileType}, customer profili ko'rsatilmoqda`);
      return (
        <CustomerProfile
          user={user}
          onBack={onBack}
          onUpdate={onUpdate}
        />
      );
  }
};

export default ProfileManager;
