/**
 * Firebase Configuration
 * Supports separate dev and prod Firebase projects
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Development Firebase config
const devConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_DEV_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_DEV_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_DEV_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_DEV_APP_ID,
};

// Production Firebase config
const prodConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PROD_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_PROD_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROD_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_PROD_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_PROD_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_PROD_APP_ID,
};

// Use production config if NODE_ENV is production, otherwise use dev
const isDevelopment = import.meta.env.MODE === 'development';
const firebaseConfig = isDevelopment ? devConfig : prodConfig;

console.log(`🔥 Firebase: Using ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} database`);
console.log(`🔥 Firebase Project ID: ${firebaseConfig.projectId}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
