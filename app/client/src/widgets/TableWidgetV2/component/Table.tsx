import { Classes as PopOver2Classes } from "@blueprintjs/popover2";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { CONNECT_BUTTON_TEXT, createMessage } from "ee/constants/messages";
import fastdom from "fastdom";
import { reduce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Row as ReactTableRowType,
  TableInstance,
  TableState,
} from "react-table";
import {
  useBlockLayout,
  useExpanded,
  usePagination,
  useResizeColumns,
  useRowSelect,
  useSortBy,
  useTable,
} from "react-table";
import { useSticky } from "react-table-sticky";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { createGlobalStyle } from "styled-components";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { ConnectDataOverlay } from "widgets/ConnectDataOverlay";
import { darkenColor } from "widgets/WidgetUtils";
import {
  ColumnTypes,
  type EditableCell,
  type TableVariant,
} from "../constants";
import { TABLE_CONNECT_OVERLAY_TEXT } from "../constants/messages";
import type {
  AddNewRowActions,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
  StickyType,
} from "./Constants";
import {
  CompactModeTypes,
  TABLE_SCROLLBAR_HEIGHT,
  TABLE_SIZES,
} from "./Constants";
import StaticTable from "./StaticTable";
import {
  TableHeaderInnerWrapper,
  TableHeaderWrapper,
  TableWrapper,
} from "./TableStyledWrappers";
import VirtualTable from "./VirtualTable";
import TableHeader from "./header";

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
  isInfiniteScrollEnabled?: boolean;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
}

