/**
 * GenSmith Layout Recipes — deterministic DSL compiler.
 *
 * Rationale
 * ---------
 * Asking a weak LLM to emit pixel-perfect Appsmith DSL (64-col grid, 10px
 * rows, modal canvas with its own 24-col snap grid, TableV2 primaryColumns
 * shape, etc.) is unreliable. A small cheap model will place a button at
 * `leftColumn: 176` and the canvas extends off-screen; it will include
 * `rowIndex` in `columnOrder`; it will forget `INPUT_WIDGET_V2`; it will
 * place a submit button below the modal's height.
 *
 * Instead, the LLM emits a tiny *Recipe* (≈20 lines of JSON describing a
 * page in semantic terms), and this module compiles that into a layout-
 * correct, product-grade DSL every time. The compiler owns all the grid
 * math, the styling tokens, the widget version numbers, and the property
 * bag shapes that the AI used to get wrong.
 *
 * Grid facts this module relies on:
 *   - MainContainer snapColumns = 64, rowHeight = 10px.
 *   - Recommended page margin = 1 col left + 1 col right (62 usable cols).
 *   - Standard button height = 4 rows (40px).
 *   - Input (V2) default height = 7 rows; we use 7.
 *   - Table widget (V2) is 64 cols wide minus 2 cols margin; 45 rows tall.
 *   - Modal inner canvas ALSO uses snapColumns = 64 (same grid as Main).
 *     The modal widget's own `columns`/`rows` properties are metadata only;
 *     all child widget positions inside a modal are laid out on a 64-col
 *     grid whose pixel width = modal.width. This was the single most
 *     frequent source of "buttons clipped / form invisible" bugs in
 *     earlier revisions.
 */

import type { NestedDSL } from "@shared/dsl";
import { LATEST_DSL_VERSION } from "@shared/dsl";
import { generateReactKey } from "@shared/dsl/src/migrate/utils";
import type { WidgetProps } from "widgets/BaseWidget";

// ---------------------------------------------------------------------------
// Design tokens (single source of truth — change here to restyle all output)
// ---------------------------------------------------------------------------

const TOKENS = {
  // Colors
  primary: "#553DE9",
  // Radii
  borderRadius: "0.375rem",
  // Typography
  titleFontSize: "1.25rem",
  labelFontSize: "0.875rem",
  labelColor: "#4B5563",
  // Grid
  gridCols: 64,
  pageMarginCol: 1, // 1 col of padding each side
  standardButtonRows: 4,
  standardInputRows: 7,
  labelRows: 3,
  titleRows: 5,
  toolbarGapCol: 1,
  // Defaults
  tableRows: 45, // ~450px table
  modalWidthPx: 560, // wider so 5-char Chinese buttons don't clip
  // NOTE: modal inner canvas uses the SAME 64-col grid as MainContainer.
  // Don't change this — Appsmith runtime ignores any other value here
  // and will render widgets on a 64-col grid regardless.
  modalInnerCols: 64,
  modalInnerPadCols: 4, // ~60px padding on each side of modal
} as const;

// ---------------------------------------------------------------------------
// Recipe types — this is the schema the LLM (or a human) emits.
// ---------------------------------------------------------------------------

export type RecipeFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "date";

export interface RecipeField {
  name: string;
  label: string;
  type?: RecipeFieldType;
  placeholder?: string;
  required?: boolean;
  /** JS binding for default value, e.g. "{{Table1.selectedRow.name}}" */
  defaultValue?: string;
}

export type RecipeColumnType = "text" | "number" | "email" | "date" | "image";

export interface RecipeColumn {
  field: string;
  label: string;
  type?: RecipeColumnType;
  width?: number; // pixel width, optional
}

export interface CrudTableRecipe {
  type: "crud-table";
  title: string;
  /** Name of query whose .data is the table source (e.g. "GetCandidates"). */
  listQuery: string;
  /** Optional query to refresh after create/update — defaults to listQuery. */
  refreshQueryAfterMutation?: string;
  /** Columns to display. If omitted, inferred from the first row of data. */
  columns: RecipeColumn[];
  /** If provided, a "+ 新增" button opens a modal and this query is called on submit. */
  createQuery?: string;
  createFields?: RecipeField[];
  /** Optional search bar above table. */
  searchable?: boolean;
}

