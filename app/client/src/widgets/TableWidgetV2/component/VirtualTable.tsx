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
import { MULTISELECT_CHECKBOX_WIDTH } from "modules/ui-builder/ui/wds/WDSTableWidget/component/Constants";
import TableColumnHeader from "./header/TableColumnHeader";
import styled from "styled-components";
import type { VirtuosoHandle } from "react-virtuoso";
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
  totalRecordsCount?: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollContainerStyles: any;
  useVirtual: boolean;
  isInfiniteScrollEnabled: boolean;
  isLoading: boolean;
  totalRecordsCount?: number;
  loadMoreFromEvaluations: () => void;
};

const VirtualTable = (
  props: VirtualTableProps,
  ref: React.Ref<SimpleBar | VirtuosoHandle>,
) => {
  const getTableBody = React.useCallback(
    (scrollableNodeRef?: React.Ref<SimpleBar | VirtuosoHandle>) => {
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
          height={props.height}
          innerElementType={VirtualTableInnerElement}
          isAddRowInProgress={props.isAddRowInProgress}
          isInfiniteScrollEnabled={props.isInfiniteScrollEnabled}
          isLoading={props.isLoading}
          isResizingColumn={props.isResizingColumn}
          isSortable={props.isSortable}
          loadMoreFromEvaluations={props.loadMoreFromEvaluations}
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
      );
    },
    [props],
  );

  return !props.isInfiniteScrollEnabled ? (
    <SimpleBar
      ref={ref as React.Ref<SimpleBar>}
      style={props.scrollContainerStyles}
    >
      {getTableBody(ref as React.Ref<SimpleBar>)}
    </SimpleBar>
  ) : (
    <>
      <TableColumnHeader
        accentColor={props.accentColor}
        borderRadius={props.borderRadius}
        canFreezeColumn={props.canFreezeColumn}
        columns={props.columns}
        disableDrag={props.disableDrag}
        editMode={props.editMode}
        enableDrag={props.enableDrag}
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
      <StyledTableBodyWrapper
        className="tbody body"
        multiRowSelection={props.multiRowSelection}
        totalColumnsWidth={props.totalColumnsWidth || 0}
      >
        {getTableBody(ref as React.Ref<VirtuosoHandle>)}
      </StyledTableBodyWrapper>
    </>
  );
};

export default React.forwardRef(VirtualTable);

const StyledTableBodyWrapper = styled.div<{
  multiRowSelection?: boolean;
  totalColumnsWidth: number;
}>`
  width: ${(props) =>
    props.multiRowSelection
      ? MULTISELECT_CHECKBOX_WIDTH + props.totalColumnsWidth
      : props.totalColumnsWidth}px !important;
`;
