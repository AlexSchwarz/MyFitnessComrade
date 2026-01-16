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
  query,
  where,
  orderBy,
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
 * Add a food entry with food reference
 * @param {string} userId - User ID
 * @param {string} foodId - Food ID
 * @param {string} foodName - Food name (denormalized for display)
 * @param {number} grams - Amount in grams
 * @param {number} calories - Pre-calculated calories
 */
export async function addEntry(userId, foodId, foodName, grams, calories) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const entryData = {
      userId,
      date: today,
      foodId,
      foodName,
      grams: Number(grams),
      calories: Number(calories),
      entryTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'entries'), entryData);
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
      collection(db, 'entries'),
      where('userId', '==', userId),
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
 * Update an existing entry
 * @param {string} entryId - Entry ID
 * @param {string} foodId - Food ID
 * @param {string} foodName - Food name
 * @param {number} grams - Amount in grams
 * @param {number} calories - Pre-calculated calories
 */
export async function updateEntry(entryId, foodId, foodName, grams, calories) {
  try {
    await updateDoc(doc(db, 'entries', entryId), {
      foodId,
      foodName,
      grams: Number(grams),
      calories: Number(calories),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId) {
  try {
    await deleteDoc(doc(db, 'entries', entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}
