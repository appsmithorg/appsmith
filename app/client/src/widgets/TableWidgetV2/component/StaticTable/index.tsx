import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { TABLE_SCROLLBAR_WIDTH } from "../Constants";
import TableColumnHeader from "../header/TableColumnHeader";
import { TableBody } from "../TableBody";
import { useAppsmithTable } from "../TableContext";

interface StaticTableProps {}
const StaticTable = (_: StaticTableProps, ref: React.Ref<SimpleBar>) => {
  const {
    accentColor,
    borderRadius,
    columns,
    getTableBodyProps,
    height,
    isAddRowInProgress,
    isLoading,
    multiRowSelection,
    nextPageClick,
    pageSize,
    prepareRow,
    primaryColumnId,
    scrollContainerStyles,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
    subPage,
    tableSizes,
    width,
  } = useAppsmithTable();

  return (
    <SimpleBar ref={ref} style={scrollContainerStyles}>
      <TableColumnHeader />
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
