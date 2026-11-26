import { StudyStreakState } from '../types';

/**
 * Returns local calendar date formatted as YYYY-MM-DD.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a YYYY-MM-DD date string by `deltaDays` safely without DST issues.
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialStreakState(): StudyStreakState {
  const today = getLocalDateKey();
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastSolvedDate: null,
    lastOpenedDate: today,
    solvedDates: [],
    todaySolvedCount: 0,
  };
}

/**
 * Syncs streak state whenever the user opens the app:
 * - Updates lastOpenedDate to today.
 * - If lastSolvedDate is older than yesterday, resets currentStreak to 0.
 * - Resets todaySolvedCount to 0 if lastSolvedDate !== today.
 */
export function syncStreakOnOpen(state: StudyStreakState, today: string = getLocalDateKey()): StudyStreakState {
  const yesterday = shiftDateKey(today, -1);
  const isSolvedToday = state.lastSolvedDate === today;
  const isSolvedYesterday = state.lastSolvedDate === yesterday;

  const currentStreak = isSolvedToday || isSolvedYesterday ? state.currentStreak : 0;
  const todaySolvedCount = isSolvedToday ? state.todaySolvedCount : 0;

  return {
    ...state,
    currentStreak,
    todaySolvedCount,
    lastOpenedDate: today,
  };
}

/**
 * Records that the student solved at least one problem today.
 * Increments consecutive-day streak only once per calendar day.
 */
export function recordProblemSolvedToday(
  state: StudyStreakState,
  today: string = getLocalDateKey()
): { nextState: StudyStreakState; unlockedThreeDayBadge: boolean; streakIncremented: boolean } {
  const synced = syncStreakOnOpen(state, today);
  const yesterday = shiftDateKey(today, -1);

  if (synced.lastSolvedDate === today) {
    return {
      nextState: {
        ...synced,
        todaySolvedCount: synced.todaySolvedCount + 1,
      },
      unlockedThreeDayBadge: false,
      streakIncremented: false,
    };
  }

  const nextStreak = synced.lastSolvedDate === yesterday ? synced.currentStreak + 1 : 1;
  const nextLongest = Math.max(synced.longestStreak, nextStreak);
  const updatedDates = Array.from(new Set([...synced.solvedDates, today])).slice(-60);

  return {
    nextState: {
      currentStreak: nextStreak,
      longestStreak: nextLongest,
      lastSolvedDate: today,
      lastOpenedDate: today,
      solvedDates: updatedDates,
      todaySolvedCount: 1,
    },
    unlockedThreeDayBadge: synced.currentStreak < 3 && nextStreak >= 3,
    streakIncremented: true,
  };
}

/**
 * Helper for testing/demoing consecutive days without waiting 24 hours:
 * Advances the streak by 1 consecutive day as if the user opened the app the next day and solved a problem.
 */
export function simulateNextConsecutiveDay(state: StudyStreakState): {
  nextState: StudyStreakState;
  unlockedThreeDayBadge: boolean;
} {
  const today = getLocalDateKey();
  const baseStreak = state.currentStreak;
  const nextStreak = baseStreak + 1;
  const nextLongest = Math.max(state.longestStreak, nextStreak);

  // Backfill consecutive solved dates ending today so the 7-day calendar strip looks accurate
  const filledDates = new Set(state.solvedDates);
  for (let i = 0; i < Math.min(nextStreak, 14); i++) {
    filledDates.add(shiftDateKey(today, -i));
  }

  return {
    nextState: {
      currentStreak: nextStreak,
      longestStreak: nextLongest,
      lastSolvedDate: today,
      lastOpenedDate: today,
      solvedDates: Array.from(filledDates).sort().slice(-60),
      todaySolvedCount: Math.max(1, state.todaySolvedCount + 1),
    },
    unlockedThreeDayBadge: baseStreak < 3 && nextStreak >= 3,
  };
}

export interface DayIndicator {
  dateKey: string;
  label: string;
  solved: boolean;
  isToday: boolean;
}

export function getRecentDaysIndicators(state: StudyStreakState, count: number = 7): DayIndicator[] {
  const today = getLocalDateKey();
  const solvedSet = new Set(state.solvedDates);
  const days: DayIndicator[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const key = shiftDateKey(today, -i);
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const label = i === 0 ? 'Today' : dt.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({
      dateKey: key,
      label,
      solved: solvedSet.has(key),
      isToday: i === 0,
    });
  }

  return days;
}
