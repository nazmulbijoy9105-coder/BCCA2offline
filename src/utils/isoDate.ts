/**
 * P4-04 / P3-07: UTC-safe ISO-8601 date arithmetic for limitation computation.
 *
 * All legal date arithmetic MUST go through these helpers. JavaScript's
 * local-timezone Date methods (getDate/setDate) shift dates across day
 * boundaries on non-UTC hosts and are not determinism-safe.
 *
 * Contract:
 *  - Input/output are strict "YYYY-MM-DD" strings.
 *  - Invalid calendar dates ("2024-02-30", "2024-13-01") return null (fail-closed).
 *  - Month/year addition clamps to the last valid day of the target month
 *    (2024-01-31 + 1 month -> 2024-02-29; 2024-02-29 + 1 year -> 2025-02-28).
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ISODateParts = { year: number; month: number; day: number };

export function parseISOToParts(value: string): ISODateParts | null {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isISODateString(value: string): boolean {
  return parseISOToParts(value) !== null;
}

function formatISO(parts: ISODateParts): string {
  const y = String(parts.year).padStart(4, "0");
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInUTCMonth(year: number, month: number): number {
  // month is 1-based; day 0 of the NEXT month = last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDaysISO(isoDate: string, days: number): string | null {
  const parts = parseISOToParts(isoDate);
  if (!parts || !Number.isInteger(days)) return null;
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatISO({
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  });
}

function addMonthsParts(parts: ISODateParts, months: number): ISODateParts {
  const total = parts.year * 12 + (parts.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(parts.day, daysInUTCMonth(year, month)) };
}

export function addMonthsISO(isoDate: string, months: number): string | null {
  const parts = parseISOToParts(isoDate);
  if (!parts || !Number.isInteger(months)) return null;
  return formatISO(addMonthsParts(parts, months));
}

export function addYearsISO(isoDate: string, years: number): string | null {
  const parts = parseISOToParts(isoDate);
  if (!parts || !Number.isInteger(years)) return null;
  return formatISO(addMonthsParts(parts, years * 12));
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
