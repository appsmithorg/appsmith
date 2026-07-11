import type {
  AppSpec,
  EditSpec,
  PageSpec,
  WidgetSpec,
  WidgetType,
} from "./schema.js";
import { WIDGET_TEMPLATES } from "./templates.js";
import {
  createInnerCanvas,
  createRootCanvas,
  type IdGenerator,
  GRID_COLUMNS,
  NameAllocator,
  nextFreeRow,
  randomIdGenerator,
  resolvePlacement,
  ROOT_WIDGET_ID,
  ROW_HEIGHT,
  stampWidget,
  type WidgetNode,
} from "./layout.js";

export const CLIENT_SCHEMA_VERSION = 2;
export const SERVER_SCHEMA_VERSION = 12;
const ROW_GAP = 1;

// Aggregate guards: the per-array Zod caps bound each level only, so cap total nodes and nesting depth here to stop
// container-in-container amplification (each container expands to a widget plus an inner canvas).
export const MAX_CONTAINER_DEPTH = 5;
export const MAX_TOTAL_WIDGETS = 300;

// Deep-clone via JSON. The DSL is pure JSON, and this guarantees plain-Object-prototype nodes so the downstream
// plain-JSON guard (serializeArtifact) accepts the result in every runtime/test realm.
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DEFAULT_BASE_NAME: Record<WidgetType, string> = {
  text: "Text",
  input: "Input",
  select: "Select",
  button: "Button",
  image: "Image",
  table: "Table",
  container: "Container",
};

interface CompileContext {
  idGen: IdGenerator;
  names: NameAllocator;
  remaining: { widgets: number };
}

function compileWidgetAt(
  spec: WidgetSpec,
  ctx: CompileContext,
  parentId: string,
  topRow: number,
  availableColumns: number,
  depth: number,
): WidgetNode {
  if (depth > MAX_CONTAINER_DEPTH) {
    throw new Error(
      `container nesting exceeds the maximum depth of ${MAX_CONTAINER_DEPTH}`,
    );
  }

  ctx.remaining.widgets -= 1;

  if (ctx.remaining.widgets < 0) {
    throw new Error(`spec exceeds the maximum of ${MAX_TOTAL_WIDGETS} widgets`);
  }

  const template = WIDGET_TEMPLATES[spec.type];
  const built = template.build(spec);
  const columns = Math.min(built.footprint.columns, availableColumns);
  const widgetId = ctx.idGen();
  const widgetName = ctx.names.allocate(
    spec.name ?? DEFAULT_BASE_NAME[spec.type],
  );

  if (spec.type === "container") {
    const innerId = ctx.idGen();
    const innerName = ctx.names.allocate("Canvas");
    const inner = stackWidgets(
      built.children ?? [],
      ctx,
      innerId,
      columns,
      0,
      depth + 1,
    );
    const rows = Math.max(built.footprint.rows, inner.endRow);
    const innerCanvas = createInnerCanvas(
      innerId,
      innerName,
      widgetId,
      columns,
      rows,
      inner.nodes,
    );

    return stampWidget({
      widgetId,
      widgetName,
      appsmithType: template.appsmithType,
      version: template.version,
      parentId,
      topRow,
      leftColumn: 0,
      columns,
      rows,
      props: built.props,
      children: [innerCanvas],
    });
  }

  return stampWidget({
    widgetId,
    widgetName,
    appsmithType: template.appsmithType,
    version: template.version,
    parentId,
    topRow,
    leftColumn: 0,
    columns,
    rows: built.footprint.rows,
    props: built.props,
  });
}

function stackWidgets(
  specs: WidgetSpec[],
  ctx: CompileContext,
  parentId: string,
  availableColumns: number,
  startRow: number,
  depth: number,
): { nodes: WidgetNode[]; endRow: number } {
  const nodes: WidgetNode[] = [];
  let cursor = startRow;

  for (const spec of specs) {
    const node = compileWidgetAt(
      spec,
      ctx,
      parentId,
      cursor,
      availableColumns,
      depth,
    );

    nodes.push(node);
    cursor = node.bottomRow + ROW_GAP;
  }

  return { nodes, endRow: cursor };
}

function compilePageDsl(pageSpec: PageSpec, ctx: CompileContext): WidgetNode {
  const root = createRootCanvas();
  const { endRow, nodes } = stackWidgets(
    pageSpec.widgets,
    ctx,
    ROOT_WIDGET_ID,
    GRID_COLUMNS,
    0,
    0,
  );

  root.children = nodes;
  root.bottomRow = Math.max(endRow * ROW_HEIGHT, 380);
  root.minHeight = root.bottomRow;

  return root;
}

