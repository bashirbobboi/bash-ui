import type { QueueSegment } from "./breakdown-dial.tsx";

/*
 * Fake data for the preview and the playground. Not shipped.
 */

/** A client queue split by priority, best first. */
export const PRIORITY_SEGMENTS: QueueSegment[] = [
  { id: "high", label: "High priority", value: 412 },
  { id: "medium", label: "Medium priority", value: 1_186 },
  { id: "low", label: "Low priority", value: 2_037 },
  { id: "unscored", label: "Unscored clients", value: 96 },
];

/** What the card would total on its own: the sum of the segments. */
export const PRIORITY_TOTAL = PRIORITY_SEGMENTS.reduce((sum, segment) => sum + segment.value, 0);
