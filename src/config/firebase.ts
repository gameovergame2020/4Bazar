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

// Firebase konfiguratsiyasini tekshirish
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "AIzaSyBcEX52KvfyWY7tpIA6s4gcSVKAjT4Z9GQ") {
  console.warn('⚠️ Firebase konfiguratsiyasi to\'liq emas. .env faylini to\'ldiring!');
}

// Firebase ilovasini ishga tushirish
const app = initializeApp(firebaseConfig);

// Firebase xizmatlarini eksport qilish
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;