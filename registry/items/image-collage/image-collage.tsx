/* eslint-disable @next/next/no-img-element -- This portable image board accepts ordinary image URLs. */
"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type CollageImage = { src: string; alt: string; caption?: string; description?: string; href?: string; fit?: "contain" | "cover"; aspectRatio?: string };

function suppliedRatio(value?: string): number | undefined {
  if (!value) return;
  const [width, height = 1] = value.split("/").map(Number);
  const ratio = width / height;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
}

export function ImageCollage({ images, columns = 2, gap = 12, showCaptions = true, className }: {
  images: CollageImage[];
  columns?: number;
  gap?: number;
  showCaptions?: boolean;
  className?: string;
}) {
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, number>>({});
  const perRow = Number.isFinite(columns) ? Math.max(1, Math.min(4, Math.round(columns))) : 2;
  const rows = Array.from({ length: Math.ceil(images.length / perRow) }, (_, index) => images.slice(index * perRow, (index + 1) * perRow));
  const ratioFor = (image: CollageImage) => suppliedRatio(image.aspectRatio) ?? measuredRatios[image.src] ?? 4 / 3;

  return (
    <div className={cn("grid w-full font-body", className)} style={{ gap }}>
      {rows.map((row) => (
        <div key={row[0].src} data-collage-row className="grid grid-cols-1 items-start sm:grid-cols-(--collage-row)" style={{ "--collage-row": row.map((image) => `${ratioFor(image)}fr`).join(" "), gap } as CSSProperties}>
          {row.map((image) => (
            <figure key={image.src} className="min-w-0">
              <a href={image.href ?? image.src} target="_blank" rel="noopener noreferrer" aria-label={`Open ${image.alt} (opens in a new tab)`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <img src={image.src} alt={image.alt} loading="lazy" width={600} height={450} className={cn("h-auto w-full", image.fit === "cover" ? "object-cover" : "object-contain")}
                  style={{ aspectRatio: ratioFor(image) }}
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget;
                    if (suppliedRatio(image.aspectRatio) || !naturalHeight) return;
                    const ratio = naturalWidth / naturalHeight;
                    setMeasuredRatios((current) => current[image.src] === ratio ? current : { ...current, [image.src]: ratio });
                  }} />
              </a>
              {showCaptions ? <figcaption className="pt-2 pb-1 text-[12px] leading-5">
                <span className="block text-ink">{image.caption ?? image.alt}</span>
                {image.description ? <span className="block text-dim">{image.description}</span> : null}
              </figcaption> : null}
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
