interface ResolveAreaDimensionsProps {
  /** array of row hights in pixels. */
  rows: number[];
  /** array of column widths in pixels. */
  columns: number[];
  /** 2D array of area names. */
  areas: string[][];
}

/**
 * Resolves dimensions of areas in a grid layout.
 */
export function resolveAreaDimensions({
  areas,
  columns,
  rows,
}: ResolveAreaDimensionsProps) {
  const result: Record<string, { height: number; width: number }> = {};
  const recorded = new Set();

  const getRecordIndex = (type: string, index: number, areaName: string) =>
    `${type}-${index}-${areaName}`;

  for (let rowIndex = 0; rowIndex < areas.length; rowIndex++) {
    const areasRow = areas[rowIndex];
    const rowHeight = rows[rowIndex];

    for (let columnIndex = 0; columnIndex < areasRow.length; columnIndex++) {
      const areaName = areasRow[columnIndex];
      const columnWidth = columns[columnIndex];
      const rowRecordIndex = getRecordIndex("row", rowIndex, areaName);
      const columnRecordIndex = getRecordIndex("column", columnIndex, areaName);

      const areaRowHeight = recorded.has(rowRecordIndex)
        ? result[areaName].height
        : rowHeight + (result[areaName]?.height || 0);

      const areaColumnWidth = recorded.has(columnRecordIndex)
        ? result[areaName].width
        : columnWidth + (result[areaName]?.width || 0);

      result[areaName] = {
        height: areaRowHeight,
        width: areaColumnWidth,
      };

      recorded.add(rowRecordIndex);
      recorded.add(columnRecordIndex);
    }
  }

  return result;
}
