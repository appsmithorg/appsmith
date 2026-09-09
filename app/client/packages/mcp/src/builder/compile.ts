import type {
  AppSpec,
  EditSpec,
  PageSpec,
  Theme,
  WidgetSpec,
  WidgetType,
} from "./schema.js";
import {
  buildTableColumns,
  compileCurrentItemBinding,
  compilePrimaryKeys,
  compileTableDataBinding,
} from "./schema.js";
import { WIDGET_TEMPLATES } from "./templates.js";
import {
  createInnerCanvas,
  createRootCanvas,
  type IdGenerator,
  GRID_COLUMNS,
  NameAllocator,
  randomIdGenerator,
  resolvePlacement,
  ROOT_WIDGET_ID,
  ROW_HEIGHT,
  stampWidget,
  type WidgetNode,
} from "./layout.js";
import { cascadeFit } from "./occupancy.js";
import { assertNoNewNestedModals } from "./modalGraph.js";
import {
  applyRoleStyling,
  inferRoles,
  planLayout,
  type LayoutSlot,
} from "./design.js";

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
  form: "Form",
  modal: "Modal",
  datepicker: "DatePicker",
  chart: "Chart",
  tabs: "Tabs",
  list: "List",
  checkbox: "Checkbox",
  switch: "Switch",
  radio: "RadioGroup",
  multiselect: "MultiSelect",
  filepicker: "FilePicker",
  divider: "Divider",
  progress: "Progress",
  circularprogress: "CircularProgress",
  rate: "Rating",
  iconbutton: "IconButton",
  currencyinput: "CurrencyInput",
  phoneinput: "PhoneInput",
  numberslider: "NumberSlider",
  categoryslider: "CategorySlider",
  rangeslider: "RangeSlider",
  checkboxgroup: "CheckboxGroup",
  switchgroup: "SwitchGroup",
  menubutton: "MenuButton",
  buttongroup: "ButtonGroup",
  camera: "Camera",
  audiorecorder: "AudioRecorder",
  codescanner: "CodeScanner",
  map: "Map",
  mapchart: "MapChart",
  singleselecttree: "SingleSelectTree",
  multiselecttree: "MultiSelectTree",
  iframe: "Iframe",
  video: "Video",
  audio: "Audio",
  documentviewer: "DocumentViewer",
  richtext: "RichText",
  jsonform: "JSONForm",
  statbox: "Statbox",
};

interface CompileContext {
  idGen: IdGenerator;
  names: NameAllocator;
  remaining: { widgets: number };
  theme?: Theme;
}

// Apply app-level theme tokens to a widget's props. Tokens are pre-validated (hex color, numeric radius, safe font
// charset) so nothing injectable reaches a style prop. borderRadius applies broadly; primaryColor themes buttons;
// fontFamily themes text.
function applyTheme(
  props: Record<string, unknown>,
  appsmithType: string,
  theme?: Theme,
): void {
  if (!theme) return;

  if (theme.borderRadius !== undefined) props.borderRadius = theme.borderRadius;

  if (theme.primaryColor !== undefined && appsmithType === "BUTTON_WIDGET") {
    props.buttonColor = theme.primaryColor;
  }

  if (theme.fontFamily !== undefined && appsmithType === "TEXT_WIDGET") {
    props.fontFamily = theme.fontFamily;
  }
}

