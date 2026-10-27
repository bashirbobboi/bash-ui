import type { TokenName, TokenValues } from "../themes/contract.ts";

/** WCAG relative luminance for opaque sRGB theme colours. */
export function contrastRatio(foreground: string, background: string): number {
  function luminance(hex: string): number {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Expected an opaque six-digit hex colour: ${hex}`);
    const channels = [1, 3, 5].map((offset) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function textContrastResult(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large text only";
  return "Below AA";
}

const PAIRS: { label: string; foreground: TokenName; background: TokenName; nonText?: boolean }[] = [
  { label: "Heading on card", foreground: "ink", background: "card" },
  { label: "Body on card", foreground: "foreground", background: "card" },
  { label: "Supporting text on card", foreground: "dim", background: "card" },
  { label: "Quiet text on card", foreground: "faint", background: "card" },
  { label: "Body on inset", foreground: "foreground", background: "paper" },
  { label: "Link on card", foreground: "lead", background: "card" },
  { label: "Primary button label", foreground: "primary-foreground", background: "primary" },
  { label: "Ink button label", foreground: "on-solid", background: "ink" },
  { label: "Positive state", foreground: "go", background: "go-wash" },
  { label: "Waiting state", foreground: "hold", background: "hold-wash" },
  { label: "Negative state", foreground: "stop", background: "stop-wash" },
  { label: "Focus ring against card", foreground: "ring", background: "card", nonText: true },
  { label: "Focus ring against ground", foreground: "ring", background: "ground", nonText: true },
];

export function themeContrast(values: TokenValues) {
  return PAIRS.map((pair) => {
    const ratio = contrastRatio(values[pair.foreground], values[pair.background]);
    return {
      ...pair,
      ratio,
      foregroundColour: values[pair.foreground],
      backgroundColour: values[pair.background],
      passes: ratio >= (pair.nonText ? 3 : 4.5),
      result: pair.nonText ? (ratio >= 3 ? "AA non-text" : "Below AA") : textContrastResult(ratio),
    };
  });
}
