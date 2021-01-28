import React from "react";
import {
  useTable,
  usePagination,
  useFlexLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { TableWrapper } from "./TableStyledWrappers";
import { ColumnMenuOptionProps } from "./ReactTableComponent";
import { ReactTableFilter } from "components/designSystems/appsmith/TableFilters";
import { TableHeaderCell, renderEmptyRows } from "./TableUtilities";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { ReactTableColumnProps } from "widgets/TableWidget";
import { Colors } from "constants/Colors";
import {
  TABLE_SIZES,
  CompactMode,
  CompactModeTypes,
} from "widgets/TableWidget";
import { EventType } from "constants/ActionConstants";

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
  data: Array<Record<string, unknown>>;
  editMode: boolean;
  columnNameMap?: { [key: string]: string };
  getColumnMenu: (columnIndex: number) => ColumnMenuOptionProps[];
  handleColumnNameUpdate: (columnIndex: number, columnName: string) => void;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  handleResizeColumn: (columnIndex: number, columnWidth: string) => void;
  selectTableRow: (
    row: { original: Record<string, unknown>; index: number },
    isSelected: boolean,
  ) => void;
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
  columnActions?: ColumnAction[];
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
}

const defaultColumn = {
  minWidth: 30,
  width: 150,
};

export const Table = (props: TableProps) => {
  const data = React.useMemo(() => props.data, [props.data]);
  const columnString = JSON.stringify({
    columns: props.columns,
    actions: props.columnActions,
    columnActions: props.columnActions,
    compactMode: props.compactMode,
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
                      columnName={
                        props.columnNameMap && props.columnNameMap[column.id]
                          ? props.columnNameMap[column.id]
                          : column.id
                      }
                      columnIndex={columnIndex}
                      isHidden={column.isHidden}
                      editMode={props.editMode}
                      handleColumnNameUpdate={props.handleColumnNameUpdate}
                      getColumnMenu={props.getColumnMenu}
                      handleResizeColumn={props.handleResizeColumn}
                      sortTableColumn={props.sortTableColumn}
                      isAscOrder={column.isAscOrder}
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
                  onClick={() => {
                    row.toggleRowSelected();
                    props.selectTableRow(
                      row,
                      row.index === selectedRowIndex ||
                        selectedRowIndices.includes(row.index),
                    );
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
