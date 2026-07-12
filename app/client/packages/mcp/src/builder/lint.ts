import { GRID_COLUMNS, ROOT_WIDGET_ID, type WidgetNode } from "./layout.js";

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

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// The grid width available to a canvas's direct children: the root canvas is measured in the 64-column page grid,
// while an inner canvas is measured in its own column count (mirrors compile.ts's availableColumns).
function canvasColumns(canvas: WidgetNode): number {
  return canvas.widgetId === ROOT_WIDGET_ID
    ? GRID_COLUMNS
    : isNumber(canvas.rightColumn)
      ? canvas.rightColumn
      : GRID_COLUMNS;
}

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

  constructor(options: LintOptions) {
    this.knownDataNames = new Set(options.knownDataNames ?? []);
  }

  lint(root: WidgetNode): Diagnostics {
    if (!root || typeof root !== "object") {
      this.error("tree", "page has no root widget");

      return this.result();
    }

    this.walk(root);
    this.checkDuplicateNames();

    return this.result();
  }

  private walk(node: WidgetNode): void {
    this.checkIdentity(node);
    this.checkBindings(node);

    // Geometry checks apply to the direct children laid out on a canvas.
    if (node.type === CANVAS_TYPE) this.checkCanvasChildren(node);

    // A container's own box must be tall enough to hold its inner canvas's extent.
    if (CONTAINER_TYPES.has(node.type)) this.checkContainerHeight(node);

    for (const child of node.children ?? []) this.walk(child);
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

    // Sibling overlap: any two children whose column AND row ranges intersect.
    for (let i = 0; i < children.length; i += 1) {
      for (let j = i + 1; j < children.length; j += 1) {
        const a = children[i];
        const b = children[j];

        if (
          isNumber(a.leftColumn) &&
          isNumber(a.rightColumn) &&
          isNumber(a.topRow) &&
          isNumber(a.bottomRow) &&
          isNumber(b.leftColumn) &&
          isNumber(b.rightColumn) &&
          isNumber(b.topRow) &&
          isNumber(b.bottomRow) &&
          rangesOverlap(
            a.leftColumn,
            a.rightColumn,
            b.leftColumn,
            b.rightColumn,
          ) &&
          rangesOverlap(a.topRow, a.bottomRow, b.topRow, b.bottomRow)
        ) {
          this.warn(
            "overlap",
            `"${nameOf(a)}" and "${nameOf(b)}" overlap on the same canvas`,
            nameOf(a),
          );
        }
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
      this.warn(
        "container-clips",
        `"${nameOf(container)}" is shorter than its content (height ${containerHeight} < inner extent ${inner.bottomRow}); inner widgets will be clipped`,
        nameOf(container),
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

        // Only flag when we have a known-name set to check against (M4). `appsmith`/`moment`/JS globals are always
        // considered valid heads and skipped.
        if (
          this.knownDataNames.size > 0 &&
          !this.knownDataNames.has(reference) &&
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

  private warn(rule: string, msg: string, widget?: string): void {
    this.issues.push({ sev: "warn", rule, msg, widget });
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

// Binding heads that are always valid: JS/Appsmith globals the agent may legitimately reference.
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
