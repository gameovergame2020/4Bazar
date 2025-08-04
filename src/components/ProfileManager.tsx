
import React from 'react';
import { UserData } from '../services/authService';
import CustomerProfile from './profiles/CustomerProfile';
import BakerProfile from './profiles/BakerProfile';
import ShopProfile from './profiles/ShopProfile';
import CourierProfile from './profiles/CourierProfile';

interface ProfileManagerProps {
  user: UserData;
  profileType: 'customer' | 'baker' | 'shop' | 'courier';
  onBack: () => void;
  onUpdate: (userData: Partial<UserData>) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ 
  user, 
  profileType, 
  onBack, 
  onUpdate 
}) => {
  switch (profileType) {
    case 'customer':
      return <CustomerProfile user={user} onBack={onBack} onUpdate={onUpdate} />;
    case 'baker':
      return <BakerProfile user={user} onBack={onBack} onUpdate={onUpdate} />;
    case 'shop':
      return <ShopProfile user={user} onBack={onBack} onUpdate={onUpdate} />;
    case 'courier':
      return <CourierProfile user={user} onBack={onBack} onUpdate={onUpdate} />;
    default:
      return null;
  }
};

export default ProfileManager;
