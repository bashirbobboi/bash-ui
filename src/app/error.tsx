"use client";

import { useEffect, useState } from "react";
import { Ghost } from "@/components/site/ghost";

/**
 * A page that threw: the ghost looks around for what went wrong, and gets to
 * work for a moment when asked to try again.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  function tryAgain() {
    setRetrying(true);
    // Long enough to see a hop before the page re-renders underneath it.
    setTimeout(() => {
      setRetrying(false);
      retry();
    }, 700);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <Ghost state={retrying ? "working" : "default"} size={112} />
      <div className="space-y-2">
        <h1 className="text-[clamp(24px,4vw,30px)] leading-[1.2] font-medium tracking-[-0.005em] text-ink">Something broke</h1>
        <p className="max-w-sm text-[14px] leading-[22px] text-dim">This page hit an error. Trying again usually fixes it.</p>
      </div>
      <button
        type="button"
        onClick={tryAgain}
        disabled={retrying}
        className="site-raised inline-flex h-8 items-center rounded-full px-3 text-[13px] leading-[14px] font-medium text-ink transition-[background-color] hover:bg-paper-sunk disabled:opacity-60"
      >
        {retrying ? "Trying again…" : "Try again"}
      </button>
    </div>
  );
}
