import {
  GRID_COLUMNS,
  ROOT_WIDGET_ID,
  ROW_HEIGHT,
  type WidgetNode,
} from "./layout.js";

// M6 canvas awareness — the shared occupancy model over a canvas's children rects. A page, a container/form body,
// a tab panel, and a modal body are each ONE canvas; geometry questions (who collides with whom, where is the
// nearest free spot, which sibling pairs overlap) are answered here and nowhere else. The overlap lint, the
// patch_widgets move/resize repair, the container-fit cascade, and the commitLayout delta gate all consume this
// single implementation, so "overlap" can never mean different things on different paths.
//
// Numeric hygiene contract: every rect READ from live DSL passes isNumber (non-numeric/NaN rects are skipped,
// never computed with); every WRITTEN row value is a safe integer clamped to MAX_ROW.

// Upper bound for any written row coordinate (5000 grid rows = 50,000px of page). Live DSL can carry absurd or
// corrupted numbers; repairs never write past this.
export const MAX_ROW = 5000;

// Widget names a patch_widgets operation can legally reference (mirrors editPatch's widgetNameSchema). Suggested
// fixes are only emitted for widgets an agent could actually address in a schema-valid patch.
export const VALID_PATCH_NAME = /^[A-Za-z0-9_]{1,64}$/;

// Widget types whose height auto-grows to fit their inner canvas (all grow in the compile path today). Modals are
// deliberately NOT here: their rendered height is a pixel prop and their body scrolls, so overflow warns instead.
export const GROW_WIDGET_TYPES = new Set([
  "CONTAINER_WIDGET",
  "FORM_WIDGET",
  "TABS_WIDGET",
]);

export interface Rect {
  topRow: number;
  bottomRow: number;
  leftColumn: number;
  rightColumn: number;
}

export interface Position {
  topRow: number;
  leftColumn: number;
}

export interface Size {
  rows: number;
  columns: number;
}

// The literal patch operations a suggestedFix payload may carry. Structural (not imported from editPatch) so the
// linter can attach fixes without a module cycle; every emitted operation must validate against widgetPatchSchema.
export type SuggestedOperation =
  | { kind: "move"; name: string; position: Position }
  | { kind: "resize"; name: string; rows: number };

export interface SuggestedFix {
  tool: "patch_widgets";
  operations: SuggestedOperation[];
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Half-open interval intersection: edge-touching (aEnd === bStart) is NOT overlap. Extracted verbatim from the
// overlap lint so lint, gate, and repair agree on the predicate.
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    rangesOverlap(a.leftColumn, a.rightColumn, b.leftColumn, b.rightColumn) &&
    rangesOverlap(a.topRow, a.bottomRow, b.topRow, b.bottomRow)
  );
}

// A widget's rect, or undefined when any coordinate is non-numeric/NaN (such rects are never computed with).
export function rectOf(node: WidgetNode): Rect | undefined {
  const { bottomRow, leftColumn, rightColumn, topRow } = node;

  if (
    isNumber(topRow) &&
    isNumber(bottomRow) &&
    isNumber(leftColumn) &&
    isNumber(rightColumn)
  ) {
    return { topRow, bottomRow, leftColumn, rightColumn };
  }

  return undefined;
}

// Detached widgets (modals on the root canvas) are overlays, not in-flow: their nominal rects are excluded from
// occupancy, pushdown, and the gate's pair sets — counting them would false-reject unrelated edits.
export function isDetached(node: WidgetNode): boolean {
  return node.detachFromLayout === true;
}

export function nameOf(node: WidgetNode): string {
  return typeof node.widgetName === "string" ? node.widgetName : node.widgetId;
}

// The grid width available to a canvas's direct children: the root canvas is measured in the 64-column page grid,
// while an inner canvas is measured in its OWN column count (mirrors compile.ts's availableColumns).
export function canvasColumns(canvas: WidgetNode): number {
  return canvas.widgetId === ROOT_WIDGET_ID
    ? GRID_COLUMNS
    : isNumber(canvas.rightColumn)
      ? canvas.rightColumn
      : GRID_COLUMNS;
}

