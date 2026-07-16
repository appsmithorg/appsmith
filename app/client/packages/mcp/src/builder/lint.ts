import { ROW_HEIGHT, type WidgetNode } from "./layout.js";
import {
  canvasColumns,
  computeCanvasOverlapFixes,
  contentExtent,
  isNumber,
  MAX_ROW,
  overlappingPairs,
  suggestedFix,
  VALID_PATCH_NAME,
  type SuggestedFix,
} from "./occupancy.js";
import { modalStackFindings } from "./modalGraph.js";

// Static, deterministic structural linter for a compiled page DSL. It reuses the compiler's grid geometry to catch
// the classes of defect the builder can produce (bad placement, tree corruption, duplicate names) WITHOUT a browser
// or runtime evaluation. This is the feedback signal an AI agent iterates against: build -> inspect -> fix.

export type Severity = "error" | "warn";

export interface Issue {
  sev: Severity;
  rule: string;
  msg: string;
  // The offending widget's name, when the issue is attributable to one.
  widget?: string;
  // M6: a literal, ready-to-apply repair payload (patch_widgets operations) for overlap / clipped diagnostics —
  // the agent applies it verbatim instead of doing spatial reasoning on the grid.
  suggestedFix?: SuggestedFix;
}

export interface Diagnostics {
  errors: number;
  warnings: number;
  issues: Issue[];
}

export interface LintOptions {
  // Names the agent has declared (queries/JS objects). When provided, `{{ name.* }}` bindings that reference an
  // unknown name are flagged. Dormant until the data layer (M4) supplies query names.
  knownDataNames?: Iterable<string>;
}

const CANVAS_TYPE = "CANVAS_WIDGET";
const CONTAINER_TYPES = new Set(["CONTAINER_WIDGET", "FORM_WIDGET"]);
const BINDING_PATTERN = /\{\{([\s\S]*?)\}\}/g;
// Leading identifier of a binding expression, e.g. `getUsers` in `{{ getUsers.data }}`.
const BINDING_HEAD = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)/;
// M5 store accumulation: a table bound to a store key (the exact shape compileTableDataBinding emits) and any
// compiler-emitted storeValue('<key>', ...) writer, so the linter can flag a store-bound table nothing writes to.
const STORE_TABLE_BINDING =
  /^\{\{ appsmith\.store\.([A-Za-z_][A-Za-z0-9_]*) \?\? \[\] \}\}$/;
const STORE_WRITE = /storeValue\('([A-Za-z_][A-Za-z0-9_]*)'/g;

// The intersect predicate, canvas column model, and numeric guards live in occupancy.ts (M6) — one shared
// implementation for the lint, the patch repair, the container-fit cascade, and the commitLayout delta gate.

function childCanvasOf(node: WidgetNode): WidgetNode | undefined {
  return node.children?.find((child) => child.type === CANVAS_TYPE);
}

function nameOf(node: WidgetNode): string {
  return typeof node.widgetName === "string" ? node.widgetName : node.widgetId;
}

// Collect every string leaf under a node's OWN props (not descendants), so binding scans don't double-count nested
// widgets. Children are walked separately by the tree traversal.
function ownStringProps(node: WidgetNode): string[] {
  const strings: string[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === "children") continue;

    if (typeof value === "string") strings.push(value);
  }

  return strings;
}

class Linter {
  private readonly issues: Issue[] = [];
  private readonly seenNames = new Map<string, number>();
  private readonly seenIds = new Set<string>();
  private readonly knownDataNames: Set<string>;
  // M5 store accumulation: key -> first store-bound table's name, and the set of keys some event writes.
  private readonly storeReads = new Map<string, string>();
  private readonly storeWrites = new Set<string>();

  constructor(options: LintOptions) {
    this.knownDataNames = new Set(options.knownDataNames ?? []);
  }

