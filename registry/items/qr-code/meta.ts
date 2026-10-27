import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "qr-code",
  title: "QR code",
  kind: "widget",
  category: "media",
  type: "registry:component",
  description:
    "Steeze's QR code artwork with no background of its own: cream modules in dark mode, inverted to dark modules in light mode.",
  whenToUse:
    "Use to hand a link from a desktop screen to a phone, such as an app download or a sign-up page. Pass your own code artwork as light modules on a transparent ground, leave the page around it clear, and keep it above about 120px so it scans.",
  files: ["registry/items/qr-code/qr-code.tsx"],
  dependencies: [],
  registryDependencies: [],
  origin: {
    project: "Steeze",
    path: "src/components/ui/contact-form.jsx (public/assets/branding/qrcode.webp, its charcoal ground made transparent for bash-ui)",
  },
  credits: [],
  props: [
    { name: "src", type: "string", description: "The QR code artwork, drawn for dark mode: light modules on a transparent ground." },
    { name: "alt", type: "string", description: "What scanning it does, e.g. \"Scan to download the Steeze app\"." },
    { name: "size", type: "number", description: "Width and height in pixels. Defaults to 224." },
    {
      name: "invertOnLight",
      type: "boolean",
      description: "Invert the artwork in light mode so it reads dark on a light page. Defaults to true.",
    },
    {
      name: "...img props",
      type: "ImgHTMLAttributes<HTMLImageElement>",
      description: "className, loading and the rest.",
    },
  ],
};
