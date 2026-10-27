"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { SortByHeading } from "./sort-by-heading";
import { options } from "./fixtures";
export const playground: PlaygroundSpec = { component: "SortByHeading", controls: [
 { type: "text", name: "prefix", label: "Sentence", default: "Top landlords by" },
 { type: "select", name: "defaultValue", label: "Starting measure", options: options.map(o => ({ value: o.value, label: o.label })), default: "fee" },
 { type: "select", name: "defaultDirection", label: "Starting direction", options: ["desc", "asc"], default: "desc" },
], render: values => <SortByHeading key={String(values.defaultValue) + values.defaultDirection} prefix={String(values.prefix)} options={options} defaultValue={String(values.defaultValue)} defaultDirection={values.defaultDirection as "asc" | "desc"} />, codeProps: ["options={options}", "onValueChange={setSort}", "onDirectionChange={setDirection}"] };
