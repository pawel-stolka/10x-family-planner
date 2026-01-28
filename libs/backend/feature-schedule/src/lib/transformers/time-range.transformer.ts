import { ValueTransformer } from 'typeorm';
import { TimeRange } from '@family-planner/shared-models-schedule';

/**
 * TypeORM Value Transformer for PostgreSQL TSTZRANGE type
 *
 * Converts between PostgreSQL TSTZRANGE string format and TypeScript TimeRange object.
 *
 * PostgreSQL format: '[2026-01-13T06:00:00Z,2026-01-13T07:00:00Z)'
 * TypeScript format: { start: Date, end: Date }
 */
export class TimeRangeTransformer implements ValueTransformer {
  /**
   * Transform TimeRange object to PostgreSQL TSTZRANGE string
   * @param value TimeRange object with start and end dates
   * @returns PostgreSQL TSTZRANGE formatted string
   */
  to(value: TimeRange | null | undefined): string | null {
    if (!value || !value.start || !value.end) {
      return null;
    }

    const start =
      value.start instanceof Date
        ? value.start.toISOString()
        : new Date(value.start).toISOString();

    const end =
      value.end instanceof Date
        ? value.end.toISOString()
        : new Date(value.end).toISOString();

    return `[${start},${end})`;
  }

  /**
   * Transform PostgreSQL TSTZRANGE string to TimeRange object
   * @param value PostgreSQL TSTZRANGE formatted string
   * @returns TimeRange object with Date instances
   */
  from(value: string | null | undefined): TimeRange | null {
    if (!value) {
      return null;
    }

    // PostgreSQL TSTZRANGE format: '[start,end)' or '(start,end]' etc.
    const matches = value.match(/[[(](.+?),(.+?)[\])]/);

    if (!matches || matches.length < 3) {
      return null;
    }

    return {
      start: new Date(matches[1]),
      end: new Date(matches[2]),
    };
  }
}
