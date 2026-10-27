"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { GithubActivityChart } from "./github-activity-chart";
import { contributions } from "./fixtures";
export const playground: PlaygroundSpec = {
  component:"GithubActivityChart",
  controls:[
    {type:"text",name:"label",label:"Caption",default:"contributions in 2025"},
    {type:"boolean",name:"watercolor",label:"Watercolour texture",default:true},
    {type:"boolean",name:"showTotal",label:"Show total",default:true},
    {type:"boolean",name:"showLegend",label:"Show legend",default:true},
  ],
  render:v => <GithubActivityChart data={contributions} label={String(v.label)} watercolor={Boolean(v.watercolor)} showTotal={Boolean(v.showTotal)} showLegend={Boolean(v.showLegend)} />,
  codeProps:["data={contributions}","onDaySelect={inspectDay}"],
};
