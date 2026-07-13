import { z } from "zod";
import { ROOT_WIDGET_ID, type WidgetNode } from "./layout.js";

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const MAX_WIDGET_NAME_LENGTH = 64;

const widgetNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_WIDGET_NAME_LENGTH)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");

const safeText = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (value) => !RAW_EXPRESSION.test(value),
      "must not contain bindings",
    );

const literalScalarSchema = z.union([
  safeText(10_000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const optionSchema = z
  .object({
    label: safeText(200).pipe(z.string().min(1)),
    value: literalScalarSchema,
  })
  .strict();

// This is deliberately a closed, literal-only property vocabulary. In particular it excludes events, bindings,
// dynamic path lists, and arbitrary style/configuration fields that could become executable at render time.
export const widgetPropsPatchSchema = z
  .object({
    text: safeText(10_000).optional(),
    label: safeText(200).optional(),
    inputType: z.enum(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]).optional(),
    options: z.array(optionSchema).max(200).optional(),
    title: safeText(200).optional(),
    image: safeText(2_000).optional(),
    chartType: z
      .enum([
        "LINE_CHART",
        "BAR_CHART",
        "PIE_CHART",
        "COLUMN_CHART",
        "AREA_CHART",
      ])
      .optional(),
    chartName: safeText(200).optional(),
    defaultText: safeText(10_000).optional(),
    placeholderText: safeText(200).optional(),
    dateFormat: safeText(100).optional(),
    isRequired: z.boolean().optional(),
    isDisabled: z.boolean().optional(),
    isVisible: z.boolean().optional(),
  })
  .strict()
  .refine((props) => Object.keys(props).length > 0, "must update a property");

const positionSchema = z
  .object({
    topRow: z.number().int().min(0),
    leftColumn: z.number().int().min(0),
  })
  .strict();

const updateOperationSchema = z
  .object({
    kind: z.literal("update"),
    name: widgetNameSchema,
    props: widgetPropsPatchSchema,
  })
  .strict();

const moveOperationSchema = z
  .object({
    kind: z.literal("move"),
    name: widgetNameSchema,
    parent: widgetNameSchema.optional(),
    position: positionSchema.optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.parent !== undefined || operation.position !== undefined,
    "must set parent or position",
  );

const removeOperationSchema = z
  .object({
    kind: z.literal("remove"),
    name: widgetNameSchema,
  })
  .strict();

export const widgetPatchSchema = z
  .object({
    operations: z
      .array(
        z.union([
          updateOperationSchema,
          moveOperationSchema,
          removeOperationSchema,
        ]),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type WidgetPatch = z.infer<typeof widgetPatchSchema>;
export type WidgetPatchOperation = WidgetPatch["operations"][number];
export type WidgetPropsPatch = z.infer<typeof widgetPropsPatchSchema>;

export interface WidgetPatchChange {
  kind: WidgetPatchOperation["kind"];
  widgetName: string;
  changedProps?: (keyof WidgetPropsPatch)[];
  previousParentWidgetName?: string;
  parentWidgetName?: string;
  previousPosition?: { topRow: number; leftColumn: number };
  position?: { topRow: number; leftColumn: number };
}

export interface WidgetPatchResult {
  dsl: WidgetNode;
  changes: WidgetPatchChange[];
}

interface LocatedWidget {
  node: WidgetNode;
  parent?: WidgetNode;
}

function cloneDsl(dsl: WidgetNode): WidgetNode {
  return JSON.parse(JSON.stringify(dsl)) as WidgetNode;
}

function indexWidgets(root: WidgetNode): Map<string, LocatedWidget> {
  const widgets = new Map<string, LocatedWidget>();

  function visit(node: WidgetNode, parent?: WidgetNode): void {
    if (widgets.has(node.widgetName)) {
      throw new Error(`widget names must be unique: "${node.widgetName}"`);
    }

    widgets.set(node.widgetName, { node, parent });

    for (const child of node.children ?? []) visit(child, node);
  }

  visit(root);

  return widgets;
}

function requireWidget(
  widgets: Map<string, LocatedWidget>,
  name: string,
): LocatedWidget {
  const widget = widgets.get(name);

  if (!widget) throw new Error(`widget "${name}" was not found`);

  if (widget.node.widgetId === ROOT_WIDGET_ID) {
    throw new Error("the root canvas cannot be modified");
  }

  return widget;
}

function directCanvas(node: WidgetNode): WidgetNode | undefined {
  if (node.type === "CANVAS_WIDGET") return node;

  return node.children?.find((child) => child.type === "CANVAS_WIDGET");
}

function isDescendant(ancestor: WidgetNode, candidate: WidgetNode): boolean {
  for (const child of ancestor.children ?? []) {
    if (
      child.widgetId === candidate.widgetId ||
      isDescendant(child, candidate)
    ) {
      return true;
    }
  }

  return false;
}

function removeFromParent(widget: LocatedWidget): void {
  if (!widget.parent?.children) {
    throw new Error(
      `widget "${widget.node.widgetName}" has no removable parent`,
    );
  }

  const index = widget.parent.children.findIndex(
    (child) => child.widgetId === widget.node.widgetId,
  );

  if (index === -1) {
    throw new Error(`widget "${widget.node.widgetName}" is not in its parent`);
  }

  widget.parent.children.splice(index, 1);
}

function positionOf(node: WidgetNode): { topRow: number; leftColumn: number } {
  return { topRow: node.topRow, leftColumn: node.leftColumn };
}

function moveToPosition(
  node: WidgetNode,
  position: { topRow: number; leftColumn: number },
): void {
  const rowSpan = node.bottomRow - node.topRow;
  const columnSpan = node.rightColumn - node.leftColumn;

  node.topRow = position.topRow;
  node.bottomRow = position.topRow + rowSpan;
  node.leftColumn = position.leftColumn;
  node.rightColumn = position.leftColumn + columnSpan;
}

// Applies local, typed widget mutations without interpreting templates or bindings. The input DSL is never mutated.
export function applyWidgetPatch(
  currentDsl: WidgetNode,
  patchInput: unknown,
): WidgetPatchResult {
  const patch = widgetPatchSchema.parse(patchInput);
  const dsl = cloneDsl(currentDsl);
  const changes: WidgetPatchChange[] = [];

  for (const operation of patch.operations) {
    const widgets = indexWidgets(dsl);
    const located = requireWidget(widgets, operation.name);

    if (operation.kind === "update") {
      Object.assign(located.node, operation.props);
      changes.push({
        kind: "update",
        widgetName: operation.name,
        changedProps: Object.keys(
          operation.props,
        ) as (keyof WidgetPropsPatch)[],
      });
      continue;
    }

    if (operation.kind === "remove") {
      if ((located.node.children?.length ?? 0) > 0) {
        throw new Error(
          `widget "${operation.name}" has children; remove them first`,
        );
      }

      removeFromParent(located);
      changes.push({ kind: "remove", widgetName: operation.name });
      continue;
    }

    const previousParentWidgetName = located.parent?.widgetName;
    const previousPosition = positionOf(located.node);
    let parentWidgetName = previousParentWidgetName;

    if (operation.parent !== undefined) {
      const target = widgets.get(operation.parent);
      const destination = target && directCanvas(target.node);

      if (!target || !destination) {
        throw new Error(
          `parent "${operation.parent}" must name a canvas or widget with an inner canvas`,
        );
      }

      if (
        destination.widgetId === located.node.widgetId ||
        isDescendant(located.node, destination)
      ) {
        throw new Error(
          `widget "${operation.name}" cannot be parented to itself`,
        );
      }

      removeFromParent(located);
      destination.children = destination.children ?? [];
      destination.children.push(located.node);
      located.node.parentId = destination.widgetId;
      parentWidgetName = target.node.widgetName;
    }

    if (operation.position !== undefined) {
      moveToPosition(located.node, operation.position);
    }

    changes.push({
      kind: "move",
      widgetName: operation.name,
      ...(operation.parent !== undefined
        ? { previousParentWidgetName, parentWidgetName }
        : {}),
      ...(operation.position !== undefined
        ? { previousPosition, position: positionOf(located.node) }
        : {}),
    });
  }

  return { dsl, changes };
}
