"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { DropdownMenu } from "radix-ui";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AGENTS, getAgent, mixPrompt, systemPrompt, themeCss, type Agent } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { getTheme } from "@/themes";
import type { Theme } from "@/themes/types";
import { CopyGlyph, PopGhost } from "./copy-button";

type Action = "prompt" | "code";
type Prefs = { action: Action; agent: Agent };
type Status = "idle" | "busy" | "copied" | "failed";

/*
 * Which copy the main button makes, and which agent prompts are written for,
 * remembered per browser so every page opens on the visitor's last choice.
 */
const KEY = "bash-ui:copy";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readPrefs(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parsePrefs(raw: string | null): Prefs {
  let saved: { action?: unknown; agent?: unknown } = {};
  try {
    saved = raw ? JSON.parse(raw) : {};
  } catch {}
  return {
    action: saved.action === "code" ? "code" : "prompt",
    agent: getAgent(typeof saved.agent === "string" ? saved.agent : undefined),
  };
}

function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ action: prefs.action, agent: prefs.agent.id }));
  } catch {}
  for (const listener of listeners) listener();
}

/** The element, rendered as a PNG at twice its size. Loaded on first use. */
async function capture(selector: string): Promise<Blob> {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Nothing at ${selector} to capture`);
  const { domToBlob } = await import("modern-screenshot");
  return domToBlob(node, {
    scale: 2,
    type: "image/png",
    filter: (el) => !(el instanceof HTMLElement && el.dataset.captureSkip !== undefined),
  });
}

/**
 * "Copy prompt" with a menu, after 21st.dev's: the main half repeats the last
 * choice, the chevron offers the prompt, the code, a picture of the preview,
 * and which agent the prompt is written for. Prompt and picture copies are
 * for an agent, so the ghost turns up for those.
 */
export function CopyMenu({
  prompt,
  promptHint,
  code,
  image,
  extras = [],
}: {
  prompt: (agent: Agent) => string;
  promptHint: (agent: Agent) => string;
  code: { label: string; hint: string; value: () => string };
  /** `target` is a selector; `missing` explains why it is off when the target is not on the page. */
  image?: { target: string; hint: string; missing: string };
  /** One-off copies under the main two; not remembered as the button's choice. */
  extras?: { title: string; hint: string; value: () => string }[];
}) {
  const prefs = parsePrefs(useSyncExternalStore(subscribe, readPrefs, () => null));
  const [status, setStatus] = useState<{ state: Status; ghost: boolean }>({ state: "idle", ghost: false });
  const [canImage, setCanImage] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function settle(state: Status, ghost: boolean) {
    clearTimeout(timer.current);
    setStatus({ state, ghost });
    timer.current = setTimeout(() => setStatus({ state: "idle", ghost: false }), 1500);
  }

  // Each clipboard write starts inside the click, with no await before it,
  // or Safari refuses it.
  function copyText(value: string, ghost: boolean) {
    navigator.clipboard.writeText(value).then(
      () => settle("copied", ghost),
      () => settle("failed", false),
    );
  }

  function run(action: Action, agent = prefs.agent) {
    savePrefs({ action, agent });
    if (action === "prompt") copyText(prompt(agent), true);
    else copyText(code.value(), false);
  }

  function copyImage() {
    if (!image) return;
    clearTimeout(timer.current);
    setStatus({ state: "busy", ghost: true });
    try {
      navigator.clipboard.write([new ClipboardItem({ "image/png": capture(image.target) })]).then(
        () => settle("copied", true),
        () => settle("failed", false),
      );
    } catch {
      settle("failed", false);
    }
  }

  const label = { idle: prefs.action === "code" ? code.label : "Copy prompt", busy: "Copying…", copied: "Copied", failed: "Couldn't copy" }[status.state];

  return (
    <span className="relative inline-flex">
      <span className="site-raised inline-flex h-8 items-stretch rounded-full text-[13px] leading-[14px] font-medium whitespace-nowrap text-ink">
        <button
          type="button"
          onClick={() => run(prefs.action)}
          disabled={status.state === "busy"}
          className="inline-flex items-center gap-2 rounded-l-full pr-2.5 pl-3 transition-[background-color] hover:bg-paper-sunk focus-visible:outline-2 focus-visible:outline-ring"
        >
          <CopyGlyph copied={status.state === "copied"} className="size-3.5" />
          <span aria-live="polite">{label}</span>
        </button>
        <span aria-hidden="true" className="my-2 w-px bg-rule" />
        <DropdownMenu.Root onOpenChange={(open) => open && image && setCanImage(document.querySelector(image.target) !== null)}>
          <DropdownMenu.Trigger
            aria-label="More ways to copy"
            className="group/trigger grid w-8 place-items-center rounded-r-full pr-0.5 transition-[background-color] hover:bg-paper-sunk focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-paper-sunk"
          >
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              collisionPadding={16}
              className="z-50 w-[272px] origin-(--radix-dropdown-menu-content-transform-origin) rounded-xl border border-rule bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
            >
              <DropdownMenu.RadioGroup value={prefs.action}>
                <DropdownMenu.RadioItem value="prompt" onSelect={() => run("prompt")} className={ITEM}>
                  <Entry title="Copy prompt" hint={promptHint(prefs.agent)} dot={<Dot />} />
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="code" onSelect={() => run("code")} className={ITEM}>
                  <Entry title={code.label} hint={code.hint} dot={<Dot />} />
                </DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>

              <DropdownMenu.Separator className={SEPARATOR} />

              {image ? (
                <DropdownMenu.Item disabled={!canImage} onSelect={copyImage} className={ITEM}>
                  <Entry title="Copy image" hint={canImage ? image.hint : image.missing} />
                </DropdownMenu.Item>
              ) : null}
              {extras.map((extra) => (
                <DropdownMenu.Item key={extra.title} onSelect={() => copyText(extra.value(), false)} className={ITEM}>
                  <Entry title={extra.title} hint={extra.hint} />
                </DropdownMenu.Item>
              ))}

              {image || extras.length ? <DropdownMenu.Separator className={SEPARATOR} /> : null}

              <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-[11.5px] leading-4 text-faint">Prompt written for</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={prefs.agent.id}>
                {AGENTS.map((agent) => (
                  <DropdownMenu.RadioItem
                    key={agent.id}
                    value={agent.id}
                    onSelect={() => run("prompt", agent)}
                    className={cn(ITEM, "flex h-8 items-center gap-2.5 py-0")}
                  >
                    <span className="grid w-2.5 shrink-0 place-items-center">
                      <Dot />
                    </span>
                    <AgentLogo id={agent.id} />
                    <span className="text-[13px] text-ink">{agent.name}</span>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </span>
      <PopGhost show={status.ghost} />
    </span>
  );
}

const ITEM =
  "block cursor-default rounded-lg px-2.5 py-2 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-[var(--site-chip-hover)]";
const SEPARATOR = "-mx-1 my-1 h-px bg-rule-soft";

/*
 * Each agent's mark, from public/agents. Codex's and v0's are black on
 * nothing, so they are painted in the text colour through a mask instead, or
 * they would vanish on the dark menu.
 */
const LOGOS: Record<string, { src: string; mono?: boolean }> = {
  "claude-code": { src: "/agents/claude-code.png" },
  codex: { src: "/agents/codex.png", mono: true },
  cursor: { src: "/agents/cursor.png" },
  replit: { src: "/agents/replit.png" },
  lovable: { src: "/agents/lovable.svg" },
  bolt: { src: "/agents/bolt.png" },
  v0: { src: "/agents/v0.svg", mono: true },
};

function AgentLogo({ id }: { id: string }) {
  const logo = LOGOS[id];
  if (!logo) return <span className="size-4 shrink-0" />;
  if (logo.mono) {
    return (
      <span
        aria-hidden="true"
        className="size-4 shrink-0 bg-ink"
        style={{ mask: `url(${logo.src}) center / contain no-repeat` }}
      />
    );
  }
  return <Image src={logo.src} alt="" width={16} height={16} className="size-4 shrink-0 object-contain" />;
}

/** The mark on the chosen option; Radix renders it only when its item is checked. */
function Dot() {
  return (
    <DropdownMenu.ItemIndicator>
      <span className="block size-1.5 rounded-full bg-ink" />
    </DropdownMenu.ItemIndicator>
  );
}

function Entry({ title, hint, dot }: { title: string; hint: string; dot?: ReactNode }) {
  return (
    <span className="flex gap-2.5">
      <span className="grid h-5 w-2.5 shrink-0 place-items-center">{dot}</span>
      <span className="min-w-0 space-y-0.5">
        <span className="block text-[13px] leading-5 font-medium text-ink">{title}</span>
        <span className="block text-[12px] leading-[17px] text-dim">{hint}</span>
      </span>
    </span>
  );
}

/** The copy menu on a design system page: the system's prompt, its CSS, and a picture of its scene. */
export function SystemCopyMenu({ slug }: { slug: string }) {
  const theme = getTheme(slug);
  if (!theme) return null;
  return (
    <CopyMenu
      prompt={(agent) => systemPrompt(theme, agent)}
      promptHint={(agent) => `${agent.install === "cli" ? "Install steps" : "The theme CSS"} and the rules, written for ${agent.name}.`}
      code={{ label: "Copy CSS", hint: "The theme for your global stylesheet, light and dark.", value: () => themeCss(theme) }}
      image={{
        target: "#system-scene",
        hint: "The scene as a PNG, to paste into a chat.",
        missing: "Open Overview to copy the scene.",
      }}
    />
  );
}

/**
 * Everything a playground mix can be taken away as, in one menu: a prompt
 * that carries its CSS (and the install for any components picked), the CSS,
 * the theme file for this gallery, and the link back to the mix.
 */
export function MixCopyMenu({ theme, parts, themeFile, link }: { theme: Theme; parts: string[]; themeFile: () => string; link: string }) {
  return (
    <CopyMenu
      prompt={(agent) => mixPrompt(theme, agent, parts)}
      promptHint={(agent) => `The theme CSS, the fonts${parts.length ? " and your components" : ""}, written for ${agent.name}.`}
      code={{ label: "Copy CSS", hint: "The mix for your global stylesheet, light and dark.", value: () => themeCss(theme) }}
      extras={[
        { title: "Copy theme file", hint: "src/themes/<name>.ts, to add it to this gallery once its rules are written.", value: themeFile },
        { title: "Copy link", hint: "Opens this mix again in the playground.", value: () => link },
      ]}
    />
  );
}
