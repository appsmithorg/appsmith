import React from "react";
import type {
  TableBodyPropGetter,
  TableBodyProps,
  Row as ReactTableRowType,
} from "react-table";
import type { ReactElementType } from "react-window";
import "simplebar-react/dist/simplebar.min.css";
import type { ReactTableColumnProps, TableSizes } from "./Constants";
import { MULTISELECT_CHECKBOX_WIDTH } from "./Constants";
import type { TableColumnHeaderProps } from "./TableHeader/TableColumnHeader";
import TableColumnHeader from "./TableHeader/TableColumnHeader";
import { TableBody } from "./TableBody";

type StaticTableProps = TableColumnHeaderProps & {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  height: number;
  width?: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
  accentColor: string;
  borderRadius: string;
  multiRowSelection?: boolean;
  prepareRow?(row: ReactTableRowType<Record<string, unknown>>): void;
  selectTableRow?: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  columns: ReactTableColumnProps[];
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  headerProps?: TableColumnHeaderProps | Record<string, never>;
  totalColumnsWidth?: number;
  tableBodyRef?: React.MutableRefObject<HTMLDivElement | null>;
  excludeFromTabOrder?: boolean;
};

const StaticTable = (props: StaticTableProps) => {
  return (
    <>
      <TableColumnHeader
        accentColor={props.accentColor}
        borderRadius={props.borderRadius}
        canFreezeColumn={props.canFreezeColumn}
        columns={props.columns}
        disableDrag={props.disableDrag}
        editMode={props.editMode}
        enableDrag={props.enableDrag}
        excludeFromTabOrder={props.excludeFromTabOrder}
        handleAllRowSelectClick={props.handleAllRowSelectClick}
        handleColumnFreeze={props.handleColumnFreeze}
        handleReorderColumn={props.handleReorderColumn}
        headerGroups={props.headerGroups}
        headerWidth={
          props.multiRowSelection && props.totalColumnsWidth
            ? MULTISELECT_CHECKBOX_WIDTH + props.totalColumnsWidth
            : props.totalColumnsWidth
        }
        isResizingColumn={props.isResizingColumn}
        isSortable={props.isSortable}
        multiRowSelection={props.multiRowSelection}
        prepareRow={props.prepareRow}
        rowSelectionState={props.rowSelectionState}
        sortTableColumn={props.sortTableColumn}
        subPage={props.subPage}
        widgetId={props.widgetId}
        width={props.width}
      />
      <TableBody
        accentColor={props.accentColor}
        borderRadius={props.borderRadius}
        columns={props.columns}
        excludeFromTabOrder={props.excludeFromTabOrder}
        getTableBodyProps={props.getTableBodyProps}
        height={props.pageSize * props.tableSizes.ROW_HEIGHT}
        isAddRowInProgress={props.isAddRowInProgress}
        multiRowSelection={!!props.multiRowSelection}
        pageSize={props.pageSize}
        prepareRow={props.prepareRow}
        primaryColumnId={props.primaryColumnId}
        rows={props.subPage}
        selectTableRow={props.selectTableRow}
        selectedRowIndex={props.selectedRowIndex}
        selectedRowIndices={props.selectedRowIndices}
        width={props.width}
      />
    </>
  );
};

export default React.forwardRef(StaticTable);
