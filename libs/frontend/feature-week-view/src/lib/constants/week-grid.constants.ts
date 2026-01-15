import { BlockType } from '@family-planner/shared/models-schedule';

/**
 * Constants for Week Grid Calendar
 */

/**
 * Member colors (default palette)
 */
export const MEMBER_COLORS: Record<string, string> = {
  tata: '#3b82f6', // blue-500
  mama: '#ec4899', // pink-500
  hania: '#f59e0b', // amber-500
  małgosia: '#10b981', // emerald-500
  monika: '#a855f7', // purple-500
};

/**
 * Default member order for display
 */
export const MEMBER_ORDER: string[] = ['tata', 'mama', 'hania', 'małgosia', 'monika'];

/**
 * Activity type icons
 */
export const ACTIVITY_ICONS: Record<BlockType, string> = {
  [BlockType.WORK]: '💼',
  [BlockType.ACTIVITY]: '⚽',
  [BlockType.MEAL]: '🍽️',
  [BlockType.OTHER]: '📌',
};

/**
 * Cell height in pixels
 */
export const CELL_HEIGHT = 36;

/**
 * Minimum activity height in pixels (for readability)
 */
export const MIN_ACTIVITY_HEIGHT = 16;

/**
 * Time column width in pixels
 */
export const TIME_COLUMN_WIDTH = 80;

/**
 * Grid gap in pixels
 */
export const GRID_GAP = 1;

/**
 * Default time range (hours)
 */
export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 23;

/**
 * Polish day names
 */
export const DAY_NAMES: string[] = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
];

/**
 * Polish short day names
 */
export const SHORT_DAY_NAMES: string[] = [
  'Pon',
  'Wt',
  'Śr',
  'Czw',
  'Pt',
  'Sob',
  'Nie',
];

/**
 * Debounce delay for filter changes (ms)
 */
export const FILTER_DEBOUNCE_DELAY = 150;

/**
 * Tooltip show delay (ms)
 */
export const TOOLTIP_DELAY = 10;

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATION = {
  fade: 200,
  slideIn: 200,
  tooltipFade: 100,
};
