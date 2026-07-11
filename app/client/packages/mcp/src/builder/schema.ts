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
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

// Best-effort placement. Omitted → append below existing content. `after` → below a named widget. `inside` → into a
// named container's inner canvas. A miss falls back to append and is reported.
export const placementSchema = z
  .object({
    after: z.string().min(1).optional(),
    inside: z.string().min(1).optional(),
  })
  .strict();

export type Placement = z.infer<typeof placementSchema>;

const nameField = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "name must be alphanumeric/underscore")
  .optional();

const selectOption = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
});

// Recursive: a container can hold child widgets. z.lazy handles the self-reference.
export const widgetSpecSchema: z.ZodType<WidgetSpec> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("text"),
        name: nameField,
        text: z.string().max(10000).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("input"),
        name: nameField,
        label: z.string().max(200).optional(),
        inputType: z.enum(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("select"),
        name: nameField,
        label: z.string().max(200).optional(),
        options: z.array(selectOption).max(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("button"),
        name: nameField,
        text: z.string().max(200).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("image"),
        name: nameField,
        image: z.string().max(2000).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("table"),
        name: nameField,
        data: z.string().max(20000).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("container"),
        name: nameField,
        children: z.array(widgetSpecSchema).max(50).optional(),
        placement: placementSchema.optional(),
      })
      .strict(),
  ]),
);

export interface PlacementSpec {
  after?: string;
  inside?: string;
}

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
  | { type: "button"; name?: string; text?: string; placement?: PlacementSpec }
  | { type: "image"; name?: string; image?: string; placement?: PlacementSpec }
  | { type: "table"; name?: string; data?: string; placement?: PlacementSpec }
  | {
      type: "container";
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

export const appSpecSchema = z
  .object({
    name: z.string().trim().min(1).max(99),
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
