import React, { useCallback, useMemo } from "react";
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
import { TableWrapper } from "./TableStyledWrappers";
import { TableHeader } from "./TableHeader";
import { Classes } from "@blueprintjs/core";
import type {
  ReactTableColumnProps,
  ReactTableFilter,
  CompactMode,
  AddNewRowActions,
  StickyType,
} from "./Constants";
import { TABLE_SIZES, CompactModeTypes } from "./Constants";
import { Colors } from "constants/Colors";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { EditableCell, TableVariant } from "../constants";
import "simplebar-react/dist/simplebar.min.css";
import StaticTable from "./StaticTable";
import VirtualTable from "./VirtualTable";
import { ConnectDataOverlay } from "widgets/ConnectDataOverlay";
import { TABLE_CONNECT_OVERLAY_TEXT } from "../constants/messages";
import {
  createMessage,
  CONNECT_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import styles from "./styles.module.css";

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
  onSearch: (searchKey: any) => void;
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
  prepareRow: any;
  headerWidth?: number;
  rowSelectionState: 0 | 1 | 2 | null;
  widgetId: string;
}

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

  const shouldUseVirtual =
    props.serverSidePaginationEnabled &&
    !props.columns.some((column) => column.columnProperties.allowCellWrapping);

  const variant = (() => {
    if (props.variant === "DEFAULT") return "default";
    if (props.variant === "VARIANT2") return "no-borders";
    if (props.variant === "VARIANT3") return "horizontal-borders";

    return "default";
  })();

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
        className={styles.table}
        data-status={props.isAddRowInProgress ? "add-row-in-progress" : ""}
        data-type={shouldUseVirtual ? "virtualized" : "static"}
        data-variant={variant}
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
          <TableHeader
            allowAddNewRow={props.allowAddNewRow}
            applyFilter={props.applyFilter}
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
            onSearch={props.onSearch}
            pageCount={pageCount}
            pageNo={props.pageNo}
            pageOptions={pageOptions}
            prevPageClick={props.prevPageClick}
            searchKey={props.searchKey}
            serverSidePaginationEnabled={props.serverSidePaginationEnabled}
            tableColumns={columns}
            tableData={data}
            tableSizes={tableSizes}
            totalRecordsCount={props.totalRecordsCount}
            updatePageNo={props.updatePageNo}
            widgetId={props.widgetId}
            widgetName={props.widgetName}
            width={props.width}
          />
        )}
        <div
          className={`tableWrap ${
            props.isLoading
              ? Classes.SKELETON
              : shouldUseVirtual
                ? " virtual"
                : ""
          }`}
          data-table-wrapper=""
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
                isResizingColumn={isResizingColumn}
                isSortable={props.isSortable}
                multiRowSelection={props?.multiRowSelection}
                pageSize={props.pageSize}
                prepareRow={prepareRow}
                primaryColumnId={props.primaryColumnId}
                rowSelectionState={rowSelectionState}
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
                isResizingColumn={isResizingColumn}
                isSortable={props.isSortable}
                multiRowSelection={props?.multiRowSelection}
                pageSize={props.pageSize}
                prepareRow={prepareRow}
                primaryColumnId={props.primaryColumnId}
                rowSelectionState={rowSelectionState}
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
