import { getDb } from "./db";
import { takenTimesForDate } from "./bookings";

// Every day is bookable by default. The admin switches individual days off,
// which adds a row here. Absence of a row = available.
export function isDayBlocked(date: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 FROM unavailable_days WHERE date = ?")
    .get(date);
  return !!row;
}

export function getBlockedDays(fromDate?: string): string[] {
  const db = getDb();
  const rows = (
    fromDate
      ? db
          .prepare(
            "SELECT date FROM unavailable_days WHERE date >= ? ORDER BY date"
          )
          .all(fromDate)
      : db.prepare("SELECT date FROM unavailable_days ORDER BY date").all()
  ) as Array<{ date: string }>;
  return rows.map((r) => r.date);
}

export function setDayBlocked(date: string, blocked: boolean): void {
  const db = getDb();
  if (blocked) {
    db.prepare(
      "INSERT OR IGNORE INTO unavailable_days (date, created_at) VALUES (?, ?)"
    ).run(date, new Date().toISOString());
  } else {
    db.prepare("DELETE FROM unavailable_days WHERE date = ?").run(date);
  }
}

// The public calendar/time-slot picker asks for the state of a single date.
export function dayState(date: string): {
  blocked: boolean;
  takenTimes: string[];
} {
  return {
    blocked: isDayBlocked(date),
    takenTimes: takenTimesForDate(date),
  };
}
