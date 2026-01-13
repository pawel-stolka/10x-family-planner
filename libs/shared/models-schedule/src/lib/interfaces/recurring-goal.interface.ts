/**
 * Recurring Goal Interface
 *
 * Represents a recurring goal that should be scheduled regularly.
 * Maps to database table: recurring_goals
 */
export interface RecurringGoal {
  /** Unique identifier for the recurring goal */
  goalId: string;

  /** Reference to the user who owns this goal */
  userId: string;

  /** Name/title of the goal */
  name: string;

  /** How many times per week this goal should be scheduled */
  frequencyPerWeek: number;

  /** Preferred duration in minutes */
  durationMinutes: number;

  /** Optional reference to associated family member */
  familyMemberId?: string;

  /** Preferences stored as JSON (preferred times, days, etc.) */
  preferences: Record<string, any>;

  /** Timestamp when the goal was created */
  createdAt: Date;

  /** Timestamp when the goal was last updated */
  updatedAt: Date;

  /** Soft delete timestamp (null if not deleted) */
  deletedAt?: Date;
}
