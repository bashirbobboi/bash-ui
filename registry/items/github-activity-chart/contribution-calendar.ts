export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
const DAY = 86_400_000;

/** UTC calendar positions preserve real gaps and do not shift with local timezones. */
export function contributionCalendar(data: ContributionDay[]) {
  const dates = new Map<string, ContributionDay>();
  for (const day of data) {
    const timestamp = Date.parse(`${day.date}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== day.date) continue;
    dates.set(day.date, { ...day, count: Math.max(0, day.count), level: Math.max(0, Math.min(4, day.level)) as ContributionDay["level"] });
  }
  const days = [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (!days.length) return { cells: [], months: [], weeks: 0, total: 0 };
  const first = Date.parse(`${days[0].date}T00:00:00Z`);
  const last = Date.parse(`${days[days.length - 1].date}T00:00:00Z`);
  const start = first - new Date(first).getUTCDay() * DAY;
  const weeks = Math.floor((last - start) / DAY / 7) + 1;
  const cells = days.map((day) => {
    const offset = Math.round((Date.parse(`${day.date}T00:00:00Z`) - start) / DAY);
    return { ...day, column: Math.floor(offset / 7), row: offset % 7 };
  });
  const months: { column: number; label: string }[] = [];
  let previousMonth = -1;
  for (let column = 0; column < weeks; column++) {
    const date = new Date(start + column * 7 * DAY);
    if (date.getUTCMonth() !== previousMonth) {
      months.push({ column, label: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) });
      previousMonth = date.getUTCMonth();
    }
  }
  return { cells, months, weeks, total: days.reduce((sum, day) => sum + day.count, 0) };
}
