import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';

// Firebase db validation
if (!db) {
  console.error('❌ Firebase Firestore (db) is not initialized! Check your .env configuration.');
  throw new Error('Firebase Firestore is not initialized. Please check your environment variables.');
}

if (!storage) {
  console.warn('⚠️ Firebase Storage is not initialized!');
}

console.log('✅ Firebase services validated:', { db: !!db, storage: !!storage });

export {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  db,
  storage
};