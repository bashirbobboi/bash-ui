"use client";
import { MoneyFlowChart } from "./money-flow-chart";
import { flows } from "./fixtures";
export default function MoneyFlowChartPreview() { return <MoneyFlowChart flows={flows} />; }
