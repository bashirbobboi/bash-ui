import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "feedback-sheet",
  title: "Feedback sheet",
  kind: "pattern",
  category: "feedback",
  type: "registry:block",
  description:
    "A tall bottom sheet that is almost all text field: write, send with a full-width pill, or follow a quiet link. It slides up over a dimmed page and drags down to dismiss.",
  whenToUse:
    "Use for open-ended feedback or a quick note from anywhere in an app, where a full page would be too much. Not for structured surveys or ratings; use a form or the feedback card for those.",
  files: ["registry/items/feedback-sheet/feedback-sheet.tsx"],
  dependencies: ["motion", "radix-ui", "lucide-react"],
  registryDependencies: [],
  origin: {
    project: "Steeze",
    path: "app/(root)/(tabs)/settings.tsx (Quick Feedback BottomSheetModal) + components/FilterSortModals.tsx (app_steeze)",
  },
  credits: [
    {
      name: "@gorhom/bottom-sheet: the app's sheet behaviour (handle, pan-down to close, backdrop) re-created here with motion and Radix Dialog",
      url: "https://github.com/gorhom/react-native-bottom-sheet",
      license: "MIT",
    },
  ],
  props: [
    { name: "open", type: "boolean", description: "Whether the sheet is up. Ignored when inline." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Called on Escape, backdrop click, the close button, a dismissing drag and after a successful send." },
    {
      name: "onSubmit",
      type: "(text: string) => void | Promise<void>",
      description: "Receives the trimmed text. While it is pending the button reads pendingLabel; on success the field clears and the sheet closes; on failure the text stays.",
    },
    { name: "title", type: "string", description: 'Optional visible heading. Without it the sheet is just the field, as in the app, named "Give feedback" for screen readers.' },
    { name: "description", type: "string", description: "Optional line under the heading." },
    { name: "placeholder", type: "string", description: 'Defaults to "Share your thoughts…".' },
    { name: "submitLabel", type: "string", description: 'Defaults to "Submit Feedback".' },
    { name: "pendingLabel", type: "string", description: 'Defaults to "Submitting...".' },
    { name: "maxLength", type: "number", description: "Character limit. Defaults to 1000." },
    { name: "linkLabel", type: "string", description: "Optional underlined link under the button; pair with onLinkClick." },
    { name: "onLinkClick", type: "() => void", description: "Called when the link is pressed." },
    { name: "inline", type: "boolean", description: "Renders the panel in place without portal, backdrop or slide, for previews and docs." },
    { name: "defaultValue", type: "string", description: "Starting text." },
  ],
};
