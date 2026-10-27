"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { RankingTable, type SortKey } from "./ranking-table";
import { rows } from "./fixtures";
export const playground: PlaygroundSpec = { component: "RankingTable", controls: [
 { type: "text", name: "prefix", label: "Sentence", default: "Top landlords by" },
 { type: "select", name: "defaultSort", label: "Starting measure", options: ["fee", "gmv", "avg", "payments"], default: "fee" },
 { type: "select", name: "defaultDirection", label: "Starting direction", options: ["desc", "asc"], default: "desc" },
 { type: "number", name: "limit", label: "Rows", min: 1, max: 10, step: 1, default: 10 },
], render: values => <RankingTable key={String(values.defaultSort) + values.defaultDirection} rows={rows} prefix={String(values.prefix)} defaultSort={values.defaultSort as SortKey} defaultDirection={values.defaultDirection as "asc" | "desc"} limit={Number(values.limit)} />, codeProps: ["rows={rows}"] };
