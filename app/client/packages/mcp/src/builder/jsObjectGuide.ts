import {
  EXPR_MAX_DEPTH,
  EXPR_MAX_NODES,
  FN_ARITY,
  type Fn,
  ITEM_FNS,
  LITERAL_TAIL,
  type Op,
  OP_ARITY,
  OPS,
  PARAMS_MAX,
  SEPARATOR_NAMES,
  type SeparatorName,
  STEP_MAX_DEPTH,
  STEPS_MAX,
} from "./jsExpr.js";
import type { JsObjectDefinition } from "./jsObject.js";

// The `js-objects` guide (get_guide slug / appsmith://guide/js-objects). The vocabulary tables are RENDERED from the
// grammar's own exports (FN_ARITY, OPS, SEPARATOR_NAMES, ITEM_FNS, LITERAL_TAIL, the bounds), and the per-name
// descriptions below are typed as Record<Fn | Op | SeparatorName, string>, so adding a function without describing
// it fails type-checking and the guide can never list something the compiler does not accept. The worked examples
// are real definitions that jsObjectGuide.test.ts parses and compiles.
//
// The "everyday Appsmith JavaScript" section maps the idioms the Ask AI assistant teaches (server resources
// ai-references/javascript-reference.md and common-issues.md: Query.run with params, storeValue / appsmith.store,
// showAlert, navigateTo, try/catch, new Date, parseInt, optional chaining, .map) onto grammar shapes, so an agent
// that learned Appsmith from those documents lands on the right structure. Keep the two in step when either changes.

const FN_DESCRIPTIONS: Record<Fn, string> = {
  trim: "String(x).trim(), empty for null",
  lower: "lower-case the string",
  upper: "upper-case the string",
  length: "length of a string or array (0 for null)",
  concat: "join 2–8 values as strings",
  startsWith: "string starts with the second value",
  endsWith: "string ends with the second value",
  includes: "array contains the second value",
  split:
    "split a string; second arg is `{ sep }` (named) or a literal of at most 10 characters",
  stripPrefix: "remove a literal prefix if present",
  stripSuffix: "remove a literal suffix if present",
  replaceAll: "replace every literal occurrence with a literal",
  number: "Number(x)",
  string: "String(x), empty for null",
  boolean: "Boolean(x)",
  isEmpty: "true for null, undefined, empty string, or empty array",
  round:
    "round to the nearest integer, or to a literal number of decimals (0–20)",
  abs: "absolute value",
  min: "smallest of 2–8 numbers",
  max: "largest of 2–8 numbers",
  date: "new Date(x)",
  now: "the current date-time",
  isoString: "ISO 8601 text of a date value",
  isValidDate: "whether x parses as a date",
  unique: "array with duplicates removed",
  join: "join an array with a literal separator",
  first: "first element of an array",
  last: "last element of an array",
  map: "array of the per-item expression",
  filter: "elements whose per-item expression is truthy",
  some: "whether any per-item expression is truthy",
  every: "whether every per-item expression is truthy",
  find: "first element whose per-item expression is truthy",
  get: "read a literal key of an object (`x?.[key]`); the key is a plain identifier, never a prototype name",
  coalesce: "first non-null of 2–4 values",
};

const OP_DESCRIPTIONS: Record<Op, string> = {
  add: "a + b + … (numbers add, strings concatenate)",
  sub: "a - b",
  mul: "a * b * …",
  div: "a / b",
  mod: "a % b",
  neg: "-a",
  eq: "a === b",
  ne: "a !== b",
  gt: "a > b",
  gte: "a >= b",
  lt: "a < b",
  lte: "a <= b",
  and: "a && b && …",
  or: "a || b || …",
  not: "!a",
};

const SEPARATOR_DESCRIPTIONS: Record<SeparatorName, string> = {
  comma: "a comma (trim each item afterwards)",
  newline: "a line break",
  commaOrNewline: "any run of commas and line breaks (pasted lists)",
  whitespace: "any run of whitespace",
  semicolon: "a semicolon",
  pipe: "a vertical bar",
};

