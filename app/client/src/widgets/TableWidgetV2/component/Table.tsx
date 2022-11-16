import React, { useEffect, useMemo, useRef } from "react";
import { pick, reduce } from "lodash";
import {
  useTable,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
  Row as ReactTableRowType,
} from "react-table";
import {
  TableWrapper,
  TableHeaderWrapper,
  TableHeaderInnerWrapper,
} from "./TableStyledWrappers";
import TableHeader from "./header";
import { Classes } from "@blueprintjs/core";
import {
  ReactTableColumnProps,
  ReactTableFilter,
  TABLE_SIZES,
  CompactMode,
  CompactModeTypes,
  AddNewRowActions,
} from "./Constants";
import { Colors } from "constants/Colors";

import { ScrollIndicator } from "design-system";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Scrollbars } from "react-custom-scrollbars";
import { renderEmptyRows } from "./cellComponents/EmptyCell";
import { renderHeaderCheckBoxCell } from "./cellComponents/SelectionCheckboxCell";
import { HeaderCell } from "./cellComponents/HeaderCell";
import { EditableCell, TableVariant } from "../constants";
import { TableBody } from "./TableBody";

interface TableProps {
  width: number;
  height: number;
  pageSize: number;
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isLoading: boolean;
  columnWidthMap?: { [key: string]: number };
  columns: ReactTableColumnProps[];
  data: Array<Record<string, unknown>>;
  totalRecordsCount?: number;
  editMode: boolean;
  editableCell: EditableCell;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  handleResizeColumn: (columnWidthMap: { [key: string]: number }) => void;
  selectTableRow: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  pageNo: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  multiRowSelection?: boolean;
  isSortable?: boolean;
  nextPageClick: () => void;
  prevPageClick: () => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  disableDrag: () => void;
  enableDrag: () => void;
  toggleAllRowSelect: (
    isSelect: boolean,
    pageData: ReactTableRowType<Record<string, unknown>>[],
  ) => void;
  triggerRowSelection: boolean;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  compactMode?: CompactMode;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  isVisibleSearch?: boolean;
  delimiter: string;
  accentColor: string;
  borderRadius: string;
  boxShadow: string;
  borderWidth?: number;
  borderColor?: string;
  onBulkEditDiscard: () => void;
  onBulkEditSave: () => void;
  variant?: TableVariant;
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  disabledAddNewRowSave: boolean;
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

function ScrollbarHorizontalTrack(props: any) {
  return <div {...props} className="track-horizontal" />;
}

export function Table(props: TableProps) {
  const isResizingColumn = React.useRef(false);

  const handleResizeColumn = (columnWidths: Record<string, number>) => {
    const columnWidthMap = {
      ...props.columnWidthMap,
      ...columnWidths,
    };
    for (const i in columnWidthMap) {
      if (columnWidthMap[i] < 60) {
        columnWidthMap[i] = 60;
      } else if (columnWidthMap[i] === undefined) {
        const columnCounts = props.columns.filter((column) => !column.isHidden)
          .length;
        columnWidthMap[i] = props.width / columnCounts;
      }
    }
    props.handleResizeColumn(columnWidthMap);
  };
  const data = React.useMemo(() => props.data, [JSON.stringify(props.data)]);
  const columnString = JSON.stringify(
    pick(props, ["columns", "compactMode", "columnWidthMap"]),
  );
  const columns = React.useMemo(() => props.columns, [columnString]);
  const tableHeadercolumns = React.useMemo(
    () =>
      props.columns.filter((column: ReactTableColumnProps) => {
        return column.alias !== "actions";
      }),
    [columnString],
  );
  /*
    For serverSidePaginationEnabled we are taking props.data.length as the page size.
    As props.pageSize is being set by the visible number of rows in the table (without scrolling),
    it will not give the correct count of records in the current page when query limit
    is set higher/lower than the visible number of rows in the table
  */
  const pageCount =
    props.serverSidePaginationEnabled &&
    props.totalRecordsCount &&
    props.data.length
      ? Math.ceil(props.totalRecordsCount / props.data.length)
      : Math.ceil(props.data.length / props.pageSize);
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
  const selectedRowIndices = props.selectedRowIndices || [];
  const tableSizes = TABLE_SIZES[props.compactMode || CompactModeTypes.DEFAULT];
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const tableBodyRef = useRef<HTMLDivElement | null>(null);
  const tableHeaderWrapperRef = React.createRef<HTMLDivElement>();
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
    props.isVisiblePagination;

  const style = useMemo(
    () => ({
      width: props.width,
      height: 38,
    }),
    [props.width],
  );

  const shouldUseVirtual =
    props.serverSidePaginationEnabled &&
    !props.columns.some(
      (column) => !!column.columnProperties.allowCellWrapping,
    );

  useEffect(() => {
    if (props.isAddRowInProgress && tableBodyRef) {
      tableBodyRef.current?.scrollTo({ top: 0 });
    }
  }, [props.isAddRowInProgress]);

  return (
    <TableWrapper
      accentColor={props.accentColor}
      backgroundColor={Colors.ATHENS_GRAY_DARKER}
      borderColor={props.borderColor}
      borderRadius={props.borderRadius}
      borderWidth={props.borderWidth}
      boxShadow={props.boxShadow}
      height={props.height}
      id={`table${props.widgetId}`}
      isAddRowInProgress={props.isAddRowInProgress}
      isHeaderVisible={isHeaderVisible}
      isResizingColumn={isResizingColumn.current}
      tableSizes={tableSizes}
      triggerRowSelection={props.triggerRowSelection}
      variant={props.variant}
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
            renderTrackHorizontal={ScrollbarHorizontalTrack}
            style={style}
          >
            <TableHeaderInnerWrapper
              backgroundColor={Colors.WHITE}
              serverSidePaginationEnabled={props.serverSidePaginationEnabled}
              tableSizes={tableSizes}
              variant={props.variant}
              width={props.width}
            >
              <TableHeader
                accentColor={props.accentColor}
                allowAddNewRow={props.allowAddNewRow}
                applyFilter={props.applyFilter}
                borderRadius={props.borderRadius}
                boxShadow={props.boxShadow}
                columns={tableHeadercolumns}
                currentPageIndex={currentPageIndex}
                delimiter={props.delimiter}
                disableAddNewRow={!!props.editableCell.column}
                disabledAddNewRowSave={props.disabledAddNewRowSave}
                filters={props.filters}
                isAddRowInProgress={props.isAddRowInProgress}
                isVisibleDownload={props.isVisibleDownload}
                isVisibleFilters={props.isVisibleFilters}
                isVisiblePagination={props.isVisiblePagination}
                isVisibleSearch={props.isVisibleSearch}
                nextPageClick={props.nextPageClick}
                onAddNewRow={props.onAddNewRow}
                onAddNewRowAction={props.onAddNewRowAction}
                pageCount={pageCount}
                pageNo={props.pageNo}
                pageOptions={pageOptions}
                prevPageClick={props.prevPageClick}
                searchKey={props.searchKey}
                searchTableData={props.searchTableData}
                serverSidePaginationEnabled={props.serverSidePaginationEnabled}
                tableColumns={columns}
                tableData={data}
                tableSizes={tableSizes}
                totalRecordsCount={props.totalRecordsCount}
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
          renderTrackHorizontal={ScrollbarHorizontalTrack}
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
            >
              {headerGroups.map((headerGroup: any, index: number) => {
                const headerRowProps = {
                  ...headerGroup.getHeaderGroupProps(),
                  style: { display: "flex" },
                };
                return (
                  <div {...headerRowProps} className="tr" key={index}>
                    {props.multiRowSelection &&
                      renderHeaderCheckBoxCell(
                        handleAllRowSelectClick,
                        rowSelectionState,
                        props.accentColor,
                        props.borderRadius,
                      )}
                    {headerGroup.headers.map(
                      (column: any, columnIndex: number) => {
                        return (
                          <HeaderCell
                            column={column}
                            columnIndex={columnIndex}
                            columnName={column.Header}
                            editMode={props.editMode}
                            isAscOrder={column.isAscOrder}
                            isHidden={column.isHidden}
                            isResizingColumn={isResizingColumn.current}
                            isSortable={props.isSortable}
                            key={columnIndex}
                            sortTableColumn={props.sortTableColumn}
                            width={column.width}
                          />
                        );
                      },
                    )}
                  </div>
                );
              })}
              {headerGroups.length === 0 &&
                renderEmptyRows(
                  1,
                  props.columns,
                  props.width,
                  subPage,
                  props.multiRowSelection,
                  props.accentColor,
                  props.borderRadius,
                  {},
                  prepareRow,
                )}
            </div>
            <TableBody
              accentColor={props.accentColor}
              borderRadius={props.borderRadius}
              columns={props.columns}
              getTableBodyProps={getTableBodyProps}
              height={props.height}
              isAddRowInProgress={props.isAddRowInProgress}
              multiRowSelection={!!props.multiRowSelection}
              pageSize={props.pageSize}
              prepareRow={prepareRow}
              primaryColumnId={props.primaryColumnId}
              ref={tableBodyRef}
              rows={subPage}
              selectTableRow={props.selectTableRow}
              selectedRowIndex={props.selectedRowIndex}
              selectedRowIndices={props.selectedRowIndices}
              tableSizes={tableSizes}
              useVirtual={shouldUseVirtual}
              width={props.width}
            />
          </div>
        </Scrollbars>
      </div>
      <ScrollIndicator
        containerRef={tableBodyRef}
        mode="LIGHT"
        showScrollbarOnlyOnHover
        top={props.editMode ? "70px" : "73px"}
      />
    </TableWrapper>
  );
}

export default Table;
