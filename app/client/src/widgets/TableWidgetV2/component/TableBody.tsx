import React, { Ref } from "react";
import {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { ReactTableColumnProps, TableSizes } from "./Constants";
import { renderEmptyRows } from "./cellComponents/EmptyCell";
import { renderBodyCheckBoxCell } from "./cellComponents/SelectionCheckboxCell";
import { WIDGET_PADDING } from "constants/WidgetConstants";

type RowType = {
  accentColor: string;
  borderRadius: string;
  className?: string;
  index: number;
  multiRowSelection?: boolean;
  prepareRow(row: ReactTableRowType<Record<string, unknown>>): void;
  row: ReactTableRowType<Record<string, unknown>>;
  selectTableRow: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  style?: ListChildComponentProps["style"];
};

function Row(props: RowType) {
  props.prepareRow(props.row);
  const rowProps = {
    ...props.row.getRowProps(),
    style: {
      display: "flex",
      ...(props.style || {}),
    },
  };
  const isRowSelected = props.multiRowSelection
    ? props.selectedRowIndices.includes(props.row.index)
    : props.row.index === props.selectedRowIndex;
  return (
    <div
      {...rowProps}
      className={`tr ${isRowSelected ? "selected-row" : ""} ${props.className ||
        ""}`}
      data-rowindex={props.index}
      key={props.index}
      onClick={(e) => {
        props.row.toggleRowSelected();
        props.selectTableRow(props.row);
        e.stopPropagation();
      }}
      role="button"
    >
      {props.multiRowSelection &&
        renderBodyCheckBoxCell(
          isRowSelected,
          props.accentColor,
          props.borderRadius,
        )}
      {props.row.cells.map((cell, cellIndex) => {
        return (
          <div
            {...cell.getCellProps()}
            className="td"
            data-colindex={cellIndex}
            data-rowindex={props.index}
            key={cellIndex}
          >
            {cell.render("Cell")}
          </div>
        );
      })}
    </div>
  );
}

type RowPropsType = Omit<RowType, "index" | "row" | "style"> & {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  tableSizes: TableSizes;
  columns: ReactTableColumnProps[];
  width: number;
};

const TableVirtualBodyComponent = React.forwardRef(
  (props: RowPropsType, ref: Ref<HTMLDivElement>) => {
    const rowRenderer = (rowProps: ListChildComponentProps) => {
      const { index, style } = rowProps;

      if (index < props.rows.length) {
        const row = props.rows[index];

        return (
          <Row
            accentColor={props.accentColor}
            borderRadius={props.borderRadius}
            className="t--virtual-row"
            index={index}
            multiRowSelection={props.multiRowSelection}
            prepareRow={props.prepareRow}
            row={row}
            selectTableRow={props.selectTableRow}
            selectedRowIndex={props.selectedRowIndex}
            selectedRowIndices={props.selectedRowIndices}
            style={style}
          />
        );
      } else {
        return renderEmptyRows(
          1,
          props.columns,
          props.width,
          props.rows,
          props.prepareRow,
          props.multiRowSelection,
          props.accentColor,
          props.borderRadius,
          style,
        )?.[0];
      }
    };

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
          itemSize={props.tableSizes.ROW_HEIGHT}
          outerRef={ref}
          width="100%"
        >
          {rowRenderer}
        </FixedSizeList>
      </div>
    );
  },
);

const TableBodyComponent = React.forwardRef(
  (props: RowPropsType, ref: Ref<HTMLDivElement>) => {
    return (
      <div {...props.getTableBodyProps()} className="tbody" ref={ref}>
        {props.rows.map((row, index) => {
          return (
            <Row
              accentColor={props.accentColor}
              borderRadius={props.borderRadius}
              index={index}
              key={index}
              multiRowSelection={props.multiRowSelection}
              prepareRow={props.prepareRow}
              row={row}
              selectTableRow={props.selectTableRow}
              selectedRowIndex={props.selectedRowIndex}
              selectedRowIndices={props.selectedRowIndices}
            />
          );
        })}
        {props.pageSize > props.rows.length &&
          renderEmptyRows(
            props.pageSize - props.rows.length,
            props.columns,
            props.width,
            props.rows,
            props.prepareRow,
            props.multiRowSelection,
            props.accentColor,
            props.borderRadius,
          )}
      </div>
    );
  },
);

export const TableBody = React.forwardRef(
  (props: RowPropsType & { useVirtual: boolean }, ref: Ref<HTMLDivElement>) => {
    const { useVirtual, ...restOfProps } = props;

    if (useVirtual) {
      return <TableVirtualBodyComponent {...restOfProps} ref={ref} />;
    } else {
      return <TableBodyComponent {...restOfProps} ref={ref} />;
    }
  },
);
