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
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;

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

const queryRef = z.object({ query: bindingIdentifier }).strict();
const runRef = z.object({ run: bindingIdentifier }).strict();

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

const selectOption = z.object({
  label: safeText(200).pipe(z.string().min(1)),
  value: z.union([safeText(200), z.number()]),
});

// Recursive: a container can hold child widgets. z.lazy handles the self-reference.
export const widgetSpecSchema: z.ZodType<WidgetSpec> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("text"),
        name: nameField,
        text: safeText(10000).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("input"),
        name: nameField,
        label: safeText(200).optional(),
        inputType: z.enum(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("select"),
        name: nameField,
        label: safeText(200).optional(),
        options: z.array(selectOption).max(200).optional(),
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
        // The children form one list item template, repeated for each data row.
        children: z.array(widgetSpecSchema).max(30).optional(),
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
  | { type: "text"; name?: string; text?: string; placement?: PlacementSpec }
  | {
      type: "input";
      name?: string;
      label?: string;
      inputType?: "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";
      placement?: PlacementSpec;
    }
  | {
      type: "select";
      name?: string;
      label?: string;
      options?: { label: string; value: string | number }[];
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
      source?: { query: string };
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
      children?: WidgetSpec[];
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
