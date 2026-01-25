/**
 * Daily Summary Service
 * Manages pre-aggregated daily calorie totals for efficient stats queries
 */

import {
  doc,
  getDocs,
  runTransaction,
  collection,
  query,
  where,
  orderBy,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getLogicalToday, getDateDaysAgo } from './dateUtils';

/**
 * Get daily summaries for last N days (efficient stats query)
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default 30)
 * @returns {Promise<Array<{date: string, totalCalories: number, entryCount: number}>>}
 */
export async function getDailySummaries(userId, days = 30) {
  const startDateStr = getDateDaysAgo(days);

  const summariesQuery = query(
    collection(db, 'users', userId, 'dailySummaries'),
    where('date', '>=', startDateStr),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(summariesQuery);
  const summaries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Fill missing dates with 0
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateDaysAgo(i);
    const existing = summaries.find(s => s.date === dateStr);
    result.push({
      date: dateStr,
      totalCalories: existing?.totalCalories || 0,
      entryCount: existing?.entryCount || 0,
    });
  }

  return result;
}

/**
 * Update daily summary atomically (called on entry add/update/delete)
 * @param {string} userId - User ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} caloriesDelta - Positive to add, negative to subtract
 * @param {number} countDelta - +1 for add, -1 for delete, 0 for update
 */
export async function updateDailySummary(userId, date, caloriesDelta, countDelta) {
  const summaryRef = doc(db, 'users', userId, 'dailySummaries', date);

  await runTransaction(db, async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);

    let current = { totalCalories: 0, entryCount: 0 };
    if (summaryDoc.exists()) {
      current = summaryDoc.data();
    }

    transaction.set(summaryRef, {
      date,
      totalCalories: Math.max(0, current.totalCalories + caloriesDelta),
      entryCount: Math.max(0, current.entryCount + countDelta),
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Backfill summaries from existing entries (one-time migration)
 * @param {string} userId - User ID
 */
export async function backfillDailySummaries(userId) {
  const entriesSnapshot = await getDocs(collection(db, 'users', userId, 'entries'));

  // If no entries, nothing to backfill
  if (entriesSnapshot.empty) {
    return;
  }

  // Group by date
  const dailyTotals = {};
  entriesSnapshot.docs.forEach(docSnapshot => {
    const entry = docSnapshot.data();
    if (!dailyTotals[entry.date]) {
      dailyTotals[entry.date] = { totalCalories: 0, entryCount: 0 };
    }
    dailyTotals[entry.date].totalCalories += entry.calories;
    dailyTotals[entry.date].entryCount += 1;
  });

  // Batch write summaries
  const batch = writeBatch(db);
  Object.entries(dailyTotals).forEach(([date, data]) => {
    const summaryRef = doc(db, 'users', userId, 'dailySummaries', date);
    batch.set(summaryRef, {
      date,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  });

  await batch.commit();
}

/**
 * Check if user has any daily summaries (for migration check)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function hasDailySummaries(userId) {
  const summariesQuery = query(
    collection(db, 'users', userId, 'dailySummaries'),
    limit(1)
  );
  const snapshot = await getDocs(summariesQuery);
  return !snapshot.empty;
}

/**
 * Calculate streak from pre-fetched summaries
 * Days with 0 calories break the streak
 * @param {Array<{date: string, totalCalories: number}>} dailySummaries - Daily summaries
 * @param {number} dailyGoal - User's daily calorie goal
 * @returns {number} - Current streak count
 */
export function calculateStreak(dailySummaries, dailyGoal) {
  const threshold = dailyGoal * 1.05;
  const today = getLogicalToday();

  // Sort newest first, exclude today
  const sorted = [...dailySummaries]
    .filter(d => d.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const day of sorted) {
    // Must have logged AND be at or below threshold
    if (day.totalCalories > 0 && day.totalCalories <= threshold) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
