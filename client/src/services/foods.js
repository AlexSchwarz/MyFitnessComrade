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
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get all foods for a user
 */
export async function getUserFoods(userId) {
  try {
    console.log('🔍 Fetching foods for user:', userId);
    const foodsQuery = query(
      collection(db, 'users', userId, 'foods'),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(foodsQuery);
    const foods = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('✅ Found foods:', foods.length, foods);
    return foods;
  } catch (error) {
    console.error('❌ Error getting foods:', error);
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
