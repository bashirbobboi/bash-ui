export const INCOME = "var(--lead)";
export const EXPENDITURE = "var(--ramp-orange)";
export const SURPLUS = "var(--go)";
export const DEFICIT = "var(--stop)";
export function calculateNiceYAxis(
  maxValue: number,
  targetTicks: number = 4,
): { max: number; ticks: number[] } {
  if (maxValue <= 0 || !Number.isFinite(maxValue)) {
    return { max: 1000, ticks: [1000, 500, 0] };
  }
  if (maxValue < 10) {
    return { max: 10, ticks: [10, 5, 0] };
  }

  const roughStep = maxValue / Math.max(1, targetTicks);
  const stepPower = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const stepFraction = roughStep / stepPower;

  let niceMultiplier = 1;
  if (stepFraction > 7.5) {
    niceMultiplier = 10;
  } else if (stepFraction > 3.5) {
    niceMultiplier = 5;
  } else if (stepFraction > 2 && stepPower >= 10_000) {
    niceMultiplier = 2.5;
  } else if (stepFraction > 1.4) {
    niceMultiplier = 2;
  } else {
    niceMultiplier = 1;
  }

  const step = niceMultiplier * stepPower;
  const niceMax = Math.ceil(maxValue / step) * step;

  const ticks: number[] = [];
  const count = Math.round(niceMax / step);
  for (let i = count; i >= 0; i--) {
    ticks.push(Math.round(i * step));
  }

  return { max: niceMax, ticks };
}
