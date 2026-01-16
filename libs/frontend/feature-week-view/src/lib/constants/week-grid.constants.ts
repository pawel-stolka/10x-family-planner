import { BlockType } from '@family-planner/shared/models-schedule';

/**
 * Constants for Week Grid Calendar
 */

/**
 * Member colors (default palette)
 */
export const MEMBER_COLORS: Record<string, string> = {
  tata: '#2563eb', // blue-600
  mama: '#db2777', // pink-600
  hania: '#f97316', // orange-500
  małgosia: '#16a34a', // green-600
  monisia: '#7c3aed', // violet-600
};

/**
 * Fallback palette for non-mapped member IDs
 */
export const MEMBER_COLOR_PALETTE: string[] = [
  '#2563eb', // blue-600
  '#db2777', // pink-600
  '#f97316', // orange-500
  '#16a34a', // green-600
  '#7c3aed', // violet-600
  '#dc2626', // red-600
  '#0ea5e9', // sky-500
];

/**
 * Get deterministic color for member ID
 */
export const getMemberColor = (memberId: string): string => {
  if (MEMBER_COLORS[memberId]) {
    return MEMBER_COLORS[memberId];
  }

  const hash = memberId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MEMBER_COLOR_PALETTE[hash % MEMBER_COLOR_PALETTE.length];
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
