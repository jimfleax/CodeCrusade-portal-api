/**
 * Calculate the percentage of attendance.
 * @param present - number of present days
 * @param total - total number of expected days
 * @returns percentage rounded to 2 decimal places
 */
export const calculateAttendancePercentage = (present: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
};

/**
 * Calculate the completion percentage for a given day.
 * @param marked - number of students marked
 * @param expected - total number of students expected
 * @returns percentage rounded to 2 decimal places
 */
export const calculateDayCompletion = (marked: number, expected: number): number => {
  if (expected === 0) return 0;
  return Number(((marked / expected) * 100).toFixed(2));
};
