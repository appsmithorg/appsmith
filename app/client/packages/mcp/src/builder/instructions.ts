import { WIDGET_CATALOG } from "./capabilities.js";
import { listPresets } from "./presets.js";

// M2 — instruction sets delivered through the MCP protocol as `resources` (reference/guides/recipes) and `prompts`
// (guided workflows). Everything here is inline TS (no external assets) so the build/tooling is unchanged, and
// every recipe/guide references only tools that actually exist. Data-layer wiring is intentionally NOT taught here;
// it arrives with the data layer so we never advertise a capability that isn't enabled.

export interface InstructionDoc {
  slug: string;
  title: string;
  description: string;
  render: () => string;
}

// --- reference/widgets — generated from the single WIDGET_CATALOG source (no forked list) -----------------------

function renderWidgetReference(): string {
  const lines = ["# Widget reference", ""];

  for (const widget of WIDGET_CATALOG) {
    lines.push(`## ${widget.type}`);
    lines.push(widget.purpose);
    lines.push("");
    lines.push("Fields:");

    for (const [field, shape] of Object.entries(widget.fields)) {
      lines.push(`- \`${field}\`: ${shape}`);
    }

    lines.push("");
  }

  lines.push(
    "Every widget also accepts an optional `name` (alphanumeric/underscore) and `placement`",
    "(`{ after: '<widgetName>' }` or `{ inside: '<containerName>' }`).",
  );

  return lines.join("\n");
}

// --- guides ----------------------------------------------------------------------------------------------------

const GUIDE_PLACEMENT = `# Placement guide

Widgets are auto-placed on a 64-column grid, stacked top-to-bottom in spec order.

- Omit \`placement\` to append below existing content.
- \`{ after: "Email" }\` places the widget just below the widget named \`Email\` (on the same canvas).
- \`{ inside: "DetailsCard" }\` places the widget inside a container's inner canvas.
- \`after\` and \`inside\` are mutually exclusive — set at most one.
- A placement that can't be resolved falls back to "append" and is reported in the response \`notes\`.

Overlap safety: widgets are never silently written over each other.

- A \`patch_widgets\` move to an occupied position is REPAIRED to the nearest free spot below —
  the change records \`requestedPosition\` vs the applied \`position\` and the result carries a
  note. Pass \`strict: true\` to get a rejection (with the colliding names and the nearest free
  position) instead of a repair.
- Any layout mutation that would still introduce an overlap is rejected with code
  \`overlap_introduced\` plus a ready-to-apply \`suggestedFix\` (literal \`patch_widgets\` move
  operations) — apply it verbatim, then retry. Pre-existing overlaps on a page never block edits.
- Swapping two widgets needs a temporary spot: move A aside, move B into A's old place, then
  move A into B's — two widgets cannot occupy the same cells mid-sequence.
- Containers, forms, and tabs auto-grow when content needs more room, pushing widgets below
  them down (reported in \`notes\`/\`changes\`). A modal body that outgrows the modal scrolls;
  its diagnostic includes a \`resize\` suggestedFix to show everything.
- Resize a widget with \`patch_widgets\` \`{ kind: "resize", name, rows?, columns? }\` (grid
  units). Overlap and clipped-container diagnostics include ready-to-apply \`suggestedFix\`
  payloads — prefer applying them over doing grid arithmetic yourself.

After a build or edit, call \`inspect_page\` (or read the inline \`diagnostics\`) to catch overlaps,
off-grid widgets, or a container that clips its contents, then fix and re-check.`;

const GUIDE_NAMING = `# Naming guide

- \`name\` must match \`[A-Za-z0-9_]+\` (letters, digits, underscore). No spaces, dashes, or punctuation.
- Names must be unique within a page — the compiler auto-suffixes collisions (Table, Table1, Table2…),
  but explicit, meaningful names make later \`edit_page\` placement (\`after\`/\`inside\`) reliable.
- If you omit \`name\`, a sensible default is assigned from the widget type.`;

const GUIDE_BINDINGS = `# Data & bindings guide

Agents never author raw expressions. Any field containing binding/template syntax
(\`{{ }}\`, \`\${ }\`, or backticks) is rejected — this keeps agent-authored content from being
evaluated as code in a viewer's browser.

- Static data: a table's \`data\` takes literal rows only — an array of flat objects of
  string/number/boolean/null cells. It is rendered as-is, never evaluated.
- Dynamic (query-backed) data: supplied through structured references, not hand-written
  \`{{ }}\`:
  - Bind a table to a query: \`{ "type": "table", "source": { "query": "getUsers" } }\`.
  - Run a query on a button click: \`{ "type": "button", "onClick": { "run": "insertRow" } }\`.
  The query name must be a plain identifier; the compiler emits the safe binding for you. These
  work when the data layer is enabled on the instance (list_datasources / get_datasource_structure
  help you discover what to query). A table sets \`data\` OR \`source\`, never both.
- IMPORTANT — the same table binding has a DIFFERENT prop name on each path:
  - Creating a table (\`build_application\` / \`edit_page\` spec): \`source: { query: "getUsers" }\`.
  - Patching an EXISTING table (\`patch_widgets\` update props): \`tableData: { query: "getUsers" }\`.
  On \`patch_widgets\`, rebinding a TABLE always uses \`tableData\` — \`source\` there is a
  text/image display binding (selected-row \`{ table, column }\` or scalar query readout
  \`{ query, field }\`) and is rejected on a table. \`read_semantic_page\` reports a table's
  binding back as \`tableData\`, matching the patch name.
- Scalar readouts (query -> text/image): show ONE field of a query's response directly, no table
  needed — \`{ "type": "text", "source": { "query": "getWeather", "field": "current.temp" } }\`,
  \`{ "type": "image", "source": { "query": "getProfile", "field": "avatarUrl" } }\`. Omit \`field\`
  to show the whole response body. On \`patch_widgets\` the same ref goes on \`source\` (text) or
  \`imageSource\` (image). A text/image sets its literal (\`text\`/\`image\`) OR \`source\`, never both.
- Computed values (no query at all): a text can show the current date/time, a row count, or a
  concatenation through the closed token vocabulary on \`value\`:
  \`{ "type": "text", "value": { "now": { "format": "dayOfWeek" } } }\` (named formats:
  dayOfWeek, date, dateShort, time, dateTime, isoDate, monthYear — the compiler owns the
  actual format string), \`{ "value": { "count": { "query": "getUsers" } } }\`, or
  \`{ "value": { "concat": [{ "table": "Users", "column": "first" }, { "literal": " " },
  { "table": "Users", "column": "last" }] } }\`, or ARITHMETIC through the formula AST:
  \`{ "value": { "formula": { "op": "round", "args": [{ "op": "add", "args": [{ "op": "mul",
  "args": [{ "query": "getWeather", "field": "current.temp" }, 1.8] }, 32] }, 1] } } }\`
  (Fahrenheit from Celsius, 1 decimal). Ops: add/sub/mul/div/round/abs/min/max; leaves are
  numbers, \`{ query, field? }\`, or \`{ table, column }\`; non-numeric inputs render blank.
  Same tokens on \`patch_widgets\` \`value\` (text only). A text sets exactly ONE of \`text\`,
  \`source\`, or \`value\`. NOTE: \`read_semantic_page\` reports \`now\` and \`count\` values back
  but NOT \`concat\` or \`formula\` — those are still applied even though they do not appear in
  read-back; do not re-set them.
- LIVE per-category counts (status badges, "N completed") — do NOT reach for spreadsheet
  COUNTIF cells, a static snapshot, or JS. For a Google Sheet, create one FILTERED read per
  category with \`create_sheets_query\` (read \`filter: [{ column, op, value }]\`, e.g. Status eq
  'Completed'), then bind a text's \`value: { count: { query } }\` to it. Each badge counts its
  own filtered read and updates live. (For SQL/Mongo, a per-category query does the same.) A
  filter \`value\` is a \`{ literal }\` or a \`{ widget, property }\`; for a bound value prefer a
  CONSTRAINED input (a select's option value or a number) over free text — a free-text value
  containing a quote can malform the Sheets filter.
- Colored badges/pills: a \`text\` takes \`textColor\` and \`backgroundColor\` (literal colors —
  hex/rgb/hsl/named, validated; no CSS/url/binding). You do NOT need per-row table colors or the
  global theme for this. ALWAYS set BOTH colors together for legible contrast — a saturated/dark
  \`backgroundColor\` needs a light \`textColor\` (e.g. \`#ffffff\` on \`#16a34a\`), a light tint needs
  a dark \`textColor\` — the compiler does not auto-pick a contrasting color. A bare \`text\` +
  \`backgroundColor\` renders as a full-width LEFT-aligned colored bar; for a compact centered pill,
  also \`patch_widgets\` a smaller size and \`textAlign: 'CENTER'\`.
- Display bindings (selected row): show or prefill from the table's selected row through the
  same structured-reference rule:
  - Detail text: \`{ "type": "text", "source": { "table": "Users", "column": "email" } }\`.
  - Edit-form prefill: \`{ "type": "input", "defaultValue": { "table": "Users", "column": "email" } }\`.
  Both are also available as \`patch_widgets\` update props (\`source\` on text, \`defaultValue\` on
  input) to upgrade an existing page. A text sets \`text\` OR \`source\`, never both.
- Event chains: \`wire_event\` wires one event, and a \`run\` action may chain
  \`onSuccess\`/\`onError\` follow-ups (run another query, close a modal, navigate, show an alert):
  \`{ "run": "insertUser", "onSuccess": [{ "run": "getUsers" }, { "closeModal": "AddUserModal" },
  { "showAlert": "Saved", "style": "success" }] }\` — the canonical submit → refresh → close flow.
  The action may also be an ordered LIST of 2–5 statements (at most one \`run\`, which alone
  carries \`onSuccess\`/\`onError\`) — e.g. a Clear button that empties a store key AND resets an
  input in one click.
- Modal discipline: a modal can never live INSIDE another modal (builds/edits/moves that nest
  one are rejected) — modals are page-level overlays. A built modal is CLOSED by default (never
  shown on page load); open it with a \`wire_event\` \`showModal\` (e.g. an "Add Task" button).
  A modal that submits data should give the user a way OUT: pair the primary action (Save/Add)
  with a Cancel button whose onClick is \`{ "closeModal": "<ThatModal>" }\`, and keep the form
  compact (a few fields) so the buttons aren't pushed to the bottom of the overlay.
  Stacking rules on wiring: opening a modal from inside another modal leaves both open — depth
  2 (e.g. a confirm dialog over an edit modal) is allowed with a warning; depth 3+ and cycles
  are rejected. To move between modals WITHOUT stacking (wizards, back buttons), close the
  host in the same action: \`[{ "closeModal": "Step1" }, { "showModal": "Step2" }]\` — a
  close-then-open is a transition and never counts as a stack. Bindings hand-written in the
  Appsmith editor that the analyzer can't parse are skipped fail-open; \`inspect_page\` reports
  how many were excluded (nested trigger paths like table row-button events are also outside
  the analysis).
- HAND-AUTHORED apps (built in the Appsmith editor, not by MCP): read-back hides every binding
  the analyzer does not recognize — a widget can carry a live hand-written expression that
  \`read_semantic_page\` simply does not show, and NO count reports hidden PROPERTY bindings
  (\`inspect_page\`'s excluded-binding count covers only event/trigger bindings). So on ANY
  page a human built or edited: an empty read-back NEVER means an unbound prop. Before
  overwriting a prop (a literal \`text\`, a new \`source\`, \`tableData\`, ...) on such a page,
  TELL the user any existing hand-written binding on that prop will be REPLACED and get their
  confirmation first.
- Accumulating results across runs (store accumulation): re-running a query REPLACES its
  \`data\`, so a query-bound table shows only the latest response. To build a table that grows
  with each run, accumulate rows in the Appsmith store:
  - \`wire_event\` verb \`appendToStore\`: \`{ "appendToStore": { "key": "zipResults", "query":
    "LookupZip" } }\` appends the query's response under the store key (an array response adds
    one row per record; an object response adds a single row). Add \`field\` (dotted identifier
    path) to append a nested array, OR \`fields\` to project named values into ONE row per run:
    \`"fields": [{ "as": "zip", "path": ["post code"] }, { "as": "state", "path": ["places", 0,
    "state"] }]\` — \`path\` is a list of string keys / numeric array indexes, so space-keyed and
    array-indexed API values are reachable.
  - \`wire_event\` verb \`clearStoreKey\`: \`{ "clearStoreKey": { "key": "zipResults" } }\` empties
    that ONE key (never the whole store).
  - Bind the table to the key: build/edit \`source: { "store": "zipResults" }\`, patch
    \`tableData: { "store": "zipResults" }\`.
  - Store keys are identifiers (letter/underscore start, max 64). Accumulated rows are
    SESSION-ONLY by design (never persisted to localStorage, so one user's rows can't leak to
    the next browser user): results reset on reload. See appsmith://recipe/zip-lookup for the
    full worked example.`;

const GUIDE_GIT = `# Git-connected applications guide

Appsmith models every git branch as its OWN application document (branch-per-application). There
is no checkout: an applicationId is permanently pinned to one branch, and working on another
branch means targeting a DIFFERENT applicationId. The human's editor view is never affected by
agent branch work.

Workflow:

1. \`read_git_status\` on the target application FIRST. Note \`branchName\` (mutations require it),
   whether the working state is dirty, and the protected branches.
2. Dirty check: if the status shows uncommitted changes you did not make, STOP and tell the
   user before editing or branching — branching from a dirty source carries their uncommitted
   work onto the new branch too, and the source branch stays dirty.
3. Behind the remote: pass \`compareRemote: true\` to fetch \`aheadCount\`/\`behindCount\` (this
   contacts the remote, so it is opt-in). If \`behindCount\` > 0, suggest the user pulls the
   latest changes in Appsmith's git UI first — MCP cannot pull.
4. Create your own branch with \`create_branch\` (governed): the name MUST start with \`mcp/\`
   (remainder: 1-60 characters of A-Za-z0-9_-). \`mcp/*\` is the RESERVED agent namespace — keep
   human branches out of it. Creating the branch PUSHES the new ref to the customer's git
   remote immediately, so remote CI/webhooks watching branch pushes will run.
5. Edit the NEW applicationId: the \`create_branch\` result carries the branched applicationId.
   ALL subsequent reads, edits, and events for this branch target that id, passing
   \`branch: "mcp/<x>"\`. The original applicationId still points at its own branch.
6. Every mutation on a git-connected app requires \`branch\` equal to the target app's current
   branch. A missing or mismatched value fails with the current branch in the error, so
   recovery is a single retry.
7. Commit with \`prepare_commit\` -> \`confirm_commit\` (governed). The commit API always PUSHES to
   the customer's git remote — there is no commit-without-push — so committing is allowed ONLY
   on \`mcp/\` agent branches (re-verified with a fresh read at confirm time; any other branch
   fails with \`git_commit_branch_forbidden\`). The message is one printable line (max 200
   characters, must not start with \`[\`); the server prepends a non-strippable \`[mcp] \` marker.
   The human approves the commit: on elicitation-capable clients \`confirm_commit\` prompts them
   directly (only an explicit accept proceeds; at most 3 prompts per confirmation); on other
   clients you MUST show the user the \`relay\` text from \`prepare_commit\` and get their approval
   before confirming.
8. The handoff for a git app is the BRANCH, not a viewerUrl — publishing from MCP stays
   disabled for git apps. Hand the user the branch name and the branch-scoped editor URL from
   the \`confirm_commit\` result: they review on the branch, merge via Appsmith's branch UI or a
   pull request on the remote, then delete the \`mcp/\` branch.

Cleanup: agents never delete branches. At most 5 \`mcp/\` branches exist per application — at the
cap, reuse a branch you created earlier in the session, or ask the user to delete stale \`mcp/\`
branches via Appsmith's branch UI.`;