// Write-side hygiene: rounded, safe-integer, clamped to [0, MAX_ROW].
export function clampRow(value: number): number {
  const rounded = Math.round(value);

  if (!Number.isSafeInteger(rounded)) return MAX_ROW;

  return Math.min(MAX_ROW, Math.max(0, rounded));
}

function safeColumn(value: number): number {
  const rounded = Math.round(value);

  if (!Number.isSafeInteger(rounded)) return 0;

  return Math.max(0, rounded);
}

interface FlowEntry {
  node: WidgetNode;
  rect: Rect;
}

// The children that participate in occupancy: in-flow (not detached) with fully numeric rects.
function inFlowRects(children: WidgetNode[]): FlowEntry[] {
  const entries: FlowEntry[] = [];

  for (const child of children) {
    if (isDetached(child)) continue;

    const rect = rectOf(child);

    if (!rect) continue;

    entries.push({ node: child, rect });
  }

  return entries;
}

// Names of the in-flow children whose rects collide with `rect`, excluding `excludeNames` (typically the widget
// being placed itself).
export function collisions(
  children: WidgetNode[],
  rect: Rect,
  excludeNames: Iterable<string> = [],
): string[] {
  const excluded = new Set(excludeNames);
  const names: string[] = [];

  for (const entry of inFlowRects(children)) {
    const name = nameOf(entry.node);

    if (excluded.has(name)) continue;

    if (rectsOverlap(entry.rect, rect)) names.push(name);
  }

  return names;
}

// Deterministic pushdown against a plain obstacle list: try `preferred`; while colliding, move topRow just past the
// lowest colliding bottom edge (+1 row gap, matching the compiler's stacking). The column is clamped into the
// canvas's own width. Terminates in <= obstacles.length iterations: each step permanently clears the collider with
// the smallest bottomRow, and topRow strictly increases (or the MAX_ROW clamp ends the walk).
export function nearestFreePositionFromRects(
  obstacles: Rect[],
  size: Size,
  preferred: Position,
  columns: number,
): Position {
  const rows = Math.max(1, Math.round(size.rows));
  const width = Math.max(1, Math.min(Math.round(size.columns), columns));
  const leftColumn = Math.min(
    safeColumn(preferred.leftColumn),
    Math.max(0, columns - width),
  );
  let topRow = clampRow(preferred.topRow);

  for (let step = 0; step <= obstacles.length; step += 1) {
    const candidate: Rect = {
      topRow,
      bottomRow: topRow + rows,
      leftColumn,
      rightColumn: leftColumn + width,
    };
    const colliders = obstacles.filter((rect) => rectsOverlap(rect, candidate));

    if (colliders.length === 0) return { topRow, leftColumn };

    const next = clampRow(
      Math.min(...colliders.map((rect) => rect.bottomRow)) + 1,
    );

    // The MAX_ROW clamp stopped the descent — accept the bound rather than loop.
    if (next <= topRow) break;

    topRow = next;
  }

  return { topRow, leftColumn };
}

// Same pushdown, taking a canvas's children (detached / non-numeric rects are skipped as obstacles).
export function nearestFreePosition(
  children: WidgetNode[],
  size: Size,
  preferred: Position,
  columns: number,
  excludeNames: Iterable<string> = [],
): Position {
  const excluded = new Set(excludeNames);
  const obstacles = inFlowRects(children)
    .filter((entry) => !excluded.has(nameOf(entry.node)))
    .map((entry) => entry.rect);

  return nearestFreePositionFromRects(obstacles, size, preferred, columns);
}

// Every overlapping sibling pair among a canvas's in-flow children, in deterministic (i < j) child order. This is
// the extracted overlap-lint predicate: identical pair set for numeric in-flow children; detached widgets are
// excluded (the deliberate, tested lint change layered on the extraction).
export function overlappingPairs(
  children: WidgetNode[],
): { a: WidgetNode; b: WidgetNode }[] {
  const entries = inFlowRects(children);
  const pairs: { a: WidgetNode; b: WidgetNode }[] = [];

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (rectsOverlap(entries[i].rect, entries[j].rect)) {
        pairs.push({ a: entries[i].node, b: entries[j].node });
      }
    }
  }

  return pairs;
}

