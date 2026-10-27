"use client";

import LinkPreviewPreview from "@/registry/items/link-preview/preview";
import { useState } from "react";
import type { Theme } from "@/themes/types";
import { SystemCard } from "./cards";
import { CodeBlock, CommandLine } from "./code-block";
import { CopyButton } from "./copy-button";
import { SystemCopyMenu } from "./copy-menu";
import { ModeToggle } from "./mode-toggle";
import { PillTabs } from "./pill-tabs";
import { PillChoice } from "./playground-controls";
import { Tile, TileGrid } from "./tiles";

/** The actual site components, rather than registry items recoloured in Studio. */
export function StudioComponents({ theme }: { theme: Theme }) {
  const [tab, setTab] = useState("preview");
  const [choice, setChoice] = useState("studio");

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-[13px] leading-5 text-dim">
        The components used to build bash-ui’s gallery. Try them here; these are the site’s own components, with the same surfaces and interactions used throughout bash-ui.
      </p>
      <TileGrid>
        <Tile theme="studio" label="Link preview"><LinkPreviewPreview /></Tile>
        <Tile theme="studio" label="Pill tabs">
          <PillTabs
            label="Example view"
            tabs={[{ value: "preview", label: "Preview" }, { value: "install", label: "Install" }]}
            value={tab}
            onChange={setTab}
          />
        </Tile>
        <Tile theme="studio" label="Choice pills">
          <PillChoice
            label="Example design system"
            options={[{ value: "studio", label: "Studio" }, { value: "meridian", label: "The Meridian" }]}
            value={choice}
            onChange={setChoice}
          />
        </Tile>
        <Tile theme="studio" label="Copy menu">
          <SystemCopyMenu slug="studio" />
        </Tile>
        <Tile theme="studio" label="Mode toggle">
          <ModeToggle />
        </Tile>
        <Tile theme="studio" label="Copy icon button">
          <CopyButton value="Studio · bash-ui" />
        </Tile>
        <Tile theme="studio" label="Command line">
          <div className="w-full min-w-0"><CommandLine command="npx shadcn@latest add @bash/theme-studio" /></div>
        </Tile>
        <Tile theme="studio" label="Code panel">
          <div className="w-full min-w-0"><CodeBlock label="Example" code={'<SystemCopyMenu slug="studio" />'} /></div>
        </Tile>
        <Tile theme="studio" label="Design system card">
          <div className="w-full max-w-xs"><SystemCard theme={theme} /></div>
        </Tile>
      </TileGrid>
    </div>
  );
}
