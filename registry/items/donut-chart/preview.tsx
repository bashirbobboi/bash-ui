"use client";
import { DonutChart } from "./donut-chart";
import { amounts } from "./fixtures";
export default function Preview() { return <DonutChart {...amounts} />; }
