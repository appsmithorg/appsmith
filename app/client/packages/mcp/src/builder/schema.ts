import { z } from "zod";

// The agent-facing "page spec" — a high-level description of what to build. The compiler turns this into a valid
// Appsmith import artifact; the agent never authors raw widget DSL.

export const WIDGET_TYPES = [
  "text",
  "input",
  "select",
  "button",
  "image",
  "table",
  "container",
  "form",
  "modal",
  "datepicker",
  "chart",
  "tabs",
  "list",
  "checkbox",
  "switch",
  "radio",
  "multiselect",
  "filepicker",
  "divider",
  "progress",
  "circularprogress",
  "rate",
  "iconbutton",
  "currencyinput",
  "phoneinput",
  "numberslider",
  "categoryslider",
  "rangeslider",
  "checkboxgroup",
  "switchgroup",
  "menubutton",
  "buttongroup",
  "camera",
  "audiorecorder",
  "codescanner",
  "map",
  "mapchart",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

// Best-effort placement. Omitted → append below existing content. `after` → below a named widget. `inside` → into a
// named container's inner canvas. A miss falls back to append and is reported.
export const placementSchema = z
  .object({
    after: z.string().min(1).optional(),
    inside: z.string().min(1).optional(),
  })
  .strict()
  // `after` and `inside` are mutually exclusive — they resolve to different canvases, so accepting both would let
  // one silently win. Either alone, or neither, is still valid.
  .refine(
    (placement) =>
      !(placement.after !== undefined && placement.inside !== undefined),
    {
      message: "placement cannot set both 'after' and 'inside'",
    },
  );

export type Placement = z.infer<typeof placementSchema>;

const nameField = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "name must be alphanumeric/underscore")
  .optional();

// A Blueprint icon name (kebab-case, e.g. "plus", "arrow-right"). Emitted as a literal prop value; the strict
// charset admits no quote/brace/backtick so it cannot break out. An unknown icon renders as nothing (safe).
const iconName = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "icon must be a kebab-case icon name (e.g. 'plus')");

