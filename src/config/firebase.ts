// Firebase konfiguratsiyasi
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase konfiguratsiya obyekti
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase konfiguratsiyasini tekshirish
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => {
  const value = firebaseConfig[key as keyof typeof firebaseConfig];
  return !value || value.includes('your_') || value === 'undefined';
});

if (missingKeys.length > 0) {
  console.warn('⚠️ Firebase konfiguratsiyasi to\'liq emas. .env faylini to\'g\'ri to\'ldiring!', {
    missingKeys,
    envExample: 'VITE_FIREBASE_API_KEY=your_actual_api_key'
  });
}

// Firebase ilovasini ishga tushirish
const app = initializeApp(firebaseConfig);

// Firebase xizmatlarini eksport qilish
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;