import { randomUUID } from "node:crypto";

// Appsmith canvas grid geometry (from the client's GridDefaults).
export const GRID_COLUMNS = 64;
export const ROW_HEIGHT = 10;
export const ROOT_WIDGET_ID = "0";
export const ROOT_WIDGET_NAME = "MainContainer";

// The page DSL version the compiler emits. It MUST equal @shared/dsl's LATEST_DSL_VERSION: the client runs
// migrateDSL on every load, applying every transform from the DSL's version up to LATEST. Emitting an older number
// makes it rescale and rewrite our widgets (e.g. migration 075 flips a single-line input to MULTI_LINE_TEXT after an
// earlier grid-density scale). Emitting LATEST means zero migrations run and our widgets render exactly as built.
// A drift test asserts this equals the live constant so an Appsmith version bump can't silently regress it.
export const LATEST_DSL_VERSION = 94;
const ROW_GAP = 1;
// Recomputed by the layout engine on render; sensible seed values keep the imported DSL well-formed.
const DEFAULT_PARENT_COLUMN_SPACE = 10;

export type WidgetNode = Record<string, unknown> & {
  widgetId: string;
  widgetName: string;
  type: string;
  topRow: number;
  bottomRow: number;
  leftColumn: number;
  rightColumn: number;
  children?: WidgetNode[];
};

export type IdGenerator = () => string;

export function randomIdGenerator(): IdGenerator {
  return () => randomUUID().replace(/-/g, "").slice(0, 10);
}

// Deterministic ids for tests/snapshots.
export function sequentialIdGenerator(prefix = "w"): IdGenerator {
  let n = 0;

  return () => `${prefix}${(n += 1)}`;
}

// Allocates unique widget names within a page (Table, Table1, Table2, ...), seeded by names already present in the
// page so edits never collide with existing widgets.
export class NameAllocator {
  private readonly used = new Set<string>();

  constructor(existing: Iterable<string> = []) {
    for (const name of existing) this.used.add(name);
  }

  allocate(base: string): string {
    if (!this.used.has(base)) {
      this.used.add(base);

      return base;
    }

    let index = 1;

    while (this.used.has(`${base}${index}`)) index += 1;

    const name = `${base}${index}`;

    this.used.add(name);

    return name;
  }
}

export interface StampParams {
  widgetId: string;
  widgetName: string;
  appsmithType: string;
  version: number;
  parentId: string;
  topRow: number;
  leftColumn: number;
  columns: number;
  rows: number;
  props: Record<string, unknown>;
  children?: WidgetNode[];
}

export function stampWidget(params: StampParams): WidgetNode {
  const bottomRow = params.topRow + params.rows;
  const rightColumn = params.leftColumn + params.columns;

  return {
    ...params.props,
    widgetId: params.widgetId,
    widgetName: params.widgetName,
    type: params.appsmithType,
    version: params.version,
    parentId: params.parentId,
    renderMode: "CANVAS",
    isVisible: true,
    isLoading: false,
    topRow: params.topRow,
    bottomRow,
    leftColumn: params.leftColumn,
    rightColumn,
    mobileTopRow: params.topRow,
    mobileBottomRow: bottomRow,
    mobileLeftColumn: params.leftColumn,
    mobileRightColumn: rightColumn,
    parentColumnSpace: DEFAULT_PARENT_COLUMN_SPACE,
    parentRowSpace: ROW_HEIGHT,
    ...(params.children !== undefined ? { children: params.children } : {}),
  };
}

export function createRootCanvas(): WidgetNode {
  return {
    widgetName: ROOT_WIDGET_NAME,
    type: "CANVAS_WIDGET",
    // The root widget's version is the page DSL version migrateDSL reads; emit LATEST so no migrations run.
    version: LATEST_DSL_VERSION,
    widgetId: ROOT_WIDGET_ID,
    backgroundColor: "none",
    snapColumns: GRID_COLUMNS,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    leftColumn: 0,
    rightColumn: GRID_COLUMNS * DEFAULT_PARENT_COLUMN_SPACE,
    topRow: 0,
    bottomRow: 380,
    containerStyle: "none",
    detachFromLayout: true,
    canExtend: true,
    minHeight: 380,
    dynamicBindingPathList: [],
    dynamicTriggerPathList: [],
    children: [],
  };
}

export function createInnerCanvas(
  widgetId: string,
  widgetName: string,
  parentId: string,
  columns: number,
  rows: number,
  children: WidgetNode[],
): WidgetNode {
  return {
    widgetName,
    type: "CANVAS_WIDGET",
    version: 1,
    widgetId,
    parentId,
    renderMode: "CANVAS",
    isVisible: true,
    detachFromLayout: true,
    canExtend: false,
    topRow: 0,
    bottomRow: rows,
    leftColumn: 0,
    rightColumn: columns,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    dynamicBindingPathList: [],
    dynamicTriggerPathList: [],
    children,
  };
}

// The next free row on a canvas = the largest bottomRow among its children (0 when empty).
export function nextFreeRow(children: WidgetNode[]): number {
  return children.reduce(
    (max, child) =>
      Math.max(max, typeof child.bottomRow === "number" ? child.bottomRow : 0),
    0,
  );
}

export interface PlacementResult {
  // The canvas (root or a container's inner canvas) to append into.
  canvas: WidgetNode;
  // The enclosing container widget when `canvas` is a container's inner canvas. The caller grows its height to
  // encompass the canvas's new extent. Absent when appending to the root page canvas.
  container?: WidgetNode;
  // The starting topRow for the appended widget(s).
  topRow: number;
  // Human-readable note about how placement was resolved (reported back to the caller).
  note?: string;
}

function findWidgetNamed(
  node: WidgetNode,
  name: string,
): WidgetNode | undefined {
  if (node.widgetName === name) return node;

  for (const child of node.children ?? []) {
    const found = findWidgetNamed(child, name);

    if (found) return found;
  }

  return undefined;
}

function findParentCanvas(
  root: WidgetNode,
  target: WidgetNode,
): WidgetNode | undefined {
  const stack: WidgetNode[] = [root];

  while (stack.length) {
    const node = stack.pop()!;

    for (const child of node.children ?? []) {
      if (child.widgetId === target.widgetId) return node;

      stack.push(child);
    }
  }

  return undefined;
}

// Resolve where to append, honoring best-effort placement. Falls back to "append to the page canvas" and records a
// note when a target can't be honored.
export function resolvePlacement(
  root: WidgetNode,
  placement: { after?: string; inside?: string } | undefined,
): PlacementResult {
  if (placement?.inside) {
    const container = findWidgetNamed(root, placement.inside);
    const innerCanvas = container?.children?.find(
      (child) => child.type === "CANVAS_WIDGET",
    );

    if (innerCanvas) {
      return {
        canvas: innerCanvas,
        container,
        topRow: nextFreeRow(innerCanvas.children ?? []),
      };
    }

    return {
      canvas: root,
      topRow: nextFreeRow(root.children ?? []),
      note: `container "${placement.inside}" not found; appended to the page instead`,
    };
  }

  if (placement?.after) {
    const target = findWidgetNamed(root, placement.after);

    if (target) {
      const parent = findParentCanvas(root, target) ?? root;

      return {
        canvas: parent,
        topRow:
          typeof target.bottomRow === "number"
            ? target.bottomRow + ROW_GAP
            : nextFreeRow(parent.children ?? []),
      };
    }

    return {
      canvas: root,
      topRow: nextFreeRow(root.children ?? []),
      note: `widget "${placement.after}" not found; appended to the page instead`,
    };
  }

  return { canvas: root, topRow: nextFreeRow(root.children ?? []) };
}
