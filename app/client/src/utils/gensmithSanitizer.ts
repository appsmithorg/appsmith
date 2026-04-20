/**
 * GenSmith DSL Sanitizer.
 *
 * Fixes the most common product-killing mistakes AI models make when asked
 * to write raw Appsmith DSL, so even the fallback path produces usable UI.
 *
 * What it fixes (in order):
 *   1. INPUT_WIDGET_V3     → INPUT_WIDGET_V2         (V3 not registered)
 *   2. INPUT_WIDGET        → INPUT_WIDGET_V2         (deprecated)
 *   3. Children of MainContainer with leftColumn/rightColumn outside 0..64
 *      are proportionally scaled back into the 0..64 range so the page
 *      fits the viewport instead of extending off-screen.
 *   4. Button heights > 8 rows are capped at 4 rows (the standard).
 *   5. TableWidgetV2 `columnOrder` and `primaryColumns` have system junk
 *      fields like `rowIndex`, `__rowIndex`, `_id` stripped out.
 *   6. Modal submit buttons placed below the modal's `rows` count are
 *      moved up so they're visible.
 *   7. All widgets get `borderRadius: "0.375rem"` if missing, so the look
 *      is consistent.
 *   8. All buttons without `buttonColor` get the brand primary.
 *
 * The sanitizer is intentionally lenient — it never throws and preserves
 * unknown fields untouched.
 */

import type { NestedDSL } from "@shared/dsl";
import { LATEST_DSL_VERSION } from "@shared/dsl";
import type { WidgetProps } from "widgets/BaseWidget";

type AnyWidget = NestedDSL<WidgetProps> & Record<string, unknown>;

const PRIMARY_COLOR = "#553DE9";
const BORDER_RADIUS = "0.375rem";
const MAIN_GRID_COLS = 64;
const MAX_BUTTON_ROWS = 8;
const STD_BUTTON_ROWS = 4;

const JUNK_COLUMN_FIELDS = new Set([
  "rowIndex",
  "__rowIndex",
  "_rowIndex",
  "_id",
  "__id",
  "uuid",
]);

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function sanitizeDsl(
  dsl: NestedDSL<WidgetProps>,
): NestedDSL<WidgetProps> {
  const root = clone(dsl) as AnyWidget;

  fixWidget(root, /* depth */ 0);

  // After per-widget pass, do a second pass specifically for MainContainer's
  // immediate children that might still extend beyond the 64-col grid.
  clampMainContainerChildren(root);

  // CRITICAL: stamp the root with the latest DSL version. Without this,
  // the server-side migration runner treats the DSL as ancient and runs
  // `migrateToNewLayout` (v18→v19), which scales every column by 4×.
  // Symptom: after save+reload, RefreshBtn is 4× too wide and the
  // MainContainer extends to ~5000px.
  if (root.type === "CANVAS_WIDGET" && root.widgetName === "MainContainer") {
    root.version = LATEST_DSL_VERSION;
  }

  return root as unknown as NestedDSL<WidgetProps>;
}

// ---------------------------------------------------------------------------
// Recursive sanitiser
// ---------------------------------------------------------------------------

