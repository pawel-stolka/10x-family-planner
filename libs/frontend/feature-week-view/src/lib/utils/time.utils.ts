/**
 * Time utilities for Week Grid Calendar
 */

/**
 * Parse time string (HH:mm) to total minutes since midnight
 * @example parseTime("09:30") => 570
 */
export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes to time string (HH:mm)
 * @example formatTime(570) => "09:30"
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calculate duration between two times
 * @example calculateDuration("09:00", "11:30") => "2h 30min"
 */
export function calculateDuration(startTime: string, endTime: string): string {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const diffMinutes = end - start;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}min`;
  }
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Check if time range is valid (end > start)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }
  return parseTime(endTime) > parseTime(startTime);
}

/**
 * Generate time slots array between start and end hour
 * @example generateTimeSlots(9, 12) => ["09:00", "10:00", "11:00", "12:00"]
 */
export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(formatTime(hour * 60));
  }
  return slots;
}

/**
 * Calculate proportional height for activity in cell
 * @param startTime Activity start time
 * @param endTime Activity end time
 * @param slotStartTime Slot start time
 * @param slotEndTime Slot end time (slotStartTime + 1 hour)
 * @returns Proportional height 0.0-1.0
 */
export function calculateProportionalHeight(
  startTime: string,
  endTime: string,
  slotStartTime: string
): number {
  const activityStart = parseTime(startTime);
  const activityEnd = parseTime(endTime);
  const slotStart = parseTime(slotStartTime);
  const slotEnd = slotStart + 60; // One hour slot

  // Calculate overlap between activity and slot
  const overlapStart = Math.max(activityStart, slotStart);
  const overlapEnd = Math.min(activityEnd, slotEnd);
  const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

  // Return proportion of slot occupied (0.0 - 1.0)
  return overlapMinutes / 60;
}

/**
 * Check if activity overlaps with time slot
 */
export function overlapsWithSlot(
  activityStart: string,
  activityEnd: string,
  slotTime: string
): boolean {
  const start = parseTime(activityStart);
  const end = parseTime(activityEnd);
  const slot = parseTime(slotTime);
  const slotEnd = slot + 60;

  return start < slotEnd && end > slot;
}

/**
 * Extract hour from time string (HH:mm)
 */
export function getHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

/**
 * Get minutes from time string (HH:mm)
 */
export function getMinutes(time: string): number {
  return parseInt(time.split(':')[1], 10);
}

/**
 * Format duration in minutes to human-readable string
 * @example formatDurationMinutes(150) => "2h 30min"
 */
export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

/**
 * Build time range from day and time strings
 * @param day ISO date string (e.g., "2026-01-20")
 * @param startTime Time string in HH:mm format (e.g., "17:00")
 * @param endTime Time string in HH:mm format (e.g., "18:00")
 * @returns Time range with ISO datetime strings
 * @example buildTimeRange("2026-01-20", "17:00", "18:00") => { start: "2026-01-20T17:00:00Z", end: "2026-01-20T18:00:00Z" }
 */
export function buildTimeRange(
  day: string,
  startTime: string,
  endTime: string
): { start: string; end: string } {
  // Combine day with time to create ISO datetime strings
  // Format: YYYY-MM-DDTHH:mm:ssZ
  const start = `${day}T${startTime}:00Z`;
  const end = `${day}T${endTime}:00Z`;

  return { start, end };
}