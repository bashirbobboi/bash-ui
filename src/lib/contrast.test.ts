import assert from "node:assert/strict";
import test from "node:test";
import { contrastRatio, textContrastResult, themeContrast } from "./contrast.ts";
import { THEMES } from "../themes/index.ts";

test("WCAG reference ratios and symmetry", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  assert.ok(Math.abs(contrastRatio("#777777", "#ffffff") - 4.478089) < 0.000001);
  assert.equal(contrastRatio("#123456", "#abcdef"), contrastRatio("#abcdef", "#123456"));
});
test("thresholds use unrounded ratios", () => {
  assert.equal(textContrastResult(4.49999), "Large text only");
  assert.equal(textContrastResult(4.5), "AA");
  assert.equal(textContrastResult(6.99999), "AA");
  assert.equal(textContrastResult(7), "AAA");
  assert.equal(textContrastResult(2.99999), "Below AA");
});
test("every theme and mode yields valid checks, including known failures", () => {
  for (const theme of THEMES) for (const mode of ["light", "dark"] as const) {
    assert.ok(themeContrast(theme[mode]).every(({ ratio }) => Number.isFinite(ratio) && ratio >= 1 && ratio <= 21));
  }
  const theme = THEMES.find(({ slug }) => slug === "180connect")!;
  assert.equal(themeContrast(theme.light).find(({ label }) => label === "Primary button label")!.passes, false);
});