function fixWidget(widget: AnyWidget, depth: number): void {
  // 1–2: Input type normalisation
  if (widget.type === "INPUT_WIDGET_V3" || widget.type === "INPUT_WIDGET") {
    widget.type = "INPUT_WIDGET_V2";
    widget.version = 2;

    if (!widget.inputType) widget.inputType = "TEXT";

    if (!widget.labelPosition) widget.labelPosition = "Top";
  }

  // 4: Button height cap
  if (widget.type === "BUTTON_WIDGET") {
    const top = Number(widget.topRow ?? 0);
    const bottom = Number(widget.bottomRow ?? top + STD_BUTTON_ROWS);
    const height = bottom - top;

    if (height > MAX_BUTTON_ROWS) {
      widget.bottomRow = top + STD_BUTTON_ROWS;
    }

    if (!widget.buttonColor) widget.buttonColor = PRIMARY_COLOR;
  }

  // 5: Strip junk columns from TableV2, AND project tableData to only
  // include the configured columns — this is the only way to prevent the
  // table from auto-adding "rowIndex" / system fields at runtime when
  // they appear in the query response (e.g. Google Sheets queries).
  if (widget.type === "TABLE_WIDGET_V2") {
    stripTableJunkColumns(widget);
    projectTableData(widget);
  }

  // 5b: Modal — strip the "size" preset property. It overrides the more
  // granular width/height/columns we compute, and is the root cause of the
  // "确认提交" button text getting clipped on narrow modals.
  if (widget.type === "MODAL_WIDGET") {
    delete widget.size;
    normaliseModalInnerCanvas(widget);

    // CRITICAL: In Appsmith, MODAL_WIDGET.isVisible doubles as "open on
    // page load". If true, the modal pops up immediately every time a user
    // visits the page (very bad default UX — user expects modals to be
    // opened only by clicking the "新增" button). See
    // widgets/ModalWidget/widget/index.tsx `getModalVisibility()`.
    //
    // Force it to false here so raw DSL from external AIs that ship
    // `isVisible: true` on modals (which most do — it's often auto-added
    // by Appsmith itself when you drag-drop a modal in the editor) is
    // auto-corrected.
    widget.isVisible = false;
  }

  // 6: Modal submit-button visibility fix (handled after we recurse into
  // the inner canvas, below).

  // 7: Consistent border radius
  if (
    widget.type === "BUTTON_WIDGET" ||
    widget.type === "INPUT_WIDGET_V2" ||
    widget.type === "TABLE_WIDGET_V2" ||
    widget.type === "MODAL_WIDGET"
  ) {
    if (widget.borderRadius === undefined) widget.borderRadius = BORDER_RADIUS;
  }

  // Recurse
  const children = widget.children as AnyWidget[] | undefined;

  if (Array.isArray(children)) {
    for (const child of children) fixWidget(child, depth + 1);
  }

  // Modal-specific post-pass: if this is a modal, check that all non-header
  // children's bottomRow ≤ modal.rows/bottomRow, and scale/move if needed.
  if (widget.type === "MODAL_WIDGET") {
    fixModalOverflow(widget);
  }
}

// ---------------------------------------------------------------------------
// Main-container child clamp
// ---------------------------------------------------------------------------

/**
 * Appsmith's MainContainer canvas will happily extend horizontally if any
 * child reports a rightColumn > snapColumns. AI models often hallucinate
 * huge column values (e.g. 176..212). We detect this and scale ALL
 * children down proportionally so the page uses the 0..64 grid.
 */