// Canvas-independent pair key. Names are page-unique and the vocabulary has no rename, so a name pair identifies
// "these two widgets overlap" regardless of which canvas they sit on — two already-overlapping widgets reparented
// TOGETHER stay "pre-existing" and never gate.
export function pairKey(a: string, b: string): string {
  return JSON.stringify([a, b].sort());
}

// All overlapping sibling name-pairs anywhere in the tree, keyed by pairKey.
export function collectOverlapPairs(
  root: WidgetNode,
): Map<string, { a: string; b: string }> {
  const found = new Map<string, { a: string; b: string }>();

  const walk = (node: WidgetNode): void => {
    if (node.type === "CANVAS_WIDGET") {
      for (const pair of overlappingPairs(node.children ?? [])) {
        const a = nameOf(pair.a);
        const b = nameOf(pair.b);

        found.set(pairKey(a, b), { a, b });
      }
    }

    for (const child of node.children ?? []) walk(child);
  };

  walk(root);

  return found;
}

export interface OverlapDelta {
  // Pairs present after the mutation but not before — the pairs the gate rejects on.
  introduced: { a: string; b: string }[];
  // Literal move operations that clear the introduced pairs, computed sequentially against simulated occupancy so
  // applying the whole payload is conflict-free.
  fixOperations: SuggestedOperation[];
}

// The commitLayout delta gate's core: initial-vs-final overlap pair diff by name pair. Carried (pre-existing)
// overlaps never appear in `introduced`, so messy human-edited pages stay editable.
export function overlapDelta(
  before: WidgetNode,
  after: WidgetNode,
): OverlapDelta {
  const beforePairs = collectOverlapPairs(before);
  const afterPairs = collectOverlapPairs(after);
  const introducedKeys = new Set<string>();

  for (const key of afterPairs.keys()) {
    if (!beforePairs.has(key)) introducedKeys.add(key);
  }

  const introduced: { a: string; b: string }[] = [];

  for (const key of introducedKeys) introduced.push(afterPairs.get(key)!);

  return {
    introduced,
    fixOperations:
      introducedKeys.size > 0 ? computeOverlapFixes(after, introducedKeys) : [],
  };
}

// Move operations that clear a canvas's overlapping pairs (all of them, or only `keysToFix`). Fixes are computed
// SEQUENTIALLY against simulated occupancy: widgets are visited top-left-first; a widget moves only when it still
// collides with an already-settled partner, and each move lands at the nearest spot free of EVERY simulated rect —
// so applying the whole payload verbatim is conflict-free and clears every targeted pair. Widgets whose names
// cannot appear in a schema-valid patch are never moved (their pairs are left to manual repair).
export function computeCanvasOverlapFixes(
  canvas: WidgetNode,
  keysToFix?: Set<string>,
): SuggestedOperation[] {
  const children = canvas.children ?? [];
  const columns = canvasColumns(canvas);
  const pairs = overlappingPairs(children).filter(
    (pair) =>
      !keysToFix || keysToFix.has(pairKey(nameOf(pair.a), nameOf(pair.b))),
  );

  if (pairs.length === 0) return [];

  const simulated = new Map<string, Rect>();

  for (const entry of inFlowRects(children)) {
    simulated.set(nameOf(entry.node), entry.rect);
  }

  const partners = new Map<string, Set<string>>();

  for (const pair of pairs) {
    const a = nameOf(pair.a);
    const b = nameOf(pair.b);
    const aPartners = partners.get(a) ?? new Set<string>();
    const bPartners = partners.get(b) ?? new Set<string>();

    aPartners.add(b);
    bPartners.add(a);
    partners.set(a, aPartners);
    partners.set(b, bPartners);
  }

  // Top-left-most first, so upper widgets keep their spot and lower ones are pushed down deterministically.
  const involved = [...partners.keys()]
    .filter((name) => simulated.has(name))
    .sort((x, y) => {
      const rx = simulated.get(x)!;
      const ry = simulated.get(y)!;

      return (
        rx.topRow - ry.topRow ||
        rx.leftColumn - ry.leftColumn ||
        x.localeCompare(y)
      );
    });
  const processed = new Set<string>();
  const operations: SuggestedOperation[] = [];

  for (const name of involved) {
    const rect = simulated.get(name)!;
    const mustMove = [...(partners.get(name) ?? [])].some(
      (other) =>
        processed.has(other) &&
        simulated.has(other) &&
        rectsOverlap(simulated.get(other)!, rect),
    );

    if (mustMove && VALID_PATCH_NAME.test(name)) {
      const obstacles: Rect[] = [];

      for (const [otherName, otherRect] of simulated) {
        if (otherName !== name) obstacles.push(otherRect);
      }

      const size = {
        rows: rect.bottomRow - rect.topRow,
        columns: rect.rightColumn - rect.leftColumn,
      };
      const position = nearestFreePositionFromRects(
        obstacles,
        size,
        { topRow: rect.topRow, leftColumn: rect.leftColumn },
        columns,
      );

      simulated.set(name, {
        topRow: position.topRow,
        bottomRow: position.topRow + Math.max(1, size.rows),
        leftColumn: position.leftColumn,
        rightColumn: position.leftColumn + Math.max(1, size.columns),
      });
      operations.push({ kind: "move", name, position });
    }

    processed.add(name);
  }

  return operations;
}

