"use client";

import { faqs } from "./fixtures.ts";
import { FaqAccordion } from "./faq-accordion.tsx";

export default function FaqAccordionPreview() {
  return (
    <div className="w-full max-w-[420px]">
      <FaqAccordion items={faqs} />
    </div>
  );
}
