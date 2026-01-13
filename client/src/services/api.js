/**
 * API service for communicating with the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function getHealth() {
  return apiFetch('/api/health');
}

/**
 * Log a value to the server console
 * @param {string} value - The value to log
 */
export async function logValue(value) {
  return apiFetch('/api/health/log', {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export default {
  getHealth,
  logValue,
};
