import type { DateRange } from 'react-day-picker';

/** True if the given ISO/date-like value falls within range.from..range.to (inclusive). Undefined range or missing bounds = no filtering on that side. */
export function isWithinDateRange(value: string | Date | null | undefined, range: DateRange | undefined): boolean {
  if (!range || (!range.from && !range.to)) return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  if (range.from && time < range.from.getTime()) return false;
  if (range.to && time > range.to.getTime()) return false;
  return true;
}
