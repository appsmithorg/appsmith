import React, { useLayoutEffect } from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { ListChildComponentProps, ReactElementType } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import { EmptyRows, EmptyRow, Row } from "./Row";
import type { ReactTableColumnProps, TableSizes } from "../Constants";
import type { HeaderComponentProps } from "../Table";

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
}

const TableVirtualBodyComponent = (props: BodyPropsType) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [horizontalScrollbarHeight, setHorizontalScrollbarHeight] =
    React.useState(0);

  useLayoutEffect(() => {
    if (ref.current) {
      const horizontalScrollbar = ref.current;
      if (horizontalScrollbar) {
        setHorizontalScrollbarHeight(
          horizontalScrollbar.offsetHeight - horizontalScrollbar.clientHeight,
        );
      }
    }
  }, [ref.current]);

  return (
    <FixedSizeList
      data-virtual-list=""
      height={
        props.height +
        props.tableSizes.COLUMN_HEADER_HEIGHT +
        horizontalScrollbarHeight
      }
      innerElementType={props.innerElementType}
      itemCount={Math.max(props.rows.length, props.pageSize)}
      itemData={props.rows}
      itemSize={props.tableSizes.ROW_HEIGHT}
      outerRef={ref}
      style={{
        overflow: "auto",
        scrollbarColor: "initial",
      }}
      width="100cqw"
    >
      {rowRenderer}
    </FixedSizeList>
  );
};

const TableBodyComponent = (props: BodyPropsType) => {
  return (
    <div
      {...props.getTableBodyProps()}
      className="tbody body"
      style={{ height: props.height }}
    >
      {props.rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {props.pageSize > props.rows.length && (
        <EmptyRows rowCount={props.pageSize - props.rows.length} />
      )}
    </div>
  );
};

export const TableBody = (
  props: BodyPropsType & BodyContextType & { useVirtual: boolean },
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
        <TableVirtualBodyComponent rows={rows} width={width} {...restOfProps} />
      ) : (
        <TableBodyComponent rows={rows} {...restOfProps} />
      )}
    </BodyContext.Provider>
  );
};
