import React from "react";
import {
  TableBodyPropGetter,
  TableBodyProps,
  Row as ReactTableRowType,
} from "react-table";
import { ReactElementType } from "react-window";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  ReactTableColumnProps,
  TableSizes,
  TABLE_SCROLLBAR_WIDTH,
} from "./Constants";
import {
  HeaderComponent,
  HeaderComponentProps,
} from "./header/TableHeaderComponent";
import { TableBody } from "./TableBody";

type StaticTableProps = HeaderComponentProps & {
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
  headerProps?: HeaderComponentProps | Record<string, never>;
  totalColumnsWidth?: number;
  scrollContainerStyles: any;
  useVirtual: boolean;
  tableBodyRef: React.MutableRefObject<HTMLDivElement | null>;
};

const StaticTable = (props: StaticTableProps) => {
  return (
    <SimpleBar style={props.scrollContainerStyles}>
      <HeaderComponent
        accentColor={props.accentColor}
        borderRadius={props.borderRadius}
        canFreezeColumn={props.canFreezeColumn}
        columnOrder={props.columns.map((item) => item.alias)}
        columns={props.columns}
        disableDrag={props.disableDrag}
        editMode={props.editMode}
        enableDrag={props.enableDrag}
        handleAllRowSelectClick={props.handleAllRowSelectClick}
        handleColumnFreeze={props.handleColumnFreeze}
        handleReorderColumn={props.handleReorderColumn}
        headerGroups={props.headerGroups}
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
        getTableBodyProps={props.getTableBodyProps}
        height={props.height}
        isAddRowInProgress={props.isAddRowInProgress}
        multiRowSelection={!!props.multiRowSelection}
        pageSize={props.pageSize}
        prepareRow={props.prepareRow}
        primaryColumnId={props.primaryColumnId}
        ref={props.tableBodyRef}
        rows={props.subPage}
        selectTableRow={props.selectTableRow}
        selectedRowIndex={props.selectedRowIndex}
        selectedRowIndices={props.selectedRowIndices}
        tableSizes={props.tableSizes}
        useVirtual={props.useVirtual}
        width={props.width - TABLE_SCROLLBAR_WIDTH / 2}
      />
    </SimpleBar>
  );
};

export default StaticTable;
