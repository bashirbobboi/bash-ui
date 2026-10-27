"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { RevenueBarChart } from "./revenue-bar-chart";
import { data } from "./fixtures";
export const playground: PlaygroundSpec = { component: "RevenueBarChart", controls: [
 { type: "text", name: "title", label: "Title", default: "Monthly revenue" },
 { type: "boolean", name: "defaultShowLandlords", label: "Include landlord payments", default: false },
 { type: "boolean", name: "animated", label: "Grow bars", default: true },
], render: values => <RevenueBarChart key={String(values.defaultShowLandlords)} data={data} title={String(values.title)} defaultShowLandlords={Boolean(values.defaultShowLandlords)} animated={Boolean(values.animated)} />, codeProps: ["data={data}"] };
