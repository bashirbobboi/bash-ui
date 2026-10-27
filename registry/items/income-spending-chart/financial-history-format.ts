const GBP_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** Formats a monetary number into standard GBP, or returns "Not disclosed" if null/undefined. */
export function formatGbp(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Not disclosed";
  }
  return GBP_FORMATTER.format(amount);
}

/** Formats a monetary number into a compact string (e.g. £450k, £1.2m). */
export function formatCompactGbp(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Not disclosed";
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}£${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }
  if (abs >= 1_000) {
    return `${sign}£${Math.round(abs / 1_000)}k`;
  }
  return `${sign}£${abs.toLocaleString("en-GB")}`;
}


export function formatUkDate(value: string) {
  const date = new Date(value.length === 10 ? value + "T00:00:00Z" : value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
