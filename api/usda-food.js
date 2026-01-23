/**
 * USDA Food Details Proxy
 * Vercel Serverless Function that fetches food details from USDA FoodData Central API
 *
 * This keeps the USDA API key server-side only and enforces rate limiting.
 */

import { verifyFirebaseToken } from './_lib/auth.js';
import { checkRateLimit } from './_lib/rateLimit.js';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs for energy (calories)
const ENERGY_NUTRIENT_IDS = [1008, 2047, 2048]; // Energy (kcal), Energy (Atwater General Factors), Energy (Atwater Specific Factors)

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

    // Get fdcId from query
    const { fdcId } = req.query;

    if (!fdcId) {
      return res.status(400).json({ error: 'fdcId is required' });
    }

    // Get USDA API key from environment
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.error('USDA_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Call USDA FoodData Central API for food details
    const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${apiKey}`);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Food not found' });
      }
      console.error('USDA API error:', response.status, await response.text());
      return res.status(502).json({ error: 'Failed to fetch from USDA API' });
    }

    const data = await response.json();

    // Extract calories per 100g from nutrients
    let caloriesPer100g = null;
    const nutrients = data.foodNutrients || [];

    // Try to find energy in kcal
    for (const nutrient of nutrients) {
      const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
      const nutrientName = (nutrient.nutrient?.name || nutrient.name || '').toLowerCase();

      // Check if this is an energy nutrient
      if (ENERGY_NUTRIENT_IDS.includes(nutrientId) || nutrientName.includes('energy')) {
        const unit = (nutrient.nutrient?.unitName || nutrient.unitName || '').toLowerCase();

        // Only use kcal values
        if (unit === 'kcal') {
          // For most USDA foods, nutrient values are already per 100g
          // Check if there's an amount field
          const value = nutrient.amount || nutrient.value;
          if (value !== undefined && value !== null) {
            caloriesPer100g = Math.round(value);
            break;
          }
        }
      }
    }

    // Transform response
    const transformedFood = {
      fdcId: data.fdcId,
      description: data.description,
      dataType: data.dataType,
      brandOwner: data.brandOwner || null,
      brandName: data.brandName || null,
      caloriesPer100g: caloriesPer100g,
      servingSize: data.servingSize || null,
      servingSizeUnit: data.servingSizeUnit || null,
      // Include raw nutrients for debugging if calories couldn't be determined
      hasCalorieData: caloriesPer100g !== null,
    };

    return res.status(200).json(transformedFood);

  } catch (error) {
    console.error('USDA food details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
