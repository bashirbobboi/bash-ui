import Image from "next/image";
import { LinkPreview } from "@/registry/items/link-preview/link-preview";
import { ScrambleText } from "@/registry/items/scramble-text/scramble-text";
import { SITE_URL } from "@/lib/site";
import type { Theme } from "@/themes/types";
import { CurrentSiteNotice } from "./current-site-notice";
import { BrandMark } from "./brand-mark";

/** The consuming project's real mark; Neutral is a baseline, not a product. */
export function ProjectIdentity({ theme }: { theme: Theme }) {
  if (theme.slug === "neutral") return <span className="text-[13px] text-dim">Component testing baseline</span>;

  let wordmark;
  if (theme.slug === "180connect") {
    wordmark = (
      <span className="inline-flex items-center gap-2 font-bold tracking-tight" style={{ fontFamily: theme.fonts.body.css }}>
        <Image src="/brands/180dc-globe.png" alt="" width={24} height={24} className="size-6 object-contain" />
        180Connect
      </span>
    );
  } else if (theme.slug === "ledge") {
    wordmark = (
      <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: theme.fonts.body.css }}>
        Ledge<span className="text-lead">.</span>
      </span>
    );
  } else if (theme.slug === "portfolio") {
    wordmark = (
      <span className="inline-flex items-center gap-2">
        <Image src="/brands/portfolio-avatar.png" alt="" width={24} height={24} className="size-6 rounded-full object-contain" />
        {theme.project}
      </span>
    );
  } else if (theme.slug === "steeze") {
    // The landing page's splash in miniature: the name scrambles in over the
    // charcoal-veiled lilac glow, in Steeze's dark tokens whatever the site mode.
    wordmark = (
      <span
        data-theme="steeze"
        className="dark inline-flex items-center rounded-inset bg-ground bg-center px-3.5 py-1 text-ink"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--ground) 80%, transparent), color-mix(in srgb, var(--ground) 80%, transparent)), url(/brands/steeze-glow.webp)",
          // The splash crops the glow to a landscape band; keep that band, squeezed to the chip.
          backgroundSize: "100% 100%, 100% 250%",
        }}
      >
        <ScrambleText text={theme.project} className="font-heading text-[20px] font-light tracking-[-0.02em]" />
      </span>
    );
  } else if (theme.slug === "studio") {
    wordmark = <span className="inline-flex items-center gap-2 font-medium"><BrandMark /><span>bash<span className="text-dim">-ui</span></span></span>;
  } else {
    wordmark = theme.project;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 align-middle">
      <span className="text-[12px] font-normal text-dim">Used by</span>
      <span className="inline-flex items-center text-[15px] leading-6 text-ink">
        {theme.projectPreview ? (
          <LinkPreview
            href={theme.projectUrl ?? SITE_URL}
            title={theme.project}
            imageSrc={theme.projectPreview}
            side="bottom"
            isCurrentSite={theme.slug === "studio"}
            trigger={theme.slug === "studio" ? (
              <button type="button" className="inline-flex min-h-11 items-center rounded-lg px-1 text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead">{wordmark}</button>
            ) : (
              <a href={theme.projectUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${theme.project} (opens in a new tab)`} className="inline-flex min-h-11 items-center rounded-lg px-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead">{wordmark}</a>
            )}
          />
        ) : theme.slug === "studio" ? (
          <CurrentSiteNotice>{wordmark}</CurrentSiteNotice>
        ) : theme.projectUrl ? (
          <a href={theme.projectUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${theme.project} (opens in a new tab)`} className="inline-flex min-h-11 items-center rounded-lg px-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead">{wordmark}</a>
        ) : wordmark}
      </span>
    </span>
  );
}