export interface FormRecipe {
  type: "form";
  title: string;
  description?: string;
  submitQuery: string;
  submitLabel?: string;
  fields: RecipeField[];
  /** Optional JS Object method to call on success, e.g. "navigateTo('/home')". */
  onSuccess?: string;
}

export interface BlankRecipe {
  type: "blank";
  title?: string;
}

export type Recipe = CrudTableRecipe | FormRecipe | BlankRecipe;

// ---------------------------------------------------------------------------
// Widget-ID generator (stable, short, unique per compile)
// ---------------------------------------------------------------------------

function makeIdFactory() {
  const counter: Record<string, number> = {};

  return (base: string): string => {
    counter[base] = (counter[base] ?? 0) + 1;

    return counter[base] === 1 ? base : `${base}${counter[base]}`;
  };
}

type IdGen = ReturnType<typeof makeIdFactory>;

/**
 * Generate a widgetId using Appsmith's own helper.
 * Keeps widgetName readable (used in bindings) while widgetId is opaque,
 * which matches Appsmith's runtime assumptions.
 */
function randomWidgetId(): string {
  return generateReactKey();
}

// ---------------------------------------------------------------------------
// Widget builders (kept tiny; every widget is fully described here)
// ---------------------------------------------------------------------------

type AnyWidget = NestedDSL<WidgetProps> & Record<string, unknown>;

interface Rect {
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
}

function baseFields(
  type: string,
  widgetName: string,
  rect: Rect,
  parentId: string,
): Record<string, unknown> {
  return {
    type,
    widgetName,
    widgetId: randomWidgetId(),
    parentId,
    parentColumnSpace: 1,
    parentRowSpace: 10,
    isLoading: false,
    version: 1,
    animateLoading: true,
    ...rect,
  };
}

function buildText(
  id: IdGen,
  parentId: string,
  rect: Rect,
  opts: {
    text: string;
    fontSize?: string;
    fontStyle?: "BOLD" | "NORMAL";
    textColor?: string;
    isDynamic?: boolean;
  },
): AnyWidget {
  const name = id("Text");
  const widget: AnyWidget = {
    ...baseFields("TEXT_WIDGET", name, rect, parentId),
    text: opts.text,
    fontSize: opts.fontSize ?? TOKENS.labelFontSize,
    fontStyle: opts.fontStyle ?? "NORMAL",
    textAlign: "LEFT",
    textColor: opts.textColor ?? "#231F20",
    overflow: "NONE",
    shouldTruncate: false,
  } as unknown as AnyWidget;

  if (opts.isDynamic) {
    widget.dynamicBindingPathList = [{ key: "text" }];
  }

  return widget;
}

function buildButton(
  id: IdGen,
  parentId: string,
  rect: Rect,
  opts: {
    baseName?: string;
    text: string;
    variant?: "PRIMARY" | "SECONDARY" | "TERTIARY";
    onClick?: string; // already a {{...}} expression or raw JS
    color?: string;
  },
): AnyWidget {
  const name = id(opts.baseName ?? "Button");
  const widget: AnyWidget = {
    ...baseFields("BUTTON_WIDGET", name, rect, parentId),
    text: opts.text,
    buttonVariant: opts.variant ?? "PRIMARY",
    buttonColor: opts.color ?? TOKENS.primary,
    placement: "CENTER",
    isVisible: true,
    isDisabled: false,
    borderRadius: TOKENS.borderRadius,
    boxShadow: "none",
    recaptchaType: "V3",
  } as unknown as AnyWidget;

  if (opts.onClick) {
    widget.onClick = opts.onClick;
    widget.dynamicTriggerPathList = [{ key: "onClick" }];
  }

  return widget;
}

function buildInput(
  id: IdGen,
  parentId: string,
  rect: Rect,
  opts: {
    baseName?: string;
    label: string;
    field: RecipeField;
  },
): AnyWidget {
  const name = id(opts.baseName ?? "Input");
  const inputTypeMap: Record<RecipeFieldType, string> = {
    text: "TEXT",
    email: "EMAIL",
    password: "PASSWORD",
    number: "NUMBER",
    textarea: "MULTI_LINE_TEXT",
    date: "TEXT",
  };
  const inputType = inputTypeMap[opts.field.type ?? "text"];

  const widget: AnyWidget = {
    ...baseFields("INPUT_WIDGET_V2", name, rect, parentId),
    version: 2,
    inputType,
    label: opts.label,
    labelPosition: "Top",
    labelAlignment: "left",
    labelTextSize: TOKENS.labelFontSize,
    placeholderText: opts.field.placeholder ?? "",
    isRequired: !!opts.field.required,
    isDisabled: false,
    isVisible: true,
    resetOnSubmit: true,
    borderRadius: TOKENS.borderRadius,
    boxShadow: "none",
    accentColor: TOKENS.primary,
    showStepArrows: false,
  } as unknown as AnyWidget;

  if (opts.field.defaultValue) {
    widget.defaultText = opts.field.defaultValue;
    widget.dynamicBindingPathList = [{ key: "defaultText" }];
  }

  return widget;
}

