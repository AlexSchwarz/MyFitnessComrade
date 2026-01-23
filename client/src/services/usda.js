/**
 * USDA Service
 * Client-side functions for searching and fetching USDA food data
 * All requests go through the Vercel serverless proxy to keep the API key secure
 */

import { auth } from '../config/firebase';

/**
 * Get the current user's ID token for API authentication
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to search USDA foods');
  }
  return user.getIdToken();
}

/**
 * Search USDA FoodData Central
 * @param {string} query - Search query (min 2 characters)
 * @param {number} pageSize - Number of results per page (default 25)
 * @param {number} pageNumber - Page number (1-indexed)
 * @returns {Promise<{foods: Array, totalHits: number, currentPage: number, totalPages: number}>}
 */
export async function searchUSDAFoods(query, pageSize = 25, pageNumber = 1) {
  if (!query || query.length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const token = await getAuthToken();

  const params = new URLSearchParams({
    query,
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });

  const response = await fetch(`/api/usda-search?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new USDAError(
        'USDA search is temporarily unavailable. Please try again later.',
        'RATE_LIMITED',
        errorData.retryAfter
      );
    }

    if (response.status === 401) {
      throw new USDAError('Authentication required. Please log in again.', 'UNAUTHORIZED');
    }

    throw new USDAError(
      errorData.error || 'Failed to search USDA foods',
      'SEARCH_ERROR'
    );
  }

  return response.json();
}

/**
 * Get detailed food information from USDA
 * @param {string} fdcId - USDA FoodData Central ID
 * @returns {Promise<{fdcId: string, description: string, dataType: string, brandOwner: string|null, caloriesPer100g: number|null, hasCalorieData: boolean}>}
 */
export async function getUSDAFoodDetails(fdcId) {
  if (!fdcId) {
    throw new Error('fdcId is required');
  }

  const token = await getAuthToken();

  const response = await fetch(`/api/usda-food?fdcId=${encodeURIComponent(fdcId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new USDAError(
        'USDA search is temporarily unavailable. Please try again later.',
        'RATE_LIMITED',
        errorData.retryAfter
      );
    }

    if (response.status === 401) {
      throw new USDAError('Authentication required. Please log in again.', 'UNAUTHORIZED');
    }

    if (response.status === 404) {
      throw new USDAError('Food not found', 'NOT_FOUND');
    }

    throw new USDAError(
      errorData.error || 'Failed to fetch food details',
      'FETCH_ERROR'
    );
  }

  return response.json();
}

/**
 * Custom error class for USDA-related errors
 */
export class USDAError extends Error {
  constructor(message, code, retryAfter = null) {
    super(message);
    this.name = 'USDAError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}
