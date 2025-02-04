import type { Ref } from "react";
import React from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { ListChildComponentProps, ReactElementType } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EmptyRows, EmptyRow, Row } from "./Row";
import type { ReactTableColumnProps, TableSizes } from "../Constants";
import type { HeaderComponentProps } from "../Table";
import type SimpleBar from "simplebar-react";
import InfiniteLoader from "react-window-infinite-loader";

export type BodyContextType = {
  accentColor: string;
  borderRadius: string;
  multiRowSelection: boolean;
  prepareRow?(row: ReactTableRowType<Record<string, unknown>>): void;
  selectTableRow?: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  columns: ReactTableColumnProps[];
  width: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  getTableBodyProps?(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  totalColumnsWidth?: number;
} & Partial<HeaderComponentProps>;

export const BodyContext = React.createContext<BodyContextType>({
  accentColor: "",
  borderRadius: "",
  multiRowSelection: false,
  selectedRowIndex: -1,
  selectedRowIndices: [],
  columns: [],
  width: 0,
  rows: [],
  primaryColumnId: "",
  isAddRowInProgress: false,
  totalColumnsWidth: 0,
});

const rowRenderer = React.memo((rowProps: ListChildComponentProps) => {
  const { data, index, style } = rowProps;

  if (index < data.length) {
    const row = data[index];

    return (
      <Row
        className="t--virtual-row"
        index={index}
        key={index}
        row={row}
        style={style}
      />
    );
  } else {
    return <EmptyRow style={style} />;
  }
}, areEqual);

interface BodyPropsType {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  width?: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
  loadMore: () => void;
  isLoading: boolean;
}

const LoadingIndicator = () => (
  <div className="sticky bottom-0 left-0 right-0 p-2 bg-white border-t">
    <div className="flex items-center justify-center p-2 space-x-2 bg-gray-50 rounded">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-600">Loading data...</span>
    </div>
  </div>
);

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<SimpleBar>) => {
    const { rows } = props;
    const isItemLoaded = (index: number) => index < rows.length;
    const TOTAL_ITEM_COUNT = 517; // static value for poc, this should come from total record count

    return (
      <div className="simplebar-content-wrapper">
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={TOTAL_ITEM_COUNT}
          loadMoreItems={() => {
            props.loadMore();
          }}
          threshold={rows.length - 3} // Load more items when the user is within 3 rows of the end
        >
          {({ onItemsRendered, ref: infiniteLoaderRef }) => (
            <FixedSizeList
              className="virtual-list simplebar-content"
              height={
                props.height -
                props.tableSizes.TABLE_HEADER_HEIGHT -
                2 * props.tableSizes.VERTICAL_PADDING
              }
              innerElementType={props.innerElementType}
              itemCount={TOTAL_ITEM_COUNT}
              itemData={rows}
              itemSize={props.tableSizes.ROW_HEIGHT}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              ref={infiniteLoaderRef}
              width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
            >
              {rowRenderer}
            </FixedSizeList>
          )}
        </InfiniteLoader>
        {props.isLoading && <LoadingIndicator />}
      </div>
    );
  },
);

const TableBodyComponent = (props: BodyPropsType) => {
  return (
    <div {...props.getTableBodyProps()} className="tbody body">
      {props.rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {props.pageSize > props.rows.length && (
        <EmptyRows rowCount={props.pageSize - props.rows.length} />
      )}
    </div>
  );
};

export const TableBody = React.forwardRef(
  (
    props: BodyPropsType & BodyContextType & { useVirtual: boolean },
    ref: Ref<SimpleBar>,
  ) => {
    const {
      accentColor,
      borderRadius,
      canFreezeColumn,
      columns,
      disableDrag,
      editMode,
      enableDrag,
      handleAllRowSelectClick,
      handleColumnFreeze,
      handleReorderColumn,
      headerGroups,
      isAddRowInProgress,
      isResizingColumn,
      isSortable,
      multiRowSelection,
      prepareRow,
      primaryColumnId,
      rows,
      rowSelectionState,
      selectedRowIndex,
      selectedRowIndices,
      selectTableRow,
      sortTableColumn,
      subPage,
      useVirtual,
      widgetId,
      width,
      ...restOfProps
    } = props;

    return (
      <BodyContext.Provider
        value={{
          accentColor,
          canFreezeColumn,
          disableDrag,
          editMode,
          enableDrag,
          handleAllRowSelectClick,
          handleColumnFreeze,
          handleReorderColumn,
          headerGroups,
          isResizingColumn,
          isSortable,
          rowSelectionState,
          sortTableColumn,
          subPage,
          widgetId,
          isAddRowInProgress,
          borderRadius,
          multiRowSelection,
          prepareRow,
          primaryColumnId,
          selectedRowIndex,
          selectedRowIndices,
          selectTableRow,
          columns,
          width,
          rows,
          getTableBodyProps: props.getTableBodyProps,
          totalColumnsWidth: props.totalColumnsWidth,
        }}
      >
        {useVirtual ? (
          <TableVirtualBodyComponent
            ref={ref}
            rows={rows}
            width={width}
            {...restOfProps}
          />
        ) : (
          <TableBodyComponent rows={rows} {...restOfProps} />
        )}
      </BodyContext.Provider>
    );
  },
);
