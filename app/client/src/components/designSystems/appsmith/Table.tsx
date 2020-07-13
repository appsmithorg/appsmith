import React from "react";
import {
  useTable,
  usePagination,
  useFlexLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { InputGroup } from "@blueprintjs/core";
import { TableWrapper } from "./TableStyledWrappers";
import {
  ReactTableColumnProps,
  ColumnMenuOptionProps,
} from "./ReactTableComponent";
import { TableColumnMenuPopup } from "./TableColumnMenu";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";

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
  showMenu: (columnIndex: number) => void;
  displayColumnActions: boolean;
  columnNameMap?: { [key: string]: string };
  columnMenuOptions: ColumnMenuOptionProps[];
  columnIndex: number;
  columnAction: string;
  onColumnNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleColumnNameUpdate: (columnIndex: number) => void;
  handleResizeColumn: Function;
  selectTableRow: (
    row: { original: object; index: number },
    isSelected: boolean,
  ) => void;
  pageNo: number;
  updatePageNo: Function;
  nextPageClick: () => void;
  prevPageClick: () => void;
  onKeyPress: (columnIndex: number, key: string) => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  disableDrag: () => void;
  enableDrag: () => void;
  searchTableData: (searchKey: any) => void;
}

export const Table = (props: TableProps) => {
  const { data, columns } = props;
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );

  const pageCount = Math.ceil(data.length / props.pageSize);
  const currentPageIndex = props.pageNo < pageCount ? props.pageNo : 0;
  // const filteredColumns = columns.filter((column: ReactTableColumnProps) => {
  //   return !column.isHidden;
  // });
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
    endIndex = data.length;
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
      />
      <div className={props.isLoading ? Classes.SKELETON : "tableWrap"}>
        <div {...getTableProps()} className="table">
          <div onMouseOver={props.disableDrag} onMouseLeave={props.enableDrag}>
            {headerGroups.map((headerGroup: any, index: number) => (
              <div
                key={index}
                {...headerGroup.getHeaderGroupProps()}
                className="tr"
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
                      key={columnIndex}
                      {...column.getHeaderProps()}
                      className="th header-reorder"
                    >
                      {props.columnIndex === columnIndex &&
                        props.columnAction === "rename_column" && (
                          <InputGroup
                            placeholder="Enter Column Name"
                            onChange={props.onColumnNameChange}
                            onKeyPress={event =>
                              props.onKeyPress(columnIndex, event.key)
                            }
                            type="text"
                            defaultValue={
                              props.columnNameMap &&
                              props.columnNameMap[column.id]
                                ? props.columnNameMap[column.id]
                                : column.id
                            }
                            className="input-group"
                            onBlur={() =>
                              props.handleColumnNameUpdate(columnIndex)
                            }
                          />
                        )}
                      {(props.columnIndex !== columnIndex ||
                        (props.columnIndex === columnIndex &&
                          "rename_column" !== props.columnAction)) && (
                        <div
                          className={
                            !column.isHidden
                              ? "draggable-header"
                              : "hidden-header"
                          }
                        >
                          {column.render("Header")}
                        </div>
                      )}
                      {props.displayColumnActions && (
                        <div className="column-menu">
                          <TableColumnMenuPopup
                            showMenu={props.showMenu}
                            columnMenuOptions={props.columnMenuOptions}
                            columnIndex={columnIndex}
                          />
                        </div>
                      )}
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
            {subPage.map((row, index) => {
              prepareRow(row);
              return (
                <div
                  key={index}
                  {...row.getRowProps()}
                  className={
                    "tr" +
                    `${row.index === selectedRowIndex ? " selected-row" : ""}`
                  }
                  onClick={() => {
                    row.toggleRowSelected();
                    props.selectTableRow(row, row.index === selectedRowIndex);
                  }}
                >
                  {row.cells.map((cell, cellIndex) => {
                    return (
                      <div
                        key={cellIndex}
                        {...cell.getCellProps()}
                        className="td"
                        data-rowindex={index}
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