export const FN_GROUPS: { title: string; names: Fn[] }[] = [
  {
    title: "Strings",
    names: [
      "trim",
      "lower",
      "upper",
      "length",
      "concat",
      "startsWith",
      "endsWith",
      "split",
      "stripPrefix",
      "stripSuffix",
      "replaceAll",
    ],
  },
  {
    title: "Conversions and checks",
    names: ["number", "string", "boolean", "isEmpty", "coalesce", "get"],
  },
  { title: "Numbers", names: ["round", "abs", "min", "max"] },
  { title: "Dates", names: ["date", "now", "isoString", "isValidDate"] },
  {
    title: "Arrays",
    names: [
      "includes",
      "unique",
      "join",
      "first",
      "last",
      "map",
      "filter",
      "some",
      "every",
      "find",
    ],
  },
];

// Every worked example is a complete, valid definition; the test suite parses and compiles each one.
export const JS_OBJECT_GUIDE_EXAMPLES: {
  title: string;
  what: string;
  definition: JsObjectDefinition;
}[] = [
  {
    title: "Refresh a table (the original run-only form)",
    what: "A function with no logic: run a query, then run another. Still accepted unchanged.",
    definition: {
      functions: [
        {
          name: "refresh",
          run: [{ query: "GetOrders" }],
          returns: { finished: true },
        },
      ],
    },
  },
  {
    title: "Split a pasted list: trim, drop blanks, dedupe",
    what: "Equivalent to `[...new Set(value.split(/[\\r\\n,]+/).map(s => s.trim()).filter(Boolean))]`. Note `not` is an op, `isEmpty` is a fn, and `{ item: true }` is the per-element value inside map / filter.",
    definition: {
      functions: [
        {
          name: "splitLines",
          params: ["value"],
          returns: {
            fn: "unique",
            args: [
              {
                fn: "filter",
                args: [
                  {
                    fn: "map",
                    args: [
                      {
                        fn: "split",
                        args: [{ param: "value" }, { sep: "commaOrNewline" }],
                      },
                      { fn: "trim", args: [{ item: true }] },
                    ],
                  },
                  {
                    op: "not",
                    args: [{ fn: "isEmpty", args: [{ item: true }] }],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  {
    title: "Normalise domains: strip a leading @, lower-case, dedupe",
    what: '`"@Acme.com, acme.com"` becomes `["acme.com"]`. Deduplication happens after normalisation because `unique` is the outermost call.',
    definition: {
      functions: [
        {
          name: "splitDomains",
          params: ["value"],
          returns: {
            fn: "unique",
            args: [
              {
                fn: "filter",
                args: [
                  {
                    fn: "map",
                    args: [
                      {
                        fn: "split",
                        args: [{ param: "value" }, { sep: "commaOrNewline" }],
                      },
                      {
                        fn: "lower",
                        args: [
                          {
                            fn: "stripPrefix",
                            args: [{ fn: "trim", args: [{ item: true }] }, "@"],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    op: "not",
                    args: [{ fn: "isEmpty", args: [{ item: true }] }],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  {
    title: "Validate related fields and a date range, then throw",
    what: "Two widgets must be both filled or both blank; an end date must be later than a start date. `throw` takes a literal message only.",
    definition: {
      functions: [
        {
          name: "validate",
          steps: [
            {
              if: {
                op: "ne",
                args: [
                  {
                    fn: "isEmpty",
                    args: [
                      {
                        fn: "trim",
                        args: [{ widget: "inpLinkLabel", property: "text" }],
                      },
                    ],
                  },
                  {
                    fn: "isEmpty",
                    args: [
                      {
                        fn: "trim",
                        args: [{ widget: "inpLinkUrl", property: "text" }],
                      },
                    ],
                  },
                ],
              },
              then: [
                { throw: "Provide both link fields or leave both blank." },
              ],
            },
            {
              let: "startsAt",
              value: { widget: "dtStartsAt", property: "selectedDate" },
            },
            {
              let: "endsAt",
              value: { widget: "dtEndsAt", property: "selectedDate" },
            },
            {
              if: {
                op: "and",
                args: [
                  {
                    op: "not",
                    args: [{ fn: "isEmpty", args: [{ var: "startsAt" }] }],
                  },
                  {
                    op: "not",
                    args: [{ fn: "isEmpty", args: [{ var: "endsAt" }] }],
                  },
                  {
                    op: "lte",
                    args: [
                      { fn: "date", args: [{ var: "endsAt" }] },
                      { fn: "date", args: [{ var: "startsAt" }] },
                    ],
                  },
                ],
              },
              then: [{ throw: "End time must be later than start time." }],
            },
            { return: true },
          ],
        },
      ],
    },
  },
  {
    title: "Save: validate, build a document, insert or update, refresh, alert",
    what: "The orchestration a form's Save button needs. `run … with` passes computed values to the query, which reads them as `{ param }` values in create_mongo_query; `into` captures the result; the selected row decides insert vs update.",
    definition: {
      constants: { maxTags: 50 },
      functions: [
        {
          name: "save",
          steps: [
            {
              let: "title",
              value: {
                fn: "trim",
                args: [{ widget: "inpTitle", property: "text" }],
              },
            },
            {
              if: { fn: "isEmpty", args: [{ var: "title" }] },
              then: [{ throw: "Title is required." }],
            },
            {
              let: "ids",
              value: {
                fn: "unique",
                args: [
                  {
                    fn: "split",
                    args: [
                      { widget: "inpTags", property: "text" },
                      { sep: "commaOrNewline" },
                    ],
                  },
                ],
              },
            },
            {
              if: {
                op: "gt",
                args: [
                  { fn: "length", args: [{ var: "ids" }] },
                  { constant: "maxTags" },
                ],
              },
              then: [{ throw: "Too many tags." }],
            },
            {
              let: "doc",
              value: {
                object: {
                  title: { var: "title" },
                  priority: {
                    fn: "number",
                    args: [{ widget: "inpPriority", property: "text" }],
                  },
                  category: {
                    widget: "msCategory",
                    property: "selectedOptionValues",
                  },
                  tagIds: { var: "ids" },
                  startsAt: {
                    fn: "isoString",
                    args: [{ widget: "dtStartsAt", property: "selectedDate" }],
                  },
                  updatedBy: { store: "currentUser" },
                  updatedAt: {
                    fn: "isoString",
                    args: [{ fn: "now", args: [] }],
                  },
                },
              },
            },
            {
              let: "selectedId",
              value: { widget: "tblOrders", property: "selectedRow.id" },
            },
            {
              if: { fn: "isEmpty", args: [{ var: "selectedId" }] },
              then: [{ run: "InsertOrder", with: { doc: { var: "doc" } } }],
              else: [
                {
                  run: "UpdateOrder",
                  with: { id: { var: "selectedId" }, doc: { var: "doc" } },
                  into: "updated",
                },
              ],
            },
            { run: "GetOrders" },
            { showAlert: "Saved", style: "success" },
            { return: { object: { saved: true, id: { var: "selectedId" } } } },
          ],
        },
      ],
    },
  },
  {
    title: "Summarise a query result with a ternary and an array",
    what: "`{ query, field }` reads a query's response (or a dotted field of it); `{ if, then, else }` inside a value is a ternary; `{ array }` builds a list.",
    definition: {
      functions: [
        {
          name: "summary",
          steps: [
            {
              let: "count",
              value: {
                fn: "length",
                args: [{ query: "GetOrders", field: "items" }],
              },
            },
          ],
          returns: {
            object: {
              count: { var: "count" },
              status: {
                if: { op: "gt", args: [{ var: "count" }, 0] },
                then: "ready",
                else: "empty",
              },
              tags: {
                array: ["orders", { fn: "string", args: [{ var: "count" }] }],
              },
            },
          },
        },
      ],
    },
  },
  {
    title: "Loop over selected rows and keep a running total",
    what: "`forEach` binds a name per element; `set` reassigns a `let`; `storeValue` writes `appsmith.store`; `resetWidget` clears a widget by name.",
    definition: {
      functions: [
        {
          name: "totalSelected",
          steps: [
            { let: "total", value: 0 },
            {
              forEach: { widget: "tblOrders", property: "selectedRows" },
              as: "row",
              do: [
                {
                  set: "total",
                  value: {
                    op: "add",
                    args: [
                      { var: "total" },
                      { fn: "get", args: [{ var: "row" }, "amount"] },
                    ],
                  },
                },
              ],
            },
            { storeValue: "lastTotal", value: { var: "total" } },
            { resetWidget: "inpAmount" },
            { return: { var: "total" } },
          ],
        },
      ],
    },
  },
];

const json = (value: unknown): string => JSON.stringify(value, null, 2);

function fnRow(name: Fn): string {
  const [min, max] = FN_ARITY[name];
  const arity = min === max ? `${min}` : `${min}–${max}`;
  const notes: string[] = [];

  if (ITEM_FNS.has(name))
    notes.push("second arg is evaluated per element with `{ item: true }`");

  const tail = LITERAL_TAIL[name];

  if (tail)
    notes.push(
      `last ${tail === 1 ? "arg" : `${tail} args`} must be string literal${tail === 1 ? "" : "s"}`,
    );

  return `| \`${name}\` | ${arity} | ${FN_DESCRIPTIONS[name]}${notes.length ? ` — ${notes.join("; ")}` : ""} |`;
}

export function renderJsObjectsGuide(): string {
  const lines: string[] = [];
  const push = (...text: string[]) => lines.push(...text);

  push(
    "# JS objects guide",
    "",
    "`create_js_object` and `update_js_object` take a **definition**, never JavaScript. The server compiles the",
    "definition into the object's code; every emitted character is compiler template text, a JSON-encoded literal,",
    "or an identifier validated against a fixed charset and deny-list, so a definition can",
    "express everyday form logic (split and normalise a pasted list, compare two dates, refuse a half-filled pair",
    "of fields, choose insert vs update, pass computed values to a query) without any agent-authored code.",
    "Anything outside the vocabulary below is refused, not passed through: the error's `path` is",
    "`functions.<index>` and its message names the function and statement (`save: steps[3].then[1]: …`).",
    "",
    "## The definition",
    "",
    "```text",
    json({
      constants: { maxTags: 50 },
      functions: [
        {
          name: "fnName",
          params: ["value"],
          steps: ["…statements…"],
          returns: "…expression…",
        },
      ],
    }),
    "```",
    "",
    '- `constants`: JSON literals on the object, read inside functions as `{ constant: "maxTags" }`.',
    `- \`functions[].params\`: up to ${PARAMS_MAX} names, read as \`{ param: \"value\" }\`. Reserved words, host globals`,
    "  (`window`, `eval`, `navigateTo`, …) and prototype names are refused.",
    `- \`functions[].steps\`: an ordered list of statements (at most ${STEPS_MAX} in a function, nested at most`,
    `  ${STEP_MAX_DEPTH} deep). \`functions[].returns\`: an expression evaluated after the steps (top-level \`let\`s are`,
    "  in scope). A function may have either, both, and/or the original `run: [{ query }]` list (emitted before",
    "- Names are plain identifiers. Widget and query names are checked for shape only, not against the page, and",
    "  resolve at run time in the end user's browser: a misspelled widget or query NAME throws when the function",
    "  runs (the create still succeeds); a misspelled PROPERTY reads as `undefined`. Read the page first.",
    "",
    "## Statements",
    "",
    "| Statement | Shape | Meaning |",
    "| --- | --- | --- |",
    '| let | `{ "let": "name", "value": expr }` | declare a local (must be new) |',
    '| set | `{ "set": "name", "value": expr }` | reassign a local declared with `let`, `into`, or `forEach … as` |',
    '| run | `{ "run": "QueryName", "with": { "key": expr }, "into": "result" }` | `await QueryName.run({ key })`; `with` values become `this.params.key` inside the query; `into` declares a local holding the result. Both optional |',
    '| if | `{ "if": expr, "then": [steps], "else": [steps] }` | branch; `else` optional |',
    '| forEach | `{ "forEach": expr, "as": "item", "do": [steps] }` | loop over an array, one local per element |',
    '| throw | `{ "throw": "message" }` | stop with `Error(message)`; the message is a literal |',
    '| return | `{ "return": expr }` | return a value |',
    '| showAlert | `{ "showAlert": "message", "style": "info" }` | toast; style info (default), success, warning, or error |',
    '| storeValue | `{ "storeValue": "key", "value": expr }` | write `appsmith.store.key` (session only) |',
    '| resetWidget | `{ "resetWidget": "WidgetName" }` | reset a widget to its default |',
    "",
    "A local declared inside a `then`, `else` or `do` block is not visible after that block.",
    "Locals are declared before use, in order; a name cannot be declared twice, cannot be a query or widget you",
    "reference, and cannot be a name the compiler itself uses (`showAlert`, `String`, `Math`, …).",
    "",
    "## Expressions",
    "",
    "Every value is a tree. Leaves:",
    "",
    "| Leaf | Shape | Reads |",
    "| --- | --- | --- |",
    '| literal | `"text"`, `42`, `true`, `null` | itself (strings are JSON-encoded; `{{ }}`, `${`, backticks refused) |',
    '| param | `{ "param": "value" }` | a function parameter |',
    '| var | `{ "var": "total" }` | a local from `let`, `into`, or `forEach … as` |',
    '| item | `{ "item": true }` | the current element inside map / filter / some / every / find |',
    '| widget | `{ "widget": "inpTitle", "property": "text" }` | a widget property; dotted paths such as `selectedRow.id` are allowed, prototype segments are not |',
    '| query | `{ "query": "GetUsers", "field": "items" }` | `GetUsers.data` or a dotted field of it |',
    '| constant | `{ "constant": "maxTags" }` | a constant of this object |',
    '| store | `{ "store": "currentUser" }` | `appsmith.store.currentUser` |',
    "",
    'Nodes: `{ "op": name, "args": [...] }`, `{ "fn": name, "args": [...] }`,',
    '`{ "if": expr, "then": expr, "else": expr }`, `{ "object": { key: expr } }`, `{ "array": [expr] }`.',
    `A tree has at most ${EXPR_MAX_NODES} nodes and nests at most ${EXPR_MAX_DEPTH} deep.`,
    "",
    "### Operators (`op`)",
    "",
    "| op | args | Meaning |",
    "| --- | --- | --- |",
    ...OPS.map((op) => {
      const [min, max] = OP_ARITY[op];

      return `| \`${op}\` | ${min === max ? min : `${min}–${max}`} | ${OP_DESCRIPTIONS[op]} |`;
    }),
    "",
    "### Functions (`fn`)",
    "",
  );

  for (const group of FN_GROUPS) {
    push(
      `#### ${group.title}`,
      "",
      "| fn | args | Meaning |",
      "| --- | --- | --- |",
    );
    push(...group.names.map(fnRow));
    push("");
  }

  push(
    "### Named separators for `split`",
    "",
    "| sep | Splits on |",
    "| --- | --- |",
    ...SEPARATOR_NAMES.map(
      (name) => `| \`${name}\` | ${SEPARATOR_DESCRIPTIONS[name]} |`,
    ),
    "",
    "Separators are compiler-owned patterns; the agent never supplies a regular expression.",
    "",
    "## Everyday Appsmith JavaScript, expressed as a definition",
    "",
    "If you learned Appsmith from its JavaScript documentation, this is where each idiom lands:",
    "",
    "| You would write in the editor | In a definition |",
    "| --- | --- |",
    '| `await GetUser.run({ id: Input1.text })` | `{ "run": "GetUser", "with": { "id": { "widget": "Input1", "property": "text" } }, "into": "user" }`; the Mongo query reads it as `{ "param": "id" }` |',
    '| `const data = await Query1.run()` then use `data` | `{ "run": "Query1", "into": "data" }` then `{ "var": "data" }` |',
    '| `Query1.data` | `{ "query": "Query1" }`; a field: `{ "query": "Query1", "field": "items" }` |',
    '| `storeValue(\'userName\', Input1.text)` | `{ "storeValue": "userName", "value": { "widget": "Input1", "property": "text" } }` |',
    '| `appsmith.store.userName` | `{ "store": "userName" }` |',
    '| `showAlert("Saved", "success")` | `{ "showAlert": "Saved", "style": "success" }` |',
    '| `resetWidget(\'Input1\')` | `{ "resetWidget": "Input1" }` |',
    '| `throw new Error("Title is required.")` | `{ "throw": "Title is required." }` |',
    '| `if (a && !b) { … } else { … }` | `{ "if": { "op": "and", "args": [a, { "op": "not", "args": [b] }] }, "then": [...], "else": [...] }` |',
    '| `cond ? x : y` inside a value | `{ "if": cond, "then": x, "else": y }` |',
    '| `parseInt(Input1.text)` / `Number(x)` | `{ "fn": "number", "args": [x] }` (Number semantics: `"12px"` is NaN) |',
    '| `new Date(x)`, `new Date()` | `{ "fn": "date", "args": [x] }`, `{ "fn": "now", "args": [] }`; compare with `gt` / `lte` on the date values |',
    '| `x.toISOString()` | `{ "fn": "isoString", "args": [x] }` (the only formatting available; `moment` is not) |',
    '| `user?.profile?.name` | `{ "fn": "get", "args": [{ "fn": "get", "args": [user, "profile"] }, "name"] }` |',
    '| `x ?? "Guest"` | `{ "fn": "coalesce", "args": [x, "Guest"] }` |',
    '| `arr.length === 0`, `value == null || value === ""` | `{ "fn": "isEmpty", "args": [arr] }` |',
    '| `arr.map(u => u.name)` | `{ "fn": "map", "args": [arr, { "fn": "get", "args": [{ "item": true }, "name"] }] }` |',
    '| `arr.filter(Boolean)` | `{ "fn": "filter", "args": [arr, { "op": "not", "args": [{ "fn": "isEmpty", "args": [{ "item": true }] }] }] }` |',
    '| `` `${a} ${b}` `` | `{ "fn": "concat", "args": [a, " ", b] }` |',
    '| `s.split(/[\\r\\n,]+/)` | `{ "fn": "split", "args": [s, { "sep": "commaOrNewline" }] }` |',
    '| `for (const row of rows) { … }` | `{ "forEach": rows, "as": "row", "do": [...] }` |',
    '| `this.maxTags` | `{ "constant": "maxTags" }` |',
    "",
    "Not available inside a function, and what to do instead:",
    "",
    "- `try { … } catch (e) { showAlert(…) }`: a failed `run` rejects the whole function and the error surfaces in",
    "  the app's debugger. Validate before running (the `throw` statements above) and keep the `showAlert` for",
    "  success after the last `run`.",
    "- `navigateTo`, `showModal`, `closeModal`: not inside a function. Use the `wire_event` actions `navigate`,",
    "  `showModal` and `closeModal` in the same statement list as the `call`.",
    '- `removeValue(key)`: not inside a function; use the `wire_event` action `{ "clearStoreKey": { "key": "…" } }`.',
    "- `clearStore`, `download`, `copyToClipboard`: not available through MCP; write the function in the editor.",
    "- `setTimeout`, `setInterval`, `fetch`, `console.log`, regular expressions, `moment`, `_` (lodash), string",
    "  formatting beyond the functions above, and any member access not listed: write that function in the",
    "  Appsmith editor. An event can still `call` it, and `read_js_object` lists it as editor-authored.",
    "",
    "## Worked examples",
    "",
    "Each example is a complete `functions` definition that the compiler accepts as written.",
    "",
  );

  for (const example of JS_OBJECT_GUIDE_EXAMPLES) {
    push(
      `### ${example.title}`,
      "",
      example.what,
      "",
      "```json",
      json(example.definition),
      "```",
      "",
    );
  }

  push(
    "## Calling, reading back, and updating",
    "",
    '- Wire an event to a function with `wire_event`: `{ "call": { "object": "FormUtils", "function": "save" } }`;',
    '  up to five `args`, each a scalar literal or `{ "widget", "property" }`, arrive as the function\'s `params`.',
    '- A Mongo query that a function runs `with` values reads them as `{ "param": "name" }` values in',
    "  `create_mongo_query`; nothing else in the query changes.",
    "- `read_js_object` returns each MCP-authored object's `definition` (this same shape) and `definitionState`:",
    "  `current` (edit it and send it back), `drifted` (someone edited the code in the editor afterwards; it is now",
    "  editor-authored, so recreate it rather than update it), or `none` (never written by the compiler).",
    "- `update_js_object` replaces the whole function set: start from the returned `definition`, change what you",
    "  need, and send every function back. Editor-authored JavaScript is never returned and never overwritten.",
    "",
  );

  return lines.join("\n");
}
