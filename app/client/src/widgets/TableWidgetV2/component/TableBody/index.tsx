import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { Ref } from "react";
import React from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { ListChildComponentProps, ReactElementType } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import type SimpleBar from "simplebar-react";
import type { ReactTableColumnProps, TableSizes } from "../Constants";
import type { HeaderComponentProps } from "../Table";
import { EmptyRow, EmptyRows, Row } from "./Row";

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
  isLoading: boolean;
  isLoadingDirection: string | null;
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
  isLoading: false,
  isLoadingDirection: "down",
});

const LoadingIndicator = () => (
  <div className="sticky bottom-0 left-0 right-0 p-2 bg-white border-t">
    <div className="flex items-center justify-center p-2 space-x-2 bg-gray-50 rounded">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-600">Loading data...</span>
    </div>
  </div>
);

const rowRenderer = React.memo((rowProps: ListChildComponentProps) => {
  const { data, index, style } = rowProps;

  if (index < data.length) {
    const row = data[index];

    return (
      <Row
        className="t--virtual-row"
        data={{
          onHeightChange: data.handleRowHeightChange,
        }}
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
  isLoading: boolean;
  isLoadingDirection: string | null;
  innerElementType?: ReactElementType;
}

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<SimpleBar>) => {
    return (
      <div className="simplebar-content-wrapper">
        {props.isLoading && props.isLoadingDirection === "up" && (
          <LoadingIndicator />
        )}
        <FixedSizeList
          className="virtual-list simplebar-content"
          height={
            props.height -
            props.tableSizes.TABLE_HEADER_HEIGHT -
            2 * props.tableSizes.VERTICAL_PADDING
          }
          innerElementType={props.innerElementType}
          itemCount={Math.max(props.rows.length, props.pageSize)}
          itemData={props.rows}
          itemSize={props.tableSizes.ROW_HEIGHT}
          outerRef={ref}
          width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
        >
          {rowRenderer}
        </FixedSizeList>
        {props.isLoading && props.isLoadingDirection === "down" && (
          <LoadingIndicator />
        )}
      </div>
    );
  },
);

const TableBodyComponent = (props: BodyPropsType) => {
  return (
    <div {...props.getTableBodyProps()} className="tbody body">
      {props.rows.map((row, index) => {
        return <Row data={{}} index={index} key={index} row={row} />;
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
      isLoading,
      isLoadingDirection,
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
          isLoading,
          isLoadingDirection,
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
            isLoading={isLoading}
            isLoadingDirection={isLoadingDirection}
            ref={ref}
            rows={rows}
            width={width}
            {...restOfProps}
          />
        ) : (
          <TableBodyComponent
            isLoading={isLoading}
            isLoadingDirection={isLoadingDirection}
            rows={rows}
            {...restOfProps}
          />
        )}
      </BodyContext.Provider>
    );
  },
);