const GUIDE_SCREENSHOT = `# Screenshot / mockup decode guide

You (the agent) see the image; the MCP server never does. Fidelity therefore depends entirely on
how you translate pixels into the spec vocabulary. Do it in three passes — layout first, data last.
Skipping pass 1 is the classic failure: you inventory the data, build "title + table + form", and
lose the screen's actual structure.

## Pass 1 — layout skeleton (before thinking about data)
Describe the image as horizontal regions, top to bottom, ignoring content:
- What is in the top bar? (title left? view-switcher tabs center? action buttons right?)
- What are the major content regions and their relative sizes?
- What is grouped inside a card/panel vs. sitting on the page?
Write this skeleton down before choosing any widget. Every region in the skeleton must appear in
your spec or be explicitly called out to the user as dropped.

## Pass 2 — map regions to widgets, approximating honestly
Map each region to the closest widget (see appsmith://reference/widgets). When there is no exact
widget, use the standard approximation and TELL THE USER what you substituted:

| You see | Build |
| --- | --- |
| View switcher (List / Board / Gantt...) | \`tabs\` — one tab per view, each holding that view's approximation (preset \`view-switcher\`) |
| Kanban board (status columns) | \`tabs\` with one tab per status, each holding a status-filtered table (preset \`status-board\`) |
| Gantt / timeline | \`chart\` (BAR_CHART, task on one axis) above a status table (preset \`timeline\`) |
| Calendar | \`datepicker\` + a table filtered to the selected date |
| KPI / stat tiles | consecutive \`text\` widgets with \`value: { count: ... }\` — the design pass tiles 2–4 per row |
| Toolbar action buttons ("+ Task") | \`button\`s — listed after the page's fields they act on so they right-align |
| Status pills / colored labels | table columns (the design pass styles headers; per-cell colors are limited — say so) |

Order matters: the compiler's design pass reads spec order (first static text = page title, text
before a section = its header, consecutive buttons = an action row). Emit widgets in the same
top-to-bottom, left-to-right order as the screenshot.

## Pass 3 — visual identity
- Extract the dominant accent color (buttons, active tab, links) and pass it as the app spec's
  \`theme.primaryColor\` (hex). Border radius if obviously rounded: \`theme.borderRadius\`.
- Put the screenshot's real title text in the first text widget — never a placeholder.
- Use the screenshot's own labels for tabs, buttons, and table columns.

## Then verify like any build
\`validate_app_spec\` -> \`build_application\` -> \`inspect_page\`, and read back with
\`read_semantic_page\` to confirm the structure matches your pass-1 skeleton. Finish by telling the
user (a) which regions were approximated and how, (b) which were dropped, and (c) what a closer
match would need (e.g. a native board/timeline widget).`;

export const GUIDES: InstructionDoc[] = [
  {
    slug: "placement",
    title: "Placement guide",
    description:
      "How auto-placement works and how to target it with after/inside.",
    render: () => GUIDE_PLACEMENT,
  },
  {
    slug: "naming",
    title: "Naming guide",
    description: "Rules and conventions for widget names.",
    render: () => GUIDE_NAMING,
  },
  {
    slug: "bindings",
    title: "Data & bindings guide",
    description: "Why raw expressions are rejected and how data binding works.",
    render: () => GUIDE_BINDINGS,
  },
  {
    slug: "git",
    title: "Git-connected applications guide",
    description:
      "Status-first workflow, the branch gate, agent mcp/ branches, and cleanup for git-connected apps.",
    render: () => GUIDE_GIT,
  },
  {
    slug: "screenshot",
    title: "Screenshot / mockup decode guide",
    description:
      "Three-pass method for recreating a screenshot: layout skeleton, widget mapping with honest approximations, theme extraction.",
    render: () => GUIDE_SCREENSHOT,
  },
];

// --- recipes (end-to-end walkthroughs; reference only tools that exist) -----------------------------------------

const RECIPE_CRUD = `# Recipe: CRUD page

Goal: a table of records with a details form to view/edit a selected row.

1. \`get_capabilities\` — confirm the widget set and spec shape.
2. \`get_preset\` with name \`crud\` — start from the ready CRUD layout.
3. Adapt the preset: rename the table and inputs to your entity, add/remove inputs to match
   your fields. Keep names alphanumeric and unique.
4. \`validate_app_spec\` — dry-run compile; fix any reported errors before building.
5. \`build_application\` — create the app. Read the inline \`diagnostics\`.
6. \`inspect_page\` — verify no overlaps/off-grid/clipped-container issues; \`edit_page\` to fix.

To make it live (when the data layer is enabled):
7. \`list_datasources\` — find your data source. If none exists yet, \`create_datasource\`
   provisions one: a PostgreSQL/MySQL/SQL Server database from host/port/database (unconfigured —
   ask the user to enter the password in Appsmith and Test & Save), or a REST API from a base
   \`url\` (created ready to use when the API needs no auth). No credentials pass through MCP.
8. \`get_datasource_structure\` — read its tables/columns.
9. \`create_query\` — e.g. a SELECT plus an UPDATE over your table (structured spec, no raw SQL).
10. Bind the table to the query — the prop name differs by path: on \`patch_widgets\` (existing
    table) use \`tableData\` = { query: '<name>' }; on \`edit_page\` (new table) use \`source\` =
    { query: '<name>' }. Then prefill the form inputs from the selection (\`defaultValue\` =
    { table: '<Table>', column: '<col>' }) and show read-only detail text (\`source\` =
    { table, column }).
11. \`wire_event\` — wire the save button: { run: '<updateQuery>', onSuccess: [{ run: '<selectQuery>' },
    { showAlert: 'Saved', style: 'success' }] } so the table refreshes after the write.

Close the loop (not optional): every write wiring chains a re-run of the read query feeding the
table (skipping it means stale data until the user reloads — \`wire_event\` returns a refreshHint
and \`inspect_page\` flags 'write-no-refresh' when you forget); the table's selected row must feed
the detail inputs (step 10) — a table whose selection nothing consumes is flagged as
'selection-unused'; and Submit/Add wirings should reset their inputs and showAlert so users see
the write landed.
12. Publish LAST: \`build_application\` auto-deployed the app at creation, but that viewer copy is a
    scaffold — it does not include the wiring above until re-published. Once everything works, re-publish
    (\`prepare_publish\` -> \`confirm_publish\`, governed) and only then hand the user the \`viewerUrl\`.
    Without governance, share the \`editorUrl\` and relay the governance 'requires' message instead.`;

const RECIPE_FORM = `# Recipe: Form page

Goal: a labelled input form with a submit button, grouped in a card.

1. \`get_capabilities\`, then \`get_preset\` with name \`form\`.
2. Replace the inputs with your fields (set \`label\` and \`inputType\`), keep the submit button.
3. Group related fields with a \`container\` and place inputs \`{ inside: "<container>" }\`.
4. \`validate_app_spec\` → \`build_application\` → \`inspect_page\`, fixing any diagnostics.`;

const RECIPE_TABLE_DETAIL = `# Recipe: Master–detail page

Goal: a table above a details card (the common admin/read pattern).

1. \`get_preset\` with name \`table-detail\`.
2. Rename the table and the card's inputs to your entity/fields.
3. Add fields as inputs \`{ inside: "DetailsCard" }\` so they land in the card.
4. \`validate_app_spec\` → \`build_application\` → \`inspect_page\`.

Static layout today; wire the table to a query and the inputs to the selected row when the data
layer is enabled.`;

