// Firebase konfiguratsiyasi
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase konfiguratsiya obyekti
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcEX52KvfyWY7tpIA6s4gcSVKAjT4Z9GQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tortbazar.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tortbazar",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tortbazar.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "637277734867",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:637277734867:web:98dc476e1cc7c202d25126",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZEY7PY1BVX"
};

// Environment variables tekshirish
console.log('🔍 Environment variables debug:', {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  allEnvVars: import.meta.env
});

// Firebase konfiguratsiyasini tekshirish - faqat real missing values uchun
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => {
  const value = firebaseConfig[key as keyof typeof firebaseConfig];
  return !value || value === '' || value === 'undefined';
});

console.log('🔍 Firebase configuration:', {
  config: firebaseConfig,
  missingKeys,
  allKeysPresent: missingKeys.length === 0
});

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
  console.log('🚀 Firebase initialization starting...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Analytics faqat production environment'da
  try {
    analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.warn('⚠️ Analytics initialization failed (normal in development):', analyticsError);
  }
  
  console.log('✅ Firebase muvaffaqiyatli ishga tushirildi', {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    analytics: !!analytics
  });
} catch (error) {
  console.error('❌ Firebase ishga tushirishda xato:', error);
  console.error('Config used:', firebaseConfig);
  throw error;
}

// Firebase xizmatlarini eksport qilish
export { auth, db, storage, analytics };
export default app;