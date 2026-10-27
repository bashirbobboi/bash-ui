import {
  ArrowUpRight,
  Box,
  BriefcaseBusiness,
  CalendarRange,
  ChartBarBig,
  ChartSpline,
  CircleDollarSign,
  CircleUserRound,
  Clapperboard,
  Droplets,
  FolderOpen,
  GalleryHorizontalEnd,
  Gauge,
  Images,
  Layers,
  Orbit,
  Inbox,
  Info,
  ListCollapse,
  ListTodo,
  Lock,
  MessageSquareHeart,
  MousePointerClick,
  PanelBottom,
  PanelLeft,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Shuffle,
  SlidersHorizontal,
  Smartphone,
  SquareCheck,
  Tally5,
  Target,
  ToggleRight,
  Trash2,
  TrendingUp,
  Wallet,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTheme } from "@/themes";

/** The glyph each item wears in the sidebar and on its page. Site-only; not shipped. */
const ICONS: Record<string, LucideIcon> = {
  "radial-nav": Orbit,
  "social-links": ArrowUpRight,
  "doodle-portrait": CircleUserRound,
  "github-activity-chart": CalendarRange,
  "tech-stack": Layers,
  "image-collage": Images,
  checkbox: SquareCheck,
  "info-tooltip": Info,
  "gooey-input": Droplets,
  "search-bar": Search,
  "loading-button": RefreshCw,
  "score-gauge": Gauge,
  "stick-progress-bar": ChartBarBig,
  "range-slider": SlidersHorizontal,
  "send-button": Send,
  "cta-button": ArrowUpRight,
  "inbox-button": Inbox,
  "delete-button": Trash2,
  "gooey-tabs": Waves,
  "count-tabs": Tally5,
  "app-sidebar": PanelLeft,
  "account-menu": CircleUserRound,
  "lock-toggle": Lock,
  "notification-toggle": ToggleRight,
  "date-range-calendar": CalendarRange,
  "metric-card": TrendingUp,
  "pipeline-chart": ChartSpline,
  "breakdown-dial": Target,
  "ai-cost-card": CircleDollarSign,
  "todo-list": ListTodo,
  "feedback-card": MessageSquareHeart,
  "scramble-text": Shuffle,
  "faq-accordion": ListCollapse,
  "qr-code": QrCode,
  "app-store-badge": Smartphone,
  "arrow-button": MousePointerClick,
  "video-button": Clapperboard,
  "tonal-button": BriefcaseBusiness,
  "saved-board": FolderOpen,
  "feedback-sheet": PanelBottom,
  "wallet-card": Wallet,
  "swipe-cards": GalleryHorizontalEnd,
};

/** A small lit tile with the item's glyph: 24px in the sidebar, 46px on a page. */
export function ItemIcon({ name, icon, size = "sm" }: { name: string; icon?: LucideIcon; size?: "sm" | "lg" }) {
  const Icon = icon ?? ICONS[name] ?? Box;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "site-tile grid shrink-0 place-items-center text-ink",
        size === "sm" ? "size-6 rounded-[7px]" : "size-[46px] rounded-xl",
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-5"} strokeWidth={size === "sm" ? 2 : 1.75} />
    </span>
  );
}

/** A design system's tile: four of its own colours in a 2×2. */
export function SystemIcon({ slug, size = "sm" }: { slug: string; size?: "sm" | "lg" }) {
  const swatches = getTheme(slug)?.palettePreview ?? ["ink", "dim", "paper", "ground"];
  return (
    <span
      aria-hidden="true"
      data-theme={slug}
      className={cn(
        "site-tile grid shrink-0 grid-cols-2 gap-px overflow-hidden",
        size === "sm" ? "size-6 rounded-[7px] p-[3px]" : "size-[46px] rounded-xl p-1.5",
      )}
    >
      {swatches.map((token) => (
        <span key={token} className="rounded-[2px]" style={{ background: `var(--${token})` }} />
      ))}
    </span>
  );
}
