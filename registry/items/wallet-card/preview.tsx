"use client";

import { walletTextures } from "./fixtures.ts";
import { WalletCard } from "./wallet-card.tsx";

export default function WalletCardPreview() {
  return (
    <WalletCard
      balance={248500}
      holderName="ADA OKAFOR"
      cardNumberSuffix="7F3A"
      {...walletTextures}
      className="w-[342px] max-w-full"
    />
  );
}
