import React, { Ref } from "react";
import {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import {
  FixedSizeList,
  ListChildComponentProps,
  areEqual,
  ReactElementType,
} from "react-window";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EmptyRows, EmptyRow, Row } from "./Row";
import { ReactTableColumnProps, TableSizes } from "../Constants";
import { HeaderComponentProps } from "../Table";

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

type BodyPropsType = {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  width?: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
};

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType & { outerRef?: any }) => {
    return (
      <div className="simplebar-content-wrapper">
        <FixedSizeList
          className="virtual-list simplebar-content"
          height={
            props.height -
            props.tableSizes.TABLE_HEADER_HEIGHT -
            2 * WIDGET_PADDING
          }
          innerElementType={props.innerElementType}
          itemCount={Math.max(props.rows.length, props.pageSize)}
          itemData={props.rows}
          itemSize={
            props.tableSizes.ROW_HEIGHT + props.tableSizes.ROW_VIRTUAL_OFFSET
          }
          outerRef={props.outerRef}
          width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
        >
          {rowRenderer}
        </FixedSizeList>
      </div>
    );
  },
);

const TableBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<HTMLDivElement>) => {
    return (
      <div {...props.getTableBodyProps()} className="tbody body" ref={ref}>
        {props.rows.map((row, index) => {
          return <Row index={index} key={index} row={row} />;
        })}
        {props.pageSize > props.rows.length && (
          <EmptyRows rowCount={props.pageSize - props.rows.length} />
        )}
      </div>
    );
  },
);

export const TableBody = React.forwardRef(
  (
    props: BodyPropsType &
      BodyContextType & {
        useVirtual: boolean;
        innerRef?: any;
        outerRef?: any;
      },
    ref: Ref<HTMLDivElement>,
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
          <TableBodyComponent ref={ref} rows={rows} {...restOfProps} />
        )}
      </BodyContext.Provider>
    );
  },
);
