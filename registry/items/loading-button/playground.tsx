"use client";

import * as React from "react";

import type { PlaygroundSpec } from "../../types.ts";
import { LoadingButton, type LoadingButtonProps } from "./loading-button.tsx";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The fake job takes turns: the first press succeeds, the next fails, and so
 * on. Whether the work succeeds is up to `onAction`, not a prop, so this is
 * how both the success and the failure label get seen.
 */
function TakingTurns(props: Omit<LoadingButtonProps, "onAction">) {
  const presses = React.useRef(0);

  return (
    <LoadingButton
      {...props}
      onAction={async () => {
        presses.current += 1;
        const fails = presses.current % 2 === 0;
        await wait(1400);
        if (fails) throw new Error("The register did not answer");
      }}
    />
  );
}

export const playground: PlaygroundSpec = {
  component: "LoadingButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Check for new grants" },
    { type: "text", name: "pendingLabel", label: "While running", default: "Working…" },
    { type: "text", name: "successLabel", label: "After success", default: "Done" },
    { type: "text", name: "errorLabel", label: "After failure", default: "That did not work. Try again." },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <TakingTurns
      label={String(values.label)}
      pendingLabel={String(values.pendingLabel)}
      successLabel={String(values.successLabel)}
      errorLabel={String(values.errorLabel)}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ["onAction={checkForGrants}"],
};
