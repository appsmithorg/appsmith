import React from "react";
import {
  useTable,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { TableWrapper } from "./TableStyledWrappers";
import { ReactTableFilter } from "components/designSystems/appsmith/TableComponent/TableFilters";
import { TableHeaderCell, renderEmptyRows } from "./TableUtilities";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";
import {
  ReactTableColumnProps,
  TABLE_SIZES,
  CompactMode,
  CompactModeTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors } from "constants/Colors";

import { EventType } from "constants/ActionConstants";
import ScrollIndicator from "components/ads/ScrollIndicator";

interface TableProps {
  width: number;
  height: number;
  pageSize: number;
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isLoading: boolean;
  columnSizeMap?: { [key: string]: number };
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  data: Array<Record<string, unknown>>;
  editMode: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  handleResizeColumn: (columnSizeMap: { [key: string]: number }) => void;
  selectTableRow: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  pageNo: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  disableDrag: () => void;
  enableDrag: () => void;
  triggerRowSelection: boolean;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
}

const defaultColumn = {
  minWidth: 30,
  width: 150,
};

export const Table = (props: TableProps) => {
  const isResizingColumn = React.useRef(false);
  const tableWrapperRef = React.useRef<HTMLDivElement>(null);

  const handleResizeColumn = (columnWidths: Record<string, number>) => {
    const columnSizeMap = {
      ...props.columnSizeMap,
      ...columnWidths,
    };
    for (const i in columnSizeMap) {
      if (columnSizeMap[i] < 60) {
        columnSizeMap[i] = 60;
      } else if (columnSizeMap[i] === undefined) {
        const columnCounts = props.columns.filter((column) => !column.isHidden)
          .length;
        columnSizeMap[i] = props.width / columnCounts;
      }
    }
    props.handleResizeColumn(columnSizeMap);
  };
  const data = React.useMemo(() => props.data, [props.data]);
  const columnString = JSON.stringify({
    columns: props.columns,
    compactMode: props.compactMode,
    columnSizeMap: props.columnSizeMap,
  });
  const columns = React.useMemo(() => props.columns, [columnString]);
  const pageCount = Math.ceil(props.data.length / props.pageSize);
  const currentPageIndex = props.pageNo < pageCount ? props.pageNo : 0;
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageOptions,
    state,
  } = useTable(
    {
      columns: columns,
      data,
      defaultColumn,
      initialState: {
        pageIndex: currentPageIndex,
        pageSize: props.pageSize,
      },
      manualPagination: true,
      pageCount,
    },
    useBlockLayout,
    useResizeColumns,
    usePagination,
    useRowSelect,
  );
  //Set isResizingColumn as true when column is resizing using table state
  if (state.columnResizing.isResizingColumn) {
    isResizingColumn.current = true;
  } else {
    // We are updating column size since the drag is complete when we are changing value of isResizing from true to false
    if (isResizingColumn.current) {
      //update isResizingColumn in next event loop so that dragEnd event does not trigger click event.
      setTimeout(function() {
        isResizingColumn.current = false;
        handleResizeColumn(state.columnResizing.columnWidths);
      }, 0);
    }
  }
  let startIndex = currentPageIndex * props.pageSize;
  let endIndex = startIndex + props.pageSize;
  if (props.serverSidePaginationEnabled) {
    startIndex = 0;
    endIndex = props.data.length;
  }
  const subPage = page.slice(startIndex, endIndex);
  const selectedRowIndex = props.selectedRowIndex;
  const selectedRowIndices = props.selectedRowIndices || [];
  const tableSizes = TABLE_SIZES[props.compactMode || CompactModeTypes.DEFAULT];
  /* Subtracting 9px to handling widget padding */
  return (
    <TableWrapper
      width={props.width}
      height={props.height}
      tableSizes={tableSizes}
      id={`table${props.widgetId}`}
      triggerRowSelection={props.triggerRowSelection}
      backgroundColor={Colors.ATHENS_GRAY_DARKER}
      ref={tableWrapperRef}
    >
      <TableHeader
        width={props.width}
        tableData={props.data}
        tableColumns={props.columns}
        searchTableData={props.searchTableData}
        searchKey={props.searchKey}
        updatePageNo={props.updatePageNo}
        nextPageClick={props.nextPageClick}
        prevPageClick={props.prevPageClick}
        pageNo={props.pageNo}
        pageCount={pageCount}
        currentPageIndex={currentPageIndex}
        pageOptions={pageOptions}
        widgetName={props.widgetName}
        serverSidePaginationEnabled={props.serverSidePaginationEnabled}
        columns={props.columns.filter((column: ReactTableColumnProps) => {
          return column.accessor !== "actions";
        })}
        hiddenColumns={props.hiddenColumns}
        updateHiddenColumns={props.updateHiddenColumns}
        filters={props.filters}
        applyFilter={props.applyFilter}
        editMode={props.editMode}
        compactMode={props.compactMode}
        updateCompactMode={props.updateCompactMode}
        tableSizes={tableSizes}
      />
      <div className={props.isLoading ? Classes.SKELETON : "tableWrap"}>
        <div {...getTableProps()} className="table">
          <div
            onMouseOver={props.disableDrag}
            onMouseLeave={props.enableDrag}
            className="thead"
          >
            {headerGroups.map((headerGroup: any, index: number) => (
              <div
                {...headerGroup.getHeaderGroupProps()}
                className="tr"
                key={index}
              >
                {headerGroup.headers.map((column: any, columnIndex: number) => {
                  return (
                    <TableHeaderCell
                      key={columnIndex}
                      column={column}
                      columnName={column.Header}
                      columnIndex={columnIndex}
                      isHidden={column.isHidden}
                      sortTableColumn={props.sortTableColumn}
                      isAscOrder={column.isAscOrder}
                      isResizingColumn={isResizingColumn.current}
                    />
                  );
                })}
              </div>
            ))}
            {headerGroups.length === 0 &&
              renderEmptyRows(
                1,
                props.columns,
                props.width,
                subPage,
                prepareRow,
              )}
          </div>
          <div
            {...getTableBodyProps()}
            className={`tbody ${
              props.pageSize > subPage.length ? "no-scroll" : ""
            }`}
          >
            {subPage.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <div
                  {...row.getRowProps()}
                  className={
                    "tr" +
                    `${
                      row.index === selectedRowIndex ||
                      selectedRowIndices.includes(row.index)
                        ? " selected-row"
                        : ""
                    }`
                  }
                  onClick={(e) => {
                    row.toggleRowSelected();
                    props.selectTableRow(row);
                    e.stopPropagation();
                  }}
                  key={rowIndex}
                >
                  {row.cells.map((cell, cellIndex) => {
                    return (
                      <div
                        {...cell.getCellProps()}
                        className="td"
                        key={cellIndex}
                        data-rowindex={rowIndex}
                        data-colindex={cellIndex}
                      >
                        {cell.render("Cell")}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {props.pageSize > subPage.length &&
              renderEmptyRows(
                props.pageSize - subPage.length,
                props.columns,
                props.width,
                subPage,
                prepareRow,
              )}
          </div>
        </div>
      </div>
      <ScrollIndicator containerRef={tableWrapperRef} mode="LIGHT" />
    </TableWrapper>
  );
};

export default Table;
