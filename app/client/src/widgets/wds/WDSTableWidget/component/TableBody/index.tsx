import React from "react";
import { TableBodyContext } from "./context";
import { StaticTableBody } from "./StaticTableBody";
import type { StaticTableProps } from "./StaticTableBody";
import type { TableBodyContextType } from "./context";

export const TableBody = (
  props: TableBodyContextType &
    StaticTableProps & {
      excludeFromTabOrder?: boolean;
    },
) => {
  const {
    accentColor,
    borderRadius,
    canFreezeColumn,
    columns,
    disableDrag,
    editMode,
    enableDrag,
    handleAllRowSelectClick,
    handleColumnFreeze,
    handleReorderColumn,
    headerGroups,
    isAddRowInProgress,
    isResizingColumn,
    isSortable,
    multiRowSelection,
    prepareRow,
    primaryColumnId,
    rows,
    rowSelectionState,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
    sortTableColumn,
    subPage,
    widgetId,
    width,
    ...restOfProps
  } = props;

  return (
    <TableBodyContext.Provider
      value={{
        accentColor,
        canFreezeColumn,
        disableDrag,
        editMode,
        enableDrag,
        handleAllRowSelectClick,
        handleColumnFreeze,
        handleReorderColumn,
        headerGroups,
        isResizingColumn,
        isSortable,
        rowSelectionState,
        sortTableColumn,
        subPage,
        widgetId,
        isAddRowInProgress,
        borderRadius,
        multiRowSelection,
        prepareRow,
        primaryColumnId,
        selectedRowIndex,
        selectedRowIndices,
        selectTableRow,
        columns,
        rows,
        width,
        getTableBodyProps: props.getTableBodyProps,
        totalColumnsWidth: props.totalColumnsWidth,
      }}
    >
      <StaticTableBody rows={rows} {...restOfProps} />
    </TableBodyContext.Provider>
  );
};

export { TableBodyContext };
