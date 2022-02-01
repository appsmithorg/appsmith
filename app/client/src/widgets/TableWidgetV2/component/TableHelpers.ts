import { uniq, without, isNaN } from "lodash";
import { ColumnProperties } from "./Constants";

export const reorderColumns = (
  columns: Record<string, ColumnProperties>,
  columnOrder: string[],
) => {
  const newColumnsInOrder: Record<string, ColumnProperties> = {};
  uniq(columnOrder).forEach((id: string, index: number) => {
    if (columns[id]) newColumnsInOrder[id] = { ...columns[id], index };
  });
  const remaining = without(
    Object.keys(columns),
    ...Object.keys(newColumnsInOrder),
  );
  const len = Object.keys(newColumnsInOrder).length;
  if (remaining && remaining.length > 0) {
    remaining.forEach((id: string, index: number) => {
      newColumnsInOrder[id] = { ...columns[id], index: len + index };
    });
  }
  return newColumnsInOrder;
};