// Tree-wide overlap fixes (per canvas, concatenated). Capped at the patch schema's 50-operation limit.
export function computeOverlapFixes(
  root: WidgetNode,
  keysToFix?: Set<string>,
): SuggestedOperation[] {
  const operations: SuggestedOperation[] = [];

  const walk = (node: WidgetNode): void => {
    if (node.type === "CANVAS_WIDGET") {
      operations.push(...computeCanvasOverlapFixes(node, keysToFix));
    }

    for (const child of node.children ?? []) walk(child);
  };

  walk(root);

  return operations.slice(0, 50);
}

// Wrap operations as the payload agents apply verbatim; undefined when there is nothing executable to suggest.
export function suggestedFix(
  operations: SuggestedOperation[],
): SuggestedFix | undefined {
  if (operations.length === 0) return undefined;

  return { tool: "patch_widgets", operations: operations.slice(0, 50) };
}

// Keep a widget's mobile row mirrors in step with its desktop rect (matches stampWidget's seeding). Called
// everywhere geometry is written.
export function syncMobileRows(node: WidgetNode): void {
  node.mobileTopRow = node.topRow;
  node.mobileBottomRow = node.bottomRow;
  node.mobileLeftColumn = node.leftColumn;
  node.mobileRightColumn = node.rightColumn;
}

// Move a widget's rect to `position`, preserving (or overriding) its span, with write-side hygiene and mobile
// mirrors. bottomRow follows the clamped topRow so the span is never distorted by the clamp.
export function applyPosition(
  node: WidgetNode,
  position: Position,
  widthColumns?: number,
): void {
  const rect = rectOf(node);

  if (!rect) {
    throw new Error(
      `widget "${nameOf(node)}" has a non-numeric position and cannot be moved safely`,
    );
  }

  const rowSpan = Math.max(1, rect.bottomRow - rect.topRow);
  const columnSpan = Math.max(
    1,
    Math.round(widthColumns ?? rect.rightColumn - rect.leftColumn),
  );
  const topRow = clampRow(position.topRow);
  const leftColumn = safeColumn(position.leftColumn);

  node.topRow = topRow;
  node.bottomRow = topRow + rowSpan;
  node.leftColumn = leftColumn;
  node.rightColumn = leftColumn + columnSpan;
  syncMobileRows(node);
}

// The occupied extent (max in-flow bottomRow) of a canvas's children — the executable minimum height for the
// enclosing container.
export function contentExtent(canvas: WidgetNode): number {
  let extent = 0;

  for (const entry of inFlowRects(canvas.children ?? [])) {
    extent = Math.max(extent, entry.rect.bottomRow);
  }

  return extent;
}