function compileWidgetAt(
  spec: WidgetSpec,
  ctx: CompileContext,
  parentId: string,
  topRow: number,
  availableColumns: number,
  depth: number,
  slot?: LayoutSlot,
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

  // Design pass: role typography first, then the app-spec theme so explicit theme tokens still win.
  applyRoleStyling(built.props, template.appsmithType, slot?.role ?? "body");
  applyTheme(built.props, template.appsmithType, ctx.theme);

  // Slot geometry contract: planLayout computed slot.columns/leftColumn from the SAME availableColumns passed
  // here, guaranteeing leftColumn + columns <= availableColumns for packed rows. The clamp below only guards the
  // no-slot (template footprint) path.
  const columns = Math.min(
    slot?.columns ?? built.footprint.columns,
    availableColumns,
  );
  const leftColumn = slot?.leftColumn ?? 0;
  const widgetId = ctx.idGen();
  const widgetName = ctx.names.allocate(
    spec.name ?? DEFAULT_BASE_NAME[spec.type],
  );

  // T1: table columns self-reference the table's own name in their computedValue binding, so they can only be built
  // once the name is allocated (the list-widget currentItem bindings have the same requirement). Replace the
  // template's empty primaryColumns/columnOrder defaults and register each computedValue as a binding.
  if (spec.type === "table" && spec.columns && spec.columns.length > 0) {
    const compiled = buildTableColumns(spec.columns, widgetName);

    built.props.primaryColumns = compiled.primaryColumns;
    built.props.columnOrder = compiled.columnOrder;

    const existing =
      (built.props.dynamicBindingPathList as { key: string }[] | undefined) ??
      [];

    built.props.dynamicBindingPathList = [
      ...existing,
      ...compiled.bindingPaths.map((key) => ({ key })),
    ];
  }

  // Tabs is multi-canvas: one inner CANVAS_WIDGET per tab, plus a tabsObj describing them. Handled directly because
  // the single-inner-canvas container path can't express it.
  if (spec.type === "tabs") {
    const tabSpecs =
      spec.tabs && spec.tabs.length > 0 ? spec.tabs : [{ label: "Tab 1" }];
    const tabsObj: Record<string, unknown> = {};
    const canvases: WidgetNode[] = [];
    let maxRows = built.footprint.rows;

    tabSpecs.forEach((tab, index) => {
      const tabId = ctx.idGen();
      const canvasId = ctx.idGen();
      const canvasName = ctx.names.allocate("Canvas");
      const inner = stackWidgets(
        tab.children ?? [],
        ctx,
        canvasId,
        columns,
        0,
        depth + 1,
      );
      const rows = Math.max(built.footprint.rows, inner.endRow);

      maxRows = Math.max(maxRows, rows);

      const canvas = createInnerCanvas(
        canvasId,
        canvasName,
        widgetId,
        columns,
        rows,
        inner.nodes,
      );

      canvas.tabId = tabId;
      canvas.tabName = tab.label;
      canvases.push(canvas);
      tabsObj[tabId] = {
        id: tabId,
        label: tab.label,
        widgetId: canvasId,
        index,
        isVisible: true,
      };
    });

    return stampWidget({
      widgetId,
      widgetName,
      appsmithType: template.appsmithType,
      version: template.version,
      parentId,
      topRow,
      leftColumn,
      columns,
      rows: maxRows,
      props: { ...built.props, tabsObj, defaultTab: tabSpecs[0].label },
      children: canvases,
    });
  }

  // List Widget V2 is a curated card grid. Its DSL needs a 4-level structure (list -> main canvas -> item container
  // -> inner canvas -> template widgets) with cross-referenced ids and compiler-authored `{{ currentItem[...] }}`
  // bindings — the single-inner-canvas container path can't express it, so it is built directly (like tabs).
  if (spec.type === "list") {
    return compileCardWidget(spec, ctx, {
      widgetId,
      widgetName,
      appsmithType: template.appsmithType,
      version: template.version,
      parentId,
      topRow,
      columns,
      baseProps: built.props,
    });
  }

  // Any widget whose template returns `children` is container-like (container, form, modal): it gets an inner
  // CANVAS_WIDGET that holds the nested widgets.
  if (built.children !== undefined) {
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
      leftColumn,
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
    leftColumn,
    columns,
    rows: slot?.rows ?? built.footprint.rows,
    props: built.props,
  });
}

interface CardWidgetParams {
  widgetId: string;
  widgetName: string;
  appsmithType: string;
  version: number;
  parentId: string;
  topRow: number;
  columns: number;
  baseProps: Record<string, unknown>;
}

// Row heights (in 10px grid rows) for the fixed card template slots.
const CARD_IMAGE_ROWS = 18;
const CARD_TEXT_ROWS = 4;

