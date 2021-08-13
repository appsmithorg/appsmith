import {
  ColumnTypes,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Row } from "react-table";
import Table from "components/designSystems/appsmith/TableComponent/Table";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isEqual } from "lodash";
import React, { useEffect, useMemo } from "react";

export interface ColumnMenuOptionProps {
  content: string | JSX.Element;
  closeOnClick?: boolean;
  isSelected?: boolean;
  editColumnName?: boolean;
  columnAccessor?: string;
  id?: string;
  category?: boolean;
  options?: ColumnMenuSubOptionProps[];
  onClick?: (columnIndex: number, isSelected: boolean) => void;
}

export interface ColumnMenuSubOptionProps {
  content: string | JSX.Element;
  isSelected?: boolean;
  closeOnClick?: boolean;
  onClick?: (columnIndex: number) => void;
  id?: string;
  category?: boolean;
  isHeader?: boolean;
}

interface ReactTableComponentProps {
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isLoading: boolean;
  editMode: boolean;
  width: number;
  height: number;
  pageSize: number;
  tableData: Array<Record<string, unknown>>;
  disableDrag: (disable: boolean) => void;
  onRowClick: (rowData: Record<string, unknown>, rowIndex: number) => void;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  selectAllRow: (pageData: Row<Record<string, unknown>>[]) => void;
  unSelectAllRow: (pageData: Row<Record<string, unknown>>[]) => void;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  sortTableColumn: (column: string, asc: boolean) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  triggerRowSelection: boolean;
  columnSizeMap?: { [key: string]: number };
  handleResizeColumn: (columnSizeMap: { [key: string]: number }) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  columns: ReactTableColumnProps[];
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
  isVisibleSearch?: boolean;
  isVisibleFilters?: boolean;
  isVisibleDownload?: boolean;
  isVisibleCompactMode?: boolean;
  isVisiblePagination?: boolean;
}

function ReactTableComponent(props: ReactTableComponentProps) {
  const {
    applyFilter,
    columns,
    columnSizeMap,
    compactMode,
    disableDrag,
    editMode,
    filters,
    handleReorderColumn,
    handleResizeColumn,
    height,
    isLoading,
    isVisibleCompactMode,
    isVisibleDownload,
    isVisibleFilters,
    isVisiblePagination,
    isVisibleSearch,
    multiRowSelection,
    nextPageClick,
    onRowClick,
    pageNo,
    pageSize,
    prevPageClick,
    searchKey,
    searchTableData,
    selectAllRow,
    selectedRowIndex,
    selectedRowIndices,
    serverSidePaginationEnabled,
    sortTableColumn: _sortTableColumn,
    tableData,
    triggerRowSelection,
    unSelectAllRow,
    updateCompactMode,
    updatePageNo,
    widgetId,
    widgetName,
    width,
  } = props;

  const sortTableColumn = (columnIndex: number, asc: boolean) => {
    if (columnIndex === -1) {
      _sortTableColumn("", asc);
    } else {
      const column = columns[columnIndex];
      const columnType = column.metaProperties?.type || ColumnTypes.TEXT;
      if (
        columnType !== ColumnTypes.IMAGE &&
        columnType !== ColumnTypes.VIDEO
      ) {
        _sortTableColumn(column.accessor, asc);
      }
    }
  };

  const selectTableRow = (row: {
    original: Record<string, unknown>;
    index: number;
  }) => {
    onRowClick(row.original, row.index);
  };

  const toggleAllRowSelect = (
    isSelect: boolean,
    pageData: Row<Record<string, unknown>>[],
  ) => {
    if (isSelect) {
      selectAllRow(pageData);
    } else {
      unSelectAllRow(pageData);
    }
  };

  return (
    <Table
      applyFilter={applyFilter}
      columnSizeMap={columnSizeMap}
      columns={columns}
      compactMode={compactMode}
      data={tableData}
      disableDrag={() => {
        disableDrag(true);
      }}
      editMode={editMode}
      enableDrag={() => {
        disableDrag(false);
      }}
      filters={filters}
      handleReorderColumn={handleReorderColumn}
      handleResizeColumn={handleResizeColumn}
      height={height}
      isLoading={isLoading}
      isVisibleCompactMode={isVisibleCompactMode}
      isVisibleDownload={isVisibleDownload}
      isVisibleFilters={isVisibleFilters}
      isVisiblePagination={isVisiblePagination}
      isVisibleSearch={isVisibleSearch}
      multiRowSelection={multiRowSelection}
      nextPageClick={nextPageClick}
      pageNo={pageNo - 1}
      pageSize={pageSize || 1}
      prevPageClick={prevPageClick}
      searchKey={searchKey}
      searchTableData={searchTableData}
      selectTableRow={selectTableRow}
      selectedRowIndex={selectedRowIndex}
      selectedRowIndices={selectedRowIndices}
      serverSidePaginationEnabled={serverSidePaginationEnabled}
      sortTableColumn={sortTableColumn}
      toggleAllRowSelect={toggleAllRowSelect}
      triggerRowSelection={triggerRowSelection}
      updateCompactMode={updateCompactMode}
      updatePageNo={updatePageNo}
      widgetId={widgetId}
      widgetName={widgetName}
      width={width}
    />
  );
}

export default React.memo(ReactTableComponent, (prev, next) => {
  return (
    prev.applyFilter === next.applyFilter &&
    prev.compactMode === next.compactMode &&
    prev.disableDrag === next.disableDrag &&
    prev.editMode === next.editMode &&
    prev.filters === next.filters &&
    prev.handleReorderColumn === next.handleReorderColumn &&
    prev.handleResizeColumn === next.handleResizeColumn &&
    prev.height === next.height &&
    prev.isLoading === next.isLoading &&
    prev.isVisibleCompactMode === next.isVisibleCompactMode &&
    prev.isVisibleDownload === next.isVisibleDownload &&
    prev.isVisibleFilters === next.isVisibleFilters &&
    prev.isVisiblePagination === next.isVisiblePagination &&
    prev.isVisibleSearch === next.isVisibleSearch &&
    prev.nextPageClick === next.nextPageClick &&
    prev.onRowClick === next.onRowClick &&
    prev.pageNo === next.pageNo &&
    prev.pageSize === next.pageSize &&
    prev.prevPageClick === next.prevPageClick &&
    prev.searchKey === next.searchKey &&
    prev.searchTableData === next.searchTableData &&
    prev.selectedRowIndex === next.selectedRowIndex &&
    prev.selectedRowIndices === next.selectedRowIndices &&
    prev.serverSidePaginationEnabled === next.serverSidePaginationEnabled &&
    prev.sortTableColumn === next.sortTableColumn &&
    prev.triggerRowSelection === next.triggerRowSelection &&
    prev.updateCompactMode === next.updateCompactMode &&
    prev.updatePageNo === next.updatePageNo &&
    prev.widgetId === next.widgetId &&
    prev.widgetName === next.widgetName &&
    prev.width === next.width &&
    isEqual(prev.columnSizeMap, next.columnSizeMap) &&
    isEqual(prev.tableData, next.tableData) &&
    // Using JSON stringify becuase isEqual doesnt work with functions,
    // and we are not changing the columns manually.
    JSON.stringify(prev.columns) === JSON.stringify(next.columns)
  );
});
