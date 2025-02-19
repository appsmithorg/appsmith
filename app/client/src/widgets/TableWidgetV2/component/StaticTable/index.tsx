import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  MULTISELECT_CHECKBOX_WIDTH,
  TABLE_SCROLLBAR_WIDTH,
} from "../Constants";
import TableColumnHeader from "../header/TableColumnHeader";
import { TableBody } from "../TableBody";
import { useAppsmithTable } from "../TableContext";

interface StaticTableProps {}
const StaticTable = (_: StaticTableProps, ref: React.Ref<SimpleBar>) => {
  const {
    accentColor,
    borderRadius,
    canFreezeColumn,
    columns,
    disableDrag,
    editMode,
    enableDrag,
    getTableBodyProps,
    handleAllRowSelectClick,
    handleColumnFreeze,
    handleReorderColumn,
    headerGroups,
    height,
    isAddRowInProgress,
    isLoading,
    isResizingColumn,
    isSortable,
    multiRowSelection,
    nextPageClick,
    pageSize,
    prepareRow,
    primaryColumnId,
    rowSelectionState,
    scrollContainerStyles,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
    sortTableColumn,
    subPage,
    tableSizes,
    totalColumnsWidth,
    widgetId,
    width,
  } = useAppsmithTable();

  return (
    <SimpleBar ref={ref} style={scrollContainerStyles}>
      <TableColumnHeader
        accentColor={accentColor}
        borderRadius={borderRadius}
        canFreezeColumn={canFreezeColumn}
        columns={columns}
        disableDrag={disableDrag}
        editMode={editMode}
        enableDrag={enableDrag}
        handleAllRowSelectClick={handleAllRowSelectClick}
        handleColumnFreeze={handleColumnFreeze}
        handleReorderColumn={handleReorderColumn}
        headerGroups={headerGroups}
        headerWidth={
          multiRowSelection && totalColumnsWidth
            ? MULTISELECT_CHECKBOX_WIDTH + totalColumnsWidth
            : totalColumnsWidth
        }
        isResizingColumn={isResizingColumn}
        isSortable={isSortable}
        multiRowSelection={multiRowSelection}
        prepareRow={prepareRow}
        rowSelectionState={rowSelectionState}
        sortTableColumn={sortTableColumn}
        subPage={subPage}
        widgetId={widgetId}
        width={width}
      />
      <TableBody
        accentColor={accentColor}
        borderRadius={borderRadius}
        columns={columns}
        getTableBodyProps={getTableBodyProps}
        height={height}
        isAddRowInProgress={isAddRowInProgress}
        isLoading={isLoading}
        loadMoreFromEvaluations={nextPageClick}
        multiRowSelection={!!multiRowSelection}
        pageSize={pageSize}
        prepareRow={prepareRow}
        primaryColumnId={primaryColumnId}
        rows={subPage}
        selectTableRow={selectTableRow}
        selectedRowIndex={selectedRowIndex}
        selectedRowIndices={selectedRowIndices}
        tableSizes={tableSizes}
        useVirtual={false}
        width={width - TABLE_SCROLLBAR_WIDTH / 2}
      />
    </SimpleBar>
  );
};

export default React.forwardRef(StaticTable);