// Security invariant (Security Reviewer ruling): agents NEVER author raw expressions. Every free-text field an agent
// supplies is rejected if it contains binding/interpolation/template syntax, so nothing agent-authored can become an
// evaluated `{{ }}` expression in a viewer's eval worker. Dynamic data arrives only via the compiler's closed
// binding vocabulary (structured refs -> `{{ query.data }}`), never as passthrough text.
// Also reject U+2028/U+2029 (line/paragraph separators): JSON.stringify does not escape them, and on a pre-ES2019
// JS engine they terminate a string literal — closing a defense-in-depth gap across every safeText sink (e.g. the
// select's JS-evaluated sourceData), not just the ones that emit into a binding.
const RAW_EXPRESSION = /\u007b\u007b|\u007d\u007d|\$\u007b|`|\u2028|\u2029/;

function safeText(max: number) {
  return z
    .string()
    .max(max)
    .refine((value) => !RAW_EXPRESSION.test(value), {
      message:
        "must not contain binding/template syntax ({{ }}, ${ }, or backticks)",
    });
}

const scalarCell = z.union([safeText(1000), z.number(), z.boolean(), z.null()]);

// Column keys are agent-supplied strings that the TableWidgetV2 client embeds into a generated `{{ }}` column
// binding, where the downstream escape does NOT neutralize `}}`/`${`/backtick/backslash/quote. So keys need a
// STRICTER gate than values: a conservative identifier charset that admits none of those characters.
const columnKey = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_ ]+$/,
    "table column names must be alphanumeric, underscore, or space",
  );

// A literal table row: a flat object of scalar cells keyed by safe column names. Static data only — never
// registered as a dynamic binding.
const tableRow = z.record(columnKey, scalarCell);

// M4 closed binding vocabulary. The agent supplies a structured reference to a named query — never raw expression
// text. The name is a strict identifier so the compiler-emitted `{{ <name>.data }}` / `{{ <name>.run() }}` cannot be
// broken out of. This is the ONLY way agent input becomes a dynamic binding.
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be a query name (alphanumeric/underscore)");

// An optional dotted field path into a query's response, so a table can bind to a nested array (e.g. a REST API
// that returns `{ places: [...] }` -> field "places" -> `{{ Query.data.places }}`). Strict identifier path so the
// emitted binding cannot be broken out of.
export const responseFieldPath = z
  .string()
  .min(1)
  .max(128)
  .regex(
    // Dot-SEPARATED identifiers only: a trailing or doubled dot would compile to a JS syntax error in the
    // eval worker (broken widget), so the shape is validated here, not just the charset [COUNCIL: B1 security].
    /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/,
    "field must be a dotted identifier path (e.g. 'places' or 'data.items')",
  );

// An optional guard: the name of an input widget whose emptiness clears the table. When set, the compiled table
// binding shows the query's data only while that input holds a value — so a Clear button that resets the input also
// empties the table (resetWidget alone can't clear a query-bound table; the bound data re-evaluates and persists).
// At BUILD time the referenced input's existence is not checked (a missing `Input.text` is falsy → empty table, a
// safe fail, not a crash). The EDIT path (editPatch.ts applyTableDataBinding) has the widget map and does verify
// both that the guard exists and that it is an input.
const guardWidget = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be a widget name (alphanumeric/underscore)");

// The ONE table-data reference schema, shared by the build-time table `source` (below) and the edit-time
// patch_widgets `tableData` (editPatch.ts imports this), so the two entry points can never drift apart.
export const tableDataRefSchema = z
  .object({
    query: bindingIdentifier,
    field: responseFieldPath.optional(),
    clearWhenEmpty: guardWidget.optional(),
  })
  .strict();
const runRef = z.object({ run: bindingIdentifier }).strict();

export interface TableDataRef {
  query: string;
  field?: string;
  clearWhenEmpty?: string;
}

// M5 store keys — the closed vocabulary for accumulating rows in the Appsmith store (wire_event's appendToStore /
// clearStoreKey, and the table's `{ store }` binding form). Two rules beyond the usual identifier charset:
// - No leading digit: the compiler emits a DOT-access read (`appsmith.store.<key>`), where `store.1abc` is a syntax
//   error.
// - A denylist of prototype-polluting names: StoreActionSaga assigns `currentStore[key] = value` on a plain object,
//   so `storeValue('__proto__', ...)` would rewrite the store object's prototype; `{ __proto__: ... }` in the
//   compiled fields projection would do the same to the row literal. The denylist covers every Object.prototype own
//   property name plus 'prototype' (not an Object.prototype own prop, but the other classic pollution key).
const STORE_KEY_DENYLIST = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  "prototype",
]);

export const storeKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*$/,
    "store keys must be an identifier: a letter or underscore, then letters, digits, or underscores",
  )
  .refine((key) => !STORE_KEY_DENYLIST.has(key), {
    message: "store key collides with an Object.prototype property name",
  });

// M5 store binding form: bind a table's rows to a store key that wire_event's appendToStore accumulates into.
// TABLE-ONLY by design — the list/card widget keeps the query-only tableDataRefSchema (store-bound card grids are
// out of scope in v1), which is why this union is a SEPARATE schema instead of widening tableDataRefSchema.
export const storeDataRefSchema = z
  .object({
    store: storeKeySchema,
  })
  .strict();

export interface StoreDataRef {
  store: string;
}

export const tableDataBindingSchema = z.union([
  tableDataRefSchema,
  storeDataRefSchema,
]);

export type TableDataBinding = TableDataRef | StoreDataRef;

// The single emitter for a table's data binding. All parts are schema-validated identifier paths, so the emitted
// expression cannot be broken out of. Optional chaining + `?? []` keeps the table valid before the query has run.
// With `clearWhenEmpty`, the data is gated on the guard input holding text: `{{ In.text ? (Q.data ?? []) : [] }}`.
// The store form reads the accumulated rows: `{{ appsmith.store.<key> ?? [] }}` (`?? []` keeps the table valid
// before the first appendToStore write, and after clearStoreKey resets the key to []).
export function compileTableDataBinding(ref: TableDataBinding): string {
  if ("store" in ref) return `{{ appsmith.store.${ref.store} ?? [] }}`;

  const dataPath = ref.field
    ? `${ref.query}.data?.${ref.field}`
    : `${ref.query}.data`;
  const base = `${dataPath} ?? []`;

  return ref.clearWhenEmpty
    ? `{{ ${ref.clearWhenEmpty}.text ? (${base}) : [] }}`
    : `{{ ${base} }}`;
}

// Named input-validation formats -> a vetted LITERAL regex + default error message. Agents pick a format and never
// author a regex: an input's `regex`/`errorMessage` props are bind-evaluated, so a raw agent regex could smuggle a
// `{{ }}` expression. Every regex below is a static string with no binding syntax (single-brace quantifiers like
// `{5}` are not Appsmith bindings, which require `{{ }}`).
export const INPUT_VALIDATION_FORMATS = {
  zipcode: { regex: "^\\d{5}$", message: "Please enter a 5-digit zip code" },
  // Local/domain parts are bounded to cap worst-case regex work: the adjacent `[^\s@]+` classes share the `.`
  // delimiter, which is polynomial (not catastrophic) backtracking, but bounding keeps it strictly linear-ish.
  email: {
    regex: "^[^\\s@]{1,64}@[^\\s@]{1,255}\\.[^\\s@]{1,63}$",
    message: "Please enter a valid email address",
  },
  number: { regex: "^-?\\d*\\.?\\d+$", message: "Please enter a number" },
  integer: { regex: "^-?\\d+$", message: "Please enter a whole number" },
  usPhone: {
    regex: "^\\d{10}$",
    message: "Please enter a 10-digit phone number",
  },
} as const;

export type InputValidationFormat = keyof typeof INPUT_VALIDATION_FORMATS;

// The enum is derived from the format map so the two can never drift: adding a format is a one-line map edit.
const INPUT_VALIDATION_FORMAT_NAMES = Object.keys(INPUT_VALIDATION_FORMATS) as [
  InputValidationFormat,
  ...InputValidationFormat[],
];

export const inputValidationSchema = z
  .object({
    format: z.enum(INPUT_VALIDATION_FORMAT_NAMES),
    // Optional override of the default error message. Safe text (no binding/template syntax), emitted as a literal
    // into the input's `errorMessage`.
    message: safeText(200).optional(),
  })
  .strict();

export interface InputValidationRef {
  format: InputValidationFormat;
  message?: string;
}

// Emits the two literal input props for a named validation format: the vetted regex and the (overridable) message.
export function compileInputValidation(ref: InputValidationRef): {
  regex: string;
  errorMessage: string;
} {
  const preset = INPUT_VALIDATION_FORMATS[ref.format];

  return { regex: preset.regex, errorMessage: ref.message ?? preset.message };
}

// A structured "disable this widget while the named input is invalid" wire — emits `{{ !<input>.isValid }}` onto the
// target's `isDisabled`, so e.g. a submit button greys out until the input passes its validation. The input name is
// a strict identifier, so the emitted expression cannot be broken out of. This is a cross-widget wire (a button
// referencing an input by name), so it is exposed only on the EDIT path (editPatch.ts), where the widget map exists
// to verify the referenced input's existence and type — not on the build-time widget spec.
export function compileDisableWhenInvalid(input: string): string {
  return `{{ !${input}.isValid }}`;
}

// A structured reference binding one field of a query's response to a SCALAR display slot (a text's content, an
// image's src) — the single-value sibling of tableDataRefSchema. Same strict identifier charsets, same emitter
// discipline: `{{ <query>.data?.<field> ?? "" }}`, blank until the query has run.
export const queryFieldRefSchema = z
  .object({ query: bindingIdentifier, field: responseFieldPath.optional() })
  .strict();

export type QueryFieldRef = z.infer<typeof queryFieldRefSchema>;

// The single emitter for scalar query-field display bindings. Both parts are schema-validated identifier paths, so
// the emitted expression cannot be broken out of. `?? ""` keeps the widget blank before the query has run.
export function compileQueryFieldBinding(ref: QueryFieldRef): string {
  const dataPath = ref.field
    ? `${ref.query}.data?.${ref.field}`
    : `${ref.query}.data`;

  return `{{ ${dataPath} ?? "" }}`;
}

// A structured reference to one column of a table's selected row — the display-binding half of the CRUD loop
// (detail views, edit-form prefill). Same charset as table column keys; the compiler emits bracket access with
// double quotes (`{{ Table1.selectedRow["col name"] }}`), and the charset admits no quote/backslash/brace, so the
// emitted expression cannot be broken out of.
const selectedRowColumn = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_ ]+$/,
    "column names must be alphanumeric, underscore, or space",
  );

export const selectedRowRefSchema = z
  .object({ table: bindingIdentifier, column: selectedRowColumn })
  .strict();

export type SelectedRowRef = z.infer<typeof selectedRowRefSchema>;

// The single emitter for selected-row display bindings. Both parts are schema-validated charsets.
export function compileSelectedRowBinding(ref: SelectedRowRef): string {
  return `{{ ${ref.table}.selectedRow["${ref.column}"] }}`;
}

// --- Computed display values (B2). Closed vocabulary of tokens a text widget can show WITHOUT any query: the
// current date/time (named formats — the agent picks a NAME, the compiler owns the moment format literal), a
// count of a query's rows, or a concatenation of inert literals and structured refs. Every emitted part is either
// a compiler-owned literal, a JSON-escaped agent literal, or a strict-charset identifier path — the same
// injection guarantees as every other emitter.
export const COMPUTED_NOW_FORMATS = {
  dayOfWeek: "dddd",
  date: "LL",
  dateShort: "L",
  time: "LT",
  dateTime: "LLL",
  isoDate: "YYYY-MM-DD",
  monthYear: "MMMM YYYY",
} as const;

export type ComputedNowFormat = keyof typeof COMPUTED_NOW_FORMATS;

const COMPUTED_NOW_FORMAT_NAMES = Object.keys(COMPUTED_NOW_FORMATS) as [
  ComputedNowFormat,
  ...ComputedNowFormat[],
];

// --- Formula AST (C1). A closed, recursive expression vocabulary for numeric computation: literals, numeric
// coercions of the existing validated refs, and a whitelisted operator set. The agent supplies STRUCTURE, never
// expression text; the compiler owns every emitted character, so the no-raw-expressions invariant holds even
// though real arithmetic is now expressible ("temperature in Fahrenheit" without a workaround).
export const FORMULA_MAX_NODES = 25;
export const FORMULA_MAX_DEPTH = 6;
const FORMULA_OPS = [
  "add",
  "sub",
  "mul",
  "div",
  "round",
  "abs",
  "min",
  "max",
] as const;

export type FormulaOp = (typeof FORMULA_OPS)[number];
export type FormulaExpr =
  | number
  | QueryFieldRef
  | SelectedRowRef
  | { op: FormulaOp; args: FormulaExpr[] };

export const formulaExprSchema: z.ZodType<FormulaExpr> = z.lazy(() =>
  z.union([
    // finite() rejects Infinity/NaN — JSON's 1e999 parses to Infinity and must not reach the emitter.
    z.number().finite(),
    queryFieldRefSchema,
    selectedRowRefSchema,
    z
      .object({
        op: z.enum(FORMULA_OPS),
        args: z.array(formulaExprSchema).min(1).max(8),
      })
      .strict(),
  ]),
);

// Arity/shape rules the recursive schema cannot express, plus the depth bound.
function formulaProblem(expr: FormulaExpr, depth: number): string | undefined {
  if (depth > FORMULA_MAX_DEPTH) {
    return `formula nests deeper than ${FORMULA_MAX_DEPTH} levels`;
  }

  if (typeof expr === "number" || !("op" in expr)) return undefined;

  const arity = expr.args.length;

  if (
    (expr.op === "add" ||
      expr.op === "mul" ||
      expr.op === "min" ||
      expr.op === "max") &&
    arity < 2
  ) {
    return `'${expr.op}' needs at least 2 arguments`;
  }

  if ((expr.op === "sub" || expr.op === "div") && arity !== 2) {
    return `'${expr.op}' needs exactly 2 arguments`;
  }

  if (expr.op === "abs" && arity !== 1) return "'abs' needs exactly 1 argument";

  if (expr.op === "round") {
    if (arity > 2) return "'round' needs 1 or 2 arguments";

    const decimals = expr.args[1];

    if (
      arity === 2 &&
      (typeof decimals !== "number" ||
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        decimals > 6)
    ) {
      return "'round' decimals must be an integer literal between 0 and 6";
    }
  }

  for (const arg of expr.args) {
    const problem = formulaProblem(arg, depth + 1);

    if (problem !== undefined) return problem;
  }

  return undefined;
}

function formulaNodeCount(expr: FormulaExpr): number {
  if (typeof expr === "number" || !("op" in expr)) return 1;

  return (
    1 + expr.args.reduce((sum: number, arg) => sum + formulaNodeCount(arg), 0)
  );
}

export function validateFormula(expr: FormulaExpr): string | undefined {
  if (formulaNodeCount(expr) > FORMULA_MAX_NODES) {
    return `formula exceeds ${FORMULA_MAX_NODES} nodes`;
  }

  return formulaProblem(expr, 1);
}

// Emits the raw (unwrapped) expression. Refs are coerced through Number() so string cells/fields behave; every
// compound is parenthesized; round's operand is parenthesized so a bare literal never produces `1.toFixed(...)`.
function compileFormulaExpr(expr: FormulaExpr): string {
  if (typeof expr === "number") return String(expr);

  if ("query" in expr) {
    return `Number(${expr.query}.data${expr.field ? `?.${expr.field}` : ""})`;
  }

  if ("table" in expr) {
    return `Number(${expr.table}.selectedRow["${expr.column}"])`;
  }

  const args = expr.args.map(compileFormulaExpr);

  switch (expr.op) {
    case "add":
      return `(${args.join(" + ")})`;
    case "mul":
      return `(${args.join(" * ")})`;
    case "sub":
      return `(${args[0]} - ${args[1]})`;
    case "div":
      return `(${args[0]} / ${args[1]})`;
    case "abs":
      return `Math.abs(${args[0]})`;
    case "min":
      return `Math.min(${args.join(", ")})`;
    case "max":
      return `Math.max(${args.join(", ")})`;
    case "round": {
      const decimals = expr.args.length === 2 ? expr.args[1] : 0;

      // Defense-in-depth [COUNCIL: C1 security]: validateFormula guarantees this, but the emitter must
      // never trust a cast — a future caller skipping schema parse would otherwise emit "[object Object]".
      if (typeof decimals !== "number") {
        throw new Error("formula 'round' decimals must be a number literal");
      }

      return decimals === 0
        ? `Math.round(${args[0]})`
        : `Number((${args[0]}).toFixed(${decimals}))`;
    }
  }
}

// Every { table, column } ref inside a computed value (concat parts or formula leaves), so the edit path can run
// its dangling-table guard uniformly across token kinds.
export function computedValueTableRefs(value: ComputedValue): string[] {
  if ("concat" in value) {
    return value.concat.flatMap((part) =>
      "table" in part ? [part.table] : [],
    );
  }

  if ("formula" in value) {
    const walk = (expr: FormulaExpr): string[] => {
      if (typeof expr === "number") return [];

      if ("table" in expr) return [expr.table];

      if ("op" in expr) return expr.args.flatMap(walk);

      return [];
    };

    return walk(value.formula);
  }

  return [];
}

export const computedValueSchema = z.union([
  z
    .object({ formula: formulaExprSchema })
    .strict()
    .superRefine((value, ctx) => {
      const problem = validateFormula(value.formula);

      if (problem !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
      }
    }),
  z
    .object({
      now: z.object({ format: z.enum(COMPUTED_NOW_FORMAT_NAMES) }).strict(),
    })
    .strict(),
  z
    .object({
      count: z
        .object({
          query: bindingIdentifier,
          field: responseFieldPath.optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      concat: z
        .array(
          z.union([
            z.object({ literal: safeText(200) }).strict(),
            selectedRowRefSchema,
            queryFieldRefSchema,
          ]),
        )
        .min(2)
        .max(5),
    })
    .strict(),
]);

export type ComputedValue = z.infer<typeof computedValueSchema>;

// The single emitter for computed text values. now: compiler-owned moment format literal; count: the guarded
// array-length read; concat: JSON.stringify makes agent literals inert (escapes quotes/backslashes), and the
// ref parts reuse the identifier-charset emission of their sibling emitters.
export function compileComputedValue(ref: ComputedValue): string {
  if ("now" in ref) {
    return `{{ moment().format('${COMPUTED_NOW_FORMATS[ref.now.format]}') }}`;
  }

  if ("formula" in ref) {
    // Finite-guarded: a not-yet-run query or a non-numeric cell renders blank, never NaN/Infinity.
    return `{{ ((v) => Number.isFinite(v) ? v : "")(${compileFormulaExpr(ref.formula)}) }}`;
  }

  if ("count" in ref) {
    const dataPath = ref.count.field
      ? `${ref.count.query}.data?.${ref.count.field}`
      : `${ref.count.query}.data`;

    return `{{ (${dataPath} ?? []).length }}`;
  }

  const parts = ref.concat.map((part) => {
    if ("literal" in part) return JSON.stringify(part.literal);

    if ("table" in part) return `${part.table}.selectedRow["${part.column}"]`;

    return part.field
      ? `${part.query}.data?.${part.field}`
      : `${part.query}.data`;
  });

  return `{{ [${parts.join(", ")}].join("") }}`;
}

// A reference to one field of the current list item, for a card-grid (List Widget V2) template slot. The card widget
// repeats a fixed template (image + title + subtitle) over a data source; each slot binds to
// `{{ currentItem["<field>"] }}`. Same charset as table columns (letters/digits/underscore/space) — admits no
// quote/brace/backtick, so the compiler-emitted bracket-access binding cannot be broken out of. The compiler authors
// the binding; the agent only names the field.
const itemField = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_ ]+$/,
    "item field names must be alphanumeric, underscore, or space",
  );

// Emits `{{ currentItem["<field>"] }}` — the per-item binding for one card-template slot.
export function compileCurrentItemBinding(field: string): string {
  return `{{ currentItem["${field}"] }}`;
}

// Emits the list's `primaryKeys` binding. List Widget V2 requires a per-row key expression; we key by row index
// (`currentIndex`), which is always unique and assumes nothing about the data's shape. Only the widget's own name is
// interpolated (strict identifier), so the compiler-authored expression cannot be broken out of.
export function compilePrimaryKeys(listName: string): string {
  return `{{ ${listName}.listData.map((currentItem, currentIndex) => currentIndex) }}`;
}

// A value a widget's visibility can be gated on — e.g. a table shown only when a view toggle equals "Table" and a
// detail panel when it equals "Details", so one control switches between views. The control is a widget
// name; `equals` is a safe literal (no quotes/braces/backticks) emitted inside single quotes.
const controlValue = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[A-Za-z0-9_ .-]+$/,
    "value may contain letters, numbers, spaces, and _ . -",
  );

// Three predicate forms, discriminated by their (disjoint, strict) keys: gate on a control's value, on a
// table having a selected row (detail panels/action buttons), or on an input holding text.
export const visibleWhenRefSchema = z.union([
  z.object({ control: bindingIdentifier, equals: controlValue }).strict(),
  z.object({ rowSelected: bindingIdentifier }).strict(),
  z.object({ notEmpty: bindingIdentifier }).strict(),
]);

export type VisibleWhenRef = z.infer<typeof visibleWhenRefSchema>;

// Emits `{{ <table>.selectedRowIndex !== -1 }}` — true only while a row is selected (the widget's own
// no-selection sentinel). Only a validated identifier is interpolated.
export function compileRowSelectedBinding(table: string): string {
  return `{{ ${table}.selectedRowIndex !== -1 }}`;
}

// Emits `{{ !!<input>.text }}` — true only while the input holds text. Only a validated identifier is
// interpolated.
export function compileNotEmptyBinding(input: string): string {
  return `{{ !!${input}.text }}`;
}

// Emits `{{ <control>.<valueProp> === '<equals>' }}`. valueProp is chosen by the compiler from the control's widget
// type (never agent-supplied), so only a validated identifier and a safe literal are interpolated.
export function compileVisibleWhenBinding(
  control: string,
  valueProp: string,
  equals: string,
): string {
  return `{{ ${control}.${valueProp} === '${equals}' }}`;
}

// Chart series: a named series of {x,y} points. Static data (x label is safe text, y is a number).
const chartPoint = z
  .object({ x: z.union([safeText(200), z.number()]), y: z.number() })
  .strict();
const chartSeries = z
  .object({
    name: safeText(200).optional(),
    points: z.array(chartPoint).max(1000).optional(),
  })
  .strict();

// M4 chart query source: bind a chart's single series to a named query's rows, mapping column `x`
// (category/label) and column `y` (numeric value) to {x,y} points. `x`/`y` are COLUMN-NAME refs — the exact same
// charset as itemField/selectedRowColumn (letters/digits/underscore/space) — NOT raw expressions. The compiler
// emits `row["<x>"]`/`row["<y>"]` bracket access with double quotes, and the charset admits no
// quote/bracket/brace/backtick/`$`/backslash, so the compiler-authored map expression cannot be broken out of.
const chartAxisColumn = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_ ]+$/,
    "chart axis column names must be alphanumeric, underscore, or space",
  );

export const chartSourceRefSchema = z
  .object({
    query: bindingIdentifier,
    field: responseFieldPath.optional(),
    x: chartAxisColumn,
    y: chartAxisColumn,
  })
  .strict();

export type ChartSourceRef = z.infer<typeof chartSourceRefSchema>;

// The single emitter for a chart's data binding. Every interpolated part is a schema-validated identifier/column
// charset, so the expression cannot be broken out of. Optional chaining (`.data?.` ... `?.map(...) ?? []`) keeps the
// chart valid before the query has run (data undefined -> `[]`, no "undefined is not a function" throw), mirroring
// compileTableDataBinding's `?? []` guard. The leading head is the query identifier, so the linter resolves it
// against knownDataNames; `row` is an arrow-local, not a binding head.
export function compileChartDataBinding(ref: ChartSourceRef): string {
  const dataPath = ref.field
    ? `${ref.query}.data?.${ref.field}`
    : `${ref.query}.data`;

  return `{{ ${dataPath}?.map((row) => ({ x: row["${ref.x}"], y: row["${ref.y}"] })) ?? [] }}`;
}

const selectOption = z.object({
  label: safeText(200).pipe(z.string().min(1)),
  value: z.union([safeText(200), z.number()]),
});

// M4 select query source: bind a select's dropdown to a named query. SELECT_WIDGET derives its options from
// `sourceData` (a JS-evaluated array) keyed by `optionLabel`/`optionValue`. For a query source the compiler emits
// `sourceData: {{ <query>.data ?? [] }}` (reusing the table-data emitter) registered as a dynamic binding, plus
// `optionLabel`/`optionValue` as validated column-name LITERALS (not bindings). `label`/`value` use the same
// column-name charset as chart axes/card fields — no quote/brace/backtick — so nothing agent-supplied is
// eval-reachable. Query/field validation is shared with tableDataRefSchema so the two entry points cannot drift.
const optionColumn = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_ ]+$/,
    "option label/value column names must be alphanumeric, underscore, or space",
  );

export const optionsSourceRefSchema = z
  .object({
    query: bindingIdentifier,
    field: responseFieldPath.optional(),
    label: optionColumn,
    value: optionColumn,
  })
  .strict();

export type OptionsSourceRef = z.infer<typeof optionsSourceRefSchema>;

// Recursive: a container can hold child widgets. z.lazy handles the self-reference.
export const widgetSpecSchema: z.ZodType<WidgetSpec> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("text"),
        name: nameField,
        text: safeText(10000).optional(),
        // Display binding: one column of a table's selected row (detail views) OR one field of a query's
        // response (scalar readouts — "show the temperature from this API"). Both compiler-emitted; mutually
        // exclusive with static `text` (enforced in the template — a .refine here would break the discriminated
        // union, same as table data/source). The strict object shapes discriminate the union by key.
        source: z.union([selectedRowRefSchema, queryFieldRefSchema]).optional(),
        // Computed display value (no query needed): current date/time, a row count, or a concat of safe parts.
        // Compiler-emitted; mutually exclusive with `text` and `source` (enforced in the template).
        value: computedValueSchema.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("input"),
        name: nameField,
        label: safeText(200).optional(),
        inputType: z.enum(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]).optional(),
        // Display binding: prefill the input from a table's selected row (edit forms). Compiler-emitted.
        defaultValue: selectedRowRefSchema.optional(),
        // Input validation from a named format (e.g. zipcode) — compiler emits a vetted regex + error message.
        validation: inputValidationSchema.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("select"),
        name: nameField,
        label: safeText(200).optional(),
        options: z.array(selectOption).max(200).optional(),
        // M4: bind the dropdown to a named query instead of static options. Compiler emits a `sourceData` binding +
        // literal optionLabel/optionValue. Mutually exclusive with `options` (enforced in the template — a `.refine`
        // here would turn the arm into a ZodEffects, which z.discriminatedUnion rejects).
        optionsSource: optionsSourceRefSchema.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("button"),
        name: nameField,
        text: safeText(200).optional(),
        // M4: run a named query on click. Compiler emits `{{ <query>.run() }}`; nothing raw is accepted.
        onClick: runRef.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("image"),
        name: nameField,
        image: safeText(2000).optional(),
        // Display binding: the image src from one field of a query's response. Compiler-emitted; mutually
        // exclusive with the static `image` (enforced in the template, like text's text/source).
        source: queryFieldRefSchema.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("table"),
        name: nameField,
        // Static, literal rows only — never a free string registered as a dynamic binding (that was a live
        // injection hole).
        data: z.array(tableRow).max(1000).optional(),
        // M4: bind the table to a named query instead of static rows (compiler emits the query-data binding).
        // M5: OR to a store key accumulated by wire_event's appendToStore ({ store: '<key>' }).
        source: tableDataBindingSchema.optional(),
        placement: placementSchema.optional(),
      })
      // NOTE: `data` and `source` are mutually exclusive; enforced in the compiler (a `.refine` here would turn the
      // arm into a ZodEffects, which z.discriminatedUnion rejects).
      .strict(),
    z
      .object({
        type: z.literal("container"),
        name: nameField,
        children: z.array(widgetSpecSchema).max(50).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("form"),
        name: nameField,
        // A form groups inputs with a submit button; children are the fields inside it.
        submitLabel: safeText(200).optional(),
        children: z.array(widgetSpecSchema).max(50).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("modal"),
        name: nameField,
        title: safeText(200).optional(),
        children: z.array(widgetSpecSchema).max(50).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("datepicker"),
        name: nameField,
        label: safeText(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("chart"),
        name: nameField,
        title: safeText(200).optional(),
        chartType: z
          .enum([
            "LINE_CHART",
            "BAR_CHART",
            "PIE_CHART",
            "COLUMN_CHART",
            "AREA_CHART",
          ])
          .optional(),
        series: z.array(chartSeries).max(10).optional(),
        // M4: bind the chart to a named query's rows instead of static series. Compiler emits a mapped chartData
        // binding. Mutually exclusive with `series` (enforced in the template — a `.refine` here would turn the arm
        // into a ZodEffects, which z.discriminatedUnion rejects).
        source: chartSourceRefSchema.optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("tabs"),
        name: nameField,
        // Each tab has a label and its own inner canvas of children.
        tabs: z
          .array(
            z
              .object({
                label: safeText(120),
                children: z.array(widgetSpecSchema).max(50).optional(),
              })
              .strict(),
          )
          .min(1)
          .max(10)
          .optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("list"),
        name: nameField,
        // A card grid (List Widget V2): a fixed template — image + title + subtitle — repeated over a data source.
        // Binding `source` to the SAME query as a table gives a shared table/cards view. The compiler emits the full
        // 4-level List-Widget-V2 DSL and every per-item binding; the agent only names the source query and which item
        // fields fill each slot.
        source: tableDataRefSchema,
        image: itemField.optional(),
        title: itemField,
        subtitle: itemField.optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("checkbox"),
        name: nameField,
        label: safeText(200).optional(),
        // Initial checked state. A plain boolean literal — never a binding.
        defaultChecked: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("switch"),
        name: nameField,
        label: safeText(200).optional(),
        // Initial on/off state. A plain boolean literal — never a binding.
        defaultChecked: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("radio"),
        name: nameField,
        label: safeText(200).optional(),
        // Static single-select options, reusing the select's validated {label,value} shape (safe text / scalars).
        // RADIO_GROUP_WIDGET stores these in its plain `options` array — never a binding.
        options: z.array(selectOption).max(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("multiselect"),
        name: nameField,
        label: safeText(200).optional(),
        // Static options, same validated {label,value} shape as select. Emitted as a literal `sourceData` array
        // (MULTI_SELECT_WIDGET_V2 defaults sourceData to a plain, non-JS array) — never a binding.
        options: z.array(selectOption).max(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("filepicker"),
        name: nameField,
        label: safeText(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("divider"),
        name: nameField,
        orientation: z.enum(["horizontal", "vertical"]).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("progress"),
        name: nameField,
        // Percent complete (0-100). A plain literal — never a binding.
        value: z.number().min(0).max(100).optional(),
        // A busy/indeterminate bar with no fixed value.
        infinite: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("circularprogress"),
        name: nameField,
        value: z.number().min(0).max(100).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("rate"),
        name: nameField,
        max: z.number().int().min(1).max(10).optional(),
        defaultRate: z.number().min(0).optional(),
        allowHalf: z.boolean().optional(),
        readOnly: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("iconbutton"),
        name: nameField,
        // A Blueprint icon name (kebab-case identifier); emitted as a literal prop, never a binding.
        icon: iconName.optional(),
        variant: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("currencyinput"),
        name: nameField,
        label: safeText(200).optional(),
        placeholder: safeText(200).optional(),
        // Plain numeric default; emitted as a literal defaultText string, never a binding.
        defaultValue: z.number().optional(),
        // Fractional digits shown (0-6). CURRENCY_INPUT_WIDGET clamps beyond that.
        decimals: z.number().int().min(0).max(6).optional(),
        // ISO 4217 currency code (e.g. "USD"). Charset-gated to letters only so it stays a literal prop.
        currencyCode: z
          .string()
          .length(3)
          .regex(/^[A-Za-z]{3}$/, "currencyCode must be a 3-letter ISO code")
          .optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("phoneinput"),
        name: nameField,
        label: safeText(200).optional(),
        placeholder: safeText(200).optional(),
        // Plain phone-string default; emitted as a literal defaultText, never a binding.
        defaultValue: safeText(40).optional(),
        // Auto-format the entered number to the dial code's national format.
        allowFormatting: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("numberslider"),
        name: nameField,
        label: safeText(200).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().positive().optional(),
        defaultValue: z.number().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("categoryslider"),
        name: nameField,
        label: safeText(200).optional(),
        // The ordered category stops; each {label,value} is emitted as a literal, never a binding.
        options: z.array(selectOption).min(2).max(50).optional(),
        // Must match one of the option values; validated at compile time.
        defaultValue: safeText(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("rangeslider"),
        name: nameField,
        label: safeText(200).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().positive().optional(),
        defaultStart: z.number().optional(),
        defaultEnd: z.number().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("checkboxgroup"),
        name: nameField,
        label: safeText(200).optional(),
        // Static {label,value} options, emitted as a literal array — never a binding.
        options: z.array(selectOption).min(1).max(200).optional(),
        // Values pre-checked on load; each must match an option value.
        defaultSelected: z.array(safeText(200)).max(200).optional(),
        // Lay the boxes out horizontally (true) or stacked (false).
        inline: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("switchgroup"),
        name: nameField,
        label: safeText(200).optional(),
        options: z.array(selectOption).min(1).max(200).optional(),
        defaultSelected: z.array(safeText(200)).max(200).optional(),
        inline: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("menubutton"),
        name: nameField,
        label: safeText(200).optional(),
        variant: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]).optional(),
        // The dropdown's menu items. Each label is a literal; per-item click actions are not wired here (a later
        // wire_event step targets them), so the menu is inert on creation.
        items: z
          .array(z.object({ label: safeText(200) }).strict())
          .min(1)
          .max(50)
          .optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("buttongroup"),
        name: nameField,
        orientation: z.enum(["horizontal", "vertical"]).optional(),
        variant: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]).optional(),
        // The buttons in the group. icon is a kebab-case Blueprint name (literal prop). Click actions are wired
        // later via wire_event, so the buttons are inert on creation.
        buttons: z
          .array(
            z
              .object({ label: safeText(200), icon: iconName.optional() })
              .strict(),
          )
          .min(1)
          .max(50)
          .optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("camera"),
        name: nameField,
        // Photo capture ("CAMERA") or video recording ("VIDEO").
        mode: z.enum(["CAMERA", "VIDEO"]).optional(),
        // Mirror the live preview (selfie view).
        mirrored: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("audiorecorder"),
        name: nameField,
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("codescanner"),
        name: nameField,
        label: safeText(200).optional(),
        // ALWAYS_ON keeps the scanner live; CLICK_TO_SCAN opens it on a button press.
        scanMode: z.enum(["ALWAYS_ON", "CLICK_TO_SCAN"]).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("map"),
        name: nameField,
        // Initial camera center. Plain numeric lat/long — never a binding. (Needs a tenant Google Maps API key
        // configured in admin settings to render; that is org config, not an authoring concern.)
        center: z
          .object({
            lat: z.number().min(-90).max(90),
            long: z.number().min(-180).max(180),
          })
          .strict()
          .optional(),
        // Appsmith's 0-100 zoom scale (not the raw Google zoom level).
        zoom: z.number().min(0).max(100).optional(),
        // Static pins; each title is a literal (safeText), coords are plain numbers.
        markers: z
          .array(
            z
              .object({
                lat: z.number().min(-90).max(90),
                long: z.number().min(-180).max(180),
                title: safeText(200).optional(),
              })
              .strict(),
          )
          .max(200)
          .optional(),
        enableSearch: z.boolean().optional(),
        allowZoom: z.boolean().optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("mapchart"),
        name: nameField,
        title: safeText(200).optional(),
        // The geographic region rendered.
        region: z
          .enum([
            "WORLD",
            "WORLD_WITH_ANTARCTICA",
            "EUROPE",
            "NORTH_AMERICA",
            "SOURTH_AMERICA",
            "ASIA",
            "OCEANIA",
            "AFRICA",
            "USA",
          ])
          .optional(),
        // Per-region values. `id` is a region code (e.g. "NA", "US-CA"); emitted as a literal, never a binding.
        data: z
          .array(
            z
              .object({
                id: z
                  .string()
                  .min(1)
                  .max(20)
                  .regex(
                    /^[A-Za-z0-9-]+$/,
                    "region id must be an alphanumeric code",
                  ),
                value: z.number(),
                label: safeText(200).optional(),
              })
              .strict(),
          )
          .max(500)
          .optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
  ]),
);

export interface PlacementSpec {
  after?: string;
  inside?: string;
}

export type TableCell = string | number | boolean | null;
export type TableRow = Record<string, TableCell>;

export type WidgetSpec =
  | {
      type: "text";
      name?: string;
      text?: string;
      source?: SelectedRowRef | QueryFieldRef;
      value?: ComputedValue;
      placement?: PlacementSpec;
    }
  | {
      type: "input";
      name?: string;
      label?: string;
      inputType?: "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";
      defaultValue?: SelectedRowRef;
      validation?: InputValidationRef;
      placement?: PlacementSpec;
    }
  | {
      type: "select";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      optionsSource?: OptionsSourceRef;
      placement?: PlacementSpec;
    }
  | {
      type: "button";
      name?: string;
      text?: string;
      onClick?: { run: string };
      placement?: PlacementSpec;
    }
  | {
      type: "image";
      name?: string;
      image?: string;
      source?: QueryFieldRef;
      placement?: PlacementSpec;
    }
  | {
      type: "table";
      name?: string;
      data?: TableRow[];
      source?: TableDataBinding;
      placement?: PlacementSpec;
    }
  | {
      type: "container";
      name?: string;
      children?: WidgetSpec[];
      placement?: PlacementSpec;
    }
  | {
      type: "form";
      name?: string;
      submitLabel?: string;
      children?: WidgetSpec[];
      placement?: PlacementSpec;
    }
  | {
      type: "modal";
      name?: string;
      title?: string;
      children?: WidgetSpec[];
      placement?: PlacementSpec;
    }
  | {
      type: "datepicker";
      name?: string;
      label?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "chart";
      name?: string;
      title?: string;
      chartType?:
        | "LINE_CHART"
        | "BAR_CHART"
        | "PIE_CHART"
        | "COLUMN_CHART"
        | "AREA_CHART";
      series?: {
        name?: string;
        points?: { x: string | number; y: number }[];
      }[];
      source?: ChartSourceRef;
      placement?: PlacementSpec;
    }
  | {
      type: "tabs";
      name?: string;
      tabs?: { label: string; children?: WidgetSpec[] }[];
      placement?: PlacementSpec;
    }
  | {
      type: "list";
      name?: string;
      source: TableDataRef;
      image?: string;
      title: string;
      subtitle?: string;
      pageSize?: number;
      placement?: PlacementSpec;
    }
  | {
      type: "checkbox";
      name?: string;
      label?: string;
      defaultChecked?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "switch";
      name?: string;
      label?: string;
      defaultChecked?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "radio";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      placement?: PlacementSpec;
    }
  | {
      type: "multiselect";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      placement?: PlacementSpec;
    }
  | {
      type: "filepicker";
      name?: string;
      label?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "divider";
      name?: string;
      orientation?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "progress";
      name?: string;
      value?: number;
      infinite?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "circularprogress";
      name?: string;
      value?: number;
      placement?: PlacementSpec;
    }
  | {
      type: "rate";
      name?: string;
      max?: number;
      defaultRate?: number;
      allowHalf?: boolean;
      readOnly?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "iconbutton";
      name?: string;
      icon?: string;
      variant?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "currencyinput";
      name?: string;
      label?: string;
      placeholder?: string;
      defaultValue?: number;
      decimals?: number;
      currencyCode?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "phoneinput";
      name?: string;
      label?: string;
      placeholder?: string;
      defaultValue?: string;
      allowFormatting?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "numberslider";
      name?: string;
      label?: string;
      min?: number;
      max?: number;
      step?: number;
      defaultValue?: number;
      placement?: PlacementSpec;
    }
  | {
      type: "categoryslider";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      defaultValue?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "rangeslider";
      name?: string;
      label?: string;
      min?: number;
      max?: number;
      step?: number;
      defaultStart?: number;
      defaultEnd?: number;
      placement?: PlacementSpec;
    }
  | {
      type: "checkboxgroup";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      defaultSelected?: string[];
      inline?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "switchgroup";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
      defaultSelected?: string[];
      inline?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "menubutton";
      name?: string;
      label?: string;
      variant?: string;
      items?: { label: string }[];
      placement?: PlacementSpec;
    }
  | {
      type: "buttongroup";
      name?: string;
      orientation?: string;
      variant?: string;
      buttons?: { label: string; icon?: string }[];
      placement?: PlacementSpec;
    }
  | {
      type: "camera";
      name?: string;
      mode?: string;
      mirrored?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "audiorecorder";
      name?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "codescanner";
      name?: string;
      label?: string;
      scanMode?: string;
      placement?: PlacementSpec;
    }
  | {
      type: "map";
      name?: string;
      center?: { lat: number; long: number };
      zoom?: number;
      markers?: { lat: number; long: number; title?: string }[];
      enableSearch?: boolean;
      allowZoom?: boolean;
      placement?: PlacementSpec;
    }
  | {
      type: "mapchart";
      name?: string;
      title?: string;
      region?: string;
      data?: { id: string; value: number; label?: string }[];
      placement?: PlacementSpec;
    };

export const pageSpecSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9_ ]+$/, "page name must be alphanumeric"),
    widgets: z.array(widgetSpecSchema).min(1).max(100),
  })
  .strict();

export type PageSpec = z.infer<typeof pageSpecSchema>;

// App-level theme tokens. Strict formats (hex color, numeric+unit radius, a safe font-name charset) so no token can
// carry expression/injection syntax into widget style props.
export const themeSchema = z
  .object({
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{3,8}$/, "primaryColor must be a hex color")
      .optional(),
    borderRadius: z
      .string()
      .regex(
        /^\d+(\.\d+)?(px|rem|em)$/,
        "borderRadius must be like 8px or 0.5rem",
      )
      .optional(),
    fontFamily: z
      .string()
      .max(60)
      .regex(/^[A-Za-z0-9 ,'-]+$/, "fontFamily has unexpected characters")
      .optional(),
  })
  .strict();

export type Theme = z.infer<typeof themeSchema>;

export const appSpecSchema = z
  .object({
    // Defense-in-depth: the app name isn't eval-reachable, but no agent string escapes the no-raw-expression rule.
    name: safeText(99).pipe(z.string().trim().min(1)),
    theme: themeSchema.optional(),
    pages: z.array(pageSpecSchema).min(1).max(20),
  })
  .strict();

export type AppSpec = z.infer<typeof appSpecSchema>;

// The edit contract: add widgets to an existing page.
export const editSpecSchema = z
  .object({
    add: z.array(widgetSpecSchema).min(1).max(50),
  })
  .strict();

export type EditSpec = z.infer<typeof editSpecSchema>;
