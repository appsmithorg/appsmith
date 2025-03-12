import React, { useEffect, useRef, type Ref } from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { VariableSizeList } from "react-window";
import { type ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../Constants";
import InfiniteScrollBody from "./InifiniteScrollBody";
import { EmptyRows, Row } from "./Row";
import { FixedVirtualList } from "./VirtualList";
import { BodyContext, type BodyContextType } from "./BodyContext";
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
  isInfiniteScrollEnabled?: boolean;
  isLoading: boolean;
  loadMoreFromEvaluations: () => void;
  totalRecordsCount?: number;
}

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<SimpleBar>) => {
    return (
      <div className="simplebar-content-wrapper">
        <FixedVirtualList
          height={props.height}
          innerElementType={props.innerElementType}
          itemCount={props.rows.length}
          outerRef={ref}
          pageSize={props.pageSize}
          rows={props.rows}
          tableSizes={props.tableSizes}
        />
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
      isInfiniteScrollEnabled,
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

    const listRef = useRef<VariableSizeList>(null);
    const rowHeights = useRef<{ [key: number]: number }>({});
    // Keep track of which rows need measurement
    const rowNeedsMeasurement = useRef<{ [key: number]: boolean }>({});

    useEffect(() => {
      rowNeedsMeasurement.current = {};
    }, [rows]);

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
          rowHeights: rowHeights,
          rowNeedsMeasurement: rowNeedsMeasurement,
          listRef: listRef,
        }}
      >
        {isInfiniteScrollEnabled ? (
          <InfiniteScrollBody
            ref={ref}
            rows={rows}
            totalRecordsCount={props.totalRecordsCount ?? rows.length}
            {...restOfProps}
          />
        ) : useVirtual ? (
          <TableVirtualBodyComponent
            isInfiniteScrollEnabled={false}
            ref={ref}
            rows={rows}
            width={width}
            {...restOfProps}
          />
        ) : (
          <TableBodyComponent
            isInfiniteScrollEnabled={false}
            rows={rows}
            {...restOfProps}
          />
        )}
      </BodyContext.Provider>
    );
  },
);
