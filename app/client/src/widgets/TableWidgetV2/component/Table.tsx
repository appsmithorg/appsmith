import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { reduce } from "lodash";
import type { Row as ReactTableRowType } from "react-table";
import {
  useTable,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
} from "react-table";
import { useSticky } from "react-table-sticky";
import {
  TableWrapper,
  TableHeaderWrapper,
  TableHeaderInnerWrapper,
} from "./TableStyledWrappers";
import TableHeader from "./header";
import { Classes } from "@blueprintjs/core";
import type {
  ReactTableColumnProps,
  ReactTableFilter,
  CompactMode,
  AddNewRowActions,
  StickyType,
} from "./Constants";
import {
  TABLE_SIZES,
  CompactModeTypes,
  TABLE_SCROLLBAR_HEIGHT,
} from "./Constants";
import { Colors } from "constants/Colors";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ColumnTypes,
  type EditableCell,
  type TableVariant,
} from "../constants";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { createGlobalStyle } from "styled-components";
import { Classes as PopOver2Classes } from "@blueprintjs/popover2";
import StaticTable from "./StaticTable";
import VirtualTable from "./VirtualTable";
import fastdom from "fastdom";
import { ConnectDataOverlay } from "widgets/ConnectDataOverlay";
import { TABLE_CONNECT_OVERLAY_TEXT } from "../constants/messages";
import { createMessage, CONNECT_BUTTON_TEXT } from "ee/constants/messages";

const SCROLL_BAR_OFFSET = 2;
const HEADER_MENU_PORTAL_CLASS = ".header-menu-portal";

const PopoverStyles = createGlobalStyle<{
  widgetId: string;
  borderRadius: string;
}>`
  ${HEADER_MENU_PORTAL_CLASS}-${({ widgetId }) => widgetId} {
    font-family: var(--wds-font-family) !important;

    & .${PopOver2Classes.POPOVER2},
    .${PopOver2Classes.POPOVER2_CONTENT},
    .bp3-menu {
      border-radius: ${({ borderRadius }) =>
        borderRadius >= `1.5rem` ? `0.375rem` : borderRadius} !important;
    }
  }
`;

export interface TableProps {
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
  handleReorderColumn: (columnOrder: string[]) => void;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  canFreezeColumn?: boolean;
  showConnectDataOverlay: boolean;
  onConnectData: () => void;
  isInfiniteScroll: boolean;
}

const defaultColumn = {
  minWidth: 30,
  width: 150,
};

