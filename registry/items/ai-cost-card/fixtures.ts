import type { AiCostCategory, AiCostReading } from "./ai-cost-card.tsx";

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A fixed "today", so the server and the browser draw the same card. */
const TODAY = Date.UTC(2026, 9, 22);
/** The platform has been in use about ten months. */
const FIRST_DAY = TODAY - 300 * DAY_MS;
/** Plain-English searches were only counted from here. */
const SEARCH_FROM = TODAY - 120 * DAY_MS;

export const categories: AiCostCategory[] = [
  { id: "initial_email", label: "Initial email", color: "var(--lead)" },
  { id: "follow_up_email", label: "Follow-up email", color: "var(--go)" },
  { id: "client_booklet", label: "Client booklet", color: "color-mix(in oklab, var(--stop) 55%, var(--paper-sunk))" },
  { id: "nl_search", label: "Plain-English search", color: "var(--ramp-orange)" },
];

/** List-price cost per request (USD) and requests on a typical weekday. */
const PROFILE: Record<string, { cost: number; perDay: number }> = {
  initial_email: { cost: 0.0011, perDay: 34 },
  follow_up_email: { cost: 0.0008, perDay: 12 },
  client_booklet: { cost: 0.0062, perDay: 3 },
  nl_search: { cost: 0.0006, perDay: 41 },
};

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type DayRow = { date: string; cost: Record<string, number>; requests: Record<string, number>; tokens: number };

function buildDays(): DayRow[] {
  const rand = seeded(213);
  const days: DayRow[] = [];
  for (let ms = FIRST_DAY; ms <= TODAY; ms += DAY_MS) {
    const row: DayRow = { date: iso(ms), cost: {}, requests: {}, tokens: 0 };
    const weekday = new Date(ms).getUTCDay();
    const busy = weekday === 0 || weekday === 6 ? 0.15 : 1;
    // Usage ramps up as more of the team comes on board.
    const ramp = 0.35 + 0.65 * Math.min(1, (ms - FIRST_DAY) / (200 * DAY_MS));
    for (const [id, { cost, perDay }] of Object.entries(PROFILE)) {
      if (id === "nl_search" && ms < SEARCH_FROM) continue;
      const n = Math.round(perDay * busy * ramp * (0.55 + rand() * 0.9));
      if (n === 0) continue;
      row.requests[id] = n;
      row.cost[id] = n * cost * (0.85 + rand() * 0.3);
      row.tokens += n * Math.round(cost * 2_400_000);
    }
    days.push(row);
  }
  return days;
}

const WINDOWS = [
  { id: "7d", pill: "7D", label: "Past 7 days", comparison: "the 7 days before", from: TODAY - 6 * DAY_MS },
  { id: "30d", pill: "30D", label: "Past 30 days", comparison: "the 30 days before", from: TODAY - 29 * DAY_MS },
  { id: "all", pill: "ALL", label: "All time", comparison: "the same length of time before", from: FIRST_DAY },
];

function buildReadings(): AiCostReading[] {
  const days = buildDays();
  const searchFrom = new Date(SEARCH_FROM);
  const searchFromLabel = `${searchFrom.getUTCDate()} ${MONTHS[searchFrom.getUTCMonth()]} ${searchFrom.getUTCFullYear()}`;

  return WINDOWS.map((window) => {
    const fromIso = iso(window.from);
    const priorIso = iso(window.from - (TODAY - window.from + DAY_MS));
    const inWindow = days.filter((day) => day.date >= fromIso);
    const prior = days.filter((day) => day.date >= priorIso && day.date < fromIso);
    const sum = (rows: DayRow[], key: "cost" | "requests", id?: string) =>
      rows.reduce(
        (total, row) => total + (id ? (row[key][id] ?? 0) : Object.values(row[key]).reduce((a, b) => a + b, 0)),
        0,
      );
    // Only the longest window reaches back far enough to carry caveats.
    const isAll = window.id === "all";

    return {
      id: window.id,
      pill: window.pill,
      label: window.label,
      comparison: window.comparison,
      from: fromIso,
      to: iso(TODAY),
      costUsd: sum(inWindow, "cost"),
      priorCostUsd: sum(prior, "cost"),
      requests: sum(inWindow, "requests"),
      unpriced: isAll ? 14 : 0,
      refused: isAll ? 3 : 0,
      totalTokens: inWindow.reduce((total, row) => total + row.tokens, 0),
      models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
      byCategory: Object.fromEntries(
        categories.map((category) => [
          category.id,
          { costUsd: sum(inWindow, "cost", category.id), requests: sum(inWindow, "requests", category.id) },
        ]),
      ),
      spendByDay: inWindow
        .filter((row) => Object.keys(row.cost).length > 0)
        .map((row) => ({ date: row.date, byCategory: row.cost })),
      note: isAll ? `Plain-English searches are counted from ${searchFromLabel}; earlier ones weren't tracked.` : undefined,
    };
  });
}

/** Three windows (7D, 30D, ALL) of a small team's AI spend. */
export const readings: AiCostReading[] = buildReadings();
