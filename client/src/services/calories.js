/**
 * Calorie Tracking Service
 * Functions for managing user goals and food entry logging
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  deleteField,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get user's daily calorie goal
 */
export async function getUserGoal(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().dailyCalorieGoal || 2000;
    }
    return 2000; // Default
  } catch (error) {
    console.error('Error getting user goal:', error);
    throw error;
  }
}

/**
 * Update user's daily calorie goal
 * Uses setDoc with merge to create doc if it doesn't exist
 */
export async function setUserGoal(userId, goal) {
  try {
    await setDoc(doc(db, 'users', userId), {
      dailyCalorieGoal: goal,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user goal:', error);
    throw error;
  }
}

/**
 * Add a food entry (food-based or custom)
 * @param {string} userId - User ID
 * @param {string|null} foodId - Food ID (null for custom entries)
 * @param {string} foodName - Food name or custom name for display
 * @param {number|null} grams - Amount in grams (null for custom entries)
 * @param {number} calories - Pre-calculated or direct calories
 */
export async function addEntry(userId, foodId, foodName, grams, calories) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const entryData = {
      date: today,
      foodName,
      calories: Number(calories),
      entryTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Only include foodId and grams for food-based entries
    if (foodId) {
      entryData.foodId = foodId;
      entryData.grams = Number(grams);
    }

    const docRef = await addDoc(collection(db, 'users', userId, 'entries'), entryData);
    return { id: docRef.id, ...entryData };
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
}

/**
 * Get all entries for today for a specific user
 */
export async function getTodaysEntries(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const entriesQuery = query(
      collection(db, 'users', userId, 'entries'),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(entriesQuery);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by entryTime in JavaScript instead of Firestore
    return entries.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
  } catch (error) {
    console.error('Error getting todays entries:', error);
    throw error;
  }
}

/**
 * Update an existing entry (food-based or custom)
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 * @param {string|null} foodId - Food ID (null for custom entries)
 * @param {string} foodName - Food name or custom name
 * @param {number|null} grams - Amount in grams (null for custom entries)
 * @param {number} calories - Pre-calculated or direct calories
 */
export async function updateEntry(userId, entryId, foodId, foodName, grams, calories) {
  try {
    const updateData = {
      foodName,
      calories: Number(calories),
      updatedAt: new Date().toISOString(),
    };

    // For food-based entries, include foodId and grams
    // For custom entries, explicitly remove them using deleteField
    if (foodId) {
      updateData.foodId = foodId;
      updateData.grams = Number(grams);
    } else {
      // Remove food-specific fields when converting to custom entry
      updateData.foodId = deleteField();
      updateData.grams = deleteField();
    }

    await updateDoc(doc(db, 'users', userId, 'entries', entryId), updateData);
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
}

/**
 * Delete an entry
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 */
export async function deleteEntry(userId, entryId) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'entries', entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}
