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
  where,
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
      collection(db, 'foods'),
      where('userId', '==', userId),
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
 */
export async function getFood(foodId) {
  try {
    const foodDoc = await getDoc(doc(db, 'foods', foodId));
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
 */
export async function addFood(userId, name, caloriesPer100g) {
  try {
    const foodData = {
      userId,
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'foods'), foodData);
    return { id: docRef.id, ...foodData };
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
}

/**
 * Update a food
 */
export async function updateFood(foodId, name, caloriesPer100g) {
  try {
    await updateDoc(doc(db, 'foods', foodId), {
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
 */
export async function deleteFood(foodId) {
  try {
    await deleteDoc(doc(db, 'foods', foodId));
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
