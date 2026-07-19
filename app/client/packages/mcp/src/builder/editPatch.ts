import { z } from "zod";
import { ROOT_WIDGET_ID, ROW_HEIGHT, type WidgetNode } from "./layout.js";
import {
  applyPosition,
  canvasColumns,
  cascadeFit,
  clampRow,
  collisions,
  contentExtent,
  isDetached,
  isNumber,
  MAX_ROW,
  nearestFreePosition,
  rectOf,
  syncMobileRows,
  type CascadeAdjustment,
  type Position,
  type Rect,
} from "./occupancy.js";
import { containsModal, hostModalOf, PAGE_HOST } from "./modalGraph.js";
import {
  compileDisableWhenInvalid,
  compileInputValidation,
  compileComputedValue,
  compileQueryFieldBinding,
  compileSelectedRowBinding,
  computedValueSchema,
  compileTableDataBinding,
  compileNotEmptyBinding,
  compileRowSelectedBinding,
  compileVisibleWhenBinding,
  inputValidationSchema,
  queryFieldRefSchema,
  selectedRowRefSchema,
  tableDataBindingSchema,
  visibleWhenRefSchema,
  type InputValidationRef,
  type QueryFieldRef,
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
    // Text content: a selected-row ref (detail views) OR a query-field ref (scalar readouts).
    source: z.union([selectedRowRefSchema, queryFieldRefSchema]).optional(),
    // Computed text value (dates, counts, concat) — compiled onto the text prop. Text-only.
    value: computedValueSchema.optional(),
    defaultValue: selectedRowRefSchema.optional(),
    // Bind an image's src to a column of a table's selected row (e.g. an employee photo in a detail panel) OR
    // to a field of a query's response.
    imageSource: z
      .union([selectedRowRefSchema, queryFieldRefSchema])
      .optional(),
    // Gate a widget's visibility: on a control's value ({ control, equals } — a view toggle switching panels),
    // on a table having a selected row ({ rowSelected } — detail panels/action buttons), or on an input holding
    // text ({ notEmpty }). Compiled to isVisible.
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
    // Default (false): a position that lands on another widget is REPAIRED to the nearest free spot below, and the
    // adjustment is reported. strict: true rejects the collision instead, naming the colliders and the nearest
    // free position so one retry can succeed.
    strict: z.boolean().optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.parent !== undefined || operation.position !== undefined,
    "must set parent or position",
  );