  lint(root: WidgetNode): Diagnostics {
    if (!root || typeof root !== "object") {
      this.error("tree", "page has no root widget");

      return this.result();
    }

    this.walk(root);
    // Bindings are checked in a second pass so widget-head references (e.g. `{{ Table1.selectedRow[...] }}`) can be
    // resolved against the COMPLETE name set, wherever the referenced widget sits in the tree.
    this.walkBindings(root);
    this.checkDuplicateNames();
    this.checkStoreWriters();
    this.checkModalGraph(root);

    return this.result();
  }

  // M6 modal discipline (lint twin): existing modal stacks (depth >= 2) and stacking cycles as warnings, plus the
  // count of bindings excluded from the fail-open analysis so the omission is visible per page.
  private checkModalGraph(root: WidgetNode): void {
    for (const finding of modalStackFindings(root)) {
      this.issues.push({
        sev: "warn",
        rule: finding.rule,
        msg: finding.msg,
        widget: finding.widget ?? "",
      });
    }
  }

  private walk(node: WidgetNode): void {
    this.checkIdentity(node);
    this.collectStoreUsage(node);

    // Geometry checks apply to the direct children laid out on a canvas.
    if (node.type === CANVAS_TYPE) this.checkCanvasChildren(node);

    // A container's own box must be tall enough to hold its inner canvas's extent.
    if (CONTAINER_TYPES.has(node.type)) this.checkContainerHeight(node);

    // A modal body taller than the modal's pixel height scrolls — warn with an executable resize fix.
    if (node.type === "MODAL_WIDGET") this.checkModalHeight(node);

    for (const child of node.children ?? []) this.walk(child);
  }

  private walkBindings(node: WidgetNode): void {
    this.checkBindings(node);

    for (const child of node.children ?? []) this.walkBindings(child);
  }

  private checkIdentity(node: WidgetNode): void {
    const name = nameOf(node);

    if (typeof node.widgetId === "string") {
      if (this.seenIds.has(node.widgetId)) {
        this.error(
          "duplicate-id",
          `widget id "${node.widgetId}" appears more than once (tree corruption)`,
          name,
        );
      }

      this.seenIds.add(node.widgetId);
    }

    if (typeof node.widgetName === "string") {
      this.seenNames.set(
        node.widgetName,
        (this.seenNames.get(node.widgetName) ?? 0) + 1,
      );

      if (!/^[A-Za-z0-9_ ]+$/.test(node.widgetName)) {
        this.warn(
          "invalid-name",
          `widget name "${node.widgetName}" has characters Appsmith may reject`,
          name,
        );
      }
    }
  }

  private checkCanvasChildren(canvas: WidgetNode): void {
    const children = canvas.children ?? [];
    const columns = canvasColumns(canvas);

    for (const child of children) {
      const name = nameOf(child);

      if (isNumber(child.bottomRow) && isNumber(child.topRow)) {
        if (child.bottomRow <= child.topRow) {
          this.error(
            "zero-height",
            `"${name}" has non-positive height (topRow ${child.topRow} >= bottomRow ${child.bottomRow})`,
            name,
          );
        }
      }

      if (isNumber(child.rightColumn) && child.rightColumn > columns) {
        this.warn(
          "off-grid",
          `"${name}" extends past the grid (rightColumn ${child.rightColumn} > ${columns})`,
          name,
        );
      }
    }

    // Sibling overlap: any two IN-FLOW children whose column AND row ranges intersect (shared predicate; detached
    // overlays like modals are excluded — their nominal rects are not laid out on the canvas). Each warning carries
    // the canvas's full sequential repair payload, so applying any one issue's suggestedFix clears them all.
    const pairs = overlappingPairs(children);

    if (pairs.length > 0) {
      const fix = suggestedFix(computeCanvasOverlapFixes(canvas));

      for (const { a, b } of pairs) {
        this.warn(
          "overlap",
          `"${nameOf(a)}" and "${nameOf(b)}" overlap on the same canvas`,
          nameOf(a),
          fix,
        );
      }
    }
  }