// Build a List-Widget-V2 "card grid": the 4-level DSL (list -> main CANVAS -> item CONTAINER(isListItemContainer) ->
// inner CANVAS -> template widgets) that the widget's runtime clones per data row. Every per-item binding
// (`{{ currentItem[...] }}`) and the `primaryKeys`/`listData` expressions are compiler-authored from schema-validated
// identifiers, so nothing agent-supplied can escape a binding. mainCanvasId/mainContainerId cross-reference the
// generated canvas/container ids — the MetaWidgetGenerator reads them to materialize each row.
//
// The structural props transcribed below (isListItemContainer, noContainerOffset, disabledWidgetFeatures, the main
// canvas's dropDisabled/detachFromLayout/noPad, etc.) mirror the widget's own blueprint — see the ListWidgetV2 default
// config at app/client/src/widgets/ListWidgetV2/widget/defaultProps.ts. If that blueprint changes upstream, diff this
// against it.
function compileCardWidget(
  spec: Extract<WidgetSpec, { type: "list" }>,
  ctx: CompileContext,
  params: CardWidgetParams,
): WidgetNode {
  const { columns, widgetId, widgetName } = params;
  const mainCanvasId = ctx.idGen();
  const containerId = ctx.idGen();
  const innerCanvasId = ctx.idGen();
  const mainCanvasName = ctx.names.allocate("Canvas");
  const containerName = ctx.names.allocate("Container");
  const innerCanvasName = ctx.names.allocate("Canvas");

  // Fixed template: optional image on top, required title, optional subtitle — each bound to a currentItem field.
  const templateChildren: WidgetNode[] = [];
  let cursor = 0;

  if (spec.image !== undefined) {
    const built = WIDGET_TEMPLATES.image.build({ type: "image" });
    const props = {
      ...built.props,
      image: compileCurrentItemBinding(spec.image),
      dynamicBindingPathList: [{ key: "image" }],
    };

    applyTheme(props, "IMAGE_WIDGET", ctx.theme);
    templateChildren.push(
      stampWidget({
        widgetId: ctx.idGen(),
        widgetName: ctx.names.allocate("Image"),
        appsmithType: "IMAGE_WIDGET",
        version: 1,
        parentId: innerCanvasId,
        topRow: cursor,
        leftColumn: 0,
        columns,
        rows: CARD_IMAGE_ROWS,
        props,
      }),
    );
    cursor += CARD_IMAGE_ROWS;
  }

  const titleBuilt = WIDGET_TEMPLATES.text.build({ type: "text" });
  const titleProps = {
    ...titleBuilt.props,
    text: compileCurrentItemBinding(spec.title),
    // Explicit weight: the card title must stay bold even if the text template's default weight changes (the
    // design pass styles page texts by role; card slots are outside that pass).
    fontStyle: "BOLD",
    // Fixed-height slots: truncate long values with an ellipsis rather than overflowing into the next slot.
    shouldTruncate: true,
    dynamicBindingPathList: [{ key: "text" }],
  };

  applyTheme(titleProps, "TEXT_WIDGET", ctx.theme);
  templateChildren.push(
    stampWidget({
      widgetId: ctx.idGen(),
      widgetName: ctx.names.allocate("Text"),
      appsmithType: "TEXT_WIDGET",
      version: 1,
      parentId: innerCanvasId,
      topRow: cursor,
      leftColumn: 0,
      columns,
      rows: CARD_TEXT_ROWS,
      props: titleProps,
    }),
  );
  cursor += CARD_TEXT_ROWS;

  if (spec.subtitle !== undefined) {
    const built = WIDGET_TEMPLATES.text.build({ type: "text" });
    const props = {
      ...built.props,
      text: compileCurrentItemBinding(spec.subtitle),
      // Subtitle reads as secondary text: normal weight, muted colour.
      fontStyle: "NORMAL",
      textColor: "#716E6E",
      shouldTruncate: true,
      dynamicBindingPathList: [{ key: "text" }],
    };

    applyTheme(props, "TEXT_WIDGET", ctx.theme);
    templateChildren.push(
      stampWidget({
        widgetId: ctx.idGen(),
        widgetName: ctx.names.allocate("Text"),
        appsmithType: "TEXT_WIDGET",
        version: 1,
        parentId: innerCanvasId,
        topRow: cursor,
        leftColumn: 0,
        columns,
        rows: CARD_TEXT_ROWS,
        props,
      }),
    );
    cursor += CARD_TEXT_ROWS;
  }

  const contentRows = cursor;

  // Count the card's template widgets against the shared widget budget (compileWidgetAt only charged the list node
  // itself). The structural canvases/container are scaffolding, not user widgets, so they are not charged.
  ctx.remaining.widgets -= templateChildren.length;

  if (ctx.remaining.widgets < 0) {
    throw new Error(`spec exceeds the maximum of ${MAX_TOTAL_WIDGETS} widgets`);
  }

  // Inner canvas holds the template widgets; fixed layout (not auto-layout).
  const innerCanvas = createInnerCanvas(
    innerCanvasId,
    innerCanvasName,
    containerId,
    columns,
    contentRows,
    templateChildren,
  );

  innerCanvas.useAutoLayout = false;
  innerCanvas.flexLayers = [];

  // The item-template container. `isListItemContainer` marks it as the per-row template the runtime clones.
  const itemContainer = stampWidget({
    widgetId: containerId,
    widgetName: containerName,
    appsmithType: "CONTAINER_WIDGET",
    version: 1,
    parentId: mainCanvasId,
    topRow: 0,
    leftColumn: 0,
    columns,
    rows: contentRows,
    props: {
      isCanvas: true,
      isListItemContainer: true,
      dragDisabled: true,
      isDeletable: false,
      disallowCopy: true,
      noContainerOffset: true,
      positioning: "fixed",
      shouldScrollContents: false,
      dynamicHeight: "FIXED",
      disabledWidgetFeatures: ["dynamicHeight"],
      containerStyle: "card",
      backgroundColor: "white",
      borderColor: "#E0DEDE",
      borderWidth: "1",
      flexVerticalAlignment: "start",
      dynamicBindingPathList: [],
      dynamicTriggerPathList: [],
    },
    children: [innerCanvas],
  });

  // The list's main canvas: a detached, drop-disabled canvas that holds only the item container.
  const mainCanvas: WidgetNode = {
    widgetName: mainCanvasName,
    type: "CANVAS_WIDGET",
    version: 1,
    widgetId: mainCanvasId,
    parentId: params.widgetId,
    renderMode: "CANVAS",
    isVisible: true,
    containerStyle: "none",
    canExtend: false,
    detachFromLayout: true,
    dropDisabled: true,
    openParentPropertyPane: true,
    noPad: true,
    minHeight: 400,
    topRow: 0,
    bottomRow: contentRows,
    leftColumn: 0,
    rightColumn: columns,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    dynamicBindingPathList: [],
    dynamicTriggerPathList: [],
    flexLayers: [],
    children: [itemContainer],
  };

  const pageSize = spec.pageSize ?? 3;
  // Give the list a visible height for a few cards; the widget paginates/scrolls internally beyond that.
  const visibleCards = Math.min(pageSize, 3);
  const listRows = Math.max(30, visibleCards * (contentRows + 1) + 6);

  const listProps = {
    ...params.baseProps,
    listData: compileTableDataBinding(spec.source),
    primaryKeys: compilePrimaryKeys(widgetName),
    pageSize,
    mainCanvasId,
    mainContainerId: containerId,
    templateBottomRow: contentRows,
    dynamicBindingPathList: [
      { key: "currentItemsView" },
      { key: "selectedItemView" },
      { key: "triggeredItemView" },
      { key: "primaryKeys" },
      { key: "listData" },
    ],
  };

  return stampWidget({
    widgetId,
    widgetName,
    appsmithType: params.appsmithType,
    version: params.version,
    parentId: params.parentId,
    topRow: params.topRow,
    leftColumn: 0,
    columns,
    rows: listRows,
    props: listProps,
    children: [mainCanvas],
  });
}

