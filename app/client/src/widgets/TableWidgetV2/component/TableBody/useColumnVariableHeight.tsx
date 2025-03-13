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

  const columnsNeedingVariableHeight = columns
    .map((col, index) => {
      if (col.columnProperties?.allowCellWrapping) {
        return index;
      }

      if (col.columnProperties?.columnType === ColumnTypes.HTML) {
        return index;
      }

      return -1;
    })
    .filter((index) => index !== -1);

  const columnsConfigChanged =
    columnsNeedingVariableHeight.length !==
      variableHeightColumnsRef.current.length ||
    columnsNeedingVariableHeight.some(
      (colIndex, i) => colIndex !== variableHeightColumnsRef.current[i],
    );

  const currentRowData = row?.original || {};
  const rowDataChanged = hasRowDataChanged(
    currentRowData,
    previousRowDataRef.current,
  );

  if (columnsConfigChanged || rowDataChanged) {
    variableHeightColumnsRef.current = columnsNeedingVariableHeight;
    previousRowDataRef.current = { ...currentRowData };
  }

  return variableHeightColumnsRef.current;
}

function hasRowDataChanged(
  currentData: Record<string, unknown>,
  previousData: Record<string, unknown> | null,
): boolean {
  if (!previousData) return true;

  const currentKeys = Object.keys(currentData);
  const previousKeys = Object.keys(previousData);

  if (currentKeys.length !== previousKeys.length) return true;

  for (const key of currentKeys) {
    if (currentData[key] !== previousData[key]) {
      return true;
    }
  }

  return false;
}

export default useColumnVariableHeight;
