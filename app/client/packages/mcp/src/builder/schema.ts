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
const responseFieldPath = z
  .string()
  .min(1)
  .max(128)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_.]*$/,
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
const queryRef = tableDataRefSchema;
const runRef = z.object({ run: bindingIdentifier }).strict();

export interface TableDataRef {
  query: string;
  field?: string;
  clearWhenEmpty?: string;
}

// The single emitter for a table's data binding. All parts are schema-validated identifier paths, so the emitted
// expression cannot be broken out of. Optional chaining + `?? []` keeps the table valid before the query has run.
// With `clearWhenEmpty`, the data is gated on the guard input holding text: `{{ In.text ? (Q.data ?? []) : [] }}`.
export function compileTableDataBinding(ref: TableDataRef): string {
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

export const visibleWhenRefSchema = z
  .object({ control: bindingIdentifier, equals: controlValue })
  .strict();

export type VisibleWhenRef = z.infer<typeof visibleWhenRefSchema>;

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
        // Display binding: show one column of a table's selected row (detail views). Compiler-emitted; mutually
        // exclusive with static `text` (enforced in the template — a .refine here would break the discriminated
        // union, same as table data/source).
        source: selectedRowRefSchema.optional(),
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
        // M4: bind the table to a named query instead of static rows. Compiler emits `{{ <query>.data }}`.
        source: queryRef.optional(),
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
      source?: SelectedRowRef;
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
  | { type: "image"; name?: string; image?: string; placement?: PlacementSpec }
  | {
      type: "table";
      name?: string;
      data?: TableRow[];
      source?: { query: string; field?: string; clearWhenEmpty?: string };
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