function clampMainContainerChildren(root: AnyWidget): void {
  if (root.type !== "CANVAS_WIDGET") return;

  const children = root.children as AnyWidget[] | undefined;

  if (!Array.isArray(children) || children.length === 0) return;

  const maxRight = children.reduce(
    (acc, c) => Math.max(acc, Number(c.rightColumn ?? 0)),
    0,
  );

  if (maxRight <= MAIN_GRID_COLS) return;

  // Scale factor with 1-col margin on both sides
  const scale = (MAIN_GRID_COLS - 2) / maxRight;

  for (const c of children) {
    const left = Number(c.leftColumn ?? 0);
    const right = Number(c.rightColumn ?? 0);

    c.leftColumn = Math.max(1, Math.round(left * scale));
    c.rightColumn = Math.min(MAIN_GRID_COLS - 1, Math.round(right * scale));

    // Ensure width ≥ 1 col
    if ((c.rightColumn as number) <= (c.leftColumn as number)) {
      c.rightColumn = (c.leftColumn as number) + 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Table column cleanup
// ---------------------------------------------------------------------------

/**
 * Rewrites `tableData` so it only exposes the fields in `columnOrder`.
 *
 * If `tableData` is already a projected expression (contains "=>" + "{"),
 * we leave it alone — the LLM or compiler already did the right thing.
 *
 * If it's a bare binding like `{{Query.data}}`, we rewrite it to
 *   `{{Query.data.map((r) => ({ field1: r.field1, field2: r.field2 }))}}`
 * so unwanted auto-columns (rowIndex, __id, …) never reach the table.
 */
function projectTableData(widget: AnyWidget): void {
  const tableData = widget.tableData as string | undefined;
  const columnOrder = widget.columnOrder as string[] | undefined;

  if (!tableData || !Array.isArray(columnOrder) || columnOrder.length === 0) {
    return;
  }

  // Already projected? skip.
  if (tableData.includes("=>") && tableData.includes("({")) return;

  const match = /^\s*{{\s*([A-Za-z0-9_.]+)\.data\s*}}\s*$/.exec(tableData);

  if (!match) return;

  const source = match[1];
  const proj = columnOrder.map((f) => `${f}: r.${f}`).join(", ");

  widget.tableData = `{{${source}.data.map((r) => ({${proj}}))}}`;
}

function stripTableJunkColumns(widget: AnyWidget): void {
  const columnOrder = widget.columnOrder as string[] | undefined;
  const primaryColumns = widget.primaryColumns as
    | Record<string, unknown>
    | undefined;
  const dynamicBindingPathList = widget.dynamicBindingPathList as
    | { key: string }[]
    | undefined;

  const isJunk = (field: string): boolean =>
    JUNK_COLUMN_FIELDS.has(field) || /^_/.test(field);

  if (Array.isArray(columnOrder)) {
    widget.columnOrder = columnOrder.filter((f) => !isJunk(f));
  }

  if (primaryColumns && typeof primaryColumns === "object") {
    const cleaned: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(primaryColumns)) {
      if (!isJunk(key)) cleaned[key] = val;
    }

    widget.primaryColumns = cleaned;
  }

  if (Array.isArray(dynamicBindingPathList)) {
    widget.dynamicBindingPathList = dynamicBindingPathList.filter((p) => {
      const m = /primaryColumns\.([^.]+)\./.exec(p.key);

      return !m || !isJunk(m[1]);
    });
  }
}

// ---------------------------------------------------------------------------
// Modal overflow fix
// ---------------------------------------------------------------------------

/**
 * If any widget inside the modal's inner canvas has a bottomRow that exceeds
 * the modal's declared rows, either:
 *   a) grow the modal (preferred), or
 *   b) shift that widget up so it stays visible.
 *
 * We do (a) because shrinking an AI-generated button is harder than growing
 * the modal.
 */
function fixModalOverflow(modal: AnyWidget): void {
  const children = modal.children as AnyWidget[] | undefined;

  if (!Array.isArray(children)) return;

  const canvas = children[0];

  if (!canvas || canvas.type !== "CANVAS_WIDGET") return;

  const canvasChildren = canvas.children as AnyWidget[] | undefined;

  if (!Array.isArray(canvasChildren)) return;

  const maxBottom = canvasChildren.reduce(
    (acc, c) => Math.max(acc, Number(c.bottomRow ?? 0)),
    0,
  );

  const currentRows = Number(modal.rows ?? 0);
  const needed = maxBottom + 2;

  if (needed > currentRows) {
    modal.rows = needed;
    modal.bottomRow = needed;
    modal.height = needed * 10 + 60;
    modal.minDynamicHeight = needed;
    canvas.bottomRow = needed;
    canvas.snapRows = needed;
    canvas.minHeight = needed * 10;
  }

  // No longer clamp by modal.columns — children are laid out on a 64-col
  // grid regardless (see normaliseModalInnerCanvas).
}

/**
 * Force the modal inner canvas to use a 64-column grid.
 *
 * WHY: Appsmith's runtime always renders modal children on the same
 * 64-col grid as MainContainer, regardless of what `snapColumns` is set
 * on the inner canvas. LLMs often emit `snapColumns: 24` (an older
 * convention) and position children on cols 0..23, which then appear
 * squished into the left 38% of the modal. We detect this and rescale
 * child columns to fit the 64-col grid.
 */
function normaliseModalInnerCanvas(modal: AnyWidget): void {
  const children = modal.children as AnyWidget[] | undefined;
  const canvas = children?.[0];

  if (!canvas || canvas.type !== "CANVAS_WIDGET") return;

  const canvasChildren = canvas.children as AnyWidget[] | undefined;

  if (!Array.isArray(canvasChildren)) return;

  const declared = Number(canvas.snapColumns ?? 0);

  // Heuristic: if snapColumns is missing or < 32, assume 24-col grid.
  if (declared === 64) return;

  const oldCols = declared > 0 && declared < 32 ? declared : 24;
  const maxRight = canvasChildren.reduce(
    (acc, c) => Math.max(acc, Number(c.rightColumn ?? 0)),
    0,
  );

  // If widgets' rightColumn fits within the assumed old grid, rescale.
  if (maxRight > 0 && maxRight <= oldCols + 1) {
    const scale = 64 / oldCols;

    for (const c of canvasChildren) {
      c.leftColumn = Math.round(Number(c.leftColumn ?? 0) * scale);
      c.rightColumn = Math.round(Number(c.rightColumn ?? 0) * scale);

      if ((c.rightColumn as number) <= (c.leftColumn as number)) {
        c.rightColumn = (c.leftColumn as number) + 1;
      }
    }
  }

  canvas.snapColumns = 64;
  canvas.canExtend = true;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
