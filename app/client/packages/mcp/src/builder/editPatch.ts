import { z } from "zod";
import { ROOT_WIDGET_ID, type WidgetNode } from "./layout.js";
import {
  compileDisableWhenInvalid,
  compileInputValidation,
  compileSelectedRowBinding,
  compileTableDataBinding,
  compileVisibleWhenBinding,
  inputValidationSchema,
  selectedRowRefSchema,
  tableDataBindingSchema,
  visibleWhenRefSchema,
  type InputValidationRef,
  type SelectedRowRef,
  type TableDataBinding,
  type VisibleWhenRef,
} from "./schema.js";

// Mirrors schema.ts RAW_EXPRESSION, including U+2028/U+2029 line/paragraph separators that JSON.stringify leaves
// unescaped and that terminate a JS string literal on pre-ES2019 engines.
const RAW_EXPRESSION = /\u007b\u007b|\u007d\u007d|\$\u007b|`|\u2028|\u2029/;
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

// A literal CSS color for style props (e.g. table row colors), emitted raw into a styled-component
// `background: ${color}` declaration. This is a COLOR-GRAMMAR allowlist, not a loose charset: hex, an
// rgb/rgba/hsl/hsla function with a numeric-only argument list, or a bare named-color token. Crucially it cannot
// spell `url(...)` (letters are forbidden inside the function parens), so it admits no CSS egress primitive — a
// value can neither fetch a URL (tracking beacon / internal-network probe) nor form a binding/expression.
const cssColor = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^(?:#[0-9A-Fa-f]{3,8}|(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%/ ]+\s*\)|[A-Za-z]+)$/,
    "color must be a literal color: hex (#rgb/#rrggbb), rgb()/rgba()/hsl()/hsla(), or a named color",
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

// This is deliberately a closed, mostly literal-only property vocabulary. It excludes events, raw bindings,
// dynamic path lists, and arbitrary style/configuration fields that could become executable at render time. The two
// exceptions — `source` (text) and `defaultValue` (input) — are STRUCTURED selected-row references compiled by the
// patch applier into `{{ Table.selectedRow[...] }}` bindings; the agent still never authors expression text.
export const widgetPropsPatchSchema = z
  .object({
    text: safeText(10_000).optional(),
    source: selectedRowRefSchema.optional(),
    defaultValue: selectedRowRefSchema.optional(),
    // Bind an image's src to a column of a table's selected row (e.g. an employee photo in a detail panel).
    imageSource: selectedRowRefSchema.optional(),
    // Gate a widget's visibility on a control's value — e.g. show a table when a view toggle equals "Table" and a
    // detail panel when it equals "Details", so one control switches views. Compiled to isVisible.
    visibleWhen: visibleWhenRefSchema.optional(),
    // Re-bind a table's data: a query ref (optionally clear-when-empty) OR (M5) a store key accumulated by
    // wire_event's appendToStore ({ store: '<key>' }). Compiled, never literal-assigned.
    tableData: tableDataBindingSchema.optional(),
    // Add named-format validation to an input (compiled to a vetted regex + error message).
    validation: inputValidationSchema.optional(),
    // Disable this widget while the named input is invalid — compiled to `{{ !<input>.isValid }}`.
    disableWhenInvalid: widgetNameSchema.optional(),
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
    // Table row-striping (TableWidgetV2 style props). Literal colors only — never bindings — so the zebra effect
    // ships as static style, not an evaluated expression.
    oddRowColor: cssColor.optional(),
    evenRowColor: cssColor.optional(),
    // Table interactivity toggles (TableWidgetV2). Literal booleans — turn on client-side search across all columns,
    // the column filter UI, sorting, download, and pagination for a directory-style browse experience.
    isVisibleSearch: z.boolean().optional(),
    enableClientSideSearch: z.boolean().optional(),
    isVisibleFilters: z.boolean().optional(),
    isSortable: z.boolean().optional(),
    isVisibleDownload: z.boolean().optional(),
    isVisiblePagination: z.boolean().optional(),
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

function registerDynamicBinding(node: WidgetNode, key: string): void {
  const paths = Array.isArray(node.dynamicBindingPathList)
    ? (node.dynamicBindingPathList as { key: string }[])
    : [];

  if (!paths.some((entry) => entry.key === key)) paths.push({ key });

  node.dynamicBindingPathList = paths;
}

// When a literal replaces a previously bound property, the stale dynamic-path entry must go too — otherwise the
// widget keeps advertising a binding it no longer has.
function unregisterDynamicBinding(node: WidgetNode, key: string): void {
  if (!Array.isArray(node.dynamicBindingPathList)) return;

  node.dynamicBindingPathList = (
    node.dynamicBindingPathList as { key: string }[]
  ).filter((entry) => entry.key !== key);
}

// Compile a structured selected-row reference onto a widget: type-checked target property, dangling-table guard,
// compiler-emitted binding, and dynamic-path registration. The agent never supplies the expression.
function applySelectedRowBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: SelectedRowRef,
  expected: { widgetType: string; property: string; field: string },
): void {
  if (node.type !== expected.widgetType) {
    throw new Error(
      `'${expected.field}' can only be set on a ${expected.widgetType} ("${node.widgetName}" is ${node.type})`,
    );
  }

  const table = widgets.get(ref.table);

  if (!table) throw new Error(`table "${ref.table}" was not found`);

  if (table.node.type !== "TABLE_WIDGET_V2") {
    throw new Error(`"${ref.table}" is not a table widget`);
  }

  node[expected.property] = compileSelectedRowBinding(ref);
  registerDynamicBinding(node, expected.property);
}

// Re-bind a table's data to a query (optionally clear-when-empty) or to a store key (M5). Type-checks the target,
// verifies the guard input exists, emits the binding from the closed vocabulary, and registers the dynamic path.
// The agent never supplies expression text.
function applyTableDataBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: TableDataBinding,
): void {
  if (node.type !== "TABLE_WIDGET_V2") {
    throw new Error(
      `'tableData' can only be set on a TABLE_WIDGET_V2 ("${node.widgetName}" is ${node.type})`,
    );
  }

  // The store form has no guard/field to verify — its key is schema-validated and the binding head (appsmith) is
  // always valid, so it compiles directly.
  if ("store" in ref) {
    node.tableData = compileTableDataBinding(ref);
    registerDynamicBinding(node, "tableData");

    return;
  }

  // The guard is emitted as `${guard}.text` — so it must be an input widget. A non-input has no `.text` (undefined
  // is falsy), which would silently keep the table permanently empty; reject that up front instead.
  if (ref.clearWhenEmpty !== undefined) {
    const guard = widgets.get(ref.clearWhenEmpty);

    if (!guard) {
      throw new Error(
        `clearWhenEmpty input "${ref.clearWhenEmpty}" was not found`,
      );
    }

    if (guard.node.type !== "INPUT_WIDGET_V2") {
      throw new Error(
        `clearWhenEmpty "${ref.clearWhenEmpty}" must be an input widget (it is ${guard.node.type})`,
      );
    }
  }

  node.tableData = compileTableDataBinding(ref);
  registerDynamicBinding(node, "tableData");
}

// Add named-format validation to an input: emits a vetted literal regex + error message and marks the input
// required (so an empty value is invalid too). Input-only; the agent never supplies a regex.
function applyInputValidation(node: WidgetNode, ref: InputValidationRef): void {
  if (node.type !== "INPUT_WIDGET_V2") {
    throw new Error(
      `'validation' can only be set on an INPUT_WIDGET_V2 ("${node.widgetName}" is ${node.type})`,
    );
  }

  const { errorMessage, regex } = compileInputValidation(ref);

  node.regex = regex;
  node.errorMessage = errorMessage;
  node.isRequired = true;
}

// Disable a widget while the named input is invalid — emits `{{ !<input>.isValid }}` onto isDisabled and registers
// the dynamic path. The referenced widget must be an input (only inputs expose `.isValid`).
function applyDisableWhenInvalid(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  inputName: string,
): void {
  const input = widgets.get(inputName);

  if (!input) {
    throw new Error(`disableWhenInvalid input "${inputName}" was not found`);
  }

  if (input.node.type !== "INPUT_WIDGET_V2") {
    throw new Error(
      `disableWhenInvalid "${inputName}" must be an input widget (it is ${input.node.type})`,
    );
  }

  node.isDisabled = compileDisableWhenInvalid(inputName);
  registerDynamicBinding(node, "isDisabled");
}

// The meta value property a control widget exposes, used by visibleWhen. Only controls that hold a single selectable
// value are supported; the agent never supplies the property name.
const CONTROL_VALUE_PROPS: Record<string, string> = {
  SELECT_WIDGET: "selectedOptionValue",
  TABS_WIDGET: "selectedTab",
};

// Gate a widget's visibility on a control's value — emits `{{ Control.<valueProp> === '<equals>' }}` onto isVisible.
// The control must exist and be a supported single-value control.
function applyVisibleWhenBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: VisibleWhenRef,
): void {
  const control = widgets.get(ref.control);

  if (!control) {
    throw new Error(`visibleWhen control "${ref.control}" was not found`);
  }

  const valueProp = CONTROL_VALUE_PROPS[control.node.type];

  if (!valueProp) {
    throw new Error(
      `visibleWhen "${ref.control}" must be a select or tabs control (it is ${control.node.type})`,
    );
  }

  node.isVisible = compileVisibleWhenBinding(
    ref.control,
    valueProp,
    ref.equals,
  );
  registerDynamicBinding(node, "isVisible");
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
      // Structured binding refs are compiled (never literal-assigned); everything else is a plain literal.
      const {
        defaultValue,
        disableWhenInvalid,
        imageSource,
        source,
        tableData,
        validation,
        visibleWhen,
        ...literals
      } = operation.props;

      // A binding and a literal for the same property in one patch would silently race; reject the ambiguity.
      if (source !== undefined && literals.text !== undefined) {
        throw new Error("cannot set both 'text' and 'source' in one update");
      }

      if (defaultValue !== undefined && literals.defaultText !== undefined) {
        throw new Error(
          "cannot set both 'defaultText' and 'defaultValue' in one update",
        );
      }

      if (imageSource !== undefined && literals.image !== undefined) {
        throw new Error(
          "cannot set both 'image' and 'imageSource' in one update",
        );
      }

      if (visibleWhen !== undefined && literals.isVisible !== undefined) {
        throw new Error(
          "cannot set both 'isVisible' and 'visibleWhen' in one update",
        );
      }

      // disableWhenInvalid emits an isDisabled binding; a literal isDisabled in the same update would race it.
      if (
        disableWhenInvalid !== undefined &&
        literals.isDisabled !== undefined
      ) {
        throw new Error(
          "cannot set both 'isDisabled' and 'disableWhenInvalid' in one update",
        );
      }

      // validation marks the input required (so empty is invalid too); a literal isRequired in the same update runs
      // last via Object.assign and would silently clobber it — reject the ambiguity rather than defeat the guard.
      if (validation !== undefined && literals.isRequired !== undefined) {
        throw new Error(
          "cannot set both 'isRequired' and 'validation' in one update",
        );
      }

      if (source !== undefined) {
        applySelectedRowBinding(widgets, located.node, source, {
          widgetType: "TEXT_WIDGET",
          property: "text",
          field: "source",
        });
      }

      if (defaultValue !== undefined) {
        applySelectedRowBinding(widgets, located.node, defaultValue, {
          widgetType: "INPUT_WIDGET_V2",
          property: "defaultText",
          field: "defaultValue",
        });
      }

      if (imageSource !== undefined) {
        applySelectedRowBinding(widgets, located.node, imageSource, {
          widgetType: "IMAGE_WIDGET",
          property: "image",
          field: "imageSource",
        });
      }

      if (tableData !== undefined) {
        applyTableDataBinding(widgets, located.node, tableData);
      }

      if (validation !== undefined) {
        applyInputValidation(located.node, validation);
      }

      if (disableWhenInvalid !== undefined) {
        applyDisableWhenInvalid(widgets, located.node, disableWhenInvalid);
      }

      if (visibleWhen !== undefined) {
        applyVisibleWhenBinding(widgets, located.node, visibleWhen);
      }

      Object.assign(located.node, literals);

      // A literal overwriting a previously bound property also clears its dynamic-path registration.
      if (literals.text !== undefined) {
        unregisterDynamicBinding(located.node, "text");
      }

      if (literals.defaultText !== undefined) {
        unregisterDynamicBinding(located.node, "defaultText");
      }

      if (literals.image !== undefined) {
        unregisterDynamicBinding(located.node, "image");
      }

      // A literal isDisabled replacing a prior disableWhenInvalid binding clears its dynamic-path registration.
      if (literals.isDisabled !== undefined) {
        unregisterDynamicBinding(located.node, "isDisabled");
      }

      // A literal isVisible replacing a prior visibleWhen binding clears its dynamic-path registration.
      if (literals.isVisible !== undefined) {
        unregisterDynamicBinding(located.node, "isVisible");
      }

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
