import React, { useRef, useCallback, useMemo } from "react";
import { reduce } from "lodash";
import {
  useTable,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
  Row,
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
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors } from "constants/Colors";

import ScrollIndicator from "components/ads/ScrollIndicator";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Scrollbars } from "react-custom-scrollbars";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DragUpdate,
  DropResult,
} from "react-beautiful-dnd";
import { useEffect } from "react";

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
  handleReorderColumn: (columnOrder: Array<string>) => void;
  selectTableRow: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  pageNo: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  multiRowSelection?: boolean;
  nextPageClick: () => void;
  prevPageClick: () => void;
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
  const tableHeadercolumns = React.useMemo(
    () =>
      props.columns.filter((column: ReactTableColumnProps) => {
        return column.accessor !== "actions";
      }),
    [columnString],
  );
  const pageCount = Math.ceil(props.data.length / props.pageSize);
  const currentPageIndex = props.pageNo < pageCount ? props.pageNo : 0;
  const {
    getTableBodyProps,
    getTableProps,
    headerGroups,
    page,
    pageOptions,
    prepareRow,
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

  const { columnOrder, hiddenColumns } = useMemo(() => {
    const order: string[] = [];
    const hidden: string[] = [];
    columns.forEach((item) => {
      if (item.isHidden) {
        hidden.push(item.accessor);
      } else {
        order.push(item.accessor);
      }
    });
    return { columnOrder: order, hiddenColumns: hidden };
  }, [columns]);

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
  const tableHeaderWrapperRef = React.createRef<HTMLDivElement>();
  const tableColumnHeaderRef = useRef<HTMLDivElement | null>(null);
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
  // selected column's position while dragging
  const thCellTop = isHeaderVisible ? 40 : 0;
  const [thCellLeft, setThCellLeft] = React.useState(0);
  const setOrgPosition = (left: number) => {
    setThCellLeft(left);
  };

  // processing dnd
  const currentColOrder = React.useRef(columnOrder);
  useEffect(() => {
    currentColOrder.current = columnOrder;
  });
  const handleDragEnd = useCallback(
    (result: DropResult, thElem: HTMLElement | null) => {
      if (thElem) {
        thElem
          .querySelector(".th.highlight-left")
          ?.classList.remove("highlight-left");
        thElem
          .querySelector(".th.highlight-right")
          ?.classList.remove("highlight-right");
      }
      if (
        result.source &&
        result.destination &&
        result.source.index != result.destination.index
      ) {
        const sIndex = result.source.index;
        const dIndex = result.destination && result.destination.index;

        if (typeof sIndex === "number" && typeof dIndex === "number") {
          const newColumnOrder = [...currentColOrder.current];
          // The dragged column
          const movedColumnName = newColumnOrder.splice(sIndex, 1);
          // If the dragged column exists
          if (movedColumnName && movedColumnName.length === 1) {
            newColumnOrder.splice(dIndex, 0, movedColumnName[0]);
          }
          props.handleReorderColumn([...newColumnOrder, ...hiddenColumns]);
        }
      }
    },
    [],
  );
  const handleDragUpdate = useCallback(
    (dragUpdateObj: DragUpdate, thElem: HTMLElement | null) => {
      if (thElem) {
        thElem
          .querySelector(".th.highlight-left")
          ?.classList.remove("highlight-left");
        thElem
          .querySelector(".th.highlight-right")
          ?.classList.remove("highlight-right");
      }
      if (dragUpdateObj.source && dragUpdateObj.destination && thElem) {
        const dElem = thElem.querySelector(
          `.th.header-reorder:nth-child(${dragUpdateObj.destination.index + 1})
          `,
        );
        if (dragUpdateObj.source.index > dragUpdateObj.destination.index) {
          dElem?.classList.add("highlight-left");
        } else if (
          dragUpdateObj.source.index < dragUpdateObj.destination.index
        ) {
          dElem?.classList.add("highlight-right");
        }
      }
    },
    [],
  );

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
      {isHeaderVisible && (
        <TableHeaderWrapper
          backgroundColor={Colors.WHITE}
          ref={tableHeaderWrapperRef}
          serverSidePaginationEnabled={props.serverSidePaginationEnabled}
          tableSizes={tableSizes}
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
              tableSizes={tableSizes}
              width={props.width}
            >
              <TableHeader
                applyFilter={props.applyFilter}
                columns={tableHeadercolumns}
                compactMode={props.compactMode}
                currentPageIndex={currentPageIndex}
                filters={props.filters}
                isVisibleCompactMode={props.isVisibleCompactMode}
                isVisibleDownload={props.isVisibleDownload}
                isVisibleFilters={props.isVisibleFilters}
                isVisiblePagination={props.isVisiblePagination}
                isVisibleSearch={props.isVisibleSearch}
                nextPageClick={props.nextPageClick}
                pageCount={pageCount}
                pageNo={props.pageNo}
                pageOptions={pageOptions}
                prevPageClick={props.prevPageClick}
                searchKey={props.searchKey}
                searchTableData={props.searchTableData}
                serverSidePaginationEnabled={props.serverSidePaginationEnabled}
                tableColumns={columns}
                tableData={props.data}
                tableSizes={tableSizes}
                updateCompactMode={props.updateCompactMode}
                updatePageNo={props.updatePageNo}
                widgetId={props.widgetId}
                widgetName={props.widgetName}
              />
            </TableHeaderInnerWrapper>
          </Scrollbars>
        </TableHeaderWrapper>
      )}
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
            <div
              className="thead"
              onMouseLeave={props.enableDrag}
              onMouseOver={props.disableDrag}
              ref={tableColumnHeaderRef}
            >
              {headerGroups.map((headerGroup: any, index: number) => {
                const headerRowProps = {
                  ...headerGroup.getHeaderGroupProps(),
                  style: { display: "flex" },
                };
                return (
                  <DragDropContext
                    key={index}
                    onDragEnd={(result: DropResult) => {
                      handleDragEnd(result, tableColumnHeaderRef.current);
                    }}
                    onDragUpdate={(dragUpdateObj: DragUpdate) => {
                      handleDragUpdate(
                        dragUpdateObj,
                        tableColumnHeaderRef.current,
                      );
                    }}
                  >
                    <Droppable direction="horizontal" droppableId="droppable">
                      {(droppableProvided) => (
                        <div
                          {...headerRowProps}
                          className="tr"
                          key={index}
                          ref={droppableProvided.innerRef}
                        >
                          {props.multiRowSelection &&
                            renderCheckBoxHeaderCell(
                              handleAllRowSelectClick,
                              rowSelectionState,
                            )}
                          {headerGroup.headers.map(
                            (column: any, columnIndex: number) => {
                              return (
                                <Draggable
                                  draggableId={column.id}
                                  index={columnIndex}
                                  isDragDisabled={column.isHidden}
                                  key={column.id}
                                >
                                  {(provided, snapshot) => {
                                    return (
                                      <TableHeaderCell
                                        column={column}
                                        columnIndex={columnIndex}
                                        columnName={column.Header}
                                        isAscOrder={column.isAscOrder}
                                        isHidden={column.isHidden}
                                        isResizingColumn={
                                          isResizingColumn.current
                                        }
                                        orgLeft={thCellLeft}
                                        orgTop={thCellTop}
                                        provided={provided}
                                        setOrgPosition={setOrgPosition}
                                        snapshot={snapshot}
                                        sortTableColumn={props.sortTableColumn}
                                      />
                                    );
                                  }}
                                </Draggable>
                              );
                            },
                          )}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
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
            <div
              {...getTableBodyProps()}
              className={`tbody ${
                props.pageSize > subPage.length ? "no-scroll" : ""
              }`}
              ref={tableBodyRef}
            >
              {subPage.map((row, rowIndex) => {
                prepareRow(row);
                const rowProps = {
                  ...row.getRowProps(),
                  style: { display: "flex" },
                };
                const isRowSelected =
                  row.index === selectedRowIndex ||
                  selectedRowIndices.includes(row.index);
                return (
                  <div
                    {...rowProps}
                    className={"tr" + `${isRowSelected ? " selected-row" : ""}`}
                    key={rowIndex}
                    onClick={(e) => {
                      row.toggleRowSelected();
                      props.selectTableRow(row);
                      e.stopPropagation();
                    }}
                  >
                    {props.multiRowSelection &&
                      renderCheckBoxCell(isRowSelected)}
                    {row.cells.map((cell, cellIndex) => {
                      return (
                        <div
                          {...cell.getCellProps()}
                          className="td"
                          data-colindex={cellIndex}
                          data-rowindex={rowIndex}
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
