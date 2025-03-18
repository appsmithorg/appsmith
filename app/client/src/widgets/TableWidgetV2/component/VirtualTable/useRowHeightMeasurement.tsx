import { useEffect, type RefObject } from "react";
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
  index: number;
  row: ReactTableRowType<Record<string, unknown>>;
  rowRef?: React.RefObject<HTMLDivElement>;
  rowHeights: RefObject<{ [key: number]: number }>;
  rowNeedsMeasurement: RefObject<{ [key: number]: boolean }>;
  listRef: RefObject<VariableSizeList> | null;
  forceUpdate: number;
  isInfiniteScrollEnabled?: boolean;
}

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
  useEffect(() => {
    if (
      !isInfiniteScrollEnabled ||
      !rowNeedsMeasurement ||
      !rowHeights ||
      !rowRef
    )
      return;

    if (
      rowNeedsMeasurement.current &&
      rowNeedsMeasurement.current[index] === false
    ) {
      return;
    }

    const element = rowRef.current;

    if (!element || !row) return;

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

    rowHeights.current && (rowHeights.current[index] = totalHeight);
    rowNeedsMeasurement.current && (rowNeedsMeasurement.current[index] = false);
    listRef && listRef.current?.resetAfterIndex(index);
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
