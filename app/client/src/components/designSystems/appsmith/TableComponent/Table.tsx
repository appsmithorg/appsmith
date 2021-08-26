import React, { useRef } from "react";
import { reduce } from "lodash";
import {
  useTable,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
  Row,
  HeaderGroup,
} from "react-table";
import {
  TableWrapper,
  TableHeaderWrapper,
  TableHeaderInnerWrapper,
} from "./TableStyledWrappers";
import {
  TableHeaderCell,
  renderEmptyRows,
  renderCheckBoxCell,
  renderCheckBoxHeaderCell,
} from "./TableUtilities";
import TableHeader from "./TableHeader";
import { Classes } from "@blueprintjs/core";
import {
  ReactTableColumnProps,
  ReactTableFilter,
  TABLE_SIZES,
  CompactMode,
  CompactModeTypes,
  TableSizes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors } from "constants/Colors";

import ScrollIndicator from "components/ads/ScrollIndicator";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Scrollbars } from "react-custom-scrollbars";
import { FixedSizeList } from "react-window";
import { scrollbarWidth } from "utils/helpers";
import InfiniteLoader from "react-window-infinite-loader";

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
  multiRowSelection?: boolean;
  nextPageClick: () => void;
  prevPageClick: () => void;
  infiniteScroll: boolean;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  disableDrag: () => void;
  enableDrag: () => void;
  toggleAllRowSelect: (
    isSelect: boolean,
    pageData: Row<Record<string, unknown>>[],
  ) => void;
  triggerRowSelection: boolean;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
  isVisibleCompactMode?: boolean;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  isVisibleSearch?: boolean;
  delimiter: string;
}

const defaultColumn = {
  minWidth: 30,
  width: 150,
};

function ScrollbarVerticalThumb(props: any) {
  return <div {...props} className="thumb-vertical" />;
}

function ScrollbarHorizontalThumb(props: any) {
  return <div {...props} className="thumb-horizontal" />;
}

function Header(
  props: TableProps & {
    tableSizes: TableSizes;
    currentPageIndex: number;
    pageCount: number;
    pageOptions: number[];
    columnString: string;
  },
) {
  const tableHeaderWrapperRef = React.createRef<HTMLDivElement>();
  const tableHeadercolumns = React.useMemo(
    () =>
      props.columns.filter((column: ReactTableColumnProps) => {
        return column.accessor !== "actions";
      }),
    [props.columnString],
  );
  return (
    <TableHeaderWrapper
      backgroundColor={Colors.WHITE}
      ref={tableHeaderWrapperRef}
      serverSidePaginationEnabled={props.serverSidePaginationEnabled}
      tableSizes={props.tableSizes}
      width={props.width}
    >
      <Scrollbars
        renderThumbHorizontal={ScrollbarHorizontalThumb}
        renderThumbVertical={ScrollbarVerticalThumb}
        style={{ width: props.width, height: 38 }}
      >
        <TableHeaderInnerWrapper
          backgroundColor={Colors.WHITE}
          serverSidePaginationEnabled={props.serverSidePaginationEnabled}
          tableSizes={props.tableSizes}
          width={props.width}
        >
          <TableHeader
            applyFilter={props.applyFilter}
            columns={tableHeadercolumns}
            compactMode={props.compactMode}
            currentPageIndex={props.currentPageIndex}
            delimiter={props.delimiter}
            filters={props.filters}
            isVisibleCompactMode={props.isVisibleCompactMode}
            isVisibleDownload={props.isVisibleDownload}
            isVisibleFilters={props.isVisibleFilters}
            isVisiblePagination={props.isVisiblePagination}
            isVisibleSearch={props.isVisibleSearch}
            nextPageClick={props.nextPageClick}
            pageCount={props.pageCount}
            pageNo={props.pageNo}
            pageOptions={props.pageOptions}
            prevPageClick={props.prevPageClick}
            searchKey={props.searchKey}
            searchTableData={props.searchTableData}
            serverSidePaginationEnabled={props.serverSidePaginationEnabled}
            tableColumns={props.columns}
            tableData={props.data}
            tableSizes={props.tableSizes}
            updateCompactMode={props.updateCompactMode}
            updatePageNo={props.updatePageNo}
            widgetId={props.widgetId}
            widgetName={props.widgetName}
          />
        </TableHeaderInnerWrapper>
      </Scrollbars>
    </TableHeaderWrapper>
  );
}