/**
 * Default column widths (px) chosen to be roomy enough for typical content
 * so the table doesn't need horizontal scroll for 2-3 columns.
 */
const DEFAULT_COL_WIDTHS: Record<RecipeColumnType, number> = {
  text: 200,
  email: 260,
  number: 140,
  date: 160,
  image: 120,
};

function buildTable(
  id: IdGen,
  parentId: string,
  rect: Rect,
  opts: {
    listQuery: string;
    columns: RecipeColumn[];
    searchable: boolean;
  },
): AnyWidget {
  const name = id("Table");

  const primaryColumns: Record<string, unknown> = {};
  const columnOrder: string[] = [];
  const typeMap: Record<RecipeColumnType, string> = {
    text: "text",
    number: "number",
    email: "text",
    date: "date",
    image: "image",
  };

  opts.columns.forEach((col, index) => {
    columnOrder.push(col.field);
    primaryColumns[col.field] = {
      index,
      width: col.width ?? DEFAULT_COL_WIDTHS[col.type ?? "text"],
      originalId: col.field,
      id: col.field,
      alias: col.field,
      label: col.label,
      columnType: typeMap[col.type ?? "text"],
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      textColor: "#231F20",
      textSize: "0.875rem",
      fontStyle: "REGULAR",
      isVisible: true,
      isDisabled: false,
      isCellVisible: true,
      isDerived: false,
      enableFilter: true,
      enableSort: true,
      isCellEditable: false,
      isEditable: false,
      allowCellWrapping: false,
      computedValue: `{{${opts.listQuery}.data.map((currentRow) => currentRow.${col.field})}}`,
    };
  });

  // CRITICAL: project tableData so the table only sees the fields we want.
  // This prevents TableV2 from auto-adding spurious columns (rowIndex,
  // __id, etc.) that queries like Google Sheets include by default.
  const projection = opts.columns
    .map((c) => `${c.field}: r.${c.field}`)
    .join(", ");
  const projectedTableData = `{{${opts.listQuery}.data.map((r) => ({${projection}}))}}`;

  return {
    ...baseFields("TABLE_WIDGET_V2", name, rect, parentId),
    version: 2,
    tableData: projectedTableData,
    label: "Data",
    primaryColumns,
    columnOrder,
    columnWidthMap: {},
    defaultSelectedRowIndex: 0,
    defaultSelectedRowIndices: [0],
    isVisible: true,
    isVisibleSearch: opts.searchable,
    isVisibleFilters: false,
    isVisibleDownload: false,
    isVisiblePagination: true,
    isSortable: true,
    delimiter: ",",
    totalRecordsCount: 0,
    defaultPageSize: 0,
    searchKey: "",
    textSize: "0.875rem",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    borderColor: "#E0DEDE",
    borderWidth: "1",
    borderRadius: TOKENS.borderRadius,
    boxShadow: "none",
    accentColor: TOKENS.primary,
    primaryColumnId: opts.columns[0]?.field ?? "",
    dynamicBindingPathList: [
      { key: "tableData" },
      ...opts.columns.map((c) => ({
        key: `primaryColumns.${c.field}.computedValue`,
      })),
    ],
  } as unknown as AnyWidget;
}

/**
 * Build a MODAL_WIDGET along with its inner CANVAS_WIDGET child containing
 * form fields. Returns [modalWidget] ready to attach under MainContainer.
 *
 * The inner canvas uses `snapColumns: 24` and pixel width = modal.width.
 */
/**
 * Pick a sensible "item name" for modal titles.
 * e.g. recipe.title "候选人管理" → strip trailing "管理" → "候选人"
 *      recipe.title "User List"  → strip trailing "List"  → "User"
 *      fallback: the full title itself.
 */
