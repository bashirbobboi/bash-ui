"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { DoodlePortrait } from "./doodle-portrait";
import { portrait } from "./fixtures";
export const playground: PlaygroundSpec = {
  component: "DoodlePortrait",
  controls:[
    {type:"number",name:"width",label:"Portrait width",min:140,max:280,step:20,default:240},
    {type:"number",name:"height",label:"Portrait height",min:200,max:360,step:20,default:300},
    {type:"number",name:"doodleSize",label:"Doodle size",min:80,max:240,step:20,default:200},
    {type:"boolean",name:"showDoodles",label:"Show doodles",default:true},
  ],
  render:v => <DoodlePortrait {...portrait} width={Number(v.width)} height={Number(v.height)} doodleSize={Number(v.doodleSize)} showDoodles={Boolean(v.showDoodles)} />,
  codeProps:['src="/your-portrait.jpg"','alt="Your name"','doodleSrc="/doodle.gif"','doodleStillSrc="/doodle-still.png"'],
};
