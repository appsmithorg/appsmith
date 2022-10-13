import React, { Ref } from "react";
import {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import { FixedSizeList, ListChildComponentProps, areEqual } from "react-window";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EmptyRows, EmptyRow, Row } from "./Row";
import { ReactTableColumnProps, TableSizes } from "../Constants";

type BodyContextType = {
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
};

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
  tableSizes: TableSizes;
};

const TableVirtualBodyComponent = React.forwardRef(
  (props: BodyPropsType, ref: Ref<HTMLDivElement>) => {
    return (
      <div {...props.getTableBodyProps()} className="tbody no-scroll">
        <FixedSizeList
          height={
            props.height -
            props.tableSizes.TABLE_HEADER_HEIGHT -
            props.tableSizes.COLUMN_HEADER_HEIGHT -
            2 * WIDGET_PADDING // Top and bottom padding
          }
          itemCount={Math.max(props.rows.length, props.pageSize)}
          itemData={props.rows}
          itemSize={
            props.tableSizes.ROW_HEIGHT + props.tableSizes.ROW_VIRTUAL_OFFSET
          }
          outerRef={ref}
          width={`calc(100% + ${2 * WIDGET_PADDING}px`}
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
      <div {...props.getTableBodyProps()} className="tbody" ref={ref}>
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
    props: BodyPropsType & BodyContextType & { useVirtual: boolean },
    ref: Ref<HTMLDivElement>,
  ) => {
    const {
      accentColor,
      borderRadius,
      columns,
      multiRowSelection,
      prepareRow,
      primaryColumnId,
      rows,
      selectedRowIndex,
      selectedRowIndices,
      selectTableRow,
      useVirtual,
      width,
      ...restOfProps
    } = props;

    return (
      <BodyContext.Provider
        value={{
          accentColor,
          borderRadius,
          multiRowSelection,
          prepareRow,
          primaryColumnId,
          selectTableRow,
          selectedRowIndex,
          selectedRowIndices,
          columns,
          width,
          rows,
        }}
      >
        {useVirtual ? (
          <TableVirtualBodyComponent ref={ref} rows={rows} {...restOfProps} />
        ) : (
          <TableBodyComponent ref={ref} rows={rows} {...restOfProps} />
        )}
      </BodyContext.Provider>
    );
  },
);
