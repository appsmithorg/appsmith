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
import { TableColumnMenuPopup } from "./TableColumnMenu";
import { RenameColumn } from "./TableUtilities";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";

interface TableProps {
  width: number;
  height: number;
  pageSize: number;
  widgetId: string;
  columnOrder: string;
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
  const columns = React.useMemo(() => props.columns, [props.columnOrder]);
  const data = React.useMemo(() => props.data, [currentPageIndex]);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageOptions,
  } = useTable(
    {
      columns,
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
        searchTableData={props.searchTableData}
        searchKey={props.searchKey}
        updatePageNo={props.updatePageNo}
        nextPageClick={props.nextPageClick}
        prevPageClick={props.prevPageClick}
        pageNo={props.pageNo}
        pageCount={pageCount}
        currentPageIndex={currentPageIndex}
        pageOptions={pageOptions}
        serverSidePaginationEnabled={props.serverSidePaginationEnabled}
        columns={props.columns.filter((column: ReactTableColumnProps) => {
          return column.accessor !== "actions";
        })}
        hiddenColumns={props.hiddenColumns}
        updateHiddenColumns={props.updateHiddenColumns}
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
                  if (column.isResizing) {
                    props.handleResizeColumn(
                      columnIndex,
                      column.getHeaderProps().style.width,
                    );
                  }
                  return (
                    <div
                      {...column.getHeaderProps()}
                      className="th header-reorder"
                      key={columnIndex}
                    >
                      <RenderColumn
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
                      >
                        {column.render("Header")}
                      </RenderColumn>
                      <div
                        {...column.getResizerProps()}
                        className={`resizer ${
                          column.isResizing ? "isResizing" : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            {headerGroups.length === 0 &&
              renderEmptyRows(1, props.columns, props.width)}
          </div>
          <div {...getTableBodyProps()} className="tbody">
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
                        data-rowindex={rowIndex}
                        data-colindex={cellIndex}
                        key={cellIndex}
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
              )}
          </div>
        </div>
      </div>
    </TableWrapper>
  );
};

export default Table;

const renderEmptyRows = (
  rowCount: number,
  columns: any,
  tableWidth: number,
) => {
  const rows: string[] = new Array(rowCount).fill("");
  const tableColumns = columns.length
    ? columns
    : new Array(3).fill({ width: tableWidth / 3, isHidden: false });
  return (
    <React.Fragment>
      {rows.map((row: string, index: number) => {
        return (
          <div
            className="tr"
            key={index}
            style={{
              display: "flex",
              flex: "1 0 auto",
            }}
          >
            {tableColumns.map((column: any, colIndex: number) => {
              return (
                <div
                  key={colIndex}
                  className="td"
                  style={{
                    width: column.width + "px",
                    boxSizing: "border-box",
                    flex: `${column.width} 0 auto`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </React.Fragment>
  );
};

const RenderColumn = (props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  displayColumnActions: boolean;
  handleColumnNameUpdate: (columnIndex: number, name: string) => void;
  getColumnMenu: (columnIndex: number) => ColumnMenuOptionProps[];
  children: React.ReactNode;
}) => {
  const [renameColumn, toggleRenameColumn] = React.useState(false);
  const handleSaveColumnName = (columnIndex: number, columName: string) => {
    props.handleColumnNameUpdate(columnIndex, columName);
    toggleRenameColumn(false);
  };
  return (
    <React.Fragment>
      {renameColumn && (
        <RenameColumn
          value={props.columnName}
          handleSave={handleSaveColumnName}
          columnIndex={props.columnIndex}
        />
      )}
      {!renameColumn && (
        <div className={!props.isHidden ? "draggable-header" : "hidden-header"}>
          {props.children}
        </div>
      )}
      {props.displayColumnActions && (
        <div className="column-menu">
          <TableColumnMenuPopup
            getColumnMenu={props.getColumnMenu}
            columnIndex={props.columnIndex}
            editColumnName={() => toggleRenameColumn(true)}
          />
        </div>
      )}
    </React.Fragment>
  );
};
