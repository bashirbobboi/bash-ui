import type { Theme } from "./types.ts";

/**
 * Steeze's visual language. The landing page carries the design system; the
 * admin dashboard contributes only its typeface.
 *
 * Sources:
 * - Desktop/steeze/src/index.css + index.html: self-hosted Playfair Display and
 *   DM Sans, the charcoal (#222222) and cream (#f1efe0) pair, the 0.5rem base
 *   radius and the purple glow behind the page.
 * - Desktop/steeze/src/App.jsx: alternating charcoal and cream sections, hero
 *   and section type scale, numbered cards, footer and motion easing.
 * - Desktop/steeze/src/components/ui/interactive-hover-button.jsx: pill CTAs.
 * - Desktop/steeze/src/components/ui/{hq,leaderboard}.jsx: cream-alpha card,
 *   border and muted steps; mint, gold and rose states; medal bronze.
 * - Desktop/steeze/src/components/ui/{about-us-popup,faq-section}.jsx:
 *   hairline cards, 12–16px radii and the FAQ accordion.
 * - Desktop/admin-steeze/src/app/globals.css: Outfit as the admin's only face.
 * - Desktop/app_steeze/tailwind.config.js: the app repeats cream, charcoal,
 *   Playfair and DM Sans, and adds the lilac (#BAA4D8) used for selection,
 *   Orbitron for card numbers, and the black-200 (#323743) and secondary-300
 *   (#5E5E5E) button fills from the profile screen (tonal and secondary here).
 * - Desktop/app_steeze/app/(root)/notification-preferences.tsx: the SMS
 *   Switch's grey/lilac tracks and off-white/charcoal thumbs, held in both modes.
 *
 * Cream and charcoal alphas are flattened onto their ground. Dark is the
 * landing's default charcoal; light is its cream sections. The light card
 * lift, deepened light-mode lilac and states, and the activity, financial
 * and collection ramps are bash-ui derivations, not Steeze originals.
 */
