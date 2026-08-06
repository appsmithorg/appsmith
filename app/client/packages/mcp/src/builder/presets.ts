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
      "A card grid and a table bound to the SAME query (a shared table/cards view). Point both `source`s at your query and set the card's item fields (image/title/subtitle) to your columns.",
    spec: {
      name: "Gallery",
      widgets: [
        { type: "table", name: "ItemsTable", source: { query: "getItems" } },
        {
          type: "list",
          name: "ItemsCards",
          source: { query: "getItems" },
          image: "image",
          title: "name",
          subtitle: "description",
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

  "view-switcher": {
    name: "view-switcher",
    description:
      "A screen with multiple views of the same data behind a tabs switcher (the List/Board/Timeline pattern). One tab per view; put each view's approximation inside its tab and bind them to the same query.",
    spec: {
      name: "Views",
      widgets: [
        { type: "text", name: "Title", text: "Records" },
        {
          type: "tabs",
          name: "ViewTabs",
          tabs: [
            {
              label: "List",
              children: [
                {
                  type: "table",
                  name: "ListTable",
                  source: { query: "getItems" },
                },
              ],
            },
            {
              label: "Cards",
              children: [
                {
                  type: "list",
                  name: "CardView",
                  source: { query: "getItems" },
                  title: "name",
                  subtitle: "status",
                },
              ],
            },
          ],
        },
      ],
    },
  },

  "status-board": {
    name: "status-board",
    description:
      "Kanban approximation: one tab per status, each holding a table bound to a status-filtered query (create one query per status, e.g. getTodo/getInProgress/getDone). Appsmith has no native board widget — say so when substituting this for a real kanban.",
    spec: {
      name: "Board",
      widgets: [
        { type: "text", name: "Title", text: "Tasks" },
        {
          type: "tabs",
          name: "StatusTabs",
          tabs: [
            {
              label: "To do",
              children: [
                {
                  type: "table",
                  name: "TodoTable",
                  source: { query: "getTodo" },
                },
              ],
            },
            {
              label: "In progress",
              children: [
                {
                  type: "table",
                  name: "InProgressTable",
                  source: { query: "getInProgress" },
                },
              ],
            },
            {
              label: "Done",
              children: [
                {
                  type: "table",
                  name: "DoneTable",
                  source: { query: "getDone" },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  timeline: {
    name: "timeline",
    description:
      "Gantt/timeline approximation: a horizontal bar chart (task per bar, duration/end as the value) above a status table bound to the same query. Appsmith has no native gantt widget — say so when substituting.",
    spec: {
      name: "Timeline",
      widgets: [
        { type: "text", name: "Title", text: "Schedule" },
        {
          type: "chart",
          name: "TimelineChart",
          chartType: "BAR_CHART",
          title: "Task timeline",
          source: { query: "getTasks", x: "task", y: "duration" },
          xAxisLabel: "Days",
        },
        { type: "text", name: "DetailHeader", text: "All tasks" },
        {
          type: "table",
          name: "TasksTable",
          source: { query: "getTasks" },
        },
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
