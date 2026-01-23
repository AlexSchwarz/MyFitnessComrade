/**
 * Mock USDA Data for Local Development
 * Used when running npm run dev without Vercel serverless functions
 */

// Sample USDA foods for testing UI
export const mockUSDAFoods = [
  {
    fdcId: '171705',
    description: 'Chicken breast, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 120,
  },
  {
    fdcId: '173944',
    description: 'Salmon, Atlantic, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 208,
  },
  {
    fdcId: '170567',
    description: 'Broccoli, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 34,
  },
  {
    fdcId: '173757',
    description: 'Rice, white, long-grain, regular, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 365,
  },
  {
    fdcId: '173430',
    description: 'Egg, whole, raw, fresh',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 143,
  },
  {
    fdcId: '174608',
    description: 'Beef, ground, 80% lean / 20% fat, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 254,
  },
  {
    fdcId: '169655',
    description: 'Apple, raw, with skin',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 52,
  },
  {
    fdcId: '170393',
    description: 'Banana, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 89,
  },
  {
    fdcId: '2346053',
    description: 'KIRKLAND SIGNATURE, Organic Peanut Butter',
    dataType: 'Branded',
    brandOwner: 'Costco Wholesale Corporation',
    caloriesPer100g: 600,
  },
  {
    fdcId: '2003590',
    description: 'Greek Yogurt, Plain, Nonfat',
    dataType: 'Branded',
    brandOwner: 'Chobani, LLC',
    caloriesPer100g: 59,
  },
  {
    fdcId: '171287',
    description: 'Oats, regular and quick, dry',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 389,
  },
  {
    fdcId: '170050',
    description: 'Avocado, raw',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 160,
  },
  {
    fdcId: '999999',
    description: 'Test Food Without Calories',
    dataType: 'Experimental',
    brandOwner: 'Test Brand',
    caloriesPer100g: null,
  },
];

/**
 * Search mock USDA foods
 * @param {string} query - Search query
 * @param {number} pageSize - Results per page
 * @param {number} pageNumber - Page number (1-indexed)
 */
export function searchMockUSDAFoods(query, pageSize = 25, pageNumber = 1) {
  const lowerQuery = query.toLowerCase();

  // Filter foods that match the query
  const matches = mockUSDAFoods.filter(food =>
    food.description.toLowerCase().includes(lowerQuery) ||
    (food.brandOwner && food.brandOwner.toLowerCase().includes(lowerQuery))
  );

  // Paginate
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFoods = matches.slice(startIndex, endIndex);

  return {
    foods: paginatedFoods,
    totalHits: matches.length,
    currentPage: pageNumber,
    totalPages: Math.ceil(matches.length / pageSize),
  };
}

/**
 * Get mock food details
 * @param {string} fdcId - USDA FDC ID
 */
export function getMockUSDAFoodDetails(fdcId) {
  const food = mockUSDAFoods.find(f => f.fdcId === fdcId);

  if (!food) {
    return null;
  }

  return {
    ...food,
    hasCalorieData: food.caloriesPer100g !== null,
  };
}
