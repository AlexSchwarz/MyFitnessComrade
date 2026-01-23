/**
 * Foods Service
 * Functions for managing user's food library
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get all foods for a user
 */
export async function getUserFoods(userId) {
  try {
    const foodsQuery = query(
      collection(db, 'users', userId, 'foods'),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(foodsQuery);
    const foods = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return foods;
  } catch (error) {
    console.error('Error getting user foods:', error);
    throw error;
  }
}

/**
 * Get a single food by ID
 * @param {string} userId - User ID
 * @param {string} foodId - Food ID
 */
export async function getFood(userId, foodId) {
  try {
    const foodDoc = await getDoc(doc(db, 'users', userId, 'foods', foodId));
    if (foodDoc.exists()) {
      return { id: foodDoc.id, ...foodDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting food:', error);
    throw error;
  }
}

/**
 * Add a new food
 * @param {string} userId - User ID
 * @param {string} name - Food name
 * @param {number} caloriesPer100g - Calories per 100g
 */
export async function addFood(userId, name, caloriesPer100g) {
  try {
    const foodData = {
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'foods'), foodData);
    return { id: docRef.id, ...foodData };
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
}

/**
 * Update a food
 * @param {string} userId - User ID
 * @param {string} foodId - Food ID
 * @param {string} name - Food name
 * @param {number} caloriesPer100g - Calories per 100g
 */
export async function updateFood(userId, foodId, name, caloriesPer100g) {
  try {
    await updateDoc(doc(db, 'users', userId, 'foods', foodId), {
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating food:', error);
    throw error;
  }
}

/**
 * Delete a food
 * @param {string} userId - User ID
 * @param {string} foodId - Food ID
 */
export async function deleteFood(userId, foodId) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'foods', foodId));
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
}

/**
 * Calculate calories for a given amount of grams
 */
export function calculateCalories(caloriesPer100g, grams) {
  return Math.round((grams / 100) * caloriesPer100g);
}

/**
 * Seed default foods for a user
 */
export async function seedDefaultFoods(userId) {
  const defaultFoods = {
    "Chicken": 120,
    "Zucchini": 16,
    "Paprika": 26,
    "Carrots": 41,
    "Sunflower Oil": 884,
    "Halb Rahm": 247,
    "Tortilla Wrap": 312,
    "Basmati Rice": 354,
    "Minced Meat": 215
  };

  const results = [];
  for (const [name, calories] of Object.entries(defaultFoods)) {
    const food = await addFood(userId, name, calories);
    results.push(food);
  }
  return results;
}

/**
 * Find a food by USDA fdcId
 * @param {string} userId - User ID
 * @param {string} fdcId - USDA FoodData Central ID
 * @returns {Promise<object|null>} The food if found, null otherwise
 */
export async function findFoodByFdcId(userId, fdcId) {
  try {
    const foodsQuery = query(
      collection(db, 'users', userId, 'foods'),
      where('fdcId', '==', fdcId)
    );

    const querySnapshot = await getDocs(foodsQuery);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error finding food by fdcId:', error);
    throw error;
  }
}

/**
 * Import a food from USDA
 * @param {string} userId - User ID
 * @param {object} usdaFood - USDA food data
 * @param {string} usdaFood.fdcId - USDA FoodData Central ID
 * @param {string} usdaFood.name - Food name/description
 * @param {number} usdaFood.caloriesPer100g - Calories per 100g
 * @param {string} usdaFood.dataType - USDA data type (Foundation, Branded, etc.)
 * @param {string|null} usdaFood.brandOwner - Brand owner (for branded foods)
 * @returns {Promise<object>} The imported food document
 */
export async function importUSDAFood(userId, usdaFood) {
  try {
    // Check for existing import
    const existing = await findFoodByFdcId(userId, usdaFood.fdcId);
    if (existing) {
      return { ...existing, alreadyExists: true };
    }

    const foodData = {
      name: usdaFood.name.trim(),
      caloriesPer100g: Number(usdaFood.caloriesPer100g),
      source: 'usda',
      fdcId: usdaFood.fdcId,
      dataType: usdaFood.dataType || null,
      brandOwner: usdaFood.brandOwner || null,
      importedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'foods'), foodData);
    return { id: docRef.id, ...foodData };
  } catch (error) {
    console.error('Error importing USDA food:', error);
    throw error;
  }
}
