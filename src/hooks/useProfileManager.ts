
import { useState } from 'react';
import { UserData } from '../services/authService';

export type ProfileType = 'customer' | 'baker' | 'shop' | 'courier' | 'admin' | 'operator';

export const useProfileManager = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);

  const openProfile = (type: ProfileType) => {
    setProfileType(type);
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
    setProfileType(null);
  };

  // Foydalanuvchi rolini aniqlash va tegishli profil ochish
  const openUserProfile = (user: UserData) => {
    const userRole = user.role as ProfileType;
    openProfile(userRole);
  };

  return {
    showProfile,
    profileType,
    openProfile,
    closeProfile,
    openUserProfile
  };
};
