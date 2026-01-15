import { TimeBlock, FamilyMember, BlockType } from '@family-planner/shared/models-schedule';

/**
 * ViewModels for Week Grid Calendar
 */

/**
 * Grid Cell - pojedyncza komórka w siatce tygodniowej
 */
export interface GridCell {
  /** Unikalne ID: `${dayISO}-${timeSlot}` */
  id: string;
  /** Slot czasowy np. "09:00" */
  timeSlot: string;
  /** Data w formacie ISO "2026-01-13" */
  day: string;
  /** Dzień tygodnia: 0=Mon, 6=Sun */
  dayOfWeek: number;
  /** Czy komórka jest pusta */
  isEmpty: boolean;
  /** Lista aktywności w tej komórce */
  activities: ActivityInCell[];
}

/**
 * Activity In Cell - aktywność wyświetlana w komórce
 */
export interface ActivityInCell {
  /** ID aktywności */
  id: string;
  /** Członek rodziny przypisany do aktywności */
  member: FamilyMemberViewModel;
  /** Oryginalne dane bloku czasowego */
  block: TimeBlockViewModel;
  /** Czy aktywność jest wspólna (family) */
  isShared: boolean;
  /** Czy występuje konflikt z inną aktywnością */
  hasConflict: boolean;
  /** Proporcjonalna wysokość w komórce: 0.0-1.0 (0.25 = 15min, 1.0 = 60min) */
  proportionalHeight: number;
  /** Czy aktywność jest wyszarzona (filtrowanie) */
  isDimmed: boolean;
}

/**
 * Day Info - informacje o dniu tygodnia
 */
export interface DayInfo {
  /** Pełna nazwa: 'Poniedziałek', 'Wtorek', ... */
  name: string;
  /** Skrócona nazwa: 'Pon', 'Wt', ... */
  shortName: string;
  /** Data w formacie ISO */
  date: string;
  /** Dzień tygodnia: 0-6 */
  dayOfWeek: number;
  /** Dzień miesiąca: 1-31 */
  dayOfMonth: number;
}

/**
 * Week Grid View Model - kompletny model widoku siatki
 */
export interface WeekGridViewModel {
  /** Początek tygodnia (poniedziałek) */
  weekStart: Date;
  /** Koniec tygodnia (niedziela) */
  weekEnd: Date;
  /** Macierz komórek [wiersz][kolumna] */
  cells: GridCell[][];
  /** Lista slotów czasowych ["09:00", "10:00", ...] */
  timeSlots: string[];
  /** Informacje o dniach tygodnia */
  days: DayInfo[];
}

/**
 * Time Block View Model - uproszczony model dla widoku
 */
export interface TimeBlockViewModel {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: BlockType;
  description?: string;
  emoji?: string;
  isGoal: boolean;
}

/**
 * Family Member View Model - uproszczony model dla widoku
 */
export interface FamilyMemberViewModel {
  id: string;
  name: string;
  initial: string; // 'T', 'M', 'H', etc.
  color: string; // Hex color
  role: 'parent' | 'child';
  age?: number;
}

/**
 * Week Schedule Response - odpowiedź API dla harmonogramu tygodniowego
 */
export interface WeekScheduleResponse {
  weekStart: string;
  weekEnd: string;
  timeBlocks: TimeBlock[];
  familyMembers?: FamilyMember[];
}

/**
 * Filter Value - wartości filtra
 */
export type FilterValue = 'all' | 'shared' | string; // string = familyMemberId
