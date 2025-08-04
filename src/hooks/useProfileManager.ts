
import { useState } from 'react';
import { UserData } from '../services/authService';

export const useProfileManager = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [profileType, setProfileType] = useState<'customer' | 'baker' | 'shop' | 'courier' | 'admin' | 'operator' | null>(null);

  const openProfile = (type: 'customer' | 'baker' | 'shop' | 'courier' | 'admin' | 'operator') => {
    setProfileType(type);
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
    setProfileType(null);
  };

  return {
    showProfile,
    profileType,
    openProfile,
    closeProfile
  };
};
