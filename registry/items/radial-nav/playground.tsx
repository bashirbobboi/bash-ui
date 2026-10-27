"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { RadialNav } from "./radial-nav";
import { items } from "./fixtures";
export const playground: PlaygroundSpec = {
  component:"RadialNav",
  controls:[
    {type:"number",name:"size",label:"Ring diameter",min:120,max:200,step:10,default:150},
    {type:"number",name:"buttonSize",label:"Button diameter",min:36,max:48,step:4,default:40},
    {type:"boolean",name:"collapsible",label:"Collapsible",default:false},
    {type:"text",name:"label",label:"Accessible label",default:"Radial navigation"},
  ],
  render:v => <RadialNav items={items} size={Number(v.size)} buttonSize={Number(v.buttonSize)} label={String(v.label)} collapsible={Boolean(v.collapsible)} defaultActiveId={1} />,
  codeProps:["items={items}","onActiveChange={navigateToSection}"],
};
