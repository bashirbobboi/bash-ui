"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { DonutChart } from "./donut-chart";
import { amounts } from "./fixtures";
export const playground: PlaygroundSpec = { component: "DonutChart", controls: [
 { type: "text", name: "title", label: "Title", default: "Where the money goes" },
 { type: "text", name: "platformLabel", label: "Platform label", default: "Ledge’s money" },
 { type: "text", name: "processingLabel", label: "Processing label", default: "Paystack fees" },
 { type: "boolean", name: "animated", label: "Draw the ring", default: true },
], render: values => <DonutChart {...amounts} title={String(values.title)} platformLabel={String(values.platformLabel)} processingLabel={String(values.processingLabel)} animated={Boolean(values.animated)} />, codeProps: ["{...amounts}"] };
