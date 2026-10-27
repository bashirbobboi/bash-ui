import type { Theme } from "./types.ts";

/**
 * Ledge's active `.ledge-theme.ledge-cool` system, used by the landlord,
 * tenant and admin layouts (not the older 4px `.ledge-theme` base).
 *
 * Sources in Desktop/ledge:
 * - src/app/globals.css: cool palette, cards, inputs, pills and motion.
 * - src/app/layout.tsx + tailwind.config.ts: Instrument Serif and Lora.
 * - src/app/dashboard/page.tsx: hierarchy, spacing and uppercase labels.
 * - src/components/admin/{collection-breakdown,revenue-trend}.tsx: chart colours.
 *
 * Source alpha colours are flattened onto the white card for this contract.
 * Extra contract slots (including ranked financial ramps) are derived from
 * the source palette. Ledge has no complete dark system: dark below is a
 * bash-ui adaptation, not an extracted original. Monospace is a system
 * fallback for registry code/technical content; Ledge's figures use serif.
 */
export const ledge: Theme = {
  slug: "ledge",
  palettePreview: ["brand", "ink", "paper", "collection-platform"],
  name: "Frontier",
  project: "Ledge",
  projectPreview: "/demo/ledge-landing.png",
  projectUrl: "https://www.ledge.ng",
  summary:
    "An overdue departure from the expected, where expressive design and thoughtful restraint come together to make innovation feel natural, credible, and assured.",
  intent: [
    "The starting point is the feeling of encountering something noticeably more considered than what came before. Spacious, graceful and quietly ambitious, the design makes modernity feel inviting. It offers a clear sense of progress while retaining the familiarity and substance that help people feel at ease. The first impression is fresh; the lasting impression should be confidence.",
    "The typography has an expressive, almost printed quality. Instrument Serif gives headings an elegant silhouette, with fine strokes and distinctive curves that reward generous space. Lora provides a steadier texture for longer passages and smaller details. Their shared serif character gives the composition continuity, while differences in proportion and weight create a natural hierarchy. Large figures become part of the visual character, as carefully placed as a headline.",
    "Light is an essential part of the system. Near-white surfaces sit against cool, barely tinted grounds, with slate text giving them a clear centre of gravity. Deep forest green brings weight to important moments. Gold and clay add a restrained earthiness, balancing the coolness of the surrounding space. The palette feels open and contemporary, with a material warmth that keeps it grounded.",
    "Generous margins, fine rules and carefully grouped details create a measured pace. Rounded controls introduce a softer counterpoint to the editorial typography, and subtle depth makes the surfaces feel tangible. Motion unfolds gently, giving each change time to register. The result aims for a distinctive balance: enough elegance to feel aspirational, enough clarity and visual substance to earn trust over time.",
  ],
  rules: [
    {
      title: "Two serifs, two jobs",
      body: "Instrument Serif (400) gives headings and key financial figures their editorial character. Lora carries body text, labels and controls. Use tabular numerals for aligned amounts; monospace is a registry fallback for code, not the app's financial typeface.",
    },
    {
      title: "Use the current cool app surface",
      body: "Near-white ground, white cards, cool blue-grey insets and slate ink. The landlord, tenant and admin apps all use ledge-cool. Its 16px panels and 10px inputs supersede the older 4px base styles.",
    },
    {
      title: "Hairlines first, shadows lightly",
      body: "Cards use border-rule with rounded-panel and generous padding. A very faint shadow can lift an interactive card; stronger shadows belong to floating dialogs and menus. Use paper for recessed content.",
    },
    {
      title: "Green actions are pills",
      body: "Primary actions use bg-primary text-primary-foreground and rounded-full; hover deepens the green. Secondary actions are outlined pills. Reserve rounded-inset for inputs and inner surfaces. Links, selected dates and the brand's terminal dot use lead.",
    },
    {
      title: "Labels whisper; headings read naturally",
      body: "Small section eyebrows and field labels may be uppercase with 0.08–0.25em tracking. Headings stay in sentence case with tight leading. Use dim for explanatory copy and faint for quiet labels and furniture.",
    },
    {
      title: "Financial colour has a meaning",
      body: "Green marks collected or paid, gold marks pending or outstanding, and red marks overdue or failed. Pair each colour with a label. Charts distinguish landlord funds in emerald, Ledge revenue in gold and processing fees in clay; avoid decorative rainbow series.",
    },
    {
      title: "Leave room to read",
      body: "Use a centred reading column (48rem tenant, 56rem landlord, 64rem admin), roughly 24px side gutters and 48px main vertical padding. Separate sections generously; group related ledger rows with fine dividers. Subtle ruled lines and dotted leaders are optional ledger details.",
    },
    {
      title: "Motion follows the ledger",
      body: "Sections rise and fade in reading order; chart bars grow from their baseline and arcs draw on. Keep hover changes near 200ms and entrances around 700–900ms. Honour reduced motion with useReducedMotionConfig() when implementing registry components.",
    },
    {
      title: "Dark mode is a bash-ui adaptation",
      body: "Ledge's app supplies the light palette only. This entry derives dark slate surfaces, pale ink, lifted green actions and brighter state colours for the gallery's dark mode. Additional contract colours and ranked chart ramps are palette extensions rather than original Ledge tokens.",
    },
  ],
  fonts: {
    body: {
      family: "Lora",
      nextFont: 'Lora({ variable: "--font-lora", subsets: ["latin"] })',
      css: "var(--font-lora), Georgia, serif",
    },
    heading: {
      family: "Instrument Serif",
      nextFont: 'Instrument_Serif({ weight: "400", variable: "--font-instrument-serif", subsets: ["latin"] })',
      css: "var(--font-instrument-serif), Georgia, serif",
    },
    mono: {
      family: "System monospace",
      css: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
  },
  radius: { panel: "16px", inset: "10px" },
  scene: {
    eyebrow: { text: "Lekki · Yearly lease", font: "body" },
    status: { tone: "hold", label: "Part paid" },
    title: "Flat 3, Bourdillon Court",
    headingWeight: 400,
    blurb: "A two-bedroom let to the same tenant since 2023. The first instalment has cleared; the second falls due in March.",
    stats: [
      { label: "Annual rent", value: "₦4.8m", font: "heading" },
      { label: "Collected", value: "₦2.4m", font: "heading" },
      { label: "Outstanding", value: "₦2.4m", font: "heading" },
    ],
    actions: { primary: "Send reminder", secondary: "Record payment", link: "Open ledger", shape: "pill", fill: "primary", quiet: "outline" },
    footnote: { text: "Ref LG-0412 · Lease ends 31 Jan 2026", font: "mono" },
    panel: "hairline",
    states: { go: "First instalment paid", hold: "Second instalment due 1 March", stop: "Service charge overdue" },
    samples: {
      heading: "Rent, received",
      body: "Every payment lands in the ledger the day it clears.",
      mono: "LG-0412 · 2025-03-01",
    },
  },
  light: {
    "activity-0": "#e3eaf0",
    "activity-1": "#c5d3ce",
    "activity-2": "#8aa69c",
    "activity-3": "#507a6b",
    "activity-4": "#154d39",

    "menu-symbol": "#e5e5e5",
    "menu-shadow": "#00000066",
    "menu-sheen-mid": "rgb(255 255 255 / 0.04)",
    "menu-footer-rule": "rgb(255 255 255 / 0.1)",

    "collection-landlord": "#127a52",
    "collection-platform": "#b4762b",
    "collection-processing": "#a23b26",
    "menu-surface": "rgb(23 23 23 / 0.65)",
    "menu-ink": "#ffffff",
    "menu-dim": "#a3a3a3",
    "menu-rule": "rgb(255 255 255 / 0.15)",
    "menu-sheen": "rgb(255 255 255 / 0.15)",

    ground: "#fdfefd",
    background: "#fdfefd",
    card: "#ffffff",
    popover: "#ffffff",
    paper: "#eef3f8",
    "paper-sunk": "#e3eaf0",
    muted: "#f4f8fc",
    secondary: "#eef3f8",

    rule: "#e8e9eb", // Source --line: slate ink at 10% on white.
    "rule-soft": "#edeeef",
    border: "#e8e9eb",
    input: "#e8e9eb",
    ring: "#1e392b",

    ink: "#1b2733",
    foreground: "#1b2733",
    dim: "#5b6976",
    faint: "#98a1a7", // Quiet slate ink at 45% on the near-white ground.
    "muted-foreground": "#5b6976",
    "card-foreground": "#1b2733",
    "popover-foreground": "#1b2733",
    "secondary-foreground": "#1b2733",
    "on-solid": "#fdfefd",

    lead: "#1e392b",
    "lead-mid": "#14271d",
    "lead-wash": "#e4e7e6",
    primary: "#1e392b",
    "primary-foreground": "#ffffff",
    accent: "#eef3f8",
    "accent-foreground": "#1e392b",

    go: "#154d39",
    "go-wash": "#e0eae6", // Source green badge: rgba(31, 107, 79, 0.14).
    hold: "#8a5a1e",
    "hold-wash": "#f5ece1", // Source gold badge: rgba(180, 118, 43, 0.14).
    stop: "#9a2c2c",
    "stop-wash": "#f6e5e5", // Source red badge: rgba(180, 35, 35, 0.12).
    destructive: "#9a2c2c",

    "ramp-orange": "#a23b26",
    "milestone-yellow": "#b4762b",
    "go-pale": "#a9c8b9",
    "slider-handle": "#ffffff",
    "switch-track-off": "var(--faint)",
    "switch-track-on": "var(--lead)",
    "switch-thumb-off": "var(--slider-handle)",
    "switch-thumb-on": "var(--on-solid)",

    brand: "#1e392b",
    "brand-hover": "#14271d",
    // Contract's legacy lime slots become a pale green highlight in Ledge.
    lime: "#e0eae6",
    "lime-hover": "#ccded5",
    "on-lime": "#14271d",
    tonal: "#eef3f8",
    "on-tonal": "#1b2733",
    "media-fill": "#000000",
    "on-media": "#ffffff",
    "media-rest-fill": "#000000",
    "media-rest-ink": "#ffffff",
    "scramble-strike": "#98a1a7",

    // Registry-only financial ramps, derived from Ledge's emerald/clay chart colours.
    "ff-plate": "#ffffff",
    "ff-plate-edge": "#e8e9eb",
    "ff-ink": "#1b2733",
    "ff-dim": "#5b6976",
    "ff-faint": "#98a1a7",
    "ff-rule": "#e8e9eb",
    "ff-residual": "#98a1a7",
    "ff-in-0": "#127a52",
    "ff-in-1": "#418f74",
    "ff-in-2": "#71af97",
    "ff-in-3": "#a0cab9",
    "ff-in-4": "#c4dfd3",
    "ff-in-5": "#e0eae6",
    "ff-out-0": "#a23b26",
    "ff-out-1": "#b56251",
    "ff-out-2": "#c78a7d",
    "ff-out-3": "#dab1a8",
    "ff-out-4": "#e9d0cb",
    "ff-out-5": "#f5e7e4",
  },
  // Derived for bash-ui; the source app has no equivalent dark palette.
  dark: {
    "activity-0": "#293942",
    "activity-1": "#364b49",
    "activity-2": "#54746a",
    "activity-3": "#739e8b",
    "activity-4": "#91c7ac",

    "menu-symbol": "#e5e5e5",
    "menu-shadow": "#00000066",
    "menu-sheen-mid": "rgb(255 255 255 / 0.04)",
    "menu-footer-rule": "rgb(255 255 255 / 0.1)",

    "collection-landlord": "#65cda5",
    "collection-platform": "#e2b066",
    "collection-processing": "#e58973",
    "menu-surface": "rgb(23 23 23 / 0.65)",
    "menu-ink": "#ffffff",
    "menu-dim": "#a3a3a3",
    "menu-rule": "rgb(255 255 255 / 0.15)",
    "menu-sheen": "rgb(255 255 255 / 0.15)",

    ground: "#10171c",
    background: "#10171c",
    card: "#172128",
    popover: "#202d35",
    paper: "#202d35",
    "paper-sunk": "#293942",
    muted: "#202d35",
    secondary: "#202d35",

    rule: "#35454e",
    "rule-soft": "#293942",
    border: "#35454e",
    input: "#35454e",
    ring: "#a9c8b9",

    ink: "#edf3f5",
    foreground: "#dce5e9",
    dim: "#afbec7",
    faint: "#8799a4",
    "muted-foreground": "#afbec7",
    "card-foreground": "#dce5e9",
    "popover-foreground": "#dce5e9",
    "secondary-foreground": "#edf3f5",
    "on-solid": "#10171c",

    lead: "#a9c8b9",
    "lead-mid": "#ccded5",
    "lead-wash": "#203c30",
    primary: "#a9c8b9",
    "primary-foreground": "#10171c",
    accent: "#203c30",
    "accent-foreground": "#ccded5",

    go: "#91c7ac",
    "go-wash": "#1b3529",
    hold: "#e0b77e",
    "hold-wash": "#382b1c",
    stop: "#e6a39b",
    "stop-wash": "#3c2425",
    destructive: "#e6a39b",

    "ramp-orange": "#cf8c77",
    "milestone-yellow": "#e0b77e",
    "go-pale": "#ccded5",
    "slider-handle": "#ffffff",
    "switch-track-off": "var(--faint)",
    "switch-track-on": "var(--lead)",
    "switch-thumb-off": "var(--slider-handle)",
    "switch-thumb-on": "var(--on-solid)",

    brand: "#a9c8b9",
    "brand-hover": "#ccded5",
    lime: "#e0eae6",
    "lime-hover": "#ccded5",
    "on-lime": "#14271d",
    tonal: "#202d35",
    "on-tonal": "#edf3f5",
    "media-fill": "#000000",
    "on-media": "#ffffff",
    "media-rest-fill": "#000000",
    "media-rest-ink": "#ffffff",
    "scramble-strike": "#8799a4",

    "ff-plate": "#172128",
    "ff-plate-edge": "#35454e",
    "ff-ink": "#edf3f5",
    "ff-dim": "#afbec7",
    "ff-faint": "#8799a4",
    "ff-rule": "#35454e",
    "ff-residual": "#8799a4",
    "ff-in-0": "#a9d8c2",
    "ff-in-1": "#91c7ac",
    "ff-in-2": "#6d9f87",
    "ff-in-3": "#4c765f",
    "ff-in-4": "#33503e",
    "ff-in-5": "#1b3529",
    "ff-out-0": "#e6b8ab",
    "ff-out-1": "#cf9988",
    "ff-out-2": "#ac7564",
    "ff-out-3": "#855443",
    "ff-out-4": "#603a2f",
    "ff-out-5": "#3c2425",
  },
};
