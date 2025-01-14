import React from "react";
import Table from "./Table";
import type {
  AddNewRowActions,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
  StickyType,
} from "./Constants";
import type { Row } from "react-table";

import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import equal from "fast-deep-equal/es6";
import type { EditableCell, TableVariant } from "../constants";
import { ColumnTypes } from "../constants";
import { useCallback } from "react";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearch: (searchKey: any) => void;
  filters?: ReactTableFilter[];
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
  boxShadow: string;
  borderColor?: string;
  borderWidth?: number;
  variant?: TableVariant;
  isEditableCellsValid?: Record<string, boolean>;
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  allowRowSelection: boolean;
  allowSorting: boolean;
  disabledAddNewRowSave: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  canFreezeColumn?: boolean;
  showConnectDataOverlay: boolean;
  onConnectData: () => void;
  excludeFromTabOrder?: boolean;
  disableScroll?: boolean;
}

function ReactTableComponent(props: ReactTableComponentProps) {
  const {
    allowAddNewRow,
    allowRowSelection,
    allowSorting,
    borderColor,
    borderWidth,
    canFreezeColumn,
    columns,
    columnWidthMap,
    compactMode,
    delimiter,
    disabledAddNewRowSave,
    disableDrag,
    disableScroll,
    editableCell,
    editMode,
    filters,
    handleColumnFreeze,
    handleReorderColumn,
    handleResizeColumn,
    height,
    isAddRowInProgress,
    isLoading,
    isSortable,
    isVisibleDownload,
    isVisibleFilters,
    isVisiblePagination,
    isVisibleSearch,
    multiRowSelection,
    nextPageClick,
    onAddNewRow,
    onAddNewRowAction,
    onBulkEditDiscard,
    onBulkEditSave,
    onConnectData,
    onRowClick,
    onSearch,
    pageNo,
    pageSize,
    prevPageClick,
    primaryColumnId,
    searchKey,
    selectAllRow,
    selectedRowIndex,
    selectedRowIndices,
    serverSidePaginationEnabled,
    showConnectDataOverlay,
    sortTableColumn: _sortTableColumn,
    tableData,
    totalRecordsCount,
    triggerRowSelection,
    unSelectAllRow,
    updatePageNo,
    variant,
    widgetId,
    widgetName,
    width,
  } = props;

  const sortTableColumn = useCallback(
    (columnIndex: number, asc: boolean) => {
      if (allowSorting) {
        if (columnIndex === -1) {
          _sortTableColumn("", asc);
        } else {
          const column = columns[columnIndex];
          if (!column) return; // Safety check to ensure column exists
          const columnType = column.metaProperties?.type || ColumnTypes.TEXT;

          if (
            columnType !== ColumnTypes.IMAGE &&
            columnType !== ColumnTypes.VIDEO
          ) {
            _sortTableColumn(column.alias, asc);
          }
        }
      }
    },
    [_sortTableColumn, allowSorting, columns],
  );

  const selectTableRow = useCallback(
    (row: { original: Record<string, unknown>; index: number }) => {
      if (allowRowSelection) {
        onRowClick(row.original, row.index);
      }
    },
    [allowRowSelection, onRowClick],
  );

  const toggleAllRowSelect = useCallback(
    (isSelect: boolean, pageData: Row<Record<string, unknown>>[]) => {
      if (allowRowSelection) {
        if (isSelect) {
          selectAllRow(pageData);
        } else {
          unSelectAllRow(pageData);
        }
      }
    },
    [allowRowSelection, selectAllRow, unSelectAllRow],
  );

  const memoziedDisableDrag = useCallback(
    () => disableDrag(true),
    [disableDrag],
  );
  const memoziedEnableDrag = useCallback(
    () => disableDrag(false),
    [disableDrag],
  );

  return (
    <Table
      accentColor={props.accentColor}
      allowAddNewRow={allowAddNewRow}
      borderColor={borderColor}
      borderRadius={props.borderRadius}
      borderWidth={borderWidth}
      boxShadow={props.boxShadow}
      canFreezeColumn={canFreezeColumn}
      columnWidthMap={columnWidthMap}
      columns={columns}
      compactMode={compactMode}
      data={tableData}
      delimiter={delimiter}
      disableDrag={memoziedDisableDrag}
      disableScroll={disableScroll}
      disabledAddNewRowSave={disabledAddNewRowSave}
      editMode={editMode}
      editableCell={editableCell}
      enableDrag={memoziedEnableDrag}
      excludeFromTabOrder={props.excludeFromTabOrder}
      filters={filters}
      handleColumnFreeze={handleColumnFreeze}
      handleReorderColumn={handleReorderColumn}
      handleResizeColumn={handleResizeColumn}
      height={height}
      isAddRowInProgress={isAddRowInProgress}
      isLoading={isLoading}
      isSortable={isSortable}
      isVisibleDownload={isVisibleDownload}
      isVisibleFilters={isVisibleFilters}
      isVisiblePagination={isVisiblePagination}
      isVisibleSearch={isVisibleSearch}
      multiRowSelection={multiRowSelection}
      nextPageClick={nextPageClick}
      onAddNewRow={onAddNewRow}
      onAddNewRowAction={onAddNewRowAction}
      onBulkEditDiscard={onBulkEditDiscard}
      onBulkEditSave={onBulkEditSave}
      onConnectData={onConnectData}
      onSearch={onSearch}
      pageNo={pageNo - 1}
      pageSize={pageSize || 1}
      prevPageClick={prevPageClick}
      primaryColumnId={primaryColumnId}
      searchKey={searchKey}
      selectTableRow={selectTableRow}
      selectedRowIndex={selectedRowIndex}
      selectedRowIndices={selectedRowIndices}
      serverSidePaginationEnabled={serverSidePaginationEnabled}
      showConnectDataOverlay={showConnectDataOverlay}
      sortTableColumn={sortTableColumn}
      toggleAllRowSelect={toggleAllRowSelect}
      totalRecordsCount={totalRecordsCount}
      triggerRowSelection={triggerRowSelection}
      updatePageNo={updatePageNo}
      variant={variant}
      widgetId={widgetId}
      widgetName={widgetName}
      width={width}
    />
  );
}

export default React.memo(ReactTableComponent, (prev, next) => {
  return (
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
    prev.onSearch === next.onSearch &&
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
    prev.borderWidth === next.borderWidth &&
    prev.borderColor === next.borderColor &&
    prev.accentColor === next.accentColor &&
    //shallow equal possible
    equal(prev.columnWidthMap, next.columnWidthMap) &&
    //static reference
    prev.tableData === next.tableData &&
    // Using JSON stringify becuase isEqual doesnt work with functions,
    // and we are not changing the columns manually.
    prev.columns === next.columns &&
    equal(prev.editableCell, next.editableCell) &&
    prev.variant === next.variant &&
    prev.primaryColumnId === next.primaryColumnId &&
    equal(prev.isEditableCellsValid, next.isEditableCellsValid) &&
    prev.isAddRowInProgress === next.isAddRowInProgress &&
    prev.allowAddNewRow === next.allowAddNewRow &&
    prev.allowRowSelection === next.allowRowSelection &&
    prev.allowSorting === next.allowSorting &&
    prev.disabledAddNewRowSave === next.disabledAddNewRowSave &&
    prev.canFreezeColumn === next.canFreezeColumn &&
    prev.showConnectDataOverlay === next.showConnectDataOverlay &&
    prev.disableScroll === next.disableScroll
  );
});
