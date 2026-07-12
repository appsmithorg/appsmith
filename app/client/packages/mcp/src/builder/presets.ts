import type { PageSpec } from "./schema.js";

// Ready-made page specs the caller's agent can use as-is or adapt. Presets encode "how Appsmith places things" for
// common shapes so the agent doesn't have to compose them from scratch.

export interface Preset {
  name: string;
  description: string;
  spec: PageSpec;
}

export const PRESETS: Record<string, Preset> = {
  form: {
    name: "form",
    description:
      "A titled form: heading, a few labelled inputs, and a submit button. Rename/extend the inputs to fit your data.",
    spec: {
      name: "Form",
      widgets: [
        { type: "text", name: "Title", text: "New record" },
        { type: "input", name: "Name", label: "Name" },
        { type: "input", name: "Email", label: "Email", inputType: "EMAIL" },
        { type: "button", name: "Submit", text: "Submit" },
      ],
    },
  },

  "table-detail": {
    name: "table-detail",
    description:
      "A table above a details card. Bind the table's `data` to a query, and the inputs in the card to the selected row.",
    spec: {
      name: "Records",
      widgets: [
        { type: "table", name: "RecordsTable" },
        {
          type: "container",
          name: "DetailsCard",
          children: [
            { type: "text", name: "DetailsTitle", text: "Details" },
            { type: "input", name: "DetailName", label: "Name" },
            {
              type: "input",
              name: "DetailEmail",
              label: "Email",
              inputType: "EMAIL",
            },
          ],
        },
      ],
    },
  },

  "card-grid": {
    name: "card-grid",
    description:
      "A single card (image + title + action) meant to be duplicated across a grid/list. Bind the image and text to your data, then repeat per row.",
    spec: {
      name: "Gallery",
      widgets: [
        {
          type: "container",
          name: "Card",
          children: [
            { type: "image", name: "CardImage", image: "" },
            { type: "text", name: "CardTitle", text: "Title" },
            { type: "button", name: "CardAction", text: "Open" },
          ],
        },
      ],
    },
  },

  crud: {
    name: "crud",
    description:
      "A basic create/read/update layout: a table of records plus an edit form with save/delete actions.",
    spec: {
      name: "Manage",
      widgets: [
        { type: "table", name: "Records" },
        { type: "input", name: "EditName", label: "Name" },
        {
          type: "input",
          name: "EditEmail",
          label: "Email",
          inputType: "EMAIL",
        },
        { type: "button", name: "Save", text: "Save" },
        { type: "button", name: "Delete", text: "Delete" },
      ],
    },
  },
};

export function listPresets() {
  return Object.values(PRESETS).map(({ description, name }) => ({
    name,
    description,
  }));
}
