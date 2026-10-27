"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { ImageCollage } from "./image-collage";
import { images } from "./fixtures";
export const playground: PlaygroundSpec = {
  component:"ImageCollage",
  controls:[
    {type:"number",name:"columns",label:"Images per row",min:1,max:4,step:1,default:2},
    {type:"number",name:"gap",label:"Space between images",min:4,max:24,step:4,default:12},
    {type:"boolean",name:"showCaptions",label:"Show captions",default:true},
  ],
  render:v => <ImageCollage images={images} columns={Number(v.columns)} gap={Number(v.gap)} showCaptions={Boolean(v.showCaptions)} />,
  codeProps:["images={images}"],
};