export interface CascadeAdjustment {
  kind: "move" | "resize";
  widgetName: string;
  previousPosition?: Position;
  position?: Position;
  previousSize?: { rows: number };
  size?: { rows: number };
}

export interface CascadeResult {
  adjustments: CascadeAdjustment[];
  notes: string[];
}

function formatPosition(position: Position): string {
  return `{ topRow: ${position.topRow}, leftColumn: ${position.leftColumn} }`;
}

// Container-fit cascade (design section D). Starting from a widget that changed (grew, moved, or was just added),
// walk UP the tree: push down in-flow siblings the widget now collides with (sequential simulated occupancy, so
// pushes chain deterministically), grow the enclosing canvas, grow the enclosing container/form/tabs (never
// shrink), and repeat on the grown ancestor. A modal body that outgrows its pixel height gets a WARNING note (the
// runtime scrolls) instead of growth. Every adjustment is recorded. Carried (pre-existing) overlaps between OTHER
// widgets are left untouched — only collisions attributable to the changed widget (and its chain) are repaired.
export function cascadeFit(root: WidgetNode, startName: string): CascadeResult {
  const adjustments: CascadeAdjustment[] = [];
  const notes: string[] = [];
  // Parent links are keyed by NODE IDENTITY, not widgetId: a corrupt/duplicated-id tree (which the lint flags but
  // must not crash or misroute a repair) still cascades along the real containment chain.
  const parents = new Map<WidgetNode, WidgetNode>();
  const byName = new Map<string, WidgetNode>();

  const index = (node: WidgetNode): void => {
    byName.set(nameOf(node), node);

    for (const child of node.children ?? []) {
      parents.set(child, node);
      index(child);
    }
  };

  index(root);

  let current = byName.get(startName);
  const visited = new Set<WidgetNode>();

  while (current && current !== root && !visited.has(current)) {
    visited.add(current);
    growToFitOwnContent(current, adjustments, notes);

    // Detached overlays are not in flow; their nominal rect never displaces siblings.
    if (isDetached(current)) break;

    const canvas = parents.get(current);

    if (!canvas || canvas.type !== "CANVAS_WIDGET") break;

    pushDownCollidingSiblings(canvas, current, adjustments, notes);
    growCanvasToExtent(canvas);

    current = parents.get(canvas);
  }

  return { adjustments, notes };
}

// Grow a container/form/tabs to encompass its inner canvases' extent (build invariant:
// container.bottomRow = container.topRow + innerCanvas.bottomRow). Modals warn instead of growing.
function growToFitOwnContent(
  node: WidgetNode,
  adjustments: CascadeAdjustment[],
  notes: string[],
): void {
  const innerCanvases = (node.children ?? []).filter(
    (child) => child.type === "CANVAS_WIDGET",
  );

  if (innerCanvases.length === 0) return;

  if (node.type === "MODAL_WIDGET") {
    let extent = 0;

    for (const canvas of innerCanvases) {
      growCanvasToExtent(canvas);
      extent = Math.max(extent, contentExtent(canvas));
    }

    if (isNumber(node.height) && extent * ROW_HEIGHT > node.height) {
      notes.push(
        `modal "${nameOf(node)}" body content (${extent} rows = ${extent * ROW_HEIGHT}px) exceeds its ${node.height}px height and will scroll; resize it with { kind: "resize", name: "${nameOf(node)}", rows: ${extent} } to show everything`,
      );
    }

    return;
  }

  if (!GROW_WIDGET_TYPES.has(node.type)) return;

  const top = isNumber(node.topRow) ? node.topRow : 0;
  let needed = 0;

  for (const canvas of innerCanvases) {
    growCanvasToExtent(canvas);
    needed = Math.max(
      needed,
      isNumber(canvas.bottomRow) ? canvas.bottomRow : 0,
    );
  }

  if (needed <= 0 || !isNumber(node.bottomRow)) return;

  const target = clampRow(top + needed);

  if (target > node.bottomRow) {
    const previousRows = node.bottomRow - top;

    node.bottomRow = target;
    syncMobileRows(node);
    adjustments.push({
      kind: "resize",
      widgetName: nameOf(node),
      previousSize: { rows: previousRows },
      size: { rows: target - top },
    });
    notes.push(
      `grew "${nameOf(node)}" from ${previousRows} to ${target - top} rows to fit its content`,
    );
  }
}

