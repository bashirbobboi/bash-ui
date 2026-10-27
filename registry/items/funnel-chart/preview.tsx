"use client";
import { FunnelChart } from "./funnel-chart";
import { stages } from "./fixtures";
export default function FunnelChartPreview() {
  return <FunnelChart data={stages} footer={<div className="flex justify-end"><span className="text-[10px] uppercase tracking-widest text-faint">Top 3</span></div>} />;
}
