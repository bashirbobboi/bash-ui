"use client";
import { GithubActivityChart } from "./github-activity-chart";
import { contributions } from "./fixtures";
export default function Preview() { return <GithubActivityChart data={contributions} label="contributions in 2025" />; }
