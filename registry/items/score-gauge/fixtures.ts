import { DEFAULT_PRIORITY_ZONES, type ScoreGaugeZone } from "./score-gauge.tsx";

/** What landing in each of the default six tiers means, shown on hover or tap. */
const NOTES: Record<string, Pick<ScoreGaugeZone, "description" | "detail">> = {
  critical_low: {
    description:
      "Non-target profile or a hard stop: an explicit opt-out, an inactive registration, or no operating capacity.",
    detail: "Rare. Usually an opt-out or no recent filings.",
  },
  low: {
    description:
      "Not a bad client, a later one. Unanswered follow-ups, modest income or an off-priority sector.",
    detail: "Typical for a client with no engagement yet.",
  },
  low_medium: {
    description:
      "A viable profile with gaps: missing fields score neutral until someone records more about them.",
    detail: "Where un-enriched clients start (0.50).",
  },
  high_medium: {
    description: "A solid fit with positive signals: verified income, a relevant sector, or warm earlier contact.",
    detail: "Two or more factors pointing the right way.",
  },
  high: {
    description: "A prime candidate: a priority sector, substantial income and a track record of engagement.",
    detail: "Roughly the top 15% of the pipeline.",
  },
  extremely_high: {
    description: "Strong on every dimension at once. Reach out now.",
    detail: "The highest rating the model gives.",
  },
};

export const zones: ScoreGaugeZone[] = DEFAULT_PRIORITY_ZONES.map((zone) => ({ ...zone, ...NOTES[zone.id] }));
