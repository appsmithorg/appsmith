import type { AnimatedGridUnit } from "../types";
import { normalizeMeasurement } from "./normalizeMeasurement";
export interface ResolveAreasVisibilityProps {
  /** Used for CSS grid-template-rows, limited to px & fr. */
  rows: AnimatedGridUnit[];
  /** Used for CSS grid-template-columns, limited to px & fr. */
  columns: AnimatedGridUnit[];
  /** Used for CSS grid-template-areas. */
  areas: string[][];
}

/**
 * Resolves the visibility of areas in a grid layout.
 */
export function resolveAreasVisibility({
  areas,
  columns,
  rows,
}: ResolveAreasVisibilityProps): Record<string, boolean> {
  const normalizedRows = rows.map(normalizeMeasurement);
  const normalizeColumns = columns.map(normalizeMeasurement);

  const result: Record<string, boolean> = {};
  for (let rowIndex = 0; rowIndex < areas.length; rowIndex++) {
    const areasRow = areas[rowIndex];
    for (let columnIndex = 0; columnIndex < areasRow.length; columnIndex++) {
      result[areasRow[columnIndex]] = false;
    }
  }

  for (let rowIndex = 0; rowIndex < areas.length; rowIndex++) {
    const areasRow = areas[rowIndex];

    if (normalizedRows[rowIndex]) {
      for (let columnIndex = 0; columnIndex < areasRow.length; columnIndex++) {
        const areaName = areasRow[columnIndex];
        if (normalizeColumns[columnIndex] && areasRow.includes(areaName)) {
          result[areaName] = true;
        }
      }
    }
  }

  return result;
}
