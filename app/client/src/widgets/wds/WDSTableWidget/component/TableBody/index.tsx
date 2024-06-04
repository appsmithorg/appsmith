import React from "react";

import { TableBodyContext } from "./context";
import { StaticTableBody } from "./StaticTableBody";
import type { TableBodyContextType } from "./context";
import type { VirtualTableBodyProps } from "./VirtualTableBody";
import { VirtualTableBody } from "./VirtualTableBody";

export const TableBody = (
  props: VirtualTableBodyProps & TableBodyContextType & { useVirtual: boolean },
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
    useVirtual,
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
      {useVirtual ? (
        <VirtualTableBody rows={rows} {...restOfProps} />
      ) : (
        <StaticTableBody rows={rows} {...restOfProps} />
      )}
    </TableBodyContext.Provider>
  );
};

export { TableBodyContext };
