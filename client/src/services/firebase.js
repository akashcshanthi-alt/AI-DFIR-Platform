import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD1c__xmTlsdRpp1c3ZZ_aWITkmxCdHyZ4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-dfir-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-dfir-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-dfir-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "599874463432",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:599874463432:web:d79c8e67405029204727fd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WX3S4SM70S"
};

// Initialize Firebase App (called only once)
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider with select_account prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export popup sign-in method
export { signInWithPopup };

/**
 * Helper to resolve user's display name gracefully.
 * Prioritizes actual display names, fallback to formatted email prefix, or default role.
 */
export const getResolvedUserName = (user, fallbackName) => {
  const isGeneric = (str) => !str || str === 'Security Analyst' || str === 'Operator' || !str.trim();

  // 1. Check user.displayName
  if (user?.displayName && !isGeneric(user.displayName)) {
    return user.displayName.trim();
  }

  // 2. Check fallbackName (e.g. from localStorage or API response)
  if (fallbackName && !isGeneric(fallbackName)) {
    return fallbackName.trim();
  }

  // 3. Derive from email address
  const email = user?.email || (typeof localStorage !== 'undefined' ? localStorage.getItem('operatorEmail') : '');
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    const formatted = prefix
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (formatted) return formatted;
  }

  // 4. Return non-empty fallbackName if present
  if (fallbackName && fallbackName.trim()) {
    return fallbackName.trim();
  }

  // 5. Default fallback role
  return 'Investigator';
};