// M6 (B2): resize a widget in grid units. rows/columns are the widget's SPAN (bottomRow - topRow /
// rightColumn - leftColumn); at least one is required. Modals translate rows into their pixel height prop.
const resizeOperationSchema = z
  .object({
    kind: z.literal("resize"),
    name: widgetNameSchema,
    rows: z.number().int().min(1).max(MAX_ROW).optional(),
    columns: z.number().int().min(1).max(MAX_ROW).optional(),
    // Default (false): growth that collides pushes the overlapping siblings down (cascade). strict: true rejects
    // the collision instead, naming the colliders.
    strict: z.boolean().optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.rows !== undefined || operation.columns !== undefined,
    "must set rows or columns",
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
          resizeOperationSchema,
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
  // Present when a colliding move was repaired: what the caller asked for vs the `position` actually applied.
  requestedPosition?: { topRow: number; leftColumn: number };
  // resize semantics: the widget's span in grid units before/after (modals report rows derived from their px height).
  previousSize?: { rows?: number; columns?: number };
  size?: { rows?: number; columns?: number };
}

export interface WidgetPatchResult {
  dsl: WidgetNode;
  changes: WidgetPatchChange[];
  // Human-readable adjustment reports (collision repairs, cascade pushes, modal-scroll warnings). Agents skim
  // `changes`; they read notes — every automatic adjustment is surfaced here too.
  notes: string[];
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

// A scalar display slot (text's content, image's src) accepts EITHER a selected-row ref or a query-field ref;
// the strict object shapes discriminate by key. Selected-row refs get the dangling-table guard; query refs
// compile directly (queries live outside the widget map, matching applyTableDataBinding's posture).
function applyScalarDisplayBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: SelectedRowRef | QueryFieldRef,
  expected: { widgetType: string; property: string; field: string },
): void {
  if ("table" in ref) {
    applySelectedRowBinding(widgets, node, ref, expected);

    return;
  }

  if (node.type !== expected.widgetType) {
    throw new Error(
      `'${expected.field}' can only be set on a ${expected.widgetType} ("${node.widgetName}" is ${node.type})`,
    );
  }

  node[expected.property] = compileQueryFieldBinding(ref);
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
  // Row-selection predicate: visible only while the referenced table has a selected row.
  if ("rowSelected" in ref) {
    const table = widgets.get(ref.rowSelected);

    if (!table) {
      throw new Error(`visibleWhen table "${ref.rowSelected}" was not found`);
    }

    if (table.node.type !== "TABLE_WIDGET_V2") {
      throw new Error(`"${ref.rowSelected}" is not a table widget`);
    }

    node.isVisible = compileRowSelectedBinding(ref.rowSelected);
    registerDynamicBinding(node, "isVisible");

    return;
  }

  // Non-empty-input predicate: visible only while the referenced input holds text.
  if ("notEmpty" in ref) {
    const input = widgets.get(ref.notEmpty);

    if (!input) {
      throw new Error(`visibleWhen input "${ref.notEmpty}" was not found`);
    }

    if (input.node.type !== "INPUT_WIDGET_V2") {
      throw new Error(
        `visibleWhen "${ref.notEmpty}" must be an input widget (it is ${input.node.type})`,
      );
    }

    node.isVisible = compileNotEmptyBinding(ref.notEmpty);
    registerDynamicBinding(node, "isVisible");

    return;
  }

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

function formatPosition(position: Position): string {
  return `{ topRow: ${position.topRow}, leftColumn: ${position.leftColumn} }`;
}

function formatNames(names: string[]): string {
  return names.map((name) => `"${name}"`).join(", ");
}

// Fold the container-fit cascade's adjustments into the patch result so every server-initiated push/growth is
// visible in `changes` alongside the operation that caused it.
function mergeCascade(
  changes: WidgetPatchChange[],
  notes: string[],
  cascade: { adjustments: CascadeAdjustment[]; notes: string[] },
): void {
  for (const adjustment of cascade.adjustments) {
    changes.push({ ...adjustment });
  }

  notes.push(...cascade.notes);
}

// The inner CANVAS_WIDGET children of a container-like widget (one for containers/forms/modals, one per tab for
// tabs). Empty for plain widgets.
function innerCanvasesOf(node: WidgetNode): WidgetNode[] {
  return (node.children ?? []).filter(
    (child) => child.type === "CANVAS_WIDGET",
  );
}

// Applies local, typed widget mutations without interpreting templates or bindings. The input DSL is never mutated.
export function applyWidgetPatch(
  currentDsl: WidgetNode,
  patchInput: unknown,
): WidgetPatchResult {
  const patch = widgetPatchSchema.parse(patchInput);
  const dsl = cloneDsl(currentDsl);
  const changes: WidgetPatchChange[] = [];
  const notes: string[] = [];

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
        value,
        visibleWhen,
        ...literals
      } = operation.props;

      // A binding and a literal for the same property in one patch would silently race; reject the ambiguity.
      if (source !== undefined && literals.text !== undefined) {
        throw new Error("cannot set both 'text' and 'source' in one update");
      }

      // `value` (computed) also compiles onto the text prop — any combination with text/source is ambiguous.
      if (
        value !== undefined &&
        (literals.text !== undefined || source !== undefined)
      ) {
        throw new Error(
          "cannot set both 'value' and 'text'/'source' in one update",
        );
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
        applyScalarDisplayBinding(widgets, located.node, source, {
          widgetType: "TEXT_WIDGET",
          property: "text",
          field: "source",
        });
      }

      if (value !== undefined) {
        if (located.node.type !== "TEXT_WIDGET") {
          throw new Error(
            `'value' can only be set on a TEXT_WIDGET ("${located.node.widgetName}" is ${located.node.type})`,
          );
        }

        // Guard parity with `source` [COUNCIL: B2 architect]: concat selected-row parts get the same
        // dangling-table checks; query parts stay unguarded per the documented posture (queries live
        // outside the widget map, and a missing query degrades to a blank part, a safe fail).
        if ("concat" in value) {
          for (const part of value.concat) {
            if (!("table" in part)) continue;

            const table = widgets.get(part.table);

            if (!table) throw new Error(`table "${part.table}" was not found`);

            if (table.node.type !== "TABLE_WIDGET_V2") {
              throw new Error(`"${part.table}" is not a table widget`);
            }
          }
        }

        located.node.text = compileComputedValue(value);
        registerDynamicBinding(located.node, "text");
      }

      if (defaultValue !== undefined) {
        applySelectedRowBinding(widgets, located.node, defaultValue, {
          widgetType: "INPUT_WIDGET_V2",
          property: "defaultText",
          field: "defaultValue",
        });
      }

      if (imageSource !== undefined) {
        applyScalarDisplayBinding(widgets, located.node, imageSource, {
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

    if (operation.kind === "resize") {
      applyResize(dsl, located, operation, changes, notes);
      continue;
    }

    applyMove(dsl, widgets, located, operation, changes, notes);
  }

  return { dsl, changes, notes };
}

type MoveOperation = Extract<WidgetPatchOperation, { kind: "move" }>;
type ResizeOperation = Extract<WidgetPatchOperation, { kind: "resize" }>;

// Collision-aware move (design section B). Explicit positions are honored when free; a collision is repaired to
// the nearest free spot below (recorded as requestedPosition vs position, plus a note) or rejected under
// strict: true. Reparenting is occupancy-aware: the landing position in the new canvas is always server-computed
// and recorded — a deliberate semantic change from the old "keep the coordinates blindly" behavior.
function applyMove(
  dsl: WidgetNode,
  widgets: Map<string, LocatedWidget>,
  located: LocatedWidget,
  operation: MoveOperation,
  changes: WidgetPatchChange[],
  notes: string[],
): void {
  const strict = operation.strict === true;
  const previousParentWidgetName = located.parent?.widgetName;
  const previousPosition = positionOf(located.node);
  let parentWidgetName = previousParentWidgetName;
  let destinationCanvas = located.parent;
  const reparented = operation.parent !== undefined;

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

    // M6 modal discipline (structural): a modal — or a subtree smuggling one — may not move under another
    // modal's canvas. Modals are page-level overlays; stacking is an event-graph concern, not a nesting one.
    if (
      containsModal(located.node) &&
      (target.node.type === "MODAL_WIDGET" ||
        hostModalOf(dsl, String(target.node.widgetName)) !== PAGE_HOST)
    ) {
      throw new Error(
        `cannot move "${operation.name}" into "${operation.parent}": it contains a modal, and a modal cannot ` +
          "live inside another modal. Keep modals at the page level and open them with a wire_event showModal action",
      );
    }

    removeFromParent(located);
    destination.children = destination.children ?? [];
    destination.children.push(located.node);
    located.node.parentId = destination.widgetId;
    parentWidgetName = target.node.widgetName;
    destinationCanvas = destination;
  }

  // Detached overlays (modals) are not in-flow: no occupancy, no cascade — apply the position directly.
  if (isDetached(located.node)) {
    if (operation.position !== undefined) {
      applyPosition(located.node, operation.position);
    }

    changes.push({
      kind: "move",
      widgetName: operation.name,
      ...(reparented ? { previousParentWidgetName, parentWidgetName } : {}),
      ...(operation.position !== undefined
        ? { previousPosition, position: positionOf(located.node) }
        : {}),
    });

    return;
  }

  const rect = rectOf(located.node);

  if (!rect) {
    throw new Error(
      `widget "${operation.name}" has a non-numeric position and cannot be moved safely`,
    );
  }

  if (!destinationCanvas || destinationCanvas.type !== "CANVAS_WIDGET") {
    throw new Error(`widget "${operation.name}" is not on a canvas`);
  }

  const columns = canvasColumns(destinationCanvas);
  const rows = rect.bottomRow - rect.topRow;
  let width = rect.rightColumn - rect.leftColumn;

  if (rows <= 0 || width <= 0) {
    throw new Error(
      `widget "${operation.name}" has a non-positive size and cannot be moved safely`,
    );
  }

  if (width > columns) {
    notes.push(
      `"${operation.name}" (${width} columns) is wider than "${parentWidgetName}" (${columns} columns); its width was reduced to fit`,
    );
    width = columns;
  }

  // Self-exclusion by node identity (not widgetId) so a corrupt duplicated-id tree cannot misroute the repair.
  const siblings = (destinationCanvas.children ?? []).filter(
    (child) => child !== located.node,
  );
  const requested: Position = operation.position ?? {
    topRow: rect.topRow,
    leftColumn: rect.leftColumn,
  };
  let landing: Position;
  let requestedPosition: Position | undefined;

  if (operation.position !== undefined) {
    const targetRect: Rect = {
      topRow: requested.topRow,
      bottomRow: requested.topRow + rows,
      leftColumn: requested.leftColumn,
      rightColumn: requested.leftColumn + width,
    };
    const colliders = collisions(siblings, targetRect);

    if (colliders.length === 0) {
      landing = requested;
    } else if (strict) {
      const free = nearestFreePosition(
        siblings,
        { rows, columns: width },
        requested,
        columns,
      );

      throw new Error(
        `moving "${operation.name}" to ${formatPosition(requested)} would overlap ${formatNames(colliders)}; nearest free position is ${formatPosition(free)}`,
      );
    } else {
      landing = nearestFreePosition(
        siblings,
        { rows, columns: width },
        requested,
        columns,
      );
      requestedPosition = requested;
      notes.push(
        `"${operation.name}": requested position ${formatPosition(requested)} overlaps ${formatNames(colliders)}; placed at ${formatPosition(landing)} instead`,
      );
    }
  } else {
    // Reparent without an explicit position: land at the nearest free spot to the old coordinates in the NEW canvas.
    landing = nearestFreePosition(
      siblings,
      { rows, columns: width },
      requested,
      columns,
    );
  }

  applyPosition(located.node, landing, width);

  changes.push({
    kind: "move",
    widgetName: operation.name,
    ...(reparented ? { previousParentWidgetName, parentWidgetName } : {}),
    previousPosition,
    position: positionOf(located.node),
    ...(requestedPosition !== undefined ? { requestedPosition } : {}),
  });

  // Container-fit cascade (D): grow the enclosing container chain to the widget's new extent, pushing anything
  // displaced further down. No-op when the landing fits.
  mergeCascade(changes, notes, cascadeFit(dsl, operation.name));
}

// The resize operation (design section B2), in grid units. Growth cascade-pushes colliding below-siblings
// (strict: true rejects); width cannot exceed the canvas (no horizontal reflow in v1); container-likes may not
// shrink below their children's occupied extent (the rejection names the executable minimum). Modal heights are a
// pixel prop: rows are translated via the grid's row height, and an over-tall body warns (the modal scrolls).
function applyResize(
  dsl: WidgetNode,
  located: LocatedWidget,
  operation: ResizeOperation,
  changes: WidgetPatchChange[],
  notes: string[],
): void {
  const strict = operation.strict === true;
  const node = located.node;

  if (node.type === "MODAL_WIDGET") {
    if (operation.columns !== undefined) {
      throw new Error(
        `modal "${operation.name}" width cannot be resized in grid columns; set rows only (height = rows × ${ROW_HEIGHT}px)`,
      );
    }

    const rows = operation.rows!;
    const previousHeight = isNumber(node.height) ? node.height : undefined;

    node.height = rows * ROW_HEIGHT;

    let extent = 0;

    for (const inner of innerCanvasesOf(node)) {
      extent = Math.max(extent, contentExtent(inner));
    }

    notes.push(
      `modal "${operation.name}" height set to ${rows * ROW_HEIGHT}px (${rows} rows × ${ROW_HEIGHT}px)`,
    );

    if (extent > rows) {
      notes.push(
        `modal "${operation.name}" body content is ${extent} rows; at ${rows} rows it will scroll`,
      );
    }

    changes.push({
      kind: "resize",
      widgetName: operation.name,
      ...(previousHeight !== undefined
        ? { previousSize: { rows: Math.round(previousHeight / ROW_HEIGHT) } }
        : {}),
      size: { rows },
    });

    return;
  }

  const rect = rectOf(node);

  if (!rect) {
    throw new Error(
      `widget "${operation.name}" has a non-numeric position and cannot be resized safely`,
    );
  }

  const canvas = located.parent;

  if (!canvas || canvas.type !== "CANVAS_WIDGET") {
    throw new Error(`widget "${operation.name}" is not on a canvas`);
  }

  const columns = canvasColumns(canvas);
  const currentRows = rect.bottomRow - rect.topRow;
  const currentColumns = rect.rightColumn - rect.leftColumn;
  const targetRows = operation.rows ?? Math.max(1, currentRows);
  const targetColumns = operation.columns ?? Math.max(1, currentColumns);

  // No horizontal reflow in v1: width growth past the canvas is rejected with the available room.
  if (rect.leftColumn + targetColumns > columns) {
    throw new Error(
      `resizing "${operation.name}" to ${targetColumns} columns exceeds its canvas: ${Math.max(0, columns - rect.leftColumn)} columns are available from leftColumn ${rect.leftColumn}`,
    );
  }

  // A container/form/tabs may not shrink below its children's occupied extent — reject with the executable minimum.
  const innerCanvases = innerCanvasesOf(node);

  if (innerCanvases.length > 0) {
    let minRows = 0;
    let minColumns = 0;

    for (const inner of innerCanvases) {
      minRows = Math.max(minRows, contentExtent(inner));

      for (const child of inner.children ?? []) {
        const childRect = rectOf(child);

        if (childRect && !isDetached(child)) {
          minColumns = Math.max(minColumns, childRect.rightColumn);
        }
      }
    }

    if (operation.rows !== undefined && targetRows < minRows) {
      throw new Error(
        `cannot shrink "${operation.name}" to ${targetRows} rows; smallest rows that fit the children: ${minRows}`,
      );
    }

    if (operation.columns !== undefined && targetColumns < minColumns) {
      throw new Error(
        `cannot shrink "${operation.name}" to ${targetColumns} columns; smallest columns that fit the children: ${minColumns}`,
      );
    }
  }

  // strict: reject growth that would land on siblings the widget does not already touch.
  const targetRect: Rect = {
    topRow: rect.topRow,
    bottomRow: rect.topRow + targetRows,
    leftColumn: rect.leftColumn,
    rightColumn: rect.leftColumn + targetColumns,
  };
  const siblings = (canvas.children ?? []).filter((child) => child !== node);
  const alreadyColliding = new Set(collisions(siblings, rect));
  const newColliders = collisions(siblings, targetRect).filter(
    (name) => !alreadyColliding.has(name),
  );

  if (newColliders.length > 0 && strict) {
    throw new Error(
      `resizing "${operation.name}" to ${targetRows} rows × ${targetColumns} columns would overlap ${formatNames(newColliders)}; retry without strict to push them down, or pick a smaller size`,
    );
  }

  // Write hygiene: rows derive from the clamped topRow (same contract as applyPosition — the span is never
  // distorted); the column write is bounded by the canvas check above.
  node.bottomRow = clampRow(rect.topRow) + targetRows;
  node.rightColumn = Math.max(0, Math.round(rect.leftColumn)) + targetColumns;
  syncMobileRows(node);

  // Keep the inner canvas rect in step with the container's body (build invariant: the canvas spans the container).
  for (const inner of innerCanvasesOf(node)) {
    if (isNumber(inner.bottomRow)) {
      inner.bottomRow = Math.max(targetRows, contentExtent(inner));
    }

    if (isNumber(inner.rightColumn)) inner.rightColumn = targetColumns;
  }

  changes.push({
    kind: "resize",
    widgetName: operation.name,
    previousSize: { rows: currentRows, columns: currentColumns },
    size: { rows: targetRows, columns: targetColumns },
  });

  if (newColliders.length > 0) {
    notes.push(
      `resizing "${operation.name}" grew it into ${formatNames(newColliders)}; they were pushed down`,
    );
  }

  // Cascade (D): push displaced siblings down and grow the ancestor chain; the delta gate verifies the final result.
  mergeCascade(changes, notes, cascadeFit(dsl, operation.name));
}
