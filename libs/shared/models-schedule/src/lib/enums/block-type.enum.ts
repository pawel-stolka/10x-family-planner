/**
 * Block Type Enum
 * 
 * Categorizes different types of time blocks in a weekly schedule.
 * Matches database enum: block_type
 */
export enum BlockType {
  /** Work-related activities (e.g., meetings, tasks) */
  WORK = 'WORK',
  
  /** Personal activities (e.g., fitness, hobbies, family time) */
  ACTIVITY = 'ACTIVITY',
  
  /** Meal times (breakfast, lunch, dinner) */
  MEAL = 'MEAL',
  
  /** Other activities that don't fit the above categories */
  OTHER = 'OTHER',
}
