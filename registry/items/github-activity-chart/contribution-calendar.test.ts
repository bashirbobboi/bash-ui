import assert from "node:assert/strict";
import test from "node:test";
import { contributionCalendar } from "./contribution-calendar.ts";

test("calendar positions preserve missing dates and input order does not matter", () => {
  const result = contributionCalendar([
    { date: "2025-01-12", count: 7, level: 4 },
    { date: "2025-01-03", count: 2, level: 1 },
  ]);
  assert.deepEqual(result.cells.map(({ date, column, row }) => ({ date, column, row })), [
    { date: "2025-01-03", column: 0, row: 5 },
    { date: "2025-01-12", column: 2, row: 0 },
  ]);
  assert.equal(result.weeks, 3);
  assert.equal(result.total, 9);
});

test("invalid dates do not become a different calendar day and duplicate dates count once", () => {
  const result = contributionCalendar([
    { date: "2025-02-30", count: 100, level: 4 },
    { date: "not-a-date", count: 100, level: 4 },
    { date: "2025-02-28", count: 2, level: 1 },
    { date: "2025-02-28", count: 5, level: 2 },
  ]);
  assert.equal(result.cells.length, 1);
  assert.equal(result.cells[0].date, "2025-02-28");
  assert.equal(result.total, 5);
});

test("UTC positioning remains stable across daylight saving dates and year boundaries", () => {
  const result = contributionCalendar([
    { date: "2024-12-31", count: 2, level: 1 },
    { date: "2025-03-30", count: 3, level: 1 },
  ]);
  assert.equal(result.cells[0].row, 2);
  assert.equal(result.cells[1].row, 0);
  assert.equal(result.weeks, 14);
});

test("empty activity has no phantom weeks or totals", () => {
  assert.deepEqual(contributionCalendar([]), { cells: [], months: [], weeks: 0, total: 0 });
});
