import React from "react";
import type {
  TableBodyPropGetter,
  TableBodyProps,
  Row as ReactTableRowType,
} from "react-table";
import type { ReactTableColumnProps, TableSizes } from "./Constants";
import type { TableColumnHeaderProps } from "./TableHeader/TableColumnHeader";
import VirtualTableInnerElement from "./TableHeader/VirtualTableInnerElement";
import { TableBody } from "./TableBody";

type VirtualTableProps = TableColumnHeaderProps & {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  height: number;
  width?: number;
  tableSizes: TableSizes;
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
  totalColumnsWidth?: number;
  useVirtual: boolean;
};

const VirtualTable = (props: VirtualTableProps) => {
  return (
    <TableBody
      accentColor={props.accentColor}
      borderRadius={props.borderRadius}
      canFreezeColumn={props.canFreezeColumn}
      columns={props.columns}
      disableDrag={props.disableDrag}
      editMode={props.editMode}
      enableDrag={props.enableDrag}
      getTableBodyProps={props.getTableBodyProps}
      handleAllRowSelectClick={props.handleAllRowSelectClick}
      handleColumnFreeze={props.handleColumnFreeze}
      handleReorderColumn={props.handleReorderColumn}
      headerGroups={props.headerGroups}
      height={props.pageSize * props.tableSizes.ROW_HEIGHT}
      innerElementType={VirtualTableInnerElement}
      isAddRowInProgress={props.isAddRowInProgress}
      isResizingColumn={props.isResizingColumn}
      isSortable={props.isSortable}
      multiRowSelection={!!props.multiRowSelection}
      pageSize={props.pageSize}
      prepareRow={props.prepareRow}
      primaryColumnId={props.primaryColumnId}
      rowSelectionState={props.rowSelectionState}
      rows={props.subPage}
      selectTableRow={props.selectTableRow}
      selectedRowIndex={props.selectedRowIndex}
      selectedRowIndices={props.selectedRowIndices}
      sortTableColumn={props.sortTableColumn}
      totalColumnsWidth={props?.totalColumnsWidth}
      useVirtual={props.useVirtual}
      widgetId={props.widgetId}
      width={props.width}
    />
  );
};

export default React.forwardRef(VirtualTable);