// Grow a canvas to its children's occupied extent (never shrink). The root canvas is measured in pixels
// (matches the compiler); inner canvases are measured in rows.
function growCanvasToExtent(canvas: WidgetNode): void {
  const extent = contentExtent(canvas);

  if (extent <= 0) return;

  if (canvas.widgetId === ROOT_WIDGET_ID) {
    const current = isNumber(canvas.bottomRow) ? canvas.bottomRow : 0;

    // clampRow bounds the extent before the pixel multiply so a corrupt child rect (~1.8e307) cannot overflow
    // the root canvas height to Infinity (which would JSON-serialize as null).
    canvas.bottomRow = Math.max(
      Math.min(current, MAX_ROW * ROW_HEIGHT),
      clampRow(extent) * ROW_HEIGHT,
    );

    return;
  }

  const target = clampRow(extent);

  if (!isNumber(canvas.bottomRow) || target > canvas.bottomRow) {
    canvas.bottomRow = target;
  }
}

// Push down the in-flow siblings that collide with `changed` (and any siblings its pushes land on), top-to-bottom
// against a settled simulated set. Overlap pairs that ALREADY existed between two other widgets are carried mess:
// they warn elsewhere but are never repaired here.
function pushDownCollidingSiblings(
  canvas: WidgetNode,
  changed: WidgetNode,
  adjustments: CascadeAdjustment[],
  notes: string[],
): void {
  const changedRect = rectOf(changed);

  if (!changedRect) return;

  const children = canvas.children ?? [];
  const columns = canvasColumns(canvas);
  const changedName = nameOf(changed);
  // Pairs not involving the changed widget that already overlap are pre-existing — leave them be.
  const carriedKeys = new Set<string>();

  for (const pair of overlappingPairs(children)) {
    const a = nameOf(pair.a);
    const b = nameOf(pair.b);

    if (a !== changedName && b !== changedName) carriedKeys.add(pairKey(a, b));
  }

  const others = inFlowRects(children)
    .filter((entry) => entry.node !== changed)
    .sort(
      (x, y) =>
        x.rect.topRow - y.rect.topRow ||
        x.rect.leftColumn - y.rect.leftColumn ||
        nameOf(x.node).localeCompare(nameOf(y.node)),
    );
  const settled: { name: string; rect: Rect }[] = [
    { name: changedName, rect: changedRect },
  ];

  for (const entry of others) {
    const entryName = nameOf(entry.node);
    let rect = entry.rect;
    const mustMove = settled.some(
      (placed) =>
        rectsOverlap(placed.rect, rect) &&
        !carriedKeys.has(pairKey(placed.name, entryName)),
    );

    if (mustMove) {
      const size = {
        rows: rect.bottomRow - rect.topRow,
        columns: rect.rightColumn - rect.leftColumn,
      };
      const position = nearestFreePositionFromRects(
        settled.map((placed) => placed.rect),
        size,
        { topRow: rect.topRow, leftColumn: rect.leftColumn },
        columns,
      );

      if (
        position.topRow !== rect.topRow ||
        position.leftColumn !== rect.leftColumn
      ) {
        const previousPosition = {
          topRow: rect.topRow,
          leftColumn: rect.leftColumn,
        };

        applyPosition(entry.node, position);
        rect = rectOf(entry.node)!;
        adjustments.push({
          kind: "move",
          widgetName: entryName,
          previousPosition,
          position,
        });
        notes.push(
          `moved "${entryName}" from ${formatPosition(previousPosition)} to ${formatPosition(position)} to make room for "${changedName}"`,
        );
      }
    }

    settled.push({ name: entryName, rect });
  }
}
