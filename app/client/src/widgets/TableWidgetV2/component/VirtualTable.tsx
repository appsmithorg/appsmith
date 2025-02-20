import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import VirtualTableInnerElement from "./header/VirtualTableInnerElement";
import { TableBody } from "./TableBody";
import { useAppsmithTable } from "./TableContext";

interface VirtualTableProps {}
const VirtualTable = (_: VirtualTableProps, ref: React.Ref<SimpleBar>) => {
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
    isInfiniteScrollEnabled,
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
      {({ scrollableNodeRef }) => (
        <TableBody
          accentColor={accentColor}
          borderRadius={borderRadius}
          canFreezeColumn={canFreezeColumn}
          columns={columns}
          disableDrag={disableDrag}
          editMode={editMode}
          enableDrag={enableDrag}
          getTableBodyProps={getTableBodyProps}
          handleAllRowSelectClick={handleAllRowSelectClick}
          handleColumnFreeze={handleColumnFreeze}
          handleReorderColumn={handleReorderColumn}
          headerGroups={headerGroups}
          height={height}
          innerElementType={VirtualTableInnerElement}
          isAddRowInProgress={isAddRowInProgress}
          isInfiniteScrollEnabled={isInfiniteScrollEnabled}
          isLoading={isLoading}
          isResizingColumn={isResizingColumn}
          isSortable={isSortable}
          loadMoreFromEvaluations={nextPageClick}
          multiRowSelection={!!multiRowSelection}
          pageSize={pageSize}
          prepareRow={prepareRow}
          primaryColumnId={primaryColumnId}
          ref={scrollableNodeRef}
          rowSelectionState={rowSelectionState}
          rows={subPage}
          selectTableRow={selectTableRow}
          selectedRowIndex={selectedRowIndex}
          selectedRowIndices={selectedRowIndices}
          sortTableColumn={sortTableColumn}
          tableSizes={tableSizes}
          totalColumnsWidth={totalColumnsWidth}
          useVirtual
          widgetId={widgetId}
          width={width}
        />
      )}
    </SimpleBar>
  );
};

export default React.forwardRef(VirtualTable);
