/**
 * USDA Service
 * Client-side functions for searching and fetching USDA food data
 * All requests go through the Vercel serverless proxy to keep the API key secure
 *
 * In local development (npm run dev), falls back to mock data when API is unavailable
 */

import { auth } from '../config/firebase';
import { searchMockUSDAFoods, getMockUSDAFoodDetails } from './usdaMock';

// Track if we should use mock data (set after first API failure in dev mode)
const isDev = import.meta.env.DEV;
let useMockData = false;

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

  // Use mock data if enabled (dev mode without API)
  if (useMockData) {
    console.log('[USDA] Using mock data for search:', query);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return searchMockUSDAFoods(query, pageSize, pageNumber);
  }

  try {
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

    // Check if we got HTML instead of JSON (happens when API routes don't exist)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('API not available');
    }

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
  } catch (error) {
    // In dev mode, fall back to mock data if API is unavailable
    if (isDev && (error.message === 'API not available' || error.name === 'TypeError')) {
      console.warn('[USDA] API unavailable, switching to mock data for development');
      useMockData = true;
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return searchMockUSDAFoods(query, pageSize, pageNumber);
    }
    throw error;
  }
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

  // Use mock data if enabled (dev mode without API)
  if (useMockData) {
    console.log('[USDA] Using mock data for details:', fdcId);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const mockFood = getMockUSDAFoodDetails(fdcId);
    if (!mockFood) {
      throw new USDAError('Food not found', 'NOT_FOUND');
    }
    return mockFood;
  }

  try {
    const token = await getAuthToken();

    const response = await fetch(`/api/usda-food?fdcId=${encodeURIComponent(fdcId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Check if we got HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('API not available');
    }

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
  } catch (error) {
    // In dev mode, fall back to mock data if API is unavailable
    if (isDev && (error.message === 'API not available' || error.name === 'TypeError')) {
      console.warn('[USDA] API unavailable, using mock data for development');
      useMockData = true;
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));
      const mockFood = getMockUSDAFoodDetails(fdcId);
      if (!mockFood) {
        throw new USDAError('Food not found', 'NOT_FOUND');
      }
      return mockFood;
    }
    throw error;
  }
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
