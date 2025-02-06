import React from "react";
import type {
  TableBodyPropGetter,
  TableBodyProps,
  Row as ReactTableRowType,
} from "react-table";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import type { ReactTableColumnProps, TableSizes } from "./Constants";
import type { TableColumnHeaderProps } from "./header/TableColumnHeader";
import VirtualTableInnerElement from "./header/VirtualTableInnerElement";
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollContainerStyles: any;
  useVirtual: boolean;
  loadMore: () => void;
  isLoading: boolean;
  totalRecordsCount?: number;
};

const VirtualTable = (props: VirtualTableProps, ref: React.Ref<SimpleBar>) => {
  return (
    <SimpleBar ref={ref} style={props.scrollContainerStyles}>
      {({ scrollableNodeRef }) => (
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
          height={props.height}
          innerElementType={VirtualTableInnerElement}
          isAddRowInProgress={props.isAddRowInProgress}
          isLoading={props.isLoading}
          isResizingColumn={props.isResizingColumn}
          isSortable={props.isSortable}
          loadMore={props.loadMore}
          multiRowSelection={!!props.multiRowSelection}
          pageSize={props.pageSize}
          prepareRow={props.prepareRow}
          primaryColumnId={props.primaryColumnId}
          ref={scrollableNodeRef}
          rowSelectionState={props.rowSelectionState}
          rows={props.subPage}
          selectTableRow={props.selectTableRow}
          selectedRowIndex={props.selectedRowIndex}
          selectedRowIndices={props.selectedRowIndices}
          sortTableColumn={props.sortTableColumn}
          tableSizes={props.tableSizes}
          totalColumnsWidth={props?.totalColumnsWidth}
          totalRecordsCount={props.totalRecordsCount}
          useVirtual={props.useVirtual}
          widgetId={props.widgetId}
          width={props.width}
        />
      )}
    </SimpleBar>
  );
};

export default React.forwardRef(VirtualTable);
