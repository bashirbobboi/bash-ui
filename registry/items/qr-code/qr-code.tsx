/* eslint-disable @next/next/no-img-element -- Portable registry component; the code artwork is passed as an image prop. */
import * as React from "react";

import { cn } from "@/lib/utils";

export interface QrCodeProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
  /** The QR code artwork: light modules on a transparent ground. */
  src: string;
  /** What scanning it does, e.g. "Scan to download the Steeze app". */
  alt: string;
  /** Rendered width and height in pixels. Defaults to 224. */
  size?: number;
  /** Invert the artwork in light mode so it reads dark on a light page. Defaults to true. */
  invertOnLight?: boolean;
}

/**
 * A QR code shown from its original artwork, with no background of its own:
 * the page shows through around the modules. The artwork is drawn for dark
 * mode, light modules; in light mode it is inverted so the modules read dark.
 */
export function QrCode({ src, alt, size = 224, invertOnLight = true, className, ...props }: QrCodeProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn(
        "block aspect-square h-auto max-w-full shrink-0 select-none",
        invertOnLight && "invert dark:invert-0",
        className,
      )}
      {...props}
    />
  );
}

export default QrCode;