function compilePage(
  pageSpec: PageSpec,
  idGen: IdGenerator,
  remaining: { widgets: number },
) {
  const ctx: CompileContext = { idGen, names: new NameAllocator(), remaining };
  const dsl = compilePageDsl(pageSpec, ctx);
  const layout = { dsl, layoutOnLoadActions: [] as unknown[] };

  return {
    unpublishedPage: {
      name: pageSpec.name,
      slug: pageSpec.name.toLowerCase().replace(/\s+/g, "-"),
      layouts: [layout],
    },
    publishedPage: {
      name: pageSpec.name,
      slug: pageSpec.name.toLowerCase().replace(/\s+/g, "-"),
      layouts: [{ dsl: cloneJson(dsl), layoutOnLoadActions: [] }],
    },
  };
}

// Compile a full application spec into an Appsmith import artifact accepted by
// POST /api/v1/applications/import/{workspaceId}.
export function compileApp(
  appSpec: AppSpec,
  idGen: IdGenerator = randomIdGenerator(),
): Record<string, unknown> {
  // One shared widget budget across all pages so total node count can't be multiplied by page count.
  const remaining = { widgets: MAX_TOTAL_WIDGETS };
  const pageList = appSpec.pages.map((page) =>
    compilePage(page, idGen, remaining),
  );
  const pageNames = appSpec.pages.map((page) => page.name);

  return {
    clientSchemaVersion: CLIENT_SCHEMA_VERSION,
    serverSchemaVersion: SERVER_SCHEMA_VERSION,
    artifactJsonType: "APPLICATION",
    exportedApplication: {
      name: appSpec.name,
      slug: appSpec.name.toLowerCase().replace(/\s+/g, "-"),
      color: "#4F70FE",
      icon: "app",
      isPublic: false,
      unpublishedCustomJSLibs: [],
      publishedCustomJSLibs: [],
    },
    pageList,
    actionList: [],
    datasourceList: [],
    actionCollectionList: [],
    customJSLibList: [],
    editModeTheme: { name: "Default", isSystemTheme: true },
    publishedTheme: { name: "Default", isSystemTheme: true },
    pageOrder: pageNames,
    publishedPageOrder: pageNames,
    unpublishedDefaultPageName: pageNames[0],
    publishedDefaultPageName: pageNames[0],
  };
}

function collectNames(node: WidgetNode, into: string[]): void {
  if (typeof node.widgetName === "string") into.push(node.widgetName);

  for (const child of node.children ?? []) collectNames(child, into);
}

// Apply an edit (add widgets) to an existing page's root-canvas DSL. Returns the merged DSL plus notes describing how
// best-effort placement was resolved. Existing widgets are never modified — only appended to.
export function applyEdit(
  currentDsl: WidgetNode,
  edit: EditSpec,
  idGen: IdGenerator = randomIdGenerator(),
): { dsl: WidgetNode; notes: string[] } {
  const dsl = cloneJson(currentDsl);
  const existingNames: string[] = [];

  collectNames(dsl, existingNames);

  const ctx: CompileContext = {
    idGen,
    names: new NameAllocator(existingNames),
    remaining: { widgets: MAX_TOTAL_WIDGETS },
  };
  const notes: string[] = [];

  for (const spec of edit.add) {
    const placement = resolvePlacement(dsl, spec.placement);

    if (placement.note) notes.push(placement.note);

    const availableColumns =
      placement.canvas.widgetId === ROOT_WIDGET_ID
        ? GRID_COLUMNS
        : placement.canvas.rightColumn;
    const node = compileWidgetAt(
      spec,
      ctx,
      placement.canvas.widgetId,
      placement.topRow,
      availableColumns,
      0,
    );

    placement.canvas.children = placement.canvas.children ?? [];
    placement.canvas.children.push(node);

    // Grow the canvas so the new widget is within bounds.
    const bottom = nextFreeRow(placement.canvas.children);

    if (placement.canvas.widgetId === ROOT_WIDGET_ID) {
      placement.canvas.bottomRow = Math.max(
        typeof placement.canvas.bottomRow === "number"
          ? placement.canvas.bottomRow
          : 0,
        bottom * ROW_HEIGHT,
      );
    } else if (bottom > (placement.canvas.bottomRow as number)) {
      placement.canvas.bottomRow = bottom;
    }
  }

  return { dsl, notes };
}
