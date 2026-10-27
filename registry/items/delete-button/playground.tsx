"use client";

import type { PlaygroundSpec } from "../../types.ts";
import type { DeleteButtonSize, DeleteButtonVariant } from "./delete-button.tsx";
import { RespawningDeleteButton } from "./fixtures.tsx";

export const playground: PlaygroundSpec = {
  component: "DeleteButton",
  controls: [
    { type: "select", name: "variant", label: "Variant", options: ["solid", "subtle"], default: "solid" },
    { type: "select", name: "size", label: "Size", options: ["xs", "sm", "md", "lg"], default: "md" },
    { type: "text", name: "label", label: "Label", default: "Delete" },
    { type: "text", name: "confirmLabel", label: "Confirm label", default: "Confirm" },
    { type: "boolean", name: "snapOnConfirm", label: "Snap to dust", default: true },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <RespawningDeleteButton
      variant={values.variant as DeleteButtonVariant}
      size={values.size as DeleteButtonSize}
      label={String(values.label)}
      confirmLabel={String(values.confirmLabel)}
      snapOnConfirm={Boolean(values.snapOnConfirm)}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ["onConfirm={deleteDraft}", "onComplete={removeRow}"],
};
