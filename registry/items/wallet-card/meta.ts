import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "wallet-card",
  title: "Wallet card",
  kind: "widget",
  category: "data-display",
  previewReplay: true,
  type: "registry:component",
  description:
    "A payment card that slides into a stitched leather pocket and peeks out above it, with the balance counting up in the pocket behind an eye toggle. Tap the card to pull it up.",
  whenToUse:
    "Use as the hero of an earnings or wallet screen, where one balance matters and the card is the user's identity in the product. Not for lists of accounts or several balances; it is one object, and it needs about 340px of width and 330px of height.",
  files: ["registry/items/wallet-card/wallet-card.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "app/(root)/earnings.tsx (wallet / card holder section)" },
  credits: [
    {
      name: "\"The New Home and Colonial Offices, Westminster, 1875\", Wellcome Collection: the engraved card artwork, changes made; gallery preview only, not shipped",
      license: "CC-BY-4.0",
    },
    {
      name: "Leather texture image by Freepik (free licence: credit required); gallery preview only, not shipped",
      url: "https://www.freepik.com",
      license: "LicenseRef-Freepik",
    },
  ],
  props: [
    { name: "balance", type: "number", description: "The balance in the pocket. Counts up from zero over 900ms when shown." },
    { name: "currency", type: "string", description: 'Prefix for the default formatter. Defaults to "₦".' },
    { name: "locale", type: "string", description: 'Digit grouping for the default formatter. Defaults to "en-NG".' },
    { name: "formatBalance", type: "(value: number) => string", description: "Replaces the default formatter." },
    { name: "balanceLabel", type: "ReactNode", description: 'Label above the balance. Defaults to "Available to Withdraw".' },
    { name: "defaultBalanceVisible", type: "boolean", description: "Whether the balance starts visible (default) or masked." },
    { name: "onBalanceVisibleChange", type: "(visible: boolean) => void", description: "Called when the eye toggle shows or hides the balance." },
    { name: "loading", type: "boolean", description: "Shows a placeholder bar instead of the balance." },
    { name: "holderName", type: "string", description: 'Name printed on the card. Defaults to "MEMBER".' },
    { name: "cardNumberSuffix", type: "string", description: 'Characters after the masked dots, set in the mono face. Defaults to "8888".' },
    { name: "brand", type: "ReactNode", description: 'Mark in the card\'s top-right corner. Defaults to "Steeze".' },
    { name: "cardImage", type: "string", description: "Artwork on the card, under a half veil. Without it the card is a flat inset shade." },
    { name: "leatherImage", type: "string", description: "Leather texture for the wallet. Without it the pocket is a flat gradient." },
    { name: "onCardPress", type: "(pulledUp: boolean) => void", description: "Called when the card is tapped, with whether it is now pulled up." },
    { name: "tone", type: '"dark" | "auto"', description: "dark (default) keeps the wallet a dark leather object on a light page too, as in the app; auto follows the page." },
    { name: "...div props", type: "HTMLAttributes<HTMLDivElement>", description: "className (set the width here) and the rest." },
  ],
};
