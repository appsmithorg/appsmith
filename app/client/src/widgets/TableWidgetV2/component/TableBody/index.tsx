import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { Ref } from "react";
import React, { useEffect, useRef } from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import { Virtuoso } from "react-virtuoso";
import type { ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import type { ReactTableColumnProps, TableSizes } from "../Constants";
import type { HeaderComponentProps } from "../Table";
import { EmptyRow, EmptyRows, Row } from "./Row";
import _ from "lodash";

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

const Footer = () => {
  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      Loading...
    </div>
  );
};

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
}

const TableVirtualBodyComponent = React.forwardRef((props: BodyPropsType) => {
  const { height, rows, tableSizes } = props;

  // Use a ref to store the accumulated data
  const accumulatedDataRef = useRef<
    ReactTableRowType<Record<string, unknown>>[]
  >([]);

  useEffect(() => {
    if (!rows.length) return;

    // Create a map of existing IDs for quick lookup
    const existingIds = new Set(
      accumulatedDataRef.current.map((row) => row.id),
    );

    // Filter out rows that already exist and add new unique rows
    const newUniqueRows = rows.filter((row) => !existingIds.has(row.id));

    if (newUniqueRows.length) {
      // Combine existing and new rows, then sort by ID
      const combinedRows = [...accumulatedDataRef.current, ...newUniqueRows];

      // Sort the combined rows based on ID
      // If IDs are numbers, sort numerically; if strings, sort alphabetically
      const sortedRows = _.sortBy(combinedRows, (row) => {
        return typeof row.id === "number"
          ? row.id
          : row.id.toString().toLowerCase();
      });

      // Update the accumulated data with sorted unique rows
      accumulatedDataRef.current = sortedRows;
    }
  }, [rows]);

  return (
    <div>
      <Virtuoso
        components={{ Footer }}
        data={accumulatedDataRef.current}
        endReached={() => props.loadMore()}
        itemContent={(index) => {
          if (index < rows.length) {
            const row = rows[index];

            return (
              <Row
                className="t--virtual-row"
                index={index}
                key={index}
                row={row}
                style={{
                  width: `calc(100% + ${2 * WIDGET_PADDING}px)`,
                }}
              />
            );
          } else {
            return (
              <EmptyRow
                style={{
                  width: `calc(100% + ${2 * WIDGET_PADDING}px)`,
                }}
              />
            );
          }
        }}
        overscan={200}
        style={{
          height:
            height -
            tableSizes.TABLE_HEADER_HEIGHT -
            2 * tableSizes.VERTICAL_PADDING,
          width: `calc(100% + ${2 * WIDGET_PADDING}px)`,
        }}
      />
    </div>
  );
});

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
