const LOG_KEY = 'ebook-reading-log';
const GOAL_KEY = 'ebook-reading-goal';

export interface ReadingDay {
  date: string; // YYYY-MM-DD
  pagesRead: number;
}

export interface ReadingGoal {
  pagesPerDay: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getReadingLog(): ReadingDay[] {
  const data = localStorage.getItem(LOG_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLog(log: ReadingDay[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function logPagesRead(pages: number): void {
  if (pages <= 0) return;
  const log = getReadingLog();
  const d = today();
  const entry = log.find(e => e.date === d);
  if (entry) {
    entry.pagesRead += pages;
  } else {
    log.push({ date: d, pagesRead: pages });
  }
  saveLog(log);
}

export function getTodayPages(): number {
  const log = getReadingLog();
  return log.find(e => e.date === today())?.pagesRead || 0;
}

export function getReadingGoal(): ReadingGoal {
  const data = localStorage.getItem(GOAL_KEY);
  return data ? JSON.parse(data) : { pagesPerDay: 10 };
}

export function setReadingGoal(goal: ReadingGoal): void {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

export function getCurrentStreak(): number {
  const log = getReadingLog();
  const goal = getReadingGoal();
  if (log.length === 0) return 0;

  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = sorted.find(e => e.date === dateStr);
    if (entry && entry.pagesRead >= goal.pagesPerDay) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function getRecordPages(): number {
  const log = getReadingLog();
  if (log.length === 0) return 0;
  return Math.max(...log.map(e => e.pagesRead));
}

export function getContributionData(weeks: number = 12): { date: string; pagesRead: number; goalMet: boolean }[] {
  const log = getReadingLog();
  const goal = getReadingGoal();
  const days = weeks * 7;
  const result: { date: string; pagesRead: number; goalMet: boolean }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = log.find(e => e.date === dateStr);
    const pagesRead = entry?.pagesRead || 0;
    result.push({ date: dateStr, pagesRead, goalMet: pagesRead >= goal.pagesPerDay });
  }
  return result;
}
