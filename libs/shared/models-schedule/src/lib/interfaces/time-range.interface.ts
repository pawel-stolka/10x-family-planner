/**
 * Time Range Interface
 * 
 * Represents a time period with start and end timestamps.
 * Maps to database TSTZRANGE type.
 */
export interface TimeRange {
  /** Start time of the range (ISO 8601 timestamp with timezone) */
  start: Date;
  
  /** End time of the range (ISO 8601 timestamp with timezone) */
  end: Date;
}
