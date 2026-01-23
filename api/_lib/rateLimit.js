/**
 * Rate Limiting using Firestore
 * Implements a sliding window rate limiter using Firestore transactions
 * to ensure concurrency safety across multiple serverless function instances.
 *
 * USDA FoodData Central limit: 1,000 requests per hour per IP (API key)
 * We use a conservative limit to avoid hitting the threshold.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 800; // Conservative limit (USDA allows 1000/hour)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_DOC_PATH = 'system/usda-rate-limit';

// Initialize Firebase Admin SDK (singleton pattern)
function getFirestoreDb() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
      return null;
    }

    try {
      const credentials = JSON.parse(serviceAccount);
      initializeApp({
        credential: cert(credentials),
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      return null;
    }
  }

  return getFirestore();
}

/**
 * Check and update rate limit using Firestore transaction
 * This ensures atomic read-modify-write to prevent race conditions
 *
 * @returns {Promise<{allowed: boolean, retryAfter?: number}>}
 */
export async function checkRateLimit() {
  const db = getFirestoreDb();

  if (!db) {
    // If we can't connect to Firestore, allow the request but log warning
    console.warn('Rate limiter: Firestore not available, allowing request');
    return { allowed: true };
  }

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docRef = db.doc(RATE_LIMIT_DOC_PATH);
      const doc = await transaction.get(docRef);

      let requests = [];

      if (doc.exists) {
        const data = doc.data();
        // Filter out requests outside the current window
        requests = (data.requests || []).filter(timestamp => timestamp > windowStart);
      }

      // Check if we're at the limit
      if (requests.length >= RATE_LIMIT_MAX_REQUESTS) {
        // Find the oldest request in the window to calculate retry time
        const oldestRequest = Math.min(...requests);
        const retryAfter = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW_MS - now) / 1000);

        return {
          allowed: false,
          retryAfter: Math.max(retryAfter, 60), // At least 60 seconds
        };
      }

      // Add current request timestamp
      requests.push(now);

      // Update the document
      transaction.set(docRef, {
        requests: requests,
        lastUpdated: FieldValue.serverTimestamp(),
        requestCount: requests.length,
      });

      return { allowed: true };
    });

    return result;

  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    // This prevents rate limit failures from blocking all USDA requests
    return { allowed: true };
  }
}

/**
 * Get current rate limit status (for monitoring/debugging)
 * @returns {Promise<{currentCount: number, maxRequests: number, windowMs: number}>}
 */
export async function getRateLimitStatus() {
  const db = getFirestoreDb();

  if (!db) {
    return { currentCount: 0, maxRequests: RATE_LIMIT_MAX_REQUESTS, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  try {
    const doc = await db.doc(RATE_LIMIT_DOC_PATH).get();

    if (!doc.exists) {
      return { currentCount: 0, maxRequests: RATE_LIMIT_MAX_REQUESTS, windowMs: RATE_LIMIT_WINDOW_MS };
    }

    const data = doc.data();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const currentRequests = (data.requests || []).filter(timestamp => timestamp > windowStart);

    return {
      currentCount: currentRequests.length,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    };

  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return { currentCount: 0, maxRequests: RATE_LIMIT_MAX_REQUESTS, windowMs: RATE_LIMIT_WINDOW_MS };
  }
}