function TableHead(
  props: TableProps & {
    prepareRow: (row: Row<Record<string, unknown>>) => void;
    subPage: Row<Record<string, unknown>>[];
    isResizingColumn: boolean;
    handleAllRowSelectClick: (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => void;
    headerGroups: HeaderGroup<Record<string, unknown>>[];
    rowSelectionState: 0 | 1 | 2 | null;
  },
) {
  const {
    handleAllRowSelectClick,
    headerGroups,
    isResizingColumn,
    prepareRow,
    rowSelectionState,
    subPage,
  } = props;
  return (
    <div
      className="thead"
      onMouseLeave={props.enableDrag}
      onMouseOver={props.disableDrag}
    >
      {headerGroups.map((headerGroup: any, index: number) => {
        const headerRowProps = {
          ...headerGroup.getHeaderGroupProps(),
          style: { display: "flex" },
        };
        return (
          <div {...headerRowProps} className="tr" key={index}>
            {props.multiRowSelection &&
              renderCheckBoxHeaderCell(
                handleAllRowSelectClick,
                rowSelectionState,
              )}
            {headerGroup.headers.map((column: any, columnIndex: number) => {
              return (
                <TableHeaderCell
                  column={column}
                  columnIndex={columnIndex}
                  columnName={column.Header}
                  isAscOrder={column.isAscOrder}
                  isHidden={column.isHidden}
                  isResizingColumn={isResizingColumn}
                  key={columnIndex}
                  sortTableColumn={props.sortTableColumn}
                />
              );
            })}
          </div>
        );
      })}
      {headerGroups.length === 0 &&
        renderEmptyRows(
          1,
          props.columns,
          props.width,
          subPage,
          prepareRow,
          props.multiRowSelection,
        )}
    </div>
  );
}

export function Table(props: TableProps) {
  const isResizingColumn = React.useRef(false);

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
    getTableBodyProps,
    getTableProps,
    headerGroups,
    page,
    pageOptions,
    prepareRow,
    rows,
    state,
    totalColumnsWidth,
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
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const tableBodyRef = useRef<HTMLDivElement | null>(null);
  const rowSelectionState = React.useMemo(() => {
    // return : 0; no row selected | 1; all row selected | 2: some rows selected
    if (!props.multiRowSelection) return null;
    const selectedRowCount = reduce(
      page,
      (count, row) => {
        return selectedRowIndices.includes(row.index) ? count + 1 : count;
      },
      0,
    );
    const result =
      selectedRowCount === 0 ? 0 : selectedRowCount === page.length ? 1 : 2;
    return result;
  }, [selectedRowIndices, page]);
  const handleAllRowSelectClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    // if all / some rows are selected we remove selection on click
    // else select all rows
    props.toggleAllRowSelect(!Boolean(rowSelectionState), page);
    // loop over subPage rows and toggleRowSelected if required
    e.stopPropagation();
  };
  const isHeaderVisible =
    props.isVisibleSearch ||
    props.isVisibleFilters ||
    props.isVisibleDownload ||
    props.isVisibleCompactMode ||
    props.isVisiblePagination;
  const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);
  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index];

      prepareRow(row);
      const rowProps = {
        ...row.getRowProps(),
        style: { ...style, display: "flex" },
      };
      const isRowSelected =
        row.index === selectedRowIndex ||
        selectedRowIndices.includes(row.index);
      return (
        <div
          {...rowProps}
          className={"tr" + `${isRowSelected ? " selected-row" : ""}`}
          key={index}
          onClick={(e) => {
            row.toggleRowSelected();
            props.selectTableRow(row);
            e.stopPropagation();
          }}
        >
          {props.multiRowSelection && renderCheckBoxCell(isRowSelected)}
          {row.cells.map((cell, cellIndex) => {
            return (
              <div
                {...cell.getCellProps()}
                className="td"
                data-colindex={cellIndex}
                data-rowindex={index}
                key={cellIndex}
              >
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows],
  );

  const loadMoreItems = React.useCallback(
    (startIndex: number, stopIndex: number) => {
      // eslint-disable-next-line no-console
      console.log({ startIndex, stopIndex });
      props.nextPageClick();
      return Promise.resolve();
    },
    [],
  );

  const isItemLoaded = React.useCallback((index: number) => {
    // eslint-disable-next-line no-console
    console.log({ index });
    return props.isLoading ? false : true;
  }, []);

  const tableHeight = isHeaderVisible ? props.height - 80 : props.height - 40;
  const tableWidth = totalColumnsWidth + scrollBarSize;

  return (
    <TableWrapper
      backgroundColor={Colors.ATHENS_GRAY_DARKER}
      height={props.height}
      id={`table${props.widgetId}`}
      isHeaderVisible={isHeaderVisible}
      tableSizes={tableSizes}
      triggerRowSelection={props.triggerRowSelection}
      width={props.width}
    >
      {isHeaderVisible &&
        Header({
          ...props,
          tableSizes,
          columnString,
          currentPageIndex,
          pageCount,
          pageOptions,
        })}
      <div
        className={props.isLoading ? Classes.SKELETON : "tableWrap"}
        ref={tableWrapperRef}
      >
        <Scrollbars
          renderThumbHorizontal={ScrollbarHorizontalThumb}
          style={{
            width: props.width,
            height: isHeaderVisible ? props.height - 48 : props.height,
          }}
        >
          <div {...getTableProps()} className="table">
            {TableHead({
              ...props,
              handleAllRowSelectClick,
              headerGroups,
              rowSelectionState,
              isResizingColumn: isResizingColumn.current,
              subPage,
              prepareRow,
            })}
            <div
              {...getTableBodyProps()}
              className={`tbody ${
                props.pageSize > subPage.length ? "no-scroll" : ""
              }`}
              ref={tableBodyRef}
            >
              {props.infiniteScroll ? (
                <InfiniteLoader
                  isItemLoaded={isItemLoaded}
                  itemCount={1000}
                  loadMoreItems={loadMoreItems}
                >
                  {({ onItemsRendered, ref }) => (
                    <FixedSizeList
                      className="List"
                      height={tableHeight}
                      itemCount={1000}
                      itemSize={tableSizes.ROW_HEIGHT}
                      onItemsRendered={onItemsRendered}
                      ref={ref}
                      width={tableWidth}
                    >
                      {RenderRow}
                    </FixedSizeList>
                  )}
                </InfiniteLoader>
              ) : (
                <FixedSizeList
                  height={tableHeight}
                  itemCount={subPage.length}
                  itemSize={tableSizes.ROW_HEIGHT}
                  width={tableWidth}
                >
                  {RenderRow}
                </FixedSizeList>
              )}
              {props.pageSize > subPage.length &&
                renderEmptyRows(
                  props.pageSize - subPage.length,
                  props.columns,
                  props.width,
                  subPage,
                  prepareRow,
                  props.multiRowSelection,
                )}
            </div>
          </div>
        </Scrollbars>
      </div>
      <ScrollIndicator
        containerRef={tableBodyRef}
        mode="LIGHT"
        top={props.editMode ? "70px" : "73px"}
      />
    </TableWrapper>
  );
}

export default Table;
