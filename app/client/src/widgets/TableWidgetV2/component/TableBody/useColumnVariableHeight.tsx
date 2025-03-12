import { useRef } from "react";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import type { ReactTableColumnProps } from "../Constants";

function useColumnVariableHeight(columns: ReactTableColumnProps[]) {
  const variableHeightColumnsRef = useRef<number[]>([]);

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
  const configurationChanged =
    columnsNeedingVariableHeight.length !==
      variableHeightColumnsRef.current.length ||
    columnsNeedingVariableHeight.some(
      (colIndex, i) => colIndex !== variableHeightColumnsRef.current[i],
    );

  // Update ref if configuration changed
  if (configurationChanged) {
    variableHeightColumnsRef.current = columnsNeedingVariableHeight;
  }

  return variableHeightColumnsRef.current;
}

export default useColumnVariableHeight;
