import type { Ref } from "react";
import React, { useEffect, useRef, useCallback } from "react";
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
  onLoadNextPage?: () => void;
  isNextPageLoading?: boolean;
  hasNextPage?: boolean;
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
  onLoadNextPage?: () => void;
  isNextPageLoading?: boolean;
  hasNextPage?: boolean;
}

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<SimpleBar>) => {
    const lastRowRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const handleIntersection = useCallback(
      (entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          props.hasNextPage &&
          !props.isNextPageLoading &&
          props.onLoadNextPage
        ) {
          props.onLoadNextPage();
        }
      },
      [props.hasNextPage, props.isNextPageLoading, props.onLoadNextPage],
    );

    useEffect(() => {
      if (lastRowRef.current) {
        observerRef.current = new IntersectionObserver(handleIntersection, {
          root: null,
          rootMargin: "100px",
          threshold: 0.1,
        });

        observerRef.current.observe(lastRowRef.current);
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [handleIntersection]);

    return (
      <div className="simplebar-content-wrapper">
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
        <div ref={lastRowRef} style={{ height: "1px" }} />
        {props.isNextPageLoading && (
          <div className="loading-indicator">Loading more...</div>
        )}
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
      onLoadNextPage,
      isNextPageLoading,
      hasNextPage,
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
          onLoadNextPage,
          isNextPageLoading,
          hasNextPage,
        }}
      >
        {useVirtual ? (
          <TableVirtualBodyComponent
            ref={ref}
            rows={rows}
            width={width}
            onLoadNextPage={onLoadNextPage}
            isNextPageLoading={isNextPageLoading}
            hasNextPage={hasNextPage}
            {...restOfProps}
          />
        ) : (
          <TableBodyComponent rows={rows} {...restOfProps} />
        )}
      </BodyContext.Provider>
    );
  },
);