function inferItemName(title: string): string {
  const trimmed = title.trim();
  const cnStripped = trimmed.replace(/管理$|列表$/u, "").trim();

  if (cnStripped && cnStripped !== trimmed) return cnStripped;

  const enStripped = trimmed
    .replace(/\s*(List|Management|Manager)$/i, "")
    .trim();

  if (enStripped && enStripped !== trimmed) return enStripped;

  return trimmed;
}

function buildAddModal(
  id: IdGen,
  parentCanvasId: string,
  recipe: CrudTableRecipe,
): AnyWidget {
  const fields = recipe.createFields ?? [];
  const modalName = id("AddModal");
  // Random IDs for parent/child linkage; keep widgetName readable for
  // bindings (e.g. {{AddModal.name}} used by closeModal/showModal).
  const modalWidgetId = randomWidgetId();
  const innerCanvasWidgetId = randomWidgetId();

  // Modal inner canvas lays out children on a 64-column grid (SAME as
  // MainContainer). The modal widget's `columns` metadata is ignored by
  // the runtime — it always renders on 64 cols. Don't change this.
  const INNER_COLS = TOKENS.modalInnerCols; // 64
  const PAD = TOKENS.modalInnerPadCols; // 4 cols on each side (~60px)
  const FIELD_LEFT = PAD;
  const FIELD_RIGHT = INNER_COLS - PAD; // 60
  const FIELD_ROWS = TOKENS.standardInputRows; // 7
  const FIELD_GAP = 1;

  // Vertical flow
  let cursor = 1;
  const headerTopRow = cursor;
  const headerBottomRow = cursor + 4;

  cursor = headerBottomRow + 2;

  const fieldWidgets: AnyWidget[] = [];

  fields.forEach((field) => {
    const top = cursor;
    const bottom = top + FIELD_ROWS;

    fieldWidgets.push(
      buildInput(
        id,
        innerCanvasWidgetId,
        {
          leftColumn: FIELD_LEFT,
          rightColumn: FIELD_RIGHT,
          topRow: top,
          bottomRow: bottom,
        },
        {
          baseName: `${capitalize(field.name)}Input`,
          label: field.label + (field.required ? " *" : ""),
          field,
        },
      ),
    );
    cursor = bottom + FIELD_GAP;
  });

  // Footer buttons row. On the 64-col grid, each button is 14 cols wide
  // (≈25% of modal width = ~140px on a 560px modal), which comfortably
  // fits 4-char Chinese labels like "确认提交" without clipping.
  cursor += 1;
  const footerTop = cursor;
  const footerBottom = cursor + TOKENS.standardButtonRows;

  const BTN_WIDTH = 14;
  const BTN_GAP = 2;
  const submitBtnRight = FIELD_RIGHT;
  const submitBtnLeft = submitBtnRight - BTN_WIDTH;
  const cancelBtnRight = submitBtnLeft - BTN_GAP;
  const cancelBtnLeft = cancelBtnRight - BTN_WIDTH;

  const cancelBtn = buildButton(
    id,
    innerCanvasWidgetId,
    {
      leftColumn: cancelBtnLeft,
      rightColumn: cancelBtnRight,
      topRow: footerTop,
      bottomRow: footerBottom,
    },
    {
      baseName: "CancelBtn",
      text: "取消",
      variant: "SECONDARY",
      onClick: `{{closeModal('${modalName}')}}`,
    },
  );

  const submitQuery = recipe.createQuery!;
  const refreshQuery = recipe.refreshQueryAfterMutation ?? recipe.listQuery;

  // After-submit: refresh list, close modal, and toast.
  const itemName = inferItemName(recipe.title);
  const submitChain = `{{${submitQuery}.run(() => { ${refreshQuery}.run(); closeModal('${modalName}'); showAlert('添加成功', 'success'); }, () => { showAlert('添加失败，请重试', 'error'); })}}`;

  const submitBtn = buildButton(
    id,
    innerCanvasWidgetId,
    {
      leftColumn: submitBtnLeft,
      rightColumn: submitBtnRight,
      topRow: footerTop,
      bottomRow: footerBottom,
    },
    {
      baseName: "SubmitBtn",
      text: "确认提交",
      variant: "PRIMARY",
      onClick: submitChain,
    },
  );

  (submitBtn as Record<string, unknown>).isDisabled =
    `{{${submitQuery}.isLoading}}`;
  (submitBtn as Record<string, unknown>).dynamicBindingPathList = [
    { key: "isDisabled" },
  ];

  const totalInnerRows = footerBottom + 1;
  const modalHeightPx = totalInnerRows * 10 + 60;

  const header = buildText(
    id,
    innerCanvasWidgetId,
    {
      leftColumn: FIELD_LEFT,
      rightColumn: FIELD_RIGHT,
      topRow: headerTopRow,
      bottomRow: headerBottomRow,
    },
    {
      text: `新增${itemName}`,
      fontSize: "1.125rem",
      fontStyle: "BOLD",
      textColor: "#111827",
    },
  );

  const children = [header, ...fieldWidgets, cancelBtn, submitBtn];

  // Inner canvas — snapColumns MUST be 64 to match Appsmith's runtime
  // layout expectations; rightColumn is in pixels and equals the modal
  // width. canExtend:true matches Appsmith's default modal blueprint.
  const innerCanvas: AnyWidget = {
    type: "CANVAS_WIDGET",
    widgetName: "Canvas1",
    widgetId: innerCanvasWidgetId,
    parentId: modalWidgetId,
    detachFromLayout: true,
    canExtend: true,
    isVisible: true,
    leftColumn: 0,
    rightColumn: TOKENS.modalWidthPx,
    topRow: 0,
    bottomRow: totalInnerRows,
    minHeight: totalInnerRows * 10,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    snapColumns: INNER_COLS,
    snapRows: totalInnerRows,
    children,
    version: 1,
  } as unknown as AnyWidget;

  // Outer modal widget — detached from main layout.
  // Do NOT set `size` (MODAL_SMALL/MEDIUM/LARGE) — it overrides `width`.
  const modal: AnyWidget = {
    type: "MODAL_WIDGET",
    widgetName: modalName,
    widgetId: modalWidgetId,
    parentId: parentCanvasId,
    detachFromLayout: true,
    canEscapeKeyClose: true,
    canOutsideClickClose: true,
    shouldScrollContents: true,
    // IMPORTANT: For MODAL_WIDGET, `isVisible` IS the open/closed state.
    // `isVisible: true` = modal pops up on page load (bad UX — user sees modal
    // immediately every time they visit the page). Keep it `false` so the
    // modal is only opened via `showModal('<ModalName>')` from the Add button.
    // See ModalWidget/widget/index.tsx `getModalVisibility()`.
    isVisible: false,
    animateLoading: true,
    width: TOKENS.modalWidthPx,
    height: modalHeightPx,
    // These are metadata only; runtime still uses 64-col grid internally.
    columns: 24,
    rows: totalInnerRows,
    minDynamicHeight: totalInnerRows,
    leftColumn: 0,
    rightColumn: 24,
    topRow: 0,
    bottomRow: totalInnerRows,
    parentColumnSpace: 1,
    parentRowSpace: 10,
    borderRadius: TOKENS.borderRadius,
    boxShadow: "0px 10px 25px rgba(17,24,39,0.12)",
    version: 2,
    children: [innerCanvas],
  } as unknown as AnyWidget;

  return modal;
}