// The originating M5 field-report app, end to end: each lookup APPENDS a row to a results table (a re-run query
// would only replace it), using the closed store-accumulation vocabulary.
const RECIPE_ZIP_LOOKUP = `# Recipe: ZIP lookup with an accumulating results table

Goal: enter a ZIP code, click Lookup, and add one row per lookup to a results table that keeps
growing; a Clear button empties the table and the input.

1. Build the page (\`build_application\` / \`edit_page\`):
   - Input \`ZipInput\` with \`validation: { "format": "zipcode" }\`.
   - Button \`LookupButton\` (text "Lookup").
   - Button \`ClearButton\` (text "Clear").
   - Table \`ZipResults\` bound to the store key: \`source: { "store": "zipResults" }\`
     (on an EXISTING table: \`patch_widgets\` with \`tableData: { "store": "zipResults" }\`).
2. Create the lookup query (data layer): \`create_rest_api\` named \`LookupZip\` against the ZIP
   API. Its response has space-keyed and array-indexed values ("post code", places[0].state) —
   exactly what the \`fields\` projection below reaches.
3. Wire the Lookup button (\`wire_event\` on \`LookupButton\` onClick) — run the query, then
   append ONE projected row per lookup:

   { "run": "LookupZip", "onSuccess": [{ "appendToStore": { "key": "zipResults",
     "query": "LookupZip", "fields": [
       { "as": "zip", "path": ["post code"] },
       { "as": "city", "path": ["places", 0, "place name"] },
       { "as": "state", "path": ["places", 0, "state"] }
     ] } }] }

4. Wire the Clear button (\`wire_event\` on \`ClearButton\` onClick) — a statement LIST that
   empties the store key and resets the input in one click:

   [{ "clearStoreKey": { "key": "zipResults" } }, { "reset": "ZipInput" }]

5. \`inspect_page\` — a store-bound table whose key has no appendToStore/clearStoreKey writer on
   the page is flagged as a warning (the writer may legitimately live on another page).
6. Publish last: the copy auto-deployed by \`build_application\` predates all of this wiring, so
   it is a scaffold until re-published. Re-publish (\`prepare_publish\` -> \`confirm_publish\`,
   governed) and hand over the \`viewerUrl\` as the final step; without governance, share the
   \`editorUrl\` and relay the governance 'requires' message from \`get_capabilities\`.

Note: accumulated rows are SESSION-ONLY by design (the server compiles storeValue with
persist=false, so rows fetched under one user's permissions are never written to the shared
browser's localStorage) — the table resets on reload.`;

export const RECIPES: InstructionDoc[] = [
  {
    slug: "crud",
    title: "CRUD page recipe",
    description: "Build a table + details form from the crud preset.",
    render: () => RECIPE_CRUD,
  },
  {
    slug: "form",
    title: "Form page recipe",
    description: "Build a labelled input form from the form preset.",
    render: () => RECIPE_FORM,
  },
  {
    slug: "table-detail",
    title: "Master–detail recipe",
    description: "Build a table-above-details-card layout.",
    render: () => RECIPE_TABLE_DETAIL,
  },
  {
    slug: "zip-lookup",
    title: "ZIP lookup recipe (store accumulation)",
    description:
      "Build a lookup form whose results table grows one row per lookup via appendToStore.",
    render: () => RECIPE_ZIP_LOOKUP,
  },
];

export const WIDGET_REFERENCE: InstructionDoc = {
  slug: "widgets",
  title: "Widget reference",
  description: "Every widget type, its purpose, and its fields.",
  render: renderWidgetReference,
};

// EVERY instruction doc (reference + guides + recipes) in one registry — the single source for both the MCP
// resources and the always-on get_guide tool (tools-only clients like ChatGPT cannot read MCP resources, so the
// same content must be reachable through a tool). Slugs are unique across all three groups (guarded by tests);
// no content is forked.
export const INSTRUCTION_DOCS: InstructionDoc[] = [
  WIDGET_REFERENCE,
  ...GUIDES,
  ...RECIPES,
];

export function getInstructionDoc(slug: string): InstructionDoc | undefined {
  return INSTRUCTION_DOCS.find((doc) => doc.slug === slug);
}

// --- prompts (guided workflows) --------------------------------------------------------------------------------

// Prompt args are string-only (MCP protocol). `fields` is a documented delimited string, parsed here.
export const FIELDS_FORMAT =
  'comma-separated "name:type" pairs, e.g. "name:TEXT, email:EMAIL, active:TEXT"';

interface ParsedField {
  name: string;
  inputType: "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";
}

const INPUT_TYPES = new Set(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]);

export function parseFields(fields: string): ParsedField[] {
  return fields
    .split(",")
    .map((pair) => pair.trim())
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [rawName, rawType] = pair.split(":").map((part) => part.trim());
      const upper = (rawType ?? "TEXT").toUpperCase();
      const inputType = (
        INPUT_TYPES.has(upper) ? upper : "TEXT"
      ) as ParsedField["inputType"];

      return { name: (rawName ?? "").replace(/[^A-Za-z0-9_]/g, ""), inputType };
    })
    .filter((field) => field.name.length > 0);
}

// Returns the concrete, ordered plan text for a scaffolding prompt — a single user-turn message that walks the
// agent through real tools with the caller's arguments already substituted.
export function scaffoldCrudPlan(entity: string, fields: string): string {
  const cleanEntity = entity.replace(/[^A-Za-z0-9_]/g, "") || "Record";
  const parsed = parseFields(fields);
  const fieldLines = parsed.length
    ? parsed.map((f) => `- ${f.name} (${f.inputType})`).join("\n")
    : "- (no fields parsed; add inputs for your entity's columns)";

  return `Build a CRUD page for "${cleanEntity}". Follow these steps, using the tools by name:

1. Call get_capabilities to confirm the widget set.
2. Call get_preset with { "name": "crud" } to get the starting layout.
3. Adapt the preset spec:
   - Rename the table to "${cleanEntity}Table".
   - Give the details card one input per field:
${fieldLines}
   - Keep names alphanumeric/underscore and unique.
4. Call validate_app_spec with the adapted app spec; fix any reported errors.
5. Call build_application with { "workspaceId": "<target workspace>", "app": <spec> }.
6. Read the returned diagnostics, then call inspect_page and resolve any issues with edit_page.

Table data is static for now. See appsmith://guide/bindings for how query-backed data works.`;
}

