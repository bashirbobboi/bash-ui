"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { TechStack } from "./tech-stack";
import { items } from "./fixtures";
export const playground: PlaygroundSpec = {
  component:"TechStack",
  controls:[
    {type:"number",name:"size",label:"Tile size",min:28,max:52,step:4,default:40},
    {type:"number",name:"overlap",label:"Stack overlap",min:0,max:16,step:2,default:8},
    {type:"number",name:"expandedGap",label:"Expanded gap",min:0,max:16,step:2,default:8},
    {type:"boolean",name:"expandOnView",label:"Expand on mobile scroll",default:true},
  ],
  render:v => <TechStack items={items} size={Number(v.size)} overlap={Number(v.overlap)} expandedGap={Number(v.expandedGap)} expandOnView={Boolean(v.expandOnView)} />,
  codeProps:["items={technologies}"],
};
