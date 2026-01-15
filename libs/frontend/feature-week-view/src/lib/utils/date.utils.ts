/**
 * Date utilities for Week Grid Calendar
 */

/**
 * Get Monday of the week for given date
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday = 0, need to go back 6 days
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate array of dates for week (7 days from Monday to Sunday)
 */
export function eachDayOfWeek(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
}

/**
 * Parse ISO date string to Date
 */
export function parseISODate(isoDate: string): Date {
  return new Date(isoDate);
}

/**
 * Get day of week (0=Monday, 6=Sunday)
 */
export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday from 0 to 6
}

/**
 * Format date for display (dd.MM)
 */
export function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

/**
 * Format date for display with year (dd.MM.yyyy)
 */
export function formatDisplayDateWithYear(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
