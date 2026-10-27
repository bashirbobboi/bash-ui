import type { AccordionEntry } from "./faq-accordion.tsx";

/** A marketplace FAQ in Steeze's voice. Not shipped. */
export const faqs: AccordionEntry[] = [
  {
    id: "what",
    question: "What is this marketplace?",
    answer:
      "A community-driven place to buy, sell and discover fashion. It is less a shop than a culture, built around genuine style and the people who wear it.",
  },
  {
    id: "sell",
    question: "How do I start selling?",
    answer:
      "Create an account, photograph your piece in good light and list it with a price. Buyers can message you, save it to a board or check out straight away.",
  },
  {
    id: "fees",
    question: "Does it cost anything to join?",
    answer: "Joining is free. A small fee is taken only when something sells, and you see it before you list.",
  },
  {
    id: "delivery",
    question: "How does delivery work?",
    answer:
      "Sellers drop orders at a partner hub or book a pickup. Buyers can follow the parcel from the order page until it arrives.",
  },
];