function capitalize(s: string): string {
  if (!s) return s;

  return s[0].toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Compilers — one per Recipe type
// ---------------------------------------------------------------------------

function compileBlank(recipe: BlankRecipe): NestedDSL<WidgetProps> {
  const id = makeIdFactory();
  const children: AnyWidget[] = [];

  if (recipe.title) {
    children.push(
      buildText(id, "0", col(2, 50, 2, 2 + TOKENS.titleRows), {
        text: recipe.title,
        fontSize: TOKENS.titleFontSize,
        fontStyle: "BOLD",
        textColor: "#111827",
      }),
    );
  }

  return mainContainer(children);
}

function compileForm(recipe: FormRecipe): NestedDSL<WidgetProps> {
  const id = makeIdFactory();
  const children: AnyWidget[] = [];

  const LEFT = 12; // center form in middle 40 cols
  const RIGHT = 52;
  let cursor = 3;

  children.push(
    buildText(
      id,
      "0",
      {
        leftColumn: LEFT,
        rightColumn: RIGHT,
        topRow: cursor,
        bottomRow: cursor + TOKENS.titleRows,
      },
      {
        text: recipe.title,
        fontSize: TOKENS.titleFontSize,
        fontStyle: "BOLD",
        textColor: "#111827",
      },
    ),
  );
  cursor += TOKENS.titleRows + 1;

  if (recipe.description) {
    children.push(
      buildText(
        id,
        "0",
        {
          leftColumn: LEFT,
          rightColumn: RIGHT,
          topRow: cursor,
          bottomRow: cursor + 3,
        },
        {
          text: recipe.description,
          fontSize: TOKENS.labelFontSize,
          fontStyle: "NORMAL",
          textColor: TOKENS.labelColor,
        },
      ),
    );
    cursor += 4;
  }

  recipe.fields.forEach((field) => {
    const top = cursor;
    const bottom = top + TOKENS.standardInputRows;

    children.push(
      buildInput(
        id,
        "0",
        {
          leftColumn: LEFT,
          rightColumn: RIGHT,
          topRow: top,
          bottomRow: bottom,
        },
        {
          baseName: `${capitalize(field.name)}Input`,
          label: field.label + (field.required ? " *" : ""),
          field,
        },
      ),
    );
    cursor = bottom + 1;
  });

  cursor += 1;
  const btnTop = cursor;
  const btnBottom = cursor + TOKENS.standardButtonRows;

  const onSuccessCode = recipe.onSuccess
    ? `${recipe.onSuccess}; showAlert('提交成功', 'success');`
    : `showAlert('提交成功', 'success');`;
  const submitBtn = buildButton(
    id,
    "0",
    {
      leftColumn: RIGHT - 10,
      rightColumn: RIGHT,
      topRow: btnTop,
      bottomRow: btnBottom,
    },
    {
      baseName: "SubmitBtn",
      text: recipe.submitLabel ?? "提交",
      variant: "PRIMARY",
      onClick: `{{${recipe.submitQuery}.run(() => { ${onSuccessCode} }, () => { showAlert('提交失败', 'error'); })}}`,
    },
  );

  (submitBtn as Record<string, unknown>).isDisabled =
    `{{${recipe.submitQuery}.isLoading}}`;
  (submitBtn as Record<string, unknown>).dynamicBindingPathList = [
    { key: "isDisabled" },
  ];
  children.push(submitBtn);

  return mainContainer(children);
}

function compileCrudTable(recipe: CrudTableRecipe): NestedDSL<WidgetProps> {
  const id = makeIdFactory();
  const children: AnyWidget[] = [];

  const LEFT_PAD = TOKENS.pageMarginCol;
  const RIGHT_EDGE = TOKENS.gridCols - TOKENS.pageMarginCol;

  // ── Header title (left) ────────────────────────────────────────────────
  const titleRightCol = RIGHT_EDGE - 24; // leave room for buttons

  children.push(
    buildText(
      id,
      "0",
      {
        leftColumn: LEFT_PAD,
        rightColumn: titleRightCol,
        topRow: 2,
        bottomRow: 2 + TOKENS.titleRows,
      },
      {
        text: recipe.title,
        fontSize: TOKENS.titleFontSize,
        fontStyle: "BOLD",
        textColor: "#111827",
      },
    ),
  );

  // ── Toolbar buttons (right-aligned) ────────────────────────────────────
  const buttonTop = 2;
  const buttonBottom = 2 + TOKENS.standardButtonRows;
  const addBtnRight = RIGHT_EDGE;
  const addBtnLeft = addBtnRight - 10;
  const refreshBtnRight = addBtnLeft - TOKENS.toolbarGapCol;
  const refreshBtnLeft = refreshBtnRight - 8;

  const refreshBtn = buildButton(
    id,
    "0",
    {
      leftColumn: refreshBtnLeft,
      rightColumn: refreshBtnRight,
      topRow: buttonTop,
      bottomRow: buttonBottom,
    },
    {
      baseName: "RefreshBtn",
      text: "刷新",
      variant: "SECONDARY",
      onClick: `{{${recipe.listQuery}.run()}}`,
    },
  );

  // Reflect list-query loading on the refresh button.
  (refreshBtn as Record<string, unknown>).isDisabled =
    `{{${recipe.listQuery}.isLoading}}`;
  (refreshBtn as Record<string, unknown>).dynamicBindingPathList = [
    { key: "isDisabled" },
  ];

  children.push(refreshBtn);

  const hasCreate =
    !!recipe.createQuery && (recipe.createFields?.length ?? 0) > 0;
  let addModal: AnyWidget | null = null;

  if (hasCreate) {
    addModal = buildAddModal(id, "0", recipe);
    const addBtn = buildButton(
      id,
      "0",
      {
        leftColumn: addBtnLeft,
        rightColumn: addBtnRight,
        topRow: buttonTop,
        bottomRow: buttonBottom,
      },
      {
        baseName: "AddBtn",
        text: "+ 新增",
        variant: "PRIMARY",
        onClick: `{{showModal('${addModal.widgetName}')}}`,
      },
    );

    children.push(addBtn);
  }

  // ── Table ──────────────────────────────────────────────────────────────
  const tableTop = buttonBottom + 2;
  const tableBottom = tableTop + TOKENS.tableRows;

  children.push(
    buildTable(
      id,
      "0",
      {
        leftColumn: LEFT_PAD,
        rightColumn: RIGHT_EDGE,
        topRow: tableTop,
        bottomRow: tableBottom,
      },
      {
        listQuery: recipe.listQuery,
        columns: recipe.columns,
        searchable: recipe.searchable ?? true,
      },
    ),
  );

  if (addModal) children.push(addModal);

  return mainContainer(children);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function col(
  leftColumn: number,
  rightColumn: number,
  topRow: number,
  bottomRow: number,
): Rect {
  return { leftColumn, rightColumn, topRow, bottomRow };
}

function mainContainer(children: AnyWidget[]): NestedDSL<WidgetProps> {
  // Compute bottom row from deepest child + some padding.
  // IMPORTANT: the modal is detached from layout, so it should NOT
  // influence main-canvas height (otherwise a 28-row modal makes the
  // page grow by 28 rows of empty space).
  const maxBottom = children.reduce((acc, c) => {
    if ((c as { detachFromLayout?: boolean }).detachFromLayout) return acc;

    return Math.max(acc, (c.bottomRow as number) ?? 0);
  }, 0);
  const bottomRow = Math.max(maxBottom + 5, 70);

  // CRITICAL: stamp the DSL version so Appsmith's migration runner skips
  // all historical migrations. If we omit `version`, the runner treats
  // the DSL as pre-v1 → runs migration v19 → multiplies every column by
  // 4 → canvas extends to ~5000px wide and every widget overflows.
  // (Symptom: editor preview looks fine, but after save+reload / deploy,
  // the page is huge and buttons look 4x too wide.)
  const root: AnyWidget = {
    type: "CANVAS_WIDGET",
    widgetName: "MainContainer",
    widgetId: "0",
    backgroundColor: "none",
    containerStyle: "none",
    rightColumn: 1242,
    snapColumns: TOKENS.gridCols,
    snapRows: bottomRow,
    leftColumn: 0,
    topRow: 0,
    bottomRow,
    minHeight: bottomRow * 10,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    detachFromLayout: true,
    canExtend: true,
    version: LATEST_DSL_VERSION,
    dynamicBindingPathList: [],
    children: children.map((c) => ({ ...c, parentId: "0" })),
  } as unknown as AnyWidget;

  return root as unknown as NestedDSL<WidgetProps>;
}

// ---------------------------------------------------------------------------
// Public compile entrypoint
// ---------------------------------------------------------------------------

export class RecipeCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecipeCompileError";
  }
}

