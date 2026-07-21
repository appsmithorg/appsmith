import type { WidgetSpec } from "./schema.js";

// The design pass: infer a visual role for each widget from what the agent already sends, then plan rows so the
// page gets typographic hierarchy, side-by-side packing, and spacing rhythm — with every style value owned by the
// compiler (nothing here is agent-supplied). Pure functions of the spec, so compileApp stays deterministic.

export type WidgetRole =
  | "pageTitle"
  | "sectionHeader"
  | "kpi"
  | "field"
  | "action"
  | "body";

// Widget types that read as "a section" — a static text immediately before one of these is a section header.
const SECTION_TYPES = new Set<string>([
  "table",
  "chart",
  "list",
  "form",
  "container",
  "jsonform",
  "tabs",
]);

// Input-like widgets that pair two-per-row like a designed form.
const FIELD_TYPES = new Set<string>([
  "input",
  "select",
  "datepicker",
  "multiselect",
  "currencyinput",
  "phoneinput",
]);

const GUTTER = 2;
// Below this slot width (in grid columns) packing stops helping; fall back to full-width stacking.
const MIN_PACKED_WIDTH = 16;
const MAX_KPIS_PER_ROW = 4;
const MAX_ACTIONS_PER_ROW = 3;
const BUTTON_COLUMNS = 16;

// Spacing rhythm, in grid rows.
const GAP_WITHIN = 1;
const GAP_SECTION = 3;
const GAP_AFTER_TITLE = 2;

