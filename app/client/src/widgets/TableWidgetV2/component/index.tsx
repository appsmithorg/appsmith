import React, { useEffect, useMemo } from "react";
import Table from "./Table";
import {
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
} from "./Constants";
import { Row } from "react-table";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isEqual } from "lodash";
import { ColumnTypes, EditableCell } from "../constants";
import { useCallback } from "react";

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
  editableCell: EditableCell;
  width: number;
  height: number;
  pageSize: number;
  totalRecordsCount?: number;
  tableData: Array<Record<string, unknown>>;
  disableDrag: (disable: boolean) => void;
  onBulkEditDiscard: () => void;
  onBulkEditSave: () => void;
  onRowClick: (rowData: Record<string, unknown>, rowIndex: number) => void;
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
  columnWidthMap?: { [key: string]: number };
  handleResizeColumn: (columnWidthMap: { [key: string]: number }) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  columns: ReactTableColumnProps[];
  compactMode?: CompactMode;
  isVisibleSearch?: boolean;
  isVisibleFilters?: boolean;
  isVisibleDownload?: boolean;
  isVisiblePagination?: boolean;
  delimiter: string;
  isSortable?: boolean;
  accentColor: string;
  borderRadius: string;
  boxShadow?: string;
}

function ReactTableComponent(props: ReactTableComponentProps) {
  const {
    applyFilter,
    columns,
    columnWidthMap,
    compactMode,
    delimiter,
    disableDrag,
    editableCell,
    editMode,
    filters,
    handleReorderColumn,
    handleResizeColumn,
    height,
    isLoading,
    isSortable,
    isVisibleDownload,
    isVisibleFilters,
    isVisiblePagination,
    isVisibleSearch,
    multiRowSelection,
    nextPageClick,
    onBulkEditDiscard,
    onBulkEditSave,
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
    totalRecordsCount,
    triggerRowSelection,
    unSelectAllRow,
    updatePageNo,
    widgetId,
    widgetName,
    width,
  } = props;

  const { columnOrder, hiddenColumns } = useMemo(() => {
    const order: string[] = [];
    const hidden: string[] = [];
    columns.forEach((item) => {
      if (item.isHidden) {
        hidden.push(item.alias);
      } else {
        order.push(item.alias);
      }
    });
    return {
      columnOrder: order,
      hiddenColumns: hidden,
    };
  }, [columns]);

  useEffect(() => {
    let dragged = -1;
    const headers = Array.prototype.slice.call(
      document.querySelectorAll(`#table${widgetId} .draggable-header`),
    );
    headers.forEach((header, i) => {
      header.setAttribute("draggable", true);

      header.ondragstart = (e: React.DragEvent<HTMLDivElement>) => {
        header.style =
          "background: #efefef; border-radius: 4px; z-index: 100; width: 100%; text-overflow: none; overflow: none;";
        e.stopPropagation();
        dragged = i;
      };

      header.ondrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
      };

      header.ondragend = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        e.stopPropagation();
        setTimeout(() => (dragged = -1), 1000);
      };

      // the dropped header
      header.ondragover = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragged && dragged !== -1) {
          if (dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragged < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragenter = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragged && dragged !== -1) {
          if (dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragged < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragleave = (e: React.DragEvent<HTMLDivElement>) => {
        header.parentElement.className = "th header-reorder";
        e.preventDefault();
      };

      header.ondrop = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        header.parentElement.className = "th header-reorder";
        if (i !== dragged && dragged !== -1) {
          e.preventDefault();
          const newColumnOrder = [...columnOrder];
          // The dragged column
          const movedColumnName = newColumnOrder.splice(dragged, 1);

          // If the dragged column exists
          if (movedColumnName && movedColumnName.length === 1) {
            newColumnOrder.splice(i, 0, movedColumnName[0]);
          }
          handleReorderColumn([...newColumnOrder, ...hiddenColumns]);
        } else {
          dragged = -1;
        }
      };
    });
  }, [props.columns.map((column) => column.alias).toString()]);

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
        _sortTableColumn(column.alias, asc);
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

  const memoziedDisableDrag = useCallback(() => disableDrag(true), [
    disableDrag,
  ]);
  const memoziedEnableDrag = useCallback(() => disableDrag(false), [
    disableDrag,
  ]);

  return (
    <Table
      accentColor={props.accentColor}
      applyFilter={applyFilter}
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      columnWidthMap={columnWidthMap}
      columns={columns}
      compactMode={compactMode}
      data={tableData}
      delimiter={delimiter}
      disableDrag={memoziedDisableDrag}
      editMode={editMode}
      editableCell={editableCell}
      enableDrag={memoziedEnableDrag}
      filters={filters}
      handleResizeColumn={handleResizeColumn}
      height={height}
      isLoading={isLoading}
      isSortable={isSortable}
      isVisibleDownload={isVisibleDownload}
      isVisibleFilters={isVisibleFilters}
      isVisiblePagination={isVisiblePagination}
      isVisibleSearch={isVisibleSearch}
      multiRowSelection={multiRowSelection}
      nextPageClick={nextPageClick}
      onBulkEditDiscard={onBulkEditDiscard}
      onBulkEditSave={onBulkEditSave}
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
      totalRecordsCount={totalRecordsCount}
      triggerRowSelection={triggerRowSelection}
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
    prev.delimiter === next.delimiter &&
    prev.disableDrag === next.disableDrag &&
    prev.editMode === next.editMode &&
    prev.isSortable === next.isSortable &&
    prev.filters === next.filters &&
    prev.handleReorderColumn === next.handleReorderColumn &&
    prev.handleResizeColumn === next.handleResizeColumn &&
    prev.height === next.height &&
    prev.isLoading === next.isLoading &&
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
    prev.totalRecordsCount === next.totalRecordsCount &&
    prev.triggerRowSelection === next.triggerRowSelection &&
    prev.updatePageNo === next.updatePageNo &&
    prev.widgetId === next.widgetId &&
    prev.widgetName === next.widgetName &&
    prev.width === next.width &&
    prev.borderRadius === next.borderRadius &&
    prev.boxShadow === next.boxShadow &&
    prev.accentColor === next.accentColor &&
    isEqual(prev.columnWidthMap, next.columnWidthMap) &&
    isEqual(prev.tableData, next.tableData) &&
    // Using JSON stringify becuase isEqual doesnt work with functions,
    // and we are not changing the columns manually.
    JSON.stringify(prev.columns) === JSON.stringify(next.columns) &&
    JSON.stringify(prev.editableCell) === JSON.stringify(next.editableCell)
  );
});
