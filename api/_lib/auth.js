/**
 * Firebase Authentication Verification
 * Verifies Firebase ID tokens for serverless function authentication
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK (singleton pattern)
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    // Use service account credentials from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
      return null;
    }

    try {
      // Trim any whitespace that might have been added
      const trimmedAccount = serviceAccount.trim();
      if (!trimmedAccount.startsWith('{')) {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY does not start with {. First 50 chars:', trimmedAccount.substring(0, 50));
        return null;
      }
      const credentials = JSON.parse(trimmedAccount);
      initializeApp({
        credential: cert(credentials),
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
      console.error('Value length:', serviceAccount?.length, 'First 100 chars:', serviceAccount?.substring(0, 100));
      return null;
    }
  }

  return getAuth();
}

/**
 * Verify a Firebase ID token
 * @param {string} idToken - The Firebase ID token to verify
 * @returns {Promise<object|null>} The decoded token or null if invalid
 */
export async function verifyFirebaseToken(idToken) {
  const auth = getFirebaseAdmin();

  if (!auth) {
    console.error('Firebase Admin not initialized');
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}