// Typography scale applied to TEXT_WIDGET props by role. Values are compiler-owned constants; the agent cannot
// influence them beyond choosing what to build.
const TEXT_ROLE_STYLES: Partial<Record<WidgetRole, Record<string, string>>> = {
  pageTitle: { fontSize: "1.875rem", fontStyle: "BOLD" },
  sectionHeader: { fontSize: "1.25rem", fontStyle: "BOLD" },
  kpi: { fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER" },
  body: { fontSize: "1rem", fontStyle: "NORMAL" },
};

function isStaticText(spec: WidgetSpec): boolean {
  return (
    spec.type === "text" &&
    typeof spec.text === "string" &&
    spec.source === undefined &&
    spec.value === undefined
  );
}

// A text bound to a numeric computed value (count or formula) reads as a KPI. `now`/`concat` values are prose
// (dates, joined names) and stay body text.
function isKpiText(spec: WidgetSpec): boolean {
  return (
    spec.type === "text" &&
    spec.value !== undefined &&
    ("count" in spec.value || "formula" in spec.value)
  );
}

export function inferRoles(
  specs: WidgetSpec[],
  options: { pageRoot: boolean },
): WidgetRole[] {
  return specs.map((spec, index) => {
    if (isStaticText(spec)) {
      if (index === 0 && options.pageRoot) return "pageTitle";

      const next = specs[index + 1];

      if (next !== undefined && SECTION_TYPES.has(next.type)) {
        return "sectionHeader";
      }

      return "body";
    }

    if (isKpiText(spec)) return "kpi";

    if (FIELD_TYPES.has(spec.type)) return "field";

    if (spec.type === "button") return "action";

    return "body";
  });
}

export interface LayoutSlot {
  // Index into the spec array this slot places.
  index: number;
  role: WidgetRole;
  leftColumn: number;
  // Width override in grid columns; absent means "use the template footprint".
  columns?: number;
  // Height override in grid rows; absent means "use the template footprint".
  rows?: number;
}

export interface LayoutRow {
  // Vertical gap (grid rows) between this row and the previous one. 0 for the first row.
  gapBefore: number;
  slots: LayoutSlot[];
}

// Equal-split slot width for n widgets across the available columns with fixed gutters.
function packedWidth(available: number, count: number): number {
  return Math.floor((available - (count - 1) * GUTTER) / count);
}

function takeRun(
  roles: WidgetRole[],
  start: number,
  role: WidgetRole,
  max: number,
): number {
  let end = start;

  while (end < roles.length && roles[end] === role && end - start < max)
    end += 1;

  return end;
}

export function planLayout(
  specs: WidgetSpec[],
  roles: WidgetRole[],
  availableColumns: number,
): LayoutRow[] {
  const rows: LayoutRow[] = [];
  let index = 0;

  const gapFor = (rowSlots: LayoutSlot[]): number => {
    if (rows.length === 0) return 0;

    const previous = rows[rows.length - 1].slots;

    if (previous.some((slot) => slot.role === "pageTitle")) {
      return GAP_AFTER_TITLE;
    }

    const first = rowSlots[0];

    if (first.role === "sectionHeader") return GAP_SECTION;

    // A section-type widget gets breathing room unless its own header directly precedes it.
    if (
      SECTION_TYPES.has(specs[first.index].type) &&
      !previous.some((slot) => slot.role === "sectionHeader")
    ) {
      return GAP_SECTION;
    }

    return GAP_WITHIN;
  };

  const push = (slots: LayoutSlot[]) => {
    rows.push({ gapBefore: gapFor(slots), slots });
  };

  while (index < specs.length) {
    const role = roles[index];

    if (role === "field") {
      const end = takeRun(roles, index, "field", 2);
      const count = end - index;
      const width = packedWidth(availableColumns, count);

      if (count === 2 && width >= MIN_PACKED_WIDTH) {
        push([
          { index, role, leftColumn: 0, columns: width },
          {
            index: index + 1,
            role,
            leftColumn: width + GUTTER,
            columns: width,
          },
        ]);
        index = end;
        continue;
      }

      push([{ index, role, leftColumn: 0 }]);
      index += 1;
      continue;
    }

    if (role === "kpi") {
      const end = takeRun(roles, index, "kpi", MAX_KPIS_PER_ROW);
      const count = end - index;
      const width = packedWidth(availableColumns, count);

      if (count >= 2 && width >= MIN_PACKED_WIDTH - 4) {
        const slots: LayoutSlot[] = [];

        for (let i = 0; i < count; i++) {
          slots.push({
            index: index + i,
            role,
            leftColumn: i * (width + GUTTER),
            columns: width,
            rows: 6,
          });
        }

        push(slots);
        index = end;
        continue;
      }

      push([{ index, role, leftColumn: 0, rows: 6 }]);
      index += 1;
      continue;
    }

    if (role === "action") {
      const end = takeRun(roles, index, "action", MAX_ACTIONS_PER_ROW);
      const count = end - index;
      const total = count * BUTTON_COLUMNS + (count - 1) * GUTTER;
      // Actions right-align (form-footer look) when they follow fields; otherwise they pack from the left.
      const followsFields = index > 0 && roles[index - 1] === "field";
      const start =
        followsFields && total <= availableColumns
          ? availableColumns - total
          : 0;

      if (total <= availableColumns) {
        const slots: LayoutSlot[] = [];

        for (let i = 0; i < count; i++) {
          slots.push({
            index: index + i,
            role,
            leftColumn: start + i * (BUTTON_COLUMNS + GUTTER),
            columns: BUTTON_COLUMNS,
          });
        }

        push(slots);
        index = end;
        continue;
      }

      // The run doesn't fit side by side on this canvas: stack one per row at template width.
      push([{ index, role, leftColumn: 0 }]);
      index += 1;
      continue;
    }

    if (role === "pageTitle") {
      push([
        {
          index,
          role,
          leftColumn: 0,
          columns: Math.min(48, availableColumns),
          rows: 5,
        },
      ]);
      index += 1;
      continue;
    }

    if (role === "sectionHeader") {
      push([
        { index, role, leftColumn: 0, columns: Math.min(40, availableColumns) },
      ]);
      index += 1;
      continue;
    }

    push([{ index, role, leftColumn: 0 }]);
    index += 1;
  }

  return rows;
}

// Apply the role's typography to a text widget's props. Only TEXT_WIDGET carries role styling in v1; other widget
// types keep their template defaults. Called before applyTheme so explicit theme tokens still win.
export function applyRoleStyling(
  props: Record<string, unknown>,
  appsmithType: string,
  role: WidgetRole,
): void {
  if (appsmithType !== "TEXT_WIDGET") return;

  const style = TEXT_ROLE_STYLES[role];

  if (style) Object.assign(props, style);
}
