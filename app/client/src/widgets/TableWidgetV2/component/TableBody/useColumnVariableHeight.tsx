import { useRef } from "react";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import type { ReactTableColumnProps } from "../Constants";
import type { Row as ReactTableRowType } from "react-table";

function useColumnVariableHeight(
  columns: ReactTableColumnProps[],
  row: ReactTableRowType<Record<string, unknown>>,
) {
  const variableHeightColumnsRef = useRef<number[]>([]);
  const previousRowDataRef = useRef<Record<string, unknown> | null>(null);

  // Identify columns that need variable height handling (wrapping or HTML)
  const columnsNeedingVariableHeight = columns
    .map((col, index) => {
      // Check for columns with wrapping enabled
      if (col.columnProperties?.allowCellWrapping) {
        return index;
      }

      // Check for with HTML type
      if (col.columnProperties?.columnType === ColumnTypes.HTML) {
        return index;
      }

      return -1;
    })
    .filter((index) => index !== -1);

  // Check if variable height configuration has changed
  const columnsConfigChanged =
    columnsNeedingVariableHeight.length !==
      variableHeightColumnsRef.current.length ||
    columnsNeedingVariableHeight.some(
      (colIndex, i) => colIndex !== variableHeightColumnsRef.current[i],
    );

  // Check if row data has changed
  const currentRowData = row?.original || {};
  const rowDataChanged = hasRowDataChanged(
    currentRowData,
    previousRowDataRef.current,
  );

  // Update refs if configuration or data changed
  if (columnsConfigChanged || rowDataChanged) {
    variableHeightColumnsRef.current = columnsNeedingVariableHeight;
    previousRowDataRef.current = { ...currentRowData };
  }

  return variableHeightColumnsRef.current;
}

// Helper function to check if row data has changed
function hasRowDataChanged(
  currentData: Record<string, unknown>,
  previousData: Record<string, unknown> | null,
): boolean {
  if (!previousData) return true;

  // Check if the keys are different
  const currentKeys = Object.keys(currentData);
  const previousKeys = Object.keys(previousData);

  if (currentKeys.length !== previousKeys.length) return true;

  // Check if any values have changed for the variable height columns
  for (const key of currentKeys) {
    if (currentData[key] !== previousData[key]) {
      return true;
    }
  }

  return false;
}

export default useColumnVariableHeight;