export interface HeaderComponentProps {
  enableDrag: () => void;
  disableDrag: () => void;
  multiRowSelection?: boolean;
  handleAllRowSelectClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  columnOrder?: string[];
  accentColor: string;
  borderRadius: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerGroups: any;
  canFreezeColumn?: boolean;
  editMode: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  isResizingColumn: React.MutableRefObject<boolean>;
  isSortable?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  columns: ReactTableColumnProps[];
  width: number;
  subPage: ReactTableRowType<Record<string, unknown>>[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepareRow: any;
  headerWidth?: number;
  rowSelectionState: 0 | 1 | 2 | null;
  widgetId: string;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyArr: any = [];

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
        const columnCounts = props.columns.filter(
          (column) => !column.isHidden,
        ).length;

        columnWidthMap[i] = props.width / columnCounts;
      }
    }

    props.handleResizeColumn(columnWidthMap);
  };
  const {
    columns,
    data,
    multiRowSelection,
    showConnectDataOverlay,
    toggleAllRowSelect,
  } = props;

  const tableHeadercolumns = React.useMemo(
    () =>
      columns.filter((column: ReactTableColumnProps) => {
        return column.alias !== "actions";
      }),
    [columns],
  );

  const pageCount =
    props.serverSidePaginationEnabled && props.totalRecordsCount
      ? Math.ceil(props.totalRecordsCount / props.pageSize)
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
    totalColumnsWidth,
  } = useTable(
    {
      //columns and data needs to be memoised as per useTable specs
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
    useBlockLayout,
    useResizeColumns,
    usePagination,
    useRowSelect,
    useSticky,
  );

  //Set isResizingColumn as true when column is resizing using table state
  if (state.columnResizing.isResizingColumn) {
    isResizingColumn.current = true;
  } else {
    // We are updating column size since the drag is complete when we are changing value of isResizing from true to false
    if (isResizingColumn.current) {
      //clear timeout logic
      //update isResizingColumn in next event loop so that dragEnd event does not trigger click event.
      setTimeout(function () {
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

  const subPage = useMemo(
    () => page.slice(startIndex, endIndex),
    [page, startIndex, endIndex],
  );
  const selectedRowIndices = props.selectedRowIndices || emptyArr;
  const tableSizes = TABLE_SIZES[props.compactMode || CompactModeTypes.DEFAULT];
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollBarRef = useRef<SimpleBar | null>(null);
  const tableHeaderWrapperRef = React.createRef<HTMLDivElement>();
  const rowSelectionState = React.useMemo(() => {
    // return : 0; no row selected | 1; all row selected | 2: some rows selected
    if (!multiRowSelection) return null;

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
  }, [multiRowSelection, page, selectedRowIndices]);
  const handleAllRowSelectClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // if all / some rows are selected we remove selection on click
      // else select all rows
      toggleAllRowSelect(!Boolean(rowSelectionState), page);
      // loop over subPage rows and toggleRowSelected if required
      e.stopPropagation();
    },
    [page, rowSelectionState, toggleAllRowSelect],
  );
  const isHeaderVisible =
    props.isVisibleSearch ||
    props.isVisibleFilters ||
    props.isVisibleDownload ||
    props.isVisiblePagination ||
    props.allowAddNewRow;

  const scrollContainerStyles = useMemo(() => {
    return {
      height: isHeaderVisible
        ? props.height - tableSizes.TABLE_HEADER_HEIGHT - TABLE_SCROLLBAR_HEIGHT
        : props.height - TABLE_SCROLLBAR_HEIGHT - SCROLL_BAR_OFFSET,
      width: props.width,
    };
  }, [
    isHeaderVisible,
    props.height,
    tableSizes.TABLE_HEADER_HEIGHT,
    props.width,
  ]);

  /**
   * What this really translates is to fixed height rows:
   * shouldUseVirtual: false -> fixed height row, irrespective of content small or big
   * shouldUseVirtual: true -> height adjusts acc to content
   * Right now all HTML content is dynamic height in nature hence
   * for server paginated tables it needs this extra handling.
   */
  const shouldUseVirtual =
    props.serverSidePaginationEnabled &&
    !props.columns.some(
      (column) =>
        !!column.columnProperties.allowCellWrapping ||
        column.metaProperties?.type === ColumnTypes.HTML,
    );

  useEffect(() => {
    if (props.isAddRowInProgress) {
      fastdom.mutate(() => {
        if (scrollBarRef && scrollBarRef?.current) {
          scrollBarRef.current.getScrollElement().scrollTop = 0;
        }
      });
    }
  }, [props.isAddRowInProgress]);

  return (
    <>
      {showConnectDataOverlay && (
        <ConnectDataOverlay
          btnText={createMessage(CONNECT_BUTTON_TEXT)}
          message={createMessage(TABLE_CONNECT_OVERLAY_TEXT)}
          onConnectData={props.onConnectData}
        />
      )}
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
        multiRowSelection={props.multiRowSelection}
        tableSizes={tableSizes}
        triggerRowSelection={props.triggerRowSelection}
        variant={props.variant}
        width={props.width}
      >
        <PopoverStyles
          borderRadius={props.borderRadius}
          widgetId={props.widgetId}
        />
        {isHeaderVisible && (
          <SimpleBar
            style={{
              maxHeight: tableSizes.TABLE_HEADER_HEIGHT,
            }}
          >
            <TableHeaderWrapper
              backgroundColor={Colors.WHITE}
              ref={tableHeaderWrapperRef}
              serverSidePaginationEnabled={props.serverSidePaginationEnabled}
              tableSizes={tableSizes}
              width={props.width}
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
                  disableAddNewRow={!!props.editableCell?.column}
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
                  serverSidePaginationEnabled={
                    props.serverSidePaginationEnabled
                  }
                  tableColumns={columns}
                  tableData={data}
                  tableSizes={tableSizes}
                  totalRecordsCount={props.totalRecordsCount}
                  updatePageNo={props.updatePageNo}
                  widgetId={props.widgetId}
                  widgetName={props.widgetName}
                />
              </TableHeaderInnerWrapper>
            </TableHeaderWrapper>
          </SimpleBar>
        )}
        <div
          className={
            props.isLoading && (!props.isInfiniteScroll || !props.data?.length)
              ? Classes.SKELETON
              : shouldUseVirtual
                ? "tableWrap virtual"
                : "tableWrap"
          }
          ref={tableWrapperRef}
        >
          <div {...getTableProps()} className="table column-freeze">
            {!shouldUseVirtual && (
              <StaticTable
                accentColor={props.accentColor}
                borderRadius={props.borderRadius}
                canFreezeColumn={props.canFreezeColumn}
                columns={props.columns}
                disableDrag={props.disableDrag}
                editMode={props.editMode}
                enableDrag={props.enableDrag}
                getTableBodyProps={getTableBodyProps}
                handleAllRowSelectClick={handleAllRowSelectClick}
                handleColumnFreeze={props.handleColumnFreeze}
                handleReorderColumn={props.handleReorderColumn}
                headerGroups={headerGroups}
                height={props.height}
                isAddRowInProgress={props.isAddRowInProgress}
                isLoading={props.isLoading}
                isResizingColumn={isResizingColumn}
                isSortable={props.isSortable}
                multiRowSelection={props?.multiRowSelection}
                nextPageClick={props.nextPageClick}
                pageSize={props.pageSize}
                prepareRow={prepareRow}
                primaryColumnId={props.primaryColumnId}
                ref={scrollBarRef}
                rowSelectionState={rowSelectionState}
                scrollContainerStyles={scrollContainerStyles}
                selectTableRow={props.selectTableRow}
                selectedRowIndex={props.selectedRowIndex}
                selectedRowIndices={props.selectedRowIndices}
                sortTableColumn={props.sortTableColumn}
                subPage={subPage}
                tableSizes={tableSizes}
                totalColumnsWidth={totalColumnsWidth}
                useVirtual={shouldUseVirtual}
                widgetId={props.widgetId}
                width={props.width}
              />
            )}

            {shouldUseVirtual && (
              <VirtualTable
                accentColor={props.accentColor}
                borderRadius={props.borderRadius}
                canFreezeColumn={props.canFreezeColumn}
                columns={props.columns}
                disableDrag={props.disableDrag}
                editMode={props.editMode}
                enableDrag={props.enableDrag}
                getTableBodyProps={getTableBodyProps}
                handleAllRowSelectClick={handleAllRowSelectClick}
                handleColumnFreeze={props.handleColumnFreeze}
                handleReorderColumn={props.handleReorderColumn}
                headerGroups={headerGroups}
                height={props.height}
                isAddRowInProgress={props.isAddRowInProgress}
                isLoading={props.isLoading}
                isResizingColumn={isResizingColumn}
                isSortable={props.isSortable}
                loadMore={props.nextPageClick}
                multiRowSelection={props?.multiRowSelection}
                pageSize={props.pageSize}
                prepareRow={prepareRow}
                primaryColumnId={props.primaryColumnId}
                ref={scrollBarRef}
                rowSelectionState={rowSelectionState}
                scrollContainerStyles={scrollContainerStyles}
                selectTableRow={props.selectTableRow}
                selectedRowIndex={props.selectedRowIndex}
                selectedRowIndices={props.selectedRowIndices}
                sortTableColumn={props.sortTableColumn}
                subPage={subPage}
                tableSizes={tableSizes}
                totalColumnsWidth={totalColumnsWidth}
                useVirtual={shouldUseVirtual}
                widgetId={props.widgetId}
                width={props.width}
              />
            )}
          </div>
        </div>
      </TableWrapper>
    </>
  );
}

export default Table;
