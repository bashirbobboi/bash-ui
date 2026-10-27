/**
 * The token contract. Every component in the registry is written against these
 * names and nothing else, so a component renders in any theme that supplies
 * them. A theme is just a value for each name, in light and in dark.
 *
 * The names are 180Connect's "Filed Record" vocabulary plus shadcn's own, so a
 * stock shadcn component and a bash-ui component sit on the same page without
 * either looking borrowed.
 *
 * Adding a name here is a contract change: every theme must then supply it.
 * `scripts/check-themes.ts` fails when one does not.
 */

export type TokenGroup =
  | "surface"
  | "line"
  | "ink"
  | "accent"
  | "state"
  | "ramp"
  | "brand";

export type TokenSpec = {
  name: string;
  group: TokenGroup;
  /** What the token is for, in one line. Read by people and by agents. */
  role: string;
};

export const TOKENS = [
  // Surfaces, from the bottom of the page up.
  { name: "ground", group: "surface", role: "The page behind the cards." },
  { name: "background", group: "surface", role: "shadcn's page colour; the body when no ground is set." },
  { name: "card", group: "surface", role: "A card sitting on the ground." },
  { name: "popover", group: "surface", role: "Anything that floats: popovers, menus, dialogs." },
  { name: "paper", group: "surface", role: "A recessed inset inside a card: hints, notes, chips." },
  { name: "paper-sunk", group: "surface", role: "One step deeper than paper; neutral pills and tracks." },
  { name: "muted", group: "surface", role: "shadcn's quiet fill; hover rows, disabled fills." },
  { name: "secondary", group: "surface", role: "shadcn's secondary button fill." },
  { name: "switch-track-off", group: "surface", role: "An off switch's neutral track." },
  { name: "switch-track-on", group: "accent", role: "An on switch's selected track." },
  { name: "switch-thumb-off", group: "surface", role: "A switch's knob when off." },
  { name: "switch-thumb-on", group: "surface", role: "A switch's knob when on." },

  // Lines.
  { name: "rule", group: "line", role: "A card's own edge. The strongest line on a card." },
  { name: "rule-soft", group: "line", role: "Dividers inside a card." },
  { name: "border", group: "line", role: "shadcn's default border." },
  { name: "input", group: "line", role: "Form control borders." },
  { name: "ring", group: "line", role: "Keyboard focus ring." },

  // Ink: content, context, furniture.
  { name: "ink", group: "ink", role: "Content: headings, values, primary buttons." },
  { name: "foreground", group: "ink", role: "Body text." },
  { name: "dim", group: "ink", role: "Context about content: hints, metadata." },
  { name: "faint", group: "ink", role: "Furniture: icons, separators, keys." },
  { name: "muted-foreground", group: "ink", role: "shadcn's quiet text." },
  { name: "card-foreground", group: "ink", role: "Text on a card." },
  { name: "popover-foreground", group: "ink", role: "Text on a popover." },
  { name: "secondary-foreground", group: "ink", role: "Text on a secondary fill." },
  { name: "on-solid", group: "ink", role: "Text and icons on a solid ink, lead or state fill." },

  // The accent says where you are.
  { name: "lead", group: "accent", role: "The one structural accent: active tab, links, focus, keys." },
  { name: "lead-mid", group: "accent", role: "Lead on hover." },
  { name: "lead-wash", group: "accent", role: "A pale lead fill behind selected things." },
  { name: "primary", group: "accent", role: "shadcn's primary fill." },
  { name: "primary-foreground", group: "accent", role: "Text on primary." },
  { name: "accent", group: "accent", role: "shadcn's hover/selection fill in menus and lists." },
  { name: "accent-foreground", group: "accent", role: "Text on accent." },

  // States say what is true.
  { name: "go", group: "state", role: "Good, done, healthy. Usable as text." },
  { name: "go-wash", group: "state", role: "Fill behind a go state." },
  { name: "hold", group: "state", role: "Waiting, caution. Usable as text." },
  { name: "hold-wash", group: "state", role: "Fill behind a hold state." },
  { name: "stop", group: "state", role: "Bad, blocked, deficit. Usable as text." },
  { name: "stop-wash", group: "state", role: "Fill behind a stop state." },
  { name: "destructive", group: "state", role: "shadcn's destructive action colour." },

  // The ramp: gauges and sliders that run from bad to good. Marks only, never text.
  { name: "ramp-orange", group: "ramp", role: "Between stop and the milestone on a ramp." },
  { name: "milestone-yellow", group: "ramp", role: "The midpoint of a ramp." },
  { name: "go-pale", group: "ramp", role: "Between the milestone and go." },
  { name: "slider-handle", group: "ramp", role: "A slider knob. Constant in both modes." },
  { name: "activity-0", group: "ramp", role: "No activity on a contribution calendar." },
  { name: "activity-1", group: "ramp", role: "Low activity on a contribution calendar." },
  { name: "activity-2", group: "ramp", role: "Moderate activity on a contribution calendar." },
  { name: "activity-3", group: "ramp", role: "High activity on a contribution calendar." },
  { name: "activity-4", group: "ramp", role: "Peak activity on a contribution calendar." },

  // Brand: the project's own colours, for marks and the occasional flourish.
  { name: "brand", group: "brand", role: "The brand colour. Logos and marks, rarely text." },
  { name: "brand-hover", group: "brand", role: "Brand on hover." },
  { name: "lime", group: "brand", role: "A pale highlight fill that holds its value in both modes." },
  { name: "lime-hover", group: "brand", role: "Lime on hover." },
  { name: "on-lime", group: "brand", role: "Text on lime. Constant in both modes." },
  { name: "tonal", group: "surface", role: "A quiet tinted fill for a secondary action that should still read as a button." },
  { name: "on-tonal", group: "ink", role: "Text and icons on a tonal fill." },
  { name: "media-fill", group: "surface", role: "A dark fill behind footage, and the scrim over it. Constant in both modes." },
  { name: "on-media", group: "ink", role: "Text over media-fill and footage. Constant in both modes." },
  { name: "media-rest-fill", group: "surface", role: "A media button's fill before footage is revealed." },
  { name: "media-rest-ink", group: "ink", role: "A media button's label before footage is revealed." },
  { name: "scramble-strike", group: "ink", role: "The struck decoy word and its line in a scramble reveal." },

  // Financial flow plate: independent income and spending ramps.
  { name: "ff-plate", group: "ramp", role: "Financial flow plate." },
  { name: "ff-plate-edge", group: "ramp", role: "Financial flow plate edge." },
  { name: "ff-ink", group: "ramp", role: "Financial flow ink." },
  { name: "ff-dim", group: "ramp", role: "Financial flow dim." },
  { name: "ff-faint", group: "ramp", role: "Financial flow faint." },
  { name: "ff-rule", group: "ramp", role: "Financial flow rule." },
  { name: "ff-residual", group: "ramp", role: "Financial flow residual." },
  { name: "ff-in-0", group: "ramp", role: "Financial flow income shade 0, darkest rank first." },
  { name: "ff-in-1", group: "ramp", role: "Financial flow income shade 1, darkest rank first." },
  { name: "ff-in-2", group: "ramp", role: "Financial flow income shade 2, darkest rank first." },
  { name: "ff-in-3", group: "ramp", role: "Financial flow income shade 3, darkest rank first." },
  { name: "ff-in-4", group: "ramp", role: "Financial flow income shade 4, darkest rank first." },
  { name: "ff-in-5", group: "ramp", role: "Financial flow income shade 5, darkest rank first." },
  { name: "ff-out-0", group: "ramp", role: "Financial flow spending shade 0, darkest rank first." },
  { name: "ff-out-1", group: "ramp", role: "Financial flow spending shade 1, darkest rank first." },
  { name: "ff-out-2", group: "ramp", role: "Financial flow spending shade 2, darkest rank first." },
  { name: "ff-out-3", group: "ramp", role: "Financial flow spending shade 3, darkest rank first." },
  { name: "ff-out-4", group: "ramp", role: "Financial flow spending shade 4, darkest rank first." },
  { name: "ff-out-5", group: "ramp", role: "Financial flow spending shade 5, darkest rank first." },

  // Ledge collection charts and its frosted navigation.
  { name: "collection-landlord", group: "ramp", role: "Money paid to landlords." },
  { name: "collection-platform", group: "ramp", role: "Platform revenue retained after processing costs." },
  { name: "collection-processing", group: "ramp", role: "Payment processing fees." },
  { name: "menu-surface", group: "surface", role: "Translucent expanding navigation surface." },
  { name: "menu-ink", group: "ink", role: "Primary text on the expanding menu." },
  { name: "menu-dim", group: "ink", role: "Quiet links on the expanding menu." },
  { name: "menu-rule", group: "line", role: "Hairlines on the expanding menu." },
  { name: "menu-sheen", group: "surface", role: "Frosted highlight on the expanding menu." },
  { name: "menu-symbol", group: "ink", role: "Plus and minus marks on the frosted navigation." },
  { name: "menu-shadow", group: "surface", role: "Shadow under the frosted navigation." },
  { name: "menu-sheen-mid", group: "surface", role: "Middle stop of the navigation frosted highlight." },
  { name: "menu-footer-rule", group: "line", role: "Footer divider on the frosted navigation." },
] as const satisfies readonly TokenSpec[];

export type TokenName = (typeof TOKENS)[number]["name"];

export type TokenValues = Record<TokenName, string>;

export const TOKEN_GROUP_LABELS: Record<TokenGroup, string> = {
  surface: "Surfaces",
  line: "Lines",
  ink: "Ink",
  accent: "Accent",
  state: "States",
  ramp: "Ramp",
  brand: "Brand",
};
