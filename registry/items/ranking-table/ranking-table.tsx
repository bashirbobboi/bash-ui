"use client";

import { useState } from "react";
import { SortByHeading } from "../sort-by-heading/sort-by-heading";

export type LandlordRow = {
  id: string;
  href?: string;
  name: string | null;
  handle: string;
  grossKobo: number;
  platformFeeKobo: number;
  paymentCount: number;
};

// Sort is client-side over the rows the server already returned, so switching
// key/direction is instant — no navigation, no scroll reset.
const OPTIONS = [
  { key: "fee", label: "platform fee", get: (r: LandlordRow) => r.platformFeeKobo },
  { key: "gmv", label: "rent collected", get: (r: LandlordRow) => r.grossKobo },
  { key: "avg", label: "avg payment", get: (r: LandlordRow) => (r.paymentCount > 0 ? r.grossKobo / r.paymentCount : 0) },
  { key: "payments", label: "payments", get: (r: LandlordRow) => r.paymentCount },
] as const;

export type SortKey = (typeof OPTIONS)[number]["key"];

export type RankingTableProps = { rows: LandlordRow[]; prefix?: string; defaultSort?: SortKey; defaultDirection?: "desc" | "asc"; limit?: number };
export function RankingTable({ rows, prefix = "Top landlords by", defaultSort = "fee", defaultDirection = "desc", limit = 10 }: RankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const [dir, setDir] = useState<"desc" | "asc">(defaultDirection);

  const active = OPTIONS.find((o) => o.key === sortKey)!;
  const sorted = [...rows]
    .sort((a, b) => (active.get(a) - active.get(b)) * (dir === "asc" ? 1 : -1))
    .slice(0, Math.max(0, limit));

  const arrow = dir === "desc" ? "↓" : "↑";

  return (
    <section className="@container w-full min-w-0 space-y-3 font-body text-ink">
      <SortByHeading prefix={prefix} options={OPTIONS.map(option => ({ value: option.key, label: option.label }))} value={sortKey} onValueChange={value => setSortKey(value as SortKey)} direction={dir} onDirectionChange={setDir} />

      <div className="rounded-panel border border-rule bg-card hidden overflow-x-auto @3xl:block">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-dim">
              <th className="px-5 py-3 font-medium">Landlord</th>
              {OPTIONS.map((o) => (
                <th key={o.key} className="px-5 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => setSortKey(o.key)}
                    className={`uppercase tracking-wide transition-colors hover:text-ink ${
                      sortKey === o.key ? "text-ink" : ""
                    }`}
                  >
                    {o.label === "avg payment" ? "Avg" : o.label}
                    {sortKey === o.key ? ` ${arrow}` : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => {
              const avg = l.paymentCount > 0 ? Math.round(l.grossKobo / l.paymentCount) : 0;
              return (
                <tr key={l.id} className="border-b border-rule last:border-0">
                  <td className="px-5 py-3">
                    <a
                      href={l.href}
                      className="transition-colors hover:text-lead"
                    >
                      {l.name ?? l.handle}
                    </a>
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums ${sortKey === "fee" ? "font-heading" : "text-dim"}`}>
                    {formatKobo(l.platformFeeKobo)}
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums ${sortKey === "gmv" ? "font-heading" : "text-dim"}`}>
                    {formatKobo(l.grossKobo)}
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums ${sortKey === "avg" ? "font-heading" : "text-dim"}`}>
                    {formatKobo(avg)}
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums ${sortKey === "payments" ? "font-heading" : "text-dim"}`}>
                    {l.paymentCount}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-dim">
                  No revenue in this window yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-panel border border-rule bg-card divide-y divide-rule @3xl:hidden">
        {sorted.map((l) => {
          const avg = l.paymentCount > 0 ? Math.round(l.grossKobo / l.paymentCount) : 0;
          return (
            <div key={l.id} className="p-4">
              <a
                href={l.href}
                className="font-heading text-lg transition-colors hover:text-lead"
              >
                {l.name ?? l.handle}
              </a>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  { label: "Platform fee", value: formatKobo(l.platformFeeKobo) },
                  { label: "Rent collected", value: formatKobo(l.grossKobo) },
                  { label: "Avg payment", value: formatKobo(avg) },
                  { label: "Payments", value: String(l.paymentCount) },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-dim">{stat.label}</dt>
                    <dd className="tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-dim">
            No revenue in this window yet.
          </p>
        )}
      </div>
    </section>
  );
}

export function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  return (
    "₦" +
    naira.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}
