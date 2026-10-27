"use client";
import { ImageCollage } from "./image-collage";
import { images } from "./fixtures";
export default function Preview() { return <ImageCollage images={images} columns={2} />; }