  private checkContainerHeight(container: WidgetNode): void {
    const inner = childCanvasOf(container);

    if (
      !inner ||
      !isNumber(container.topRow) ||
      !isNumber(container.bottomRow) ||
      !isNumber(inner.bottomRow)
    ) {
      return;
    }

    const containerHeight = container.bottomRow - container.topRow;

    if (containerHeight < inner.bottomRow) {
      // Executable repair: resize the container to the rows that fit its content (B2 gives the vocabulary a
      // resize op, so this diagnostic is no longer a dead end).
      const rows = Math.max(
        Math.round(inner.bottomRow),
        Math.round(contentExtent(inner)),
      );
      const name = nameOf(container);
      // rows clamped to the resize schema's ceiling so the emitted suggestion always validates, even on a
      // corrupt DSL with absurd extents.
      const fix =
        rows >= 1 && VALID_PATCH_NAME.test(name)
          ? suggestedFix([
              { kind: "resize", name, rows: Math.min(rows, MAX_ROW) },
            ])
          : undefined;

      this.warn(
        "container-clips",
        `"${name}" is shorter than its content (height ${containerHeight} < inner extent ${inner.bottomRow}); inner widgets will be clipped`,
        name,
        fix,
      );
    }
  }

  // A modal's rendered height is a pixel prop, not grid rows. A body taller than the modal scrolls (the runtime
  // sets shouldScrollContents) — a WARNING, never an error, with an executable resize fix (rows × row height px).
  private checkModalHeight(modal: WidgetNode): void {
    const inner = childCanvasOf(modal);

    if (!inner || !isNumber(modal.height)) return;

    const extent = Math.round(contentExtent(inner));

    if (extent * ROW_HEIGHT > modal.height) {
      const name = nameOf(modal);
      const fix =
        extent >= 1 && VALID_PATCH_NAME.test(name)
          ? suggestedFix([
              { kind: "resize", name, rows: Math.min(extent, MAX_ROW) },
            ])
          : undefined;

      this.warn(
        "modal-clips",
        `"${name}" body content (${extent} rows = ${extent * ROW_HEIGHT}px) exceeds its ${modal.height}px height; the body will scroll`,
        name,
        fix,
      );
    }
  }

  private checkBindings(node: WidgetNode): void {
    for (const value of ownStringProps(node)) {
      BINDING_PATTERN.lastIndex = 0;

      let match: RegExpExecArray | null;

      while ((match = BINDING_PATTERN.exec(value)) !== null) {
        const head = BINDING_HEAD.exec(match[1]);

        if (!head) continue;

        const reference = head[1];

        // Only flag when we have a known-name set to check against (M4). `appsmith`/`moment`/JS globals and widget
        // names on this page (display bindings like `{{ Table1.selectedRow[...] }}`) are always valid heads.
        if (
          this.knownDataNames.size > 0 &&
          !this.knownDataNames.has(reference) &&
          !this.seenNames.has(reference) &&
          !GLOBAL_BINDING_HEADS.has(reference)
        ) {
          this.error(
            "dangling-binding",
            `binding {{ ${match[1].trim()} }} references unknown "${reference}"`,
            nameOf(node),
          );
        }
      }
    }
  }

  // Record the node's store reads (a table's store-form tableData binding) and writes (any storeValue('<key>', ...)
  // in its own string props — event bindings, wherever the compiler put them).
  private collectStoreUsage(node: WidgetNode): void {
    if (node.type === "TABLE_WIDGET_V2" && typeof node.tableData === "string") {
      const read = STORE_TABLE_BINDING.exec(node.tableData);

      if (read && !this.storeReads.has(read[1])) {
        this.storeReads.set(read[1], nameOf(node));
      }
    }

    for (const value of ownStringProps(node)) {
      STORE_WRITE.lastIndex = 0;

      let match: RegExpExecArray | null;

      while ((match = STORE_WRITE.exec(value)) !== null) {
        this.storeWrites.add(match[1]);
      }
    }
  }

