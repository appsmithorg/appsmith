import React from "react";
import {
  useTable,
  usePagination,
  useFlexLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { Icon, InputGroup } from "@blueprintjs/core";
import {
  TableWrapper,
  PaginationWrapper,
  PaginationItemWrapper,
} from "./TableStyledWrappers";
import {
  ReactTableColumnProps,
  ColumnMenuOptionProps,
} from "./ReactTableComponent";
import { TableColumnMenuPopup } from "./TableColumnMenu";

interface TableProps {
  width: number;
  height: number;
  pageSize: number;
  widgetId: string;
  columns: ReactTableColumnProps[];
  data: object[];
  showMenu: (columnIndex: number) => void;
  displayColumnActions: boolean;
  columnNameMap?: { [key: string]: string };
  columnMenuOptions: ColumnMenuOptionProps[];
  columnIndex: number;
  columnAction: string;
  onColumnNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleColumnNameUpdate: () => void;
  handleResizeColumn: Function;
  selectTableRow: (
    row: { original: object; index: number },
    isSelected: boolean,
  ) => void;
  pageNo: number;
  updatePageNo: Function;
  nextPageClick: () => void;
  prevPageClick: () => void;
  onKeyPress: (key: string) => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  disableDrag: () => void;
  enableDrag: () => void;
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
      <div className="tableWrap">
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
                            onKeyPress={event => props.onKeyPress(event.key)}
                            type="text"
                            defaultValue={
                              props.columnNameMap &&
                              props.columnNameMap[column.id]
                                ? props.columnNameMap[column.id]
                                : column.id
                            }
                            className="input-group"
                            onBlur={() => props.handleColumnNameUpdate()}
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
          </div>
        </div>
      </div>
      {props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            disabled={false}
            onClick={() => {
              props.prevPageClick();
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
          <PaginationItemWrapper selected className="page-item">
            {props.pageNo + 1}
          </PaginationItemWrapper>
          <PaginationItemWrapper
            disabled={false}
            onClick={() => {
              props.nextPageClick();
            }}
          >
            <Icon icon="chevron-right" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
      {!props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            disabled={currentPageIndex === 0}
            onClick={() => {
              const pageNo = currentPageIndex > 0 ? currentPageIndex - 1 : 0;
              props.updatePageNo(pageNo + 1);
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
          {pageOptions.map((pageNumber: number, index: number) => {
            return (
              <PaginationItemWrapper
                key={index}
                selected={pageNumber === currentPageIndex}
                onClick={() => {
                  props.updatePageNo(pageNumber + 1);
                }}
                className="page-item"
              >
                {index + 1}
              </PaginationItemWrapper>
            );
          })}
          <PaginationItemWrapper
            disabled={currentPageIndex === pageCount - 1}
            onClick={() => {
              const pageNo =
                currentPageIndex < pageCount - 1 ? currentPageIndex + 1 : 0;
              props.updatePageNo(pageNo + 1);
            }}
          >
            <Icon icon="chevron-right" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
    </TableWrapper>
  );
};

export default Table;
