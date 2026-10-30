// All dates are simple "YYYY-MM-DD" strings. Comparing them with < and >
// works because the format sorts in calendar order.

/** Today's date as YYYY-MM-DD using the computer's local clock. */
export function todayString(): string {
  const now = new Date();
  return toDateString(now);
}

/** Turns a Date object into YYYY-MM-DD (local time, not UTC). */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Adds (or subtracts, with a negative number) days to a YYYY-MM-DD string. */
export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  // JavaScript happily rolls over 32 January into 1 February for us.
  const date = new Date(year, month - 1, day + days);
  return toDateString(date);
}

/** True when the string really is a calendar date in YYYY-MM-DD format. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // If the day was invalid (like 2026-02-30) the date object corrects itself.
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Number of nights between check-in and check-out. Check-out day is free. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.UTC(...(checkIn.split('-').map(Number) as [number, number, number]));
  const end = Date.UTC(...(checkOut.split('-').map(Number) as [number, number, number]));
  // 86400000 ms = one day. Date.UTC ignores daylight saving changes.
  return Math.round((end - start) / 86400000);
}

/** "2026-03-12" becomes "12 Mar 2026" for display. */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${day} ${monthNames[month - 1]} ${year}`;
}

/* ------------------------------------------------------------------ */
/* Month helpers, used by the host calendar                            */
/* ------------------------------------------------------------------ */

/** This month as YYYY-MM. */
export function currentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** True when the string really is a month in YYYY-MM format. */
export function isValidMonthString(value: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return true;
}

/** Moves a YYYY-MM string by a number of months (negative goes back). */
export function addMonths(monthString: string, delta: number): string {
  const [year, month] = monthString.split('-').map(Number);
  // Date months are 0-based, and JS rolls 0 into last December for us.
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** How many days are in a YYYY-MM month. */
export function daysInMonth(monthString: string): number {
  const [year, month] = monthString.split('-').map(Number);
  // Day 0 of the next month is the last day of this month.
  return new Date(year, month, 0).getDate();
}

/** Every date in a month, as YYYY-MM-DD strings. */
export function dayStringsInMonth(monthString: string): string[] {
  const total = daysInMonth(monthString);
  const days: string[] = [];
  for (let day = 1; day <= total; day += 1) {
    days.push(`${monthString}-${String(day).padStart(2, '0')}`);
  }
  return days;
}
