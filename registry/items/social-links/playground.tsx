"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { SocialLinks } from "./social-links";
import { links } from "./fixtures";
export const playground: PlaygroundSpec = {
  component: "SocialLinks",
  controls: [
    {type:"number",name:"size",label:"Image height",min:40,max:100,step:4,default:80},
    {type:"number",name:"gap",label:"Gap",min:8,max:80,step:4,default:40},
    {type:"boolean",name:"showLabels",label:"Show labels",default:false},
    {type:"boolean",name:"newWindow",label:"Open in new tab",default:true},
  ],
  render: v => <SocialLinks links={links} size={Number(v.size)} gap={Number(v.gap)} showLabels={Boolean(v.showLabels)} newWindow={Boolean(v.newWindow)} />,
  codeProps:["links={links}"],
};
