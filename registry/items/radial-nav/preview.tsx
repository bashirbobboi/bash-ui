"use client";
import { RadialNav } from "./radial-nav";
import { items } from "./fixtures";
export default function Preview() { return <RadialNav items={items} defaultActiveId={1} />; }
