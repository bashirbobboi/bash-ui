import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "key-login-button",
  "title": "Key login button",
  "kind": "primitive",
  "category": "buttons",
  "type": "registry:ui",
  "description": "Ledge’s green pill login button with a rotating key and rolling label on hover or keyboard focus.",
  "whenToUse": "Use as an entry action or login link. Supply href for navigation, or onClick / type=\"submit\" for an action.",
  "files": [
    "registry/items/key-login-button/key-login-button.tsx"
  ],
  "dependencies": [
    "motion"
  ],
  "origin": {
    "project": "Ledge",
    "path": "src/components/landing/header.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "label",
      "type": "string",
      "description": "Button text, default Log in."
    },
    {
      "name": "href",
      "type": "string",
      "description": "Renders a link when supplied."
    },
    {
      "name": "onClick",
      "type": "MouseEventHandler",
      "description": "Action callback."
    },
    {
      "name": "disabled",
      "type": "boolean",
      "description": "Prevents interaction."
    },
    {
      "name": "fullWidth",
      "type": "boolean",
      "description": "Fills the available width."
    },
    {
      "name": "type",
      "type": "\"button\" | \"submit\" | \"reset\"",
      "description": "Native button type, default button."
    }
  ]
};