export function scaffoldFormPlan(entity: string, fields: string): string {
  const cleanEntity = entity.replace(/[^A-Za-z0-9_]/g, "") || "Record";
  const parsed = parseFields(fields);
  const fieldLines = parsed.length
    ? parsed.map((f) => `- ${f.name} (${f.inputType})`).join("\n")
    : "- (no fields parsed; add inputs for your form)";

  return `Build a form page for "${cleanEntity}". Use the tools by name:

1. Call get_capabilities, then get_preset with { "name": "form" }.
2. Adapt the spec: put these inputs inside a container named "${cleanEntity}Form":
${fieldLines}
   Keep the submit button. Names must be alphanumeric/underscore and unique.
3. Call validate_app_spec; fix errors.
4. Call build_application, then inspect_page and fix any diagnostics with edit_page.`;
}

// Guided workflow for recreating a screenshot/mockup the USER has shown the AGENT (the server never sees images).
// Walks the agent through the same three passes as appsmith://guide/screenshot with the app name substituted.
export function recreateFromScreenshotPlan(appName: string): string {
  const cleanName = appName.replace(/[^A-Za-z0-9_ ]/g, "").trim() || "App";

  return `Recreate the screenshot the user shared as an Appsmith app named "${cleanName}". The server cannot see the image — YOU are the eyes, so decode it methodically. Use the tools by name:

1. Call get_guide with { "slug": "screenshot" } and follow its three-pass method exactly.
2. Pass 1 — write down the layout skeleton: top bar contents, content regions top-to-bottom,
   what is grouped in cards/panels. Do this BEFORE choosing widgets.
3. Pass 2 — map every region to a widget, using the guide's approximation table for anything
   without an exact widget (view switcher -> tabs; kanban -> status-board preset; gantt/timeline
   -> timeline preset). Call get_preset for a matching preset and adapt it rather than composing
   from scratch. Emit widgets in the screenshot's visual order.
4. Pass 3 — extract the accent color into the spec's theme.primaryColor, and use the
   screenshot's real title/labels/columns, never placeholders.
5. Call validate_app_spec; fix errors. Call build_application with the target workspaceId.
6. Call inspect_page and read_semantic_page; compare against your pass-1 skeleton and fix gaps
   with edit_page / patch_widgets.
7. Report to the user: which regions were approximated (and how), which were dropped, and what
   a closer match would need.`;
}

// Presets referenced by the recipes above, surfaced for tests/consistency.
export function recipePresetNames(): string[] {
  return listPresets().map((preset) => preset.name);
}

