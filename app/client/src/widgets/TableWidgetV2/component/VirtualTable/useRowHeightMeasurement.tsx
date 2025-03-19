import { useEffect, useMemo, type RefObject } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { VariableSizeList } from "react-window";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { TABLE_SIZES } from "../Constants";

interface CellWithColumnProps {
  column: {
    columnProperties?: {
      allowCellWrapping?: boolean;
      columnType: ColumnTypes;
    };
  };
}

interface UseRowHeightMeasurementProps {
  index: number; // Index of the current row
  row: ReactTableRowType<Record<string, unknown>>; // Row data from react-table
  rowRef?: React.RefObject<HTMLDivElement>; // Reference to the row DOM element
  rowHeights?: RefObject<{ [key: number]: number }>; // Object storing calculated heights for each row
  rowNeedsMeasurement?: RefObject<{ [key: number]: boolean }>; // Tracks which rows need height measurement
  listRef?: RefObject<VariableSizeList> | null; // Reference to the virtualized list component
  forceUpdate: number; // Trigger to force recalculation of row heights
  isInfiniteScrollEnabled?: boolean;
}

/**
 * Hook for dynamically measuring and managing row heights in a virtualized table
 *
 * This hook is crucial for tables with variable row heights when using features like:
 * - Cell wrapping
 * - HTML content in cells
 * - Infinite scrolling
 *
 * The hook measures the actual rendered height of specific cells that might affect row height
 * (cells with wrapping enabled or HTML content) and updates the virtualized list accordingly.
 *
 * The measurement process:
 * 1. Identifies cells that might affect row height (HTML cells or cells with wrapping)
 * 2. Measures their actual rendered height including margins and padding
 * 3. Updates the height in rowHeights and marks the row as measured
 * 4. Notifies the virtualized list to update its internal cache
 */
export function useRowHeightMeasurement({
  forceUpdate,
  index,
  isInfiniteScrollEnabled,
  listRef,
  row,
  rowHeights,
  rowNeedsMeasurement,
  rowRef,
}: UseRowHeightMeasurementProps) {
  const hasPreRequisitesForInfiniteScroll = useMemo(() => {
    return (
      isInfiniteScrollEnabled && rowNeedsMeasurement && rowHeights && rowRef
    );
  }, [isInfiniteScrollEnabled, rowNeedsMeasurement, rowHeights, rowRef]);

  const isAlreadyCalculated =
    rowNeedsMeasurement &&
    rowNeedsMeasurement.current &&
    rowNeedsMeasurement.current[index] === false;

  const hasRowDataAndUIElement = rowRef?.current && row;

  useEffect(() => {
    if (!hasPreRequisitesForInfiniteScroll || !hasRowDataAndUIElement) return;

    // Skip measurement if this row was already processed
    if (isAlreadyCalculated) {
      return;
    }

    const element = rowRef?.current;

    if (!hasRowDataAndUIElement) return;

    // Track cells that might affect row height
    const cellIndexesWithAllowCellWrapping: number[] = [];
    const cellIndexesWithHTMLCell: number[] = [0];

    if (row?.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell, index: number) => {
        const typedCell = cell as unknown as CellWithColumnProps;

        if (typedCell?.column?.columnProperties?.allowCellWrapping) {
          cellIndexesWithAllowCellWrapping.push(index);
        }

        if (
          typedCell?.column?.columnProperties?.columnType === ColumnTypes.HTML
        ) {
          cellIndexesWithHTMLCell.push(index);
        }
      });
    }

    // Get all child elements
    const children = element.children;
    let normalCellHeight = 0;
    let htmlCellHeight = 0;

    cellIndexesWithAllowCellWrapping.forEach((index: number) => {
      const child = children[index] as HTMLElement;
      const dynamicContent = child.querySelector(
        ".t--table-cell-tooltip-target",
      );

      if (dynamicContent) {
        const styles = window.getComputedStyle(dynamicContent);

        // Calculate total height including margins and padding
        normalCellHeight +=
          (dynamicContent as HTMLElement).offsetHeight +
          parseFloat(styles.marginTop) +
          parseFloat(styles.marginBottom) +
          parseFloat(styles.paddingTop) +
          parseFloat(styles.paddingBottom);
      }
    });

    cellIndexesWithHTMLCell.forEach((index: number) => {
      const child = children[index] as HTMLElement;
      const dynamicContent = child.querySelector(
        '[data-testid="t--table-widget-v2-html-cell"]>span',
      );

      if (dynamicContent) {
        const styles = window.getComputedStyle(dynamicContent);

        htmlCellHeight +=
          (dynamicContent as HTMLElement).offsetHeight +
          parseFloat(styles.marginTop) +
          parseFloat(styles.marginBottom) +
          parseFloat(styles.paddingTop) * 2 +
          parseFloat(styles.paddingBottom) * 2;
      }
    });

    const totalHeight =
      Math.max(normalCellHeight, htmlCellHeight) +
      TABLE_SIZES.DEFAULT.VERTICAL_PADDING * 2;

    rowHeights?.current && (rowHeights.current[index] = totalHeight);
    rowNeedsMeasurement?.current &&
      (rowNeedsMeasurement.current[index] = false);
    // Notify the virtualized list to update its cache for this row
    listRef?.current && listRef.current?.resetAfterIndex(index);
  }, [
    index,
    row,
    forceUpdate,
    rowHeights,
    rowNeedsMeasurement,
    listRef,
    rowRef,
  ]);
}