function stackWidgets(
  specs: WidgetSpec[],
  ctx: CompileContext,
  parentId: string,
  availableColumns: number,
  startRow: number,
  depth: number,
  pageRoot = false,
): { nodes: WidgetNode[]; endRow: number } {
  const roles = inferRoles(specs, { pageRoot });
  const rows = planLayout(specs, roles, availableColumns);
  const nodes: WidgetNode[] = [];
  let cursor = startRow;

  for (const row of rows) {
    cursor += row.gapBefore;

    let rowBottom = cursor;

    for (const slot of row.slots) {
      const node = compileWidgetAt(
        specs[slot.index],
        ctx,
        parentId,
        cursor,
        availableColumns,
        depth,
        slot,
      );

      nodes.push(node);
      rowBottom = Math.max(rowBottom, node.bottomRow);
    }

    cursor = rowBottom;
  }

  // Empty canvas: no trailing gap (preserves pre-design-pass container heights).
  return { nodes, endRow: rows.length === 0 ? startRow : cursor + ROW_GAP };
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
    true,
  );

  root.children = nodes;
  root.bottomRow = Math.max(endRow * ROW_HEIGHT, 380);
  root.minHeight = root.bottomRow;
  // M6 modal discipline (structural): a fresh build may not nest a modal inside another modal's subtree.
  assertNoNewNestedModals(undefined, root);

  return root;
}