// Server-level instructions returned in the MCP `initialize` response, so EVERY client (ChatGPT, Claude, ...) sees
// the full workflow and the fact that data/JS/governed capabilities exist — even before calling get_capabilities.
// This is the primary visibility surface: it must name the real tools and steer the agent to discover gated tools
// rather than assume the server can only scaffold.
// MAINTENANCE: this is hand-authored prose (MCP `instructions` cannot be generated). The tool names, widget list, and
// env-var names below are NOT bound to TOOL_CATALOG / WIDGET_CATALOG at compile time — on any tool rename, gate
// change, or widget addition, reconcile this string with those sources. The `SERVER_INSTRUCTIONS names only real
// tools + env vars` test guards against drift.
export const SERVER_INSTRUCTIONS = `Appsmith MCP — build and modify REAL Appsmith applications through a safe, structured API. You never write raw widget DSL, SQL, JS, or bindings; you call tools and the server compiles them under the user's own permissions.

ALWAYS call get_capabilities first. It lists the exact tools available under this deployment's configuration, plus 'disabledCapabilities' — capability groups that exist but are turned off (e.g. datasources/queries, JS objects, publish). If a capability you need is disabled, relay that group's 'requires' instruction to the user (it tells them to ask their Appsmith administrator to enable it) — do NOT claim the server cannot do it. Enabling is controlled by APPSMITH_MCP_DATA_ENABLED / APPSMITH_MCP_JS_ENABLED and a Mongo + Redis governance backend.

Recommended workflow for a production-quality app:
1. Target a workspace: resolve_workspace(name) -> workspaceId (or list_workspaces). Tools take an id, not a name — never ask the user for a raw id if they gave you a name.
2. Create the app: build_application(workspaceId, appSpec). Widgets: text, input, select, button, image, table, container, form, modal, datepicker, chart, tabs, list. Inputs support named-format validation; tables support a query 'source' (optionally clear-when-empty). 'list' renders a card grid (image + title + subtitle) bound to a query 'source' — point it at the same query as a table for a shared table/cards view (a query is required; there is no static-data card grid). The new app is auto-deployed on creation and the response includes an editorUrl and viewerUrl for the default page — that first deployed copy is only a scaffold until re-published, so don't hand out the viewer link yet.
3. Add data (if listed by get_capabilities): create_datasource (DB or REST, no credentials) -> create_query / create_rest_api -> bind a table to it, and bind detail widgets to the selected row.
4. Inspect and refine with read_semantic_page / inspect_page, then patch_widgets: bind a table's data, a text/image/input to the selected row (source / imageSource / defaultValue), toggle table search/filter/sort/pagination, set row striping, add input validation, disable a button while an input is invalid, and move/reparent/remove widgets. To switch between views (e.g. a table and a detail panel) with one control, gate each view's visibility on a select/tabs control (visibleWhen { control, equals }); gate a detail panel or action button on a row being selected (visibleWhen { rowSelected: "<table>" }) or on an input holding text (visibleWhen { notEmpty: "<input>" }). Append new widgets with edit_page.
5. Wire behavior: wire_event connects button onClick / table onRowSelected / modal onClose / tabs onTabSelected / select onOptionChange / input onSubmit / checkbox onCheckChange / switch onChange / datepicker onDateSelected to run a query (with onSuccess/onError chains), navigate, show/close a modal, show an alert, reset widgets (a Clear button), or accumulate query rows in the Appsmith store (appendToStore / clearStoreKey — bind a table to the key with a store source/tableData for a results table that grows with each run; rows are session-only). The action may also be an ordered list of 2-5 statements (at most one run).
6. Add JS logic (if listed): create_js_object for restricted, declarative JS objects.
7. Ship it LAST: finish wiring queries and events first — the copy auto-deployed at creation is a scaffold that goes stale as you edit. Then re-publish with prepare_publish -> confirm_publish (governed) and hand the user the viewerUrl as the final step. On deployments without governance, re-publishing is unavailable: relay the editorUrl from build_application plus the governance group's 'requires' instruction from get_capabilities instead of promising an up-to-date viewer link. GIT-APP CARVE-OUT: for a git-connected app the final deliverable is the mcp/ branch plus its branch-scoped review URL from confirm_commit, NOT a viewerUrl — publish refuses git apps.

Git-connected applications: call read_git_status BEFORE mutating one — every mutation on a git-connected app requires a 'branch' parameter equal to the target app's current branch (a missing or stale value fails with the current branch in the error, so retry once with it). Prefer creating your own agent branch with create_branch (governed; the name must start with the reserved 'mcp/' prefix): it PUSHES the new ref to the customer's git remote and returns a NEW applicationId — do ALL further edits against that new id with 'branch' set to the new branch name (Appsmith has no checkout; each branch is its own applicationId, and the human's editor view is unaffected). If read_git_status shows uncommitted changes you did not make, tell the user before branching or editing; if a remote compare shows the branch behind, suggest the user pulls in Appsmith first (MCP cannot pull). Commit your work with prepare_commit -> confirm_commit (governed): the commit API always PUSHES to the remote, so it is allowed ONLY on mcp/ branches, and the human must approve — confirm_commit prompts them directly on elicitation-capable clients (only an explicit accept proceeds), otherwise show the user prepare_commit's relay text and get approval before confirming. Publishing from MCP stays disabled for git apps — the deliverable is the mcp/ branch plus the branch-scoped review URL from confirm_commit (never a viewerUrl); the user merges via Appsmith's branch UI or a PR on the remote, then deletes the branch. At most 5 mcp/ branches per app: reuse yours; humans delete stale ones in Appsmith's branch UI. Full workflow: the appsmith://guide/git resource.

If the user shows you a screenshot or mockup to recreate: read the appsmith://guide/screenshot resource (or get_guide with slug "screenshot") BEFORE building — decode the layout skeleton first, map regions to widgets with the guide's approximation table (view-switcher / status-board / timeline presets), extract the accent color into theme.primaryColor, and tell the user what was approximated.

CLOSE THE LOOP before you call an app done — an app that shows stale data or dead-end selections is broken, not minimal: (1) EVERY wiring that runs a write query (INSERT/UPDATE/DELETE, non-GET REST) must chain onSuccess: [{ run: '<read query>' }] to re-run the reads it invalidates — otherwise tables/charts show stale data until the user reloads the page. (2) EVERY table whose rows users act on must feed something: a detail/edit panel bound to the selected row (source/defaultValue { table, column }), a visibleWhen { rowSelected } panel, or an onRowSelected event — a bare table whose selection does nothing is a dead end (display-only dashboards are the exception; say so if that's the intent). (3) After a Submit/Add wiring, reset the inputs (reset) and confirm with showAlert so the user sees it worked. inspect_page flags (1) as 'write-no-refresh' and (2) as 'selection-unused', and wire_event returns a refreshHint when you wire a write with no follow-up read — treat these as defects to fix, not noise.

Read the appsmith://reference/widgets resource and appsmith://recipe/* walkthroughs for details. Prefer editing an existing app iteratively (read -> patch -> re-read) over rebuilding.`;
