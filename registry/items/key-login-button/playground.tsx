"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { KeyLoginButton } from "./key-login-button";
export const playground: PlaygroundSpec = {
  component: "KeyLoginButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Log in" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
    { type: "boolean", name: "fullWidth", label: "Full width", default: false },
  ],
  render: (values) => <KeyLoginButton label={String(values.label)} disabled={Boolean(values.disabled)} fullWidth={Boolean(values.fullWidth)} />,
};
