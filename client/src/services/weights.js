/**
 * Weight Tracking Service
 * Functions for managing user weight entries
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Add a weight entry
 * @param {string} userId - User ID
 * @param {number} weight - Weight value
 * @param {string} entryTime - ISO timestamp for the entry
 */
export async function addWeightEntry(userId, weight, entryTime) {
  try {
    const entryData = {
      weight: Number(weight),
      entryTime: entryTime,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'weightEntries'), entryData);
    return { id: docRef.id, ...entryData };
  } catch (error) {
    console.error('Error adding weight entry:', error);
    throw error;
  }
}

/**
 * Get weight entries for the last N days
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 */
export async function getWeightEntries(userId, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    const entriesQuery = query(
      collection(db, 'users', userId, 'weightEntries'),
      where('entryTime', '>=', cutoffISO)
    );

    const querySnapshot = await getDocs(entriesQuery);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by entryTime descending (most recent first)
    return entries.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
  } catch (error) {
    console.error('Error getting weight entries:', error);
    throw error;
  }
}

/**
 * Update a weight entry
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 * @param {number} weight - New weight value
 * @param {string} entryTime - ISO timestamp for the entry
 */
export async function updateWeightEntry(userId, entryId, weight, entryTime) {
  try {
    const updateData = {
      weight: Number(weight),
      entryTime: entryTime,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'users', userId, 'weightEntries', entryId), updateData);
  } catch (error) {
    console.error('Error updating weight entry:', error);
    throw error;
  }
}

/**
 * Delete a weight entry
 * @param {string} userId - User ID
 * @param {string} entryId - Entry ID
 */
export async function deleteWeightEntry(userId, entryId) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'weightEntries', entryId));
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw error;
  }
}
