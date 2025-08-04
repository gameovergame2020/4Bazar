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
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

// BloomFilter xatolarini suppress qilish
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('BloomFilter error') || 
      args[0]?.includes?.('@firebase/firestore: Firestore')) {
    return; // BloomFilter xatolarini yashirish
  }
  originalConsoleError.apply(console, args);
};

try {
  // Agar Firebase konfiguratsiyasi to'liq bo'lsa
  if (missingKeys.length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    analytics = getAnalytics(app);
    console.log('✅ Firebase muvaffaqiyatli ishga tushirildi');
  } else {
    console.warn('⚠️ Firebase konfiguratsiyasi to\'liq emas, Firebase xizmatlar o\'chirilgan');
  }
} catch (error) {
  console.error('❌ Firebase ishga tushirishda xato:', error);
}

// Firebase xizmatlarini eksport qilish
export { auth, db, storage, analytics };
export default app;