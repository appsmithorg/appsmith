import type { Ref } from "react";
import React from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import { type ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import type { ReactTableColumnProps, TableSizes } from "../Constants";
import type { HeaderComponentProps } from "../Table";
import InfiniteScrollBody from "./InifiniteScrollBody";
import { EmptyRows, Row } from "./Row";
import { FixedVirtualList } from "./VirtualList";
import type { VirtuosoHandle } from "react-virtuoso";

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
  totalRecordsCount?: number;
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
    ref: Ref<SimpleBar | VirtuosoHandle>,
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
        {isInfiniteScrollEnabled ? (
          <InfiniteScrollBody
            ref={ref as React.Ref<VirtuosoHandle>}
            rows={rows}
            totalRecordsCount={props.totalRecordsCount ?? rows.length}
            {...restOfProps}
          />
        ) : useVirtual ? (
          <TableVirtualBodyComponent
            isInfiniteScrollEnabled={false}
            ref={ref as React.Ref<SimpleBar>}
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