export interface ReactTablePropertiesState extends TableState {
  pageIndex: number;
  pageSize: number;
}

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
  isVisibleSearch?: boolean;
  isVisibleFilters?: boolean;
  isVisibleDownload?: boolean;
  isVisiblePagination?: boolean;
  filters?: ReactTableFilter[];
  updateFilter: (filters: ReactTableFilter[]) => void;
  searchKey: string;
  pageNo?: number;
  pageSize: number;
  totalRecordsCount?: number;
  isLastPage?: boolean;
  isFirstPage?: boolean;
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
    primaryColumnId,
  } = props;
  const [accumulatedData, setAccumulatedData] = useState(data);

  useEffect(() => {
    // Process the data before accumulating
    const processedData = data.map((row, index) => ({
      ...row,
      __originalIndex__: index,
      __primaryKey__: row[primaryColumnId || ""] || index + 1,
    }));

    if (!props.isInfiniteScrollEnabled) {
      setAccumulatedData(processedData);
    } else if (props.pageNo === 1) {
      setAccumulatedData(processedData);
    } else {
      setAccumulatedData((prevData) => [...prevData, ...processedData]);
    }
  }, [data, props.isInfiniteScrollEnabled, props.pageNo, primaryColumnId]);

  const handleNextPage = useCallback(() => {
    if (props.nextPageClick && !props.isNextPageLoading && props.hasNextPage) {
      props.nextPageClick();
    }
  }, [props.nextPageClick, props.isNextPageLoading, props.hasNextPage]);

  const tableSizesValue =
    TABLE_SIZES[props.compactMode || CompactModeTypes.DEFAULT];

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
    getTableBodyProps: mainTableBodyProps,
    getTableProps: mainTableProps,
    headerGroups: tableHeaderGroups,
    page: tablePage,
    pageOptions,
    prepareRow: tablePrepareRow,
    rows,
    totalColumnsWidth: tableTotalColumnsWidth,
    state,
    page,
  } = useTable(
    {
      columns,
      data: accumulatedData,
      defaultColumn: {
        minWidth: 30,
        width: 150,
      },
      initialState: {
        pageIndex: 0,
        pageSize: props.pageSize,
      },
      manualPagination: true,
      pageCount: Math.ceil((props.totalRecordsCount || 0) / props.pageSize),
    },
    useBlockLayout,
    useSortBy,
    useExpanded,
    useResizeColumns,
    usePagination,
    useRowSelect,
    useSticky,
  ) as TableInstance & { totalColumnsWidth: number };

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

  // Create a ref for the scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollObserverRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (props.isInfiniteScrollEnabled && scrollContainerRef.current) {
      const options = {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      };

      const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          props.hasNextPage &&
          !props.isNextPageLoading
        ) {
          handleNextPage();
        }
      }, options);

      scrollObserverRef.current = observer;
      observer.observe(scrollContainerRef.current);

      return () => {
        if (scrollObserverRef.current) {
          scrollObserverRef.current.disconnect();
        }
      };
    }
  }, [
    props.isInfiniteScrollEnabled,
    props.hasNextPage,
    props.isNextPageLoading,
    handleNextPage,
  ]);

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
        tableSizes={tableSizesValue}
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
              maxHeight: tableSizesValue.TABLE_HEADER_HEIGHT,
            }}
          >
            <TableHeaderWrapper
              backgroundColor={Colors.WHITE}
              ref={tableHeaderWrapperRef}
              serverSidePaginationEnabled={props.serverSidePaginationEnabled}
              tableSizes={tableSizesValue}
              width={props.width}
            >
              <TableHeaderInnerWrapper
                backgroundColor={Colors.WHITE}
                serverSidePaginationEnabled={props.serverSidePaginationEnabled}
                tableSizes={tableSizesValue}
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
          className={`tableWrap`}
          data-testid="table-widget-wrapper"
          onClick={stopEventPropagation}
          ref={tableWrapperRef}
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            boxShadow: `0px 0px 4px 0px ${
              props.editMode ? Colors.GREY_2 : "rgba(0, 0, 0, 0.25)"
            }`,
            borderRadius: props.borderRadius,
            border: `1px solid ${darkenColor(
              props.accentColor,
              props.editMode ? 0 : isResizingColumn.current ? 0.3 : 0.1,
            )}`,
            backgroundColor: Colors.WHITE,
          }}
        >
          <div {...mainTableProps} className="table column-freeze">
            {!shouldUseVirtual && (
              <StaticTable
                accentColor={props.accentColor}
                borderRadius={props.borderRadius}
                canFreezeColumn={props.canFreezeColumn}
                columns={columns}
                disableDrag={props.disableDrag}
                editMode={props.editMode}
                enableDrag={props.enableDrag}
                getTableBodyProps={mainTableBodyProps}
                handleAllRowSelectClick={handleAllRowSelectClick}
                handleColumnFreeze={props.handleColumnFreeze}
                handleReorderColumn={props.handleReorderColumn}
                headerGroups={tableHeaderGroups}
                height={props.height}
                isAddRowInProgress={props.isAddRowInProgress}
                isResizingColumn={isResizingColumn}
                isSortable={props.isSortable}
                multiRowSelection={props?.multiRowSelection}
                pageSize={props.pageSize}
                prepareRow={tablePrepareRow}
                primaryColumnId={props.primaryColumnId}
                ref={scrollBarRef}
                rowSelectionState={rowSelectionState}
                scrollContainerStyles={scrollContainerStyles}
                selectTableRow={props.selectTableRow}
                selectedRowIndex={props.selectedRowIndex}
                selectedRowIndices={props.selectedRowIndices}
                sortTableColumn={props.sortTableColumn}
                subPage={tablePage}
                tableSizes={tableSizesValue}
                totalColumnsWidth={tableTotalColumnsWidth}
                useVirtual={shouldUseVirtual}
                widgetId={props.widgetId}
                width={props.width}
              />
            )}

            {shouldUseVirtual && (
              <div ref={scrollContainerRef}>
                <VirtualTable
                  accentColor={props.accentColor}
                  borderRadius={props.borderRadius}
                  canFreezeColumn={props.canFreezeColumn}
                  columns={columns}
                  disableDrag={props.disableDrag}
                  editMode={props.editMode}
                  enableDrag={props.enableDrag}
                  getTableBodyProps={mainTableBodyProps}
                  handleAllRowSelectClick={handleAllRowSelectClick}
                  handleColumnFreeze={props.handleColumnFreeze}
                  handleReorderColumn={props.handleReorderColumn}
                  headerGroups={tableHeaderGroups}
                  height={props.height}
                  isAddRowInProgress={props.isAddRowInProgress}
                  isResizingColumn={isResizingColumn}
                  isSortable={props.isSortable}
                  multiRowSelection={props?.multiRowSelection}
                  pageSize={props.pageSize}
                  prepareRow={tablePrepareRow}
                  primaryColumnId={props.primaryColumnId}
                  ref={scrollBarRef}
                  rowSelectionState={rowSelectionState}
                  scrollContainerStyles={scrollContainerStyles}
                  selectTableRow={props.selectTableRow}
                  selectedRowIndex={props.selectedRowIndex}
                  selectedRowIndices={props.selectedRowIndices}
                  sortTableColumn={props.sortTableColumn}
                  subPage={tablePage}
                  tableSizes={tableSizesValue}
                  totalColumnsWidth={tableTotalColumnsWidth}
                  useVirtual={shouldUseVirtual}
                  widgetId={props.widgetId}
                  width={props.width}
                  onLoadNextPage={
                    props.isInfiniteScrollEnabled ? handleNextPage : undefined
                  }
                  isNextPageLoading={props.isNextPageLoading}
                  hasNextPage={props.hasNextPage}
                />
              </div>
            )}
          </div>
        </div>
      </TableWrapper>
    </>
  );
}

export default Table;
