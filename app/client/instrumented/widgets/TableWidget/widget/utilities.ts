import { isNumber } from "lodash";

export const getOriginalRowIndex = (
  oldTableData: Array<Record<string, unknown>>,
  newTableData: Array<Record<string, unknown>>,
  selectedRowIndex: number | undefined,
) => {
  const primaryKey =
    selectedRowIndex !== undefined &&
    oldTableData &&
    oldTableData[selectedRowIndex] &&
    oldTableData[selectedRowIndex].__primaryKey__
      ? oldTableData[selectedRowIndex].__primaryKey__
      : null;
  if (primaryKey && newTableData) {
    const selectedRow = newTableData.find(
      (item) => item.__primaryKey__ === primaryKey,
    );
    if (selectedRow) {
      return selectedRow.__originalIndex__ as number;
    }
  }
};

export const selectRowIndex = (
  oldTableData: Array<Record<string, unknown>>,
  newTableData: Array<Record<string, unknown>>,
  defaultSelectedRow: string | number | number[] | undefined,
  selectedRowIndexProp: number | undefined,
  primaryColumnId: string | undefined,
) => {
  let selectedRowIndex = isNumber(defaultSelectedRow) ? defaultSelectedRow : -1;
  if (
    selectedRowIndexProp !== -1 &&
    selectedRowIndexProp !== undefined &&
    primaryColumnId
  ) {
    const rowIndex = getOriginalRowIndex(
      oldTableData,
      newTableData,
      selectedRowIndexProp,
    );
    if (rowIndex !== undefined) {
      selectedRowIndex = rowIndex;
    }
  }
  return selectedRowIndex;
};

export const selectRowIndices = (
  oldTableData: Array<Record<string, unknown>>,
  newTableData: Array<Record<string, unknown>>,
  defaultSelectedRow: string | number | number[] | undefined,
  selectedRowIndicesProp: number[] | undefined,
  primaryColumnId: string | undefined,
) => {
  const rowIndices: number[] =
    Array.isArray(selectedRowIndicesProp) && primaryColumnId
      ? selectedRowIndicesProp
      : Array.isArray(defaultSelectedRow)
      ? defaultSelectedRow
      : [];
  const selectedRowIndices = rowIndices
    .map((index: number) => {
      const rowIndex = getOriginalRowIndex(oldTableData, newTableData, index);
      return rowIndex;
    })
    .filter((index) => index !== undefined);
  return selectedRowIndices;
};
