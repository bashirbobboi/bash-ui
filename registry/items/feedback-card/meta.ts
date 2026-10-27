import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "feedback-card",
  title: "Feedback card",
  kind: "widget",
  category: "feedback",
  type: "registry:component",
  description:
    "A non-blocking card that floats at the bottom right and asks for a 1–5 rating on a morphing face, with an optional comment, then thanks the person and leaves.",
  whenToUse:
    "Use to ask for an occasional in-product rating without interrupting work; the caller decides when it shows. Do not use for a required form, a bug report with fields, or anything that must block the page; use a dialog for those.",
  files: [
    "registry/items/feedback-card/feedback-card.tsx",
    "registry/items/feedback-card/face-rating.tsx",
  ],
  dependencies: ["motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/feedback-prompt.tsx",
  },
  credits: [
    {
      name: "Spectrum UI (Face Rating)",
      url: "https://ui.spectrumhq.in",
      license: "Apache-2.0",
    },
  ],
  props: [
    {
      name: "onSubmit",
      type: "(feedback: { rating: number; label: string; comment?: string }) => Promise<void | boolean | { ok: boolean }>",
      description:
        "Sends the rating. Resolving with nothing means sent; rejecting or returning false / ok: false keeps the form up with an error line.",
    },
    {
      name: "onDismiss",
      type: "() => Promise<void> | void",
      description:
        'The person closed it without sending ("Not now" or the X). Snooze the prompt here. Not called after a send.',
    },
    {
      name: "open / defaultOpen / onOpenChange",
      type: "boolean / boolean / (open: boolean) => void",
      description:
        "Visibility. Whatever decides when to ask (a cookie, a last-asked date) lives with the caller and drives open. Each reopening starts blank.",
    },
    {
      name: "position",
      type: '"fixed" | "inline"',
      description:
        "fixed floats bottom-right of the viewport (a full-width strip on a phone); inline sits in the flow, up to 360px wide. Defaults to fixed.",
    },
    {
      name: "autoCloseMs",
      type: "number",
      description: "How long the thank-you stays before the card leaves. 0 keeps it up. Defaults to 5000.",
    },
    {
      name: "labels",
      type: "[string, string, string, string, string]",
      description: 'Mood names for ratings 1–5. Defaults to "Terrible" … "Amazing".',
    },
    {
      name: "title / description / placeholder / submitLabel / dismissLabel",
      type: "ReactNode / ReactNode / string / ReactNode / ReactNode",
      description: "The form's copy.",
    },
    {
      name: "thankYouTitle / thankYouMessage / errorMessage",
      type: "ReactNode",
      description: "The thank-you state's copy, and the line shown when onSubmit fails.",
    },
    {
      name: "maxLength",
      type: "number",
      description: "Longest comment accepted; a counter appears once typing starts. Defaults to 280.",
    },
  ],
};