export const steeze: Theme = {
  slug: "steeze",
  palettePreview: ["ground", "ink", "lead", "dim"],
  name: "Curated",
  project: "Steeze",
  projectUrl: "https://www.steeze.ng",
  projectPreview: "/demo/steeze-landing.png",
  summary:
    "A refined visual identity that feels elevated without feeling exclusive. Thoughtful design gives it a distinctive presence while keeping it welcoming and approachable.",
  intent: [
    "Steeze is a community-driven fashion marketplace for Nigeria, and its landing page reads like the opening spread of a fashion magazine rather than a shop. \"Curated by culture, built for you\" is the brief: the interface should feel considered and a little exclusive, while staying warm enough that buying and selling with your community feels natural.",
    "Two materials do almost all the work. Charcoal sets a dim, evening mood; cream replaces white, so text and buttons feel like printed card stock rather than screen light. Sections alternate between the two, and every other neutral is one of them at reduced strength. A soft lilac glow sits behind the page, and the app picks the same lilac for whatever is switched on or selected.",
    "Playfair Display gives the wordmark, headlines and even navigation a high-contrast, couture character. It is set large, with tight tracking, often at its lightest weight, and an occasional italic for the phrase that matters. DM Sans carries the explanation in light, open paragraphs, so the serif can stay expressive without becoming hard to read.",
    "Motion is slow and assured. Sections rise and fade in on long, decelerating curves; calls to action are pills whose fill blooms from a small dot on hover. Behind the scenes, the admin dashboard keeps the brand's tone but works in Outfit, a geometric sans suited to dense tables and controls.",
  ],
  rules: [
    {
      title: "Playfair speaks, DM Sans explains",
      body: "Playfair Display is the page's root face: wordmark, headings, navigation and button labels. DM Sans carries paragraphs, answers, form copy and the footer. Section headings request weight 300, which renders as Playfair's lightest available weight (400); the hero uses 500 and small card titles 600 in uppercase. Body copy often sits at DM Sans 300 with 1.5–1.6 line height.",
    },
    {
      title: "Charcoal and cream, nothing else neutral",
      body: "The ground is #222222 and the ink is #f1efe0; light mode swaps them, as the landing's cream sections do. Derive every other neutral from those two at reduced strength: borders at 10–15%, quiet fills at 2–5%, supporting text at 60–70%. Never use pure white text or a grey from another scale.",
    },
    {
      title: "Tight serifs, spaced labels",
      body: "Large headings pull in tracking (about −1 to −2px at 32–64px) with 1.1–1.2 leading and stay in sentence case. Italicise one phrase for emphasis, as in \"Join the culture\". Small eyebrows, numbering (01, 02…) and footer captions go uppercase with +0.05em to 1px tracking.",
    },
    {
      title: "Actions are pills",
      body: "Primary calls to action are rounded-full pills in Playfair: cream fill with charcoal label, or a cream outline in the navigation. On hover, a small dot expands to fill the pill and the label gives way to an up-right arrow over about 300ms. Inputs and inner controls use rounded-inset (8px), cards rounded-panel (12px) and full-screen dialogs about 16px.",
    },
    {
      title: "Hairlines, not boxes",
      body: "Cards barely lift from the ground: a near-invisible fill with a border-rule hairline. Lists and accordions separate items with bottom borders only. Reserve deep, soft black shadows for floating media such as phone mock-ups; do not add decorative shadows to cards.",
    },
    {
      title: "Lilac is a glow, used sparingly",
      body: "Lead is the lilac from the page glow and the app's on-switches, spinners and default-address badges. Use it for links, focus, selection and small marks, never for large fills or body text. Primary buttons stay cream on charcoal (or charcoal on cream). In light mode, lead deepens so it reads as text on cream.",
    },
    {
      title: "Status in soft pastels",
      body: "Steeze's internal dashboards mark good in mint, warning in gold and bad in rose, and rank in gold, silver and bronze. Pair each with a label. On charcoal the pastels are used as-is; on cream this entry deepens them so they pass as text.",
    },
    {
      title: "Slow, confident motion",
      body: "Entrances rise 20–50px and fade over 0.8–1s on cubic-bezier(0.22, 1, 0.36, 1), staggered 0.1–0.2s. The hero's slide uses 2.8s on cubic-bezier(0.19, 1, 0.22, 1). Hover changes take about 300ms, card washes about 500ms. Honour reduced motion with useReducedMotionConfig().",
    },
    {
      title: "Outfit belongs to the tools",
      body: "The admin dashboard uses Outfit (variable, 100–900) for everything; it is the interface font here (font-interface). Use it for dense screens such as tables, dashboards and the app's earnings figures. Customer-facing copy stays Playfair and DM Sans. The admin's own colours are not part of this system, and nor is the app's Montserrat.",
    },
    {
      title: "Orbitron is for card numbers",
      body: "The app sets payment-card digits in Orbitron with wide tracking; it is the mono face here (font-mono). Keep it to short technical strings such as card numbers and codes, never paragraphs or labels.",
    },
    {
      title: "Two quiet button fills",
      body: "Beside a primary action, the app uses two filled buttons with rounded-inset corners and DM Sans semibold labels: tonal, a blue-slate (#323743) with off-white text, for things like Earnings; and secondary, a mid grey (#5E5E5E) with white text, for things like Edit Profile. Both hold their colour in light and dark.",
    },
  ],
  fonts: {
    body: {
      family: "DM Sans",
      nextFont: 'DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] })',
      css: "var(--font-dm-sans), Arial, sans-serif",
    },
    heading: {
      family: "Playfair Display",
      nextFont: 'Playfair_Display({ variable: "--font-playfair-display", subsets: ["latin"], style: ["normal", "italic"] })',
      css: "var(--font-playfair-display), Georgia, serif",
    },
    mono: {
      family: "Orbitron",
      nextFont: 'Orbitron({ variable: "--font-orbitron", subsets: ["latin"] })',
      css: "var(--font-orbitron), ui-monospace, monospace",
    },
    interface: {
      family: "Outfit",
      nextFont: 'Outfit({ variable: "--font-outfit", subsets: ["latin"] })',
      css: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
    },
  },
  radius: { panel: "12px", inset: "8px" },
  scene: {
    eyebrow: { text: "Drop 04", font: "body" },
    status: { tone: "go", label: "Live" },
    title: "The Lagos linen edit",
    emphasis: "linen",
    headingWeight: 400,
    blurb: "Hand-dyed adire sets from three Yaba studios, sized S to XXL and shipped from Lagos within two days.",
    stats: [
      { label: "Earnings", value: "₦412,500", font: "interface" },
      { label: "Orders", value: "37", font: "interface" },
      { label: "Drop code", value: "STZ-0421" },
    ],
    actions: { primary: "Share drop", secondary: "Edit listing", link: "View orders", shape: "pill", fill: "ink", quiet: "outline", font: "heading" },
    footnote: { text: "Admin · 12 orders to ship · 1 refund pending", font: "interface" },
    panel: "hairline",
    states: { go: "Payout sent Friday", hold: "12 orders awaiting dispatch", stop: "1 refund requested" },
    samples: {
      heading: "Curated by culture",
      body: "Buy and sell with the people who shape your style.",
      mono: "5399 •••• •••• 0421",
      interface: "Orders · Payouts · Refunds",
    },
  },
  // The cream sections of the landing page.
  light: {
    "activity-0": "#e5e3d5",
    "activity-1": "#d8cddc",
    "activity-2": "#baa4d8",
    "activity-3": "#927bb6",
    "activity-4": "#6a5294",

    // The frosted menu stays charcoal in both modes, like the landing's nav overlays.
    "menu-symbol": "#f1efe0",
    "menu-shadow": "#00000066",
    "menu-sheen-mid": "rgb(241 239 224 / 0.04)",
    "menu-footer-rule": "rgb(241 239 224 / 0.1)",

    "collection-landlord": "#2c6b44",
    "collection-platform": "#6a5294",
    "collection-processing": "#9a5a2e",
    "menu-surface": "rgb(34 34 34 / 0.8)",
    "menu-ink": "#f1efe0",
    "menu-dim": "rgb(241 239 224 / 0.6)",
    "menu-rule": "rgb(241 239 224 / 0.15)",
    "menu-sheen": "rgb(241 239 224 / 0.1)",

    ground: "#f1efe0",
    background: "#f1efe0",
    card: "#f7f5ec", // Derived: cream lifted 40% toward white.
    popover: "#f9f9f3",
    paper: "#e7e5d7", // Charcoal at 5% on cream.
    "paper-sunk": "#e0dfd1",
    muted: "#ebe9da", // Source hover: rgba(34, 34, 34, 0.03).
    secondary: "#5e5e5e", // The app's secondary-300: Edit Profile and most raised surfaces.

    rule: "#dcdbcd", // Source: rgba(34, 34, 34, 0.1).
    "rule-soft": "#e5e3d5",
    border: "#dcdbcd",
    input: "#c8c6ba",
    ring: "#75746e",

    ink: "#222222",
    foreground: "#222222",
    dim: "#60605b", // Source: rgba(34, 34, 34, 0.7).
    faint: "#8a8981", // Source labels use 40%; deepened to 50% to stay legible.
    "muted-foreground": "#60605b",
    "card-foreground": "#222222",
    "popover-foreground": "#222222",
    "secondary-foreground": "#ffffff",
    "on-solid": "#f1efe0",

    lead: "#6a5294", // Lilac deepened to read as text on cream.
    "lead-mid": "#584678",
    "lead-wash": "#e5dde6",
    primary: "#222222",
    "primary-foreground": "#f1efe0",
    accent: "#e5e3d5",
    "accent-foreground": "#222222",

    go: "#2c6b44",
    "go-wash": "#d4e9d0",
    hold: "#7f5a12",
    "hold-wash": "#f3dfb1",
    stop: "#93353a",
    "stop-wash": "#f3d6ce",
    destructive: "#93353a",

    "ramp-orange": "#b07440",
    "milestone-yellow": "#d9a441",
    "go-pale": "#8cc79d",
    "slider-handle": "#ffffff",
    // Exact SMS Switch colours from app_steeze/notification-preferences.tsx.
    "switch-track-off": "#666666",
    "switch-track-on": "#bda5d8",
    "switch-thumb-off": "#f4f3f4",
    "switch-thumb-on": "#222222",

    brand: "#6a5294",
    "brand-hover": "#584678",
    // The cream pill is Steeze's highlight; its hover goes to white, as on the site.
    lime: "#f1efe0",
    "lime-hover": "#ffffff",
    "on-lime": "#222222",
    // The app's Earnings button: black-200 with white-100 text, in both modes.
    tonal: "#323743",
    "on-tonal": "#f3f4f6",
    "media-fill": "#000000",
    "on-media": "#ffffff",
    "media-rest-fill": "#000000",
    "media-rest-ink": "#ffffff",
    "scramble-strike": "#9095a1",

    "ff-plate": "#f7f5ec",
    "ff-plate-edge": "#dcdbcd",
    "ff-ink": "#222222",
    "ff-dim": "#60605b",
    "ff-faint": "#8a8981",
    "ff-rule": "#dcdbcd",
    "ff-residual": "#8a8981",
    "ff-in-0": "#2c6b44",
    "ff-in-1": "#538563",
    "ff-in-2": "#7ba082",
    "ff-in-3": "#a2baa2",
    "ff-in-4": "#cad5c1",
    "ff-in-5": "#dde2d0",
    "ff-out-0": "#9a5a2e",
    "ff-out-1": "#ab7852",
    "ff-out-2": "#bd9675",
    "ff-out-3": "#ceb399",
    "ff-out-4": "#e0d1bc",
    "ff-out-5": "#e8e0ce",
  },
  // The landing page's default charcoal.
  dark: {
    "activity-0": "#2e2e2d",
    "activity-1": "#4a464f",
    "activity-2": "#6d637a",
    "activity-3": "#9081a5",
    "activity-4": "#baa4d8",

    "menu-symbol": "#f1efe0",
    "menu-shadow": "#00000066",
    "menu-sheen-mid": "rgb(241 239 224 / 0.04)",
    "menu-footer-rule": "rgb(241 239 224 / 0.1)",

    "collection-landlord": "#a8e0b8",
    "collection-platform": "#baa4d8",
    "collection-processing": "#c98a5b",
    "menu-surface": "rgb(34 34 34 / 0.8)",
    "menu-ink": "#f1efe0",
    "menu-dim": "rgb(241 239 224 / 0.6)",
    "menu-rule": "rgb(241 239 224 / 0.15)",
    "menu-sheen": "rgb(241 239 224 / 0.1)",

    ground: "#222222",
    background: "#222222",
    card: "#262626", // Source card: rgba(241, 239, 224, 0.02).
    popover: "#131316", // The app's black-300: bottom sheets sit darker than the page.
    paper: "#2c2c2c", // Cream at 5%.
    "paper-sunk": "#333231",
    muted: "#282828", // Source alternate row: cream at 3%.
    secondary: "#5e5e5e",

    rule: "#41413f", // Source: rgba(241, 239, 224, 0.15).
    "rule-soft": "#373735",
    border: "#41413f",
    input: "#4b4b48",
    ring: "#8a8981", // Source focus ring: cream at 50%.

    ink: "#f1efe0",
    foreground: "#f1efe0",
    dim: "#9e9d94", // Source muted: cream at 60%.
    faint: "#75746e",
    "muted-foreground": "#9e9d94",
    "card-foreground": "#f1efe0",
    "popover-foreground": "#f1efe0",
    "secondary-foreground": "#ffffff",
    "on-solid": "#222222",

    lead: "#baa4d8",
    "lead-mid": "#cbbbe2",
    "lead-wash": "#3a373f",
    primary: "#f1efe0",
    "primary-foreground": "#222222",
    accent: "#373735",
    "accent-foreground": "#f1efe0",

    go: "#a8e0b8",
    "go-wash": "#353d37",
    hold: "#f5c66b",
    "hold-wash": "#40392c",
    stop: "#f5b8b8",
    "stop-wash": "#403737",
    destructive: "#ef4444", // The app's error and Skip red; stop stays the softer rose.

    "ramp-orange": "#c98a5b",
    "milestone-yellow": "#f5c66b",
    "go-pale": "#cfd392",
    "slider-handle": "#ffffff",
    // Exact SMS Switch colours from app_steeze/notification-preferences.tsx.
    "switch-track-off": "#666666",
    "switch-track-on": "#bda5d8",
    "switch-thumb-off": "#f4f3f4",
    "switch-thumb-on": "#222222",

    brand: "#baa4d8",
    "brand-hover": "#cbbbe2",
    lime: "#f1efe0",
    "lime-hover": "#ffffff",
    "on-lime": "#222222",
    // The app's Earnings button: black-200 with white-100 text, in both modes.
    tonal: "#323743",
    "on-tonal": "#f3f4f6",
    "media-fill": "#000000",
    "on-media": "#ffffff",
    "media-rest-fill": "#ffffff",
    "media-rest-ink": "#000000",
    "scramble-strike": "#9095a1",

    "ff-plate": "#262626",
    "ff-plate-edge": "#41413f",
    "ff-ink": "#f1efe0",
    "ff-dim": "#9e9d94",
    "ff-faint": "#75746e",
    "ff-rule": "#41413f",
    "ff-residual": "#75746e",
    "ff-in-0": "#a8e0b8",
    "ff-in-1": "#8dba9a",
    "ff-in-2": "#72947c",
    "ff-in-3": "#586e5e",
    "ff-in-4": "#3d4840",
    "ff-in-5": "#2f3531",
    "ff-out-0": "#c98a5b",
    "ff-out-1": "#a87550",
    "ff-out-2": "#866044",
    "ff-out-3": "#654c39",
    "ff-out-4": "#43372d",
    "ff-out-5": "#332c28",
  },
};
