import React from "react";
import {
  useTable,
  usePagination,
  useFlexLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { TableWrapper } from "./TableStyledWrappers";
import {
  ReactTableColumnProps,
  ColumnMenuOptionProps,
} from "./ReactTableComponent";
import { TableHeaderCell, renderEmptyRows } from "./TableUtilities";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

export enum TABLE_SIZES {
  COLUMN_HEADER_HEIGHT = 52,
  TABLE_HEADER_HEIGHT = 61,
  ROW_HEIGHT = 52,
}

interface TableProps {
  width: number;
  height: number;
  pageSize: number;
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isLoading: boolean;
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  data: object[];
  displayColumnActions: boolean;
  columnNameMap?: { [key: string]: string };
  getColumnMenu: (columnIndex: number) => ColumnMenuOptionProps[];
  handleColumnNameUpdate: (columnIndex: number, columnName: string) => void;
  handleResizeColumn: Function;
  selectTableRow: (
    row: { original: object; index: number },
    isSelected: boolean,
  ) => void;
  pageNo: number;
  updatePageNo: Function;
  nextPageClick: () => void;
  prevPageClick: () => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  disableDrag: () => void;
  enableDrag: () => void;
  searchTableData: (searchKey: any) => void;
  columnActions?: ColumnAction[];
}

export const Table = (props: TableProps) => {
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );
  const pageCount = Math.ceil(props.data.length / props.pageSize);
  const currentPageIndex = props.pageNo < pageCount ? props.pageNo : 0;
  const data = React.useMemo(() => props.data, [JSON.stringify(props.data)]);
  const columns = React.useMemo(() => props.columns, [
    JSON.stringify(props.columns),
    JSON.stringify(props.columnActions),
  ]);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageOptions,
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
    useFlexLayout,
    useResizeColumns,
    usePagination,
    useRowSelect,
  );
  let startIndex = currentPageIndex * props.pageSize;
  let endIndex = startIndex + props.pageSize;
  if (props.serverSidePaginationEnabled) {
    startIndex = 0;
    endIndex = props.data.length;
  }
  const subPage = page.slice(startIndex, endIndex);
  const selectedRowIndex = props.selectedRowIndex;
  return (
    <TableWrapper
      width={props.width}
      height={props.height}
      id={`table${props.widgetId}`}
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
        displayColumnActions={props.displayColumnActions}
      />
      <div className={props.isLoading ? Classes.SKELETON : "tableWrap"}>
        <div {...getTableProps()} className="table">
          <div onMouseOver={props.disableDrag} onMouseLeave={props.enableDrag}>
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
                      columnName={
                        props.columnNameMap && props.columnNameMap[column.id]
                          ? props.columnNameMap[column.id]
                          : column.id
                      }
                      columnIndex={columnIndex}
                      isHidden={column.isHidden}
                      displayColumnActions={props.displayColumnActions}
                      handleColumnNameUpdate={props.handleColumnNameUpdate}
                      getColumnMenu={props.getColumnMenu}
                      handleResizeColumn={props.handleResizeColumn}
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
                    `${row.index === selectedRowIndex ? " selected-row" : ""}`
                  }
                  onClick={() => {
                    row.toggleRowSelected();
                    props.selectTableRow(row, row.index === selectedRowIndex);
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
    </TableWrapper>
  );
};

export default Table;