/**
 * Validate a Recipe. Returns error string or null.
 * Kept lenient — we want weak models' outputs to still work.
 */
export function validateRecipe(recipe: unknown): string | null {
  if (!recipe || typeof recipe !== "object") return "Recipe must be an object.";

  const r = recipe as Record<string, unknown>;

  if (!r.type || typeof r.type !== "string") return "Recipe.type is required.";

  if (r.type === "crud-table") {
    if (!r.title) return "crud-table: title required.";

    if (!r.listQuery) return "crud-table: listQuery required.";

    if (!Array.isArray(r.columns) || r.columns.length === 0) {
      return "crud-table: columns[] required (at least one column).";
    }
  } else if (r.type === "form") {
    if (!r.title) return "form: title required.";

    if (!r.submitQuery) return "form: submitQuery required.";

    if (!Array.isArray(r.fields) || r.fields.length === 0) {
      return "form: fields[] required.";
    }
  } else if (r.type !== "blank") {
    return `Unknown recipe type "${r.type}". Expected: crud-table | form | blank.`;
  }

  return null;
}

export function compileRecipe(recipe: Recipe): NestedDSL<WidgetProps> {
  const err = validateRecipe(recipe);

  if (err) throw new RecipeCompileError(err);

  switch (recipe.type) {
    case "crud-table":
      return compileCrudTable(recipe);
    case "form":
      return compileForm(recipe);
    case "blank":
      return compileBlank(recipe);
  }
}
