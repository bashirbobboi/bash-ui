"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { walletTextures } from "./fixtures.ts";
import { WalletCard } from "./wallet-card.tsx";

export const playground: PlaygroundSpec = {
  component: "WalletCard",
  controls: [
    { type: "number", name: "balance", label: "Balance", min: 0, max: 2000000, step: 500, default: 248500 },
    { type: "text", name: "holderName", label: "Card holder", default: "ADA OKAFOR" },
    { type: "text", name: "cardNumberSuffix", label: "Card suffix", default: "7F3A" },
    { type: "boolean", name: "defaultBalanceVisible", label: "Balance visible", default: true },
    { type: "boolean", name: "loading", label: "Loading", default: false },
  ],
  render: (values) => (
    <WalletCard
      key={String(values.defaultBalanceVisible)}
      balance={Number(values.balance)}
      holderName={String(values.holderName)}
      cardNumberSuffix={String(values.cardNumberSuffix)}
      defaultBalanceVisible={Boolean(values.defaultBalanceVisible)}
      loading={Boolean(values.loading)}
      {...walletTextures}
      className="w-[342px] max-w-full"
    />
  ),
  codeProps: ['cardImage="/card-art.webp"', 'leatherImage="/leather.webp"', "onCardPress={trackCardTap}"],
};
