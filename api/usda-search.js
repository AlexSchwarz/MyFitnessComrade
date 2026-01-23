/**
 * USDA Food Search Proxy
 * Vercel Serverless Function that proxies requests to USDA FoodData Central API
 *
 * This keeps the USDA API key server-side only and enforces rate limiting.
 */

import { verifyFirebaseToken } from './_lib/auth.js';
import { checkRateLimit } from './_lib/rateLimit.js';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Firebase authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit();
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'USDA search is temporarily unavailable due to rate limiting. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      });
    }

    // Get search parameters
    const { query, pageSize = 25, pageNumber = 1 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Get USDA API key from environment
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.error('USDA_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Call USDA FoodData Central API
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      query: query,
      pageSize: String(pageSize),
      pageNumber: String(pageNumber),
      dataType: 'Foundation,SR Legacy,Branded',
    });

    const response = await fetch(`${USDA_API_BASE}/foods/search?${searchParams}`);

    if (!response.ok) {
      console.error('USDA API error:', response.status, await response.text());
      return res.status(502).json({ error: 'Failed to fetch from USDA API' });
    }

    const data = await response.json();

    // Transform response to only include needed fields (reduce payload size)
    const transformedFoods = (data.foods || []).map(food => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      brandOwner: food.brandOwner || null,
      brandName: food.brandName || null,
    }));

    return res.status(200).json({
      foods: transformedFoods,
      totalHits: data.totalHits || 0,
      currentPage: data.currentPage || pageNumber,
      totalPages: data.totalPages || Math.ceil((data.totalHits || 0) / pageSize),
    });

  } catch (error) {
    console.error('USDA search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