  // A store-bound table whose key nothing on this page writes is a WARNING, not an error: the store is app-global,
  // so a legitimate writer (appendToStore/clearStoreKey) may live on another page.
  private checkStoreWriters(): void {
    for (const [key, widget] of this.storeReads) {
      if (!this.storeWrites.has(key)) {
        this.warn(
          "store-never-written",
          `store key '${key}' is never written on this page`,
          widget,
        );
      }
    }
  }

  private checkDuplicateNames(): void {
    for (const [name, count] of this.seenNames) {
      if (count > 1) {
        this.error(
          "duplicate-name",
          `widget name "${name}" is used ${count} times (Appsmith requires unique names)`,
          name,
        );
      }
    }
  }

  private error(rule: string, msg: string, widget?: string): void {
    this.issues.push({ sev: "error", rule, msg, widget });
  }

  private warn(
    rule: string,
    msg: string,
    widget?: string,
    suggestedRepair?: SuggestedFix,
  ): void {
    this.issues.push({
      sev: "warn",
      rule,
      msg,
      widget,
      ...(suggestedRepair !== undefined
        ? { suggestedFix: suggestedRepair }
        : {}),
    });
  }

  private result(): Diagnostics {
    const errors = this.issues.filter((issue) => issue.sev === "error").length;

    return {
      errors,
      warnings: this.issues.length - errors,
      issues: this.issues,
    };
  }
}

// Binding heads that are always valid: JS/Appsmith globals and the platform action functions the compiler emits
// (e.g. wire_event -> resetWidget/navigateTo/showAlert), so they aren't mistaken for dangling entity references.
const GLOBAL_BINDING_HEADS = new Set([
  "appsmith",
  "moment",
  "Math",
  "Object",
  "Array",
  "JSON",
  "Number",
  "String",
  "Boolean",
  "Date",
  "window",
  // Platform action functions (compiler-emitted event bindings).
  "resetWidget",
  "navigateTo",
  "showModal",
  "closeModal",
  "showAlert",
  "storeValue",
  "clearStore",
  "removeValue",
  "copyToClipboard",
  "download",
  "postWindowMessage",
  // List Widget V2 template scope: inside a card grid's item template the runtime injects these per-row locals, so
  // the compiler-emitted `{{ currentItem["field"] }}` slot bindings are valid heads, not dangling references.
  "currentItem",
  "currentIndex",
  "currentView",
  "level",
  "levelData",
]);

export function lintDsl(
  root: WidgetNode,
  options: LintOptions = {},
): Diagnostics {
  return new Linter(options).lint(root);
}

// Lint every page DSL inside a compiled import artifact (pageList[].unpublishedPage.layouts[0].dsl). Returns a
// per-page diagnostics map plus a rolled-up total, so build_application can report structural health inline.
export function lintArtifact(
  artifact: Record<string, unknown>,
  options: LintOptions = {},
): { errors: number; warnings: number; pages: Record<string, Diagnostics> } {
  const pages: Record<string, Diagnostics> = {};
  let errors = 0;
  let warnings = 0;

  const pageList = Array.isArray(artifact.pageList) ? artifact.pageList : [];

  for (const page of pageList) {
    const unpublished = (page as { unpublishedPage?: unknown })
      .unpublishedPage as
      | { name?: string; layouts?: { dsl?: WidgetNode }[] }
      | undefined;
    const dsl = unpublished?.layouts?.[0]?.dsl;
    const name = unpublished?.name ?? "page";

    if (!dsl) continue;

    const diagnostics = lintDsl(dsl, options);

    pages[name] = diagnostics;
    errors += diagnostics.errors;
    warnings += diagnostics.warnings;
  }

  return { errors, warnings, pages };
}
