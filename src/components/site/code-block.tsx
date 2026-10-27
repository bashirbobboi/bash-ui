import { CopyButton } from "./copy-button";

/** A snippet on its own surface, copy button in the corner. Never a different kind of card from the stage. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative rounded-xl bg-card">
      {label ? (
        <div className="px-4 pt-3 font-mono text-[11.5px] text-faint">{label}</div>
      ) : null}
      <CopyButton value={code} className="absolute top-2 right-2" />
      <pre className="max-h-[520px] overflow-auto rounded-[inherit] p-4 pr-12 font-mono text-[12.5px] leading-[1.7] text-ink [scrollbar-width:thin]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CommandLine({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-card py-1.5 pr-1.5 pl-4">
      <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">
        <span className="text-faint select-none">$ </span>
        {command}
      </code>
      <CopyButton value={command} />
    </div>
  );
}
