/**
 * Date Utilities
 * Handles date calculations with Switzerland timezone and 3 AM day boundary
 */

const SWITZERLAND_TIMEZONE = 'Europe/Zurich';
const DAY_START_HOUR = 3; // Day starts at 3 AM

/**
 * Get the "logical" today's date string (YYYY-MM-DD) based on Switzerland timezone
 * with a 3 AM cutoff. Before 3 AM, it's still considered "yesterday".
 *
 * @param {Date} [date] - Optional date to calculate from (defaults to now)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getLogicalToday(date = new Date()) {
  // Get the current time in Switzerland
  const swissTime = new Date(date.toLocaleString('en-US', { timeZone: SWITZERLAND_TIMEZONE }));

  // If it's before 3 AM, subtract a day
  if (swissTime.getHours() < DAY_START_HOUR) {
    swissTime.setDate(swissTime.getDate() - 1);
  }

  // Format as YYYY-MM-DD
  const year = swissTime.getFullYear();
  const month = String(swissTime.getMonth() + 1).padStart(2, '0');
  const day = String(swissTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to YYYY-MM-DD string in Switzerland timezone
 * (without the 3 AM adjustment - for historical dates)
 *
 * @param {Date} date - Date to convert
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatDateSwiss(date) {
  const swissTime = new Date(date.toLocaleString('en-US', { timeZone: SWITZERLAND_TIMEZONE }));

  const year = swissTime.getFullYear();
  const month = String(swissTime.getMonth() + 1).padStart(2, '0');
  const day = String(swissTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get a date N days ago from the logical today
 *
 * @param {number} daysAgo - Number of days to go back
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateDaysAgo(daysAgo) {
  const today = new Date();
  // Get Switzerland time
  const swissTime = new Date(today.toLocaleString('en-US', { timeZone: SWITZERLAND_TIMEZONE }));

  // Adjust for 3 AM boundary
  if (swissTime.getHours() < DAY_START_HOUR) {
    swissTime.setDate(swissTime.getDate() - 1);
  }

  // Subtract the days
  swissTime.setDate(swissTime.getDate() - daysAgo);

  const year = swissTime.getFullYear();
  const month = String(swissTime.getMonth() + 1).padStart(2, '0');
  const day = String(swissTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