function compilePage(
  pageSpec: PageSpec,
  idGen: IdGenerator,
  remaining: { widgets: number },
  theme?: Theme,
) {
  const ctx: CompileContext = {
    idGen,
    names: new NameAllocator(),
    remaining,
    theme,
  };
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

// The card palette and icon set the Applications UI draws from when creating an app (it picks randomly from
// each). Copied because this package has no dependency on the client bundle; palette from `appColors` in
// app/client/src/constants/DefaultTheme.tsx, icons from `AppIconCollection` in
// packages/design-system/ads-old/src/AppIcon/index.tsx.
const APP_CARD_COLORS = [
  "#FFEFDB",
  "#D9E7FF",
  "#FFDEDE",
  "#E3DEFF",
  "#C7F3E3",
  "#F1DEFF",
  "#F4FFDE",
  "#C7F3F0",
  "#C2DAF0",
  "#F5D1D1",
  "#ECECEC",
  "#CCCCCC",
  "#F3F1C7",
  "#E4D8CC",
  "#EAEDFB",
  "#D6D1F2",
  "#FBF4ED",
  "#FFEBFB",
];

const APP_CARD_ICONS = [
  "bag",
  "product",
  "book",
  "camera",
  "file",
  "chat",
  "calender",
  "flight",
  "frame",
  "globe",
  "shopper",
  "heart",
  "alien",
  "bar-graph",
  "basketball",
  "bicycle",
  "bird",
  "bitcoin",
  "burger",
  "bus",
  "call",
  "car",
  "card",
  "cat",
  "chinese-remnibi",
  "cloud",
  "coding",
  "couples",
  "cricket",
  "diamond",
  "dog",
  "dollar",
  "earth",
  "email",
  "euros",
  "family",
  "flag",
  "football",
  "hat",
  "headphones",
  "hospital",
  "joystick",
  "laptop",
  "line-chart",
  "location",
  "lotus",
  "love",
  "medal",
  "medical",
  "money",
  "moon",
  "mug",
  "music",
  "package",
  "pants",
  "pie-chart",
  "pizza",
  "plant",
  "rainy-weather",
  "restaurant",
  "rocket",
  "rose",
  "rupee",
  "saturn",
  "server",
  "server-line",
  "shake-hands",
  "shirt",
  "shop",
  "single-person",
  "smartphone",
  "snowy-weather",
  "stars",
  "steam-bowl",
  "sunflower",
  "system",
  "team",
  "tree",
  "uk-pounds",
  "website",
  "yen",
  "airplane",
  "arrow-down",
  "arrow-up",
  "arrow-left",
  "arrow-right",
  "help",
  "open-new-tab",
  "workflows",
];

// FNV-1a over the app name: varied like the UI's random pick, but deterministic so compileApp stays a pure
// function of its spec (same spec -> byte-identical artifact).
function hashAppName(name: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
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
    compilePage(page, idGen, remaining, appSpec.theme),
  );
  const pageNames = appSpec.pages.map((page) => page.name);
  // The application's page list. At the declared serverSchemaVersion the server runs no import migrations, so the
  // v4 migration that would derive these from pageOrder is skipped — we must emit them, or the imported app links
  // to zero pages. The migration keys each ApplicationPage id on the page NAME and marks the first as default.
  const applicationPages = pageNames.map((name) => ({
    id: name,
    isDefault: name === pageNames[0],
  }));

  return {
    clientSchemaVersion: CLIENT_SCHEMA_VERSION,
    serverSchemaVersion: SERVER_SCHEMA_VERSION,
    artifactJsonType: "APPLICATION",
    exportedApplication: {
      name: appSpec.name,
      slug: appSpec.name.toLowerCase().replace(/\s+/g, "-"),
      color:
        APP_CARD_COLORS[hashAppName(appSpec.name) % APP_CARD_COLORS.length],
      icon: APP_CARD_ICONS[hashAppName(appSpec.name) % APP_CARD_ICONS.length],
      isPublic: false,
      unpublishedCustomJSLibs: [],
      publishedCustomJSLibs: [],
      pages: applicationPages.map((page) => ({ ...page })),
      publishedPages: applicationPages.map((page) => ({ ...page })),
      // The compiler emits fixed-grid geometry (topRow/leftColumn/...). Pin the app to FIXED positioning so the
      // import renders it as designed instead of reflowing it through auto-layout (which stretches widgets full
      // width and stacks them with large gaps).
      unpublishedApplicationDetail: { appPositioning: { type: "FIXED" } },
      publishedApplicationDetail: { appPositioning: { type: "FIXED" } },
    },
    pageList,
    actionList: [],
    datasourceList: [],
    actionCollectionList: [],
    customJSLibList: [],
    editModeTheme: { name: "Default", isSystemTheme: true },
    publishedTheme: { name: "Default", isSystemTheme: true },
    // Distinct array copies: sharing one reference between both fields is valid JSON but trips the
    // artifact serializer's shared-reference guard.
    pageOrder: [...pageNames],
    publishedPageOrder: [...pageNames],
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
    // Single-spec design pass: the same role inference as build_application (so a KPI text appended via edit_page
    // styles identically to one built with the app), but no cross-widget packing and never a pageTitle — each
    // `add` entry places independently against its own placement target.
    const [role] = inferRoles([spec], { pageRoot: false });
    const slot = planLayout([spec], [role], availableColumns)[0]?.slots[0];
    const node = compileWidgetAt(
      spec,
      ctx,
      placement.canvas.widgetId,
      placement.topRow,
      availableColumns,
      0,
      slot,
    );

    placement.canvas.children = placement.canvas.children ?? [];
    placement.canvas.children.push(node);

    // M6 container-fit cascade: push down anything the new widget landed on (e.g. an `after` placement into the
    // middle of a page), grow the enclosing canvas, and grow the enclosing container/form/tabs chain (never
    // shrink) so nothing is clipped — the pre-M6 container growth, now applied recursively with every adjustment
    // reported as a note. The commitLayout delta gate verifies the final result introduces no overlaps.
    const cascade = cascadeFit(dsl, node.widgetName);

    notes.push(...cascade.notes);
  }

  // M6 modal discipline (structural, delta-aware): the edit may not INTRODUCE a nested modal — covers both a
  // modal spec added inside a modal-resident container and a container subtree that smuggles one in. Pre-existing
  // human-authored nesting stays editable.
  assertNoNewNestedModals(currentDsl, dsl);

  return { dsl, notes };
}
