import _ from "lodash";
import React, { useCallback, useEffect, useRef } from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
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
};

const VirtualTable = (props: VirtualTableProps, ref: React.Ref<SimpleBar>) => {
  // Use a ref to store the previous scroll position
  const prevScrollTop = useRef(0);
  const isLoadingRef = useRef(false);

  // Create a throttled scroll handler that will run at most once every 200ms
  const handleScroll = useCallback(
    _.throttle(
      (e: React.UIEvent<HTMLElement>) => {
        // Skip if we're currently loading
        if (isLoadingRef.current) return;

        const target = e.target as HTMLElement;

        // Scroll position properties
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        const scrollBottom = scrollHeight - (scrollTop + clientHeight);
        const threshold = 20;

        // Check if scrolling downwards
        const isScrollingDown = scrollTop > prevScrollTop.current;

        // Update the previous scroll position
        prevScrollTop.current = scrollTop;

        // Only trigger loadMore if scrolling down and near the bottom
        const isNearBottom = scrollBottom < threshold;

        if (isScrollingDown && isNearBottom) {
          isLoadingRef.current = true;

          Promise.resolve(props.loadMore()).finally(() => {
            // Reset loading flag after loadMore completes
            isLoadingRef.current = false;
            // Reset scroll to the top
            target.scrollTo({
              top: 0,
              behavior: "auto",
            });
          });
        }
      },
      200,
      { leading: true, trailing: true },
    ),
    [props.loadMore],
  );

  // Cleanup the throttled function on unmount
  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return (
    <SimpleBar
      onScrollCapture={handleScroll}
      ref={ref}
      style={props.scrollContainerStyles}
    >
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
          isResizingColumn={props.isResizingColumn}
          isSortable={props.isSortable}
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
          useVirtual={props.useVirtual}
          widgetId={props.widgetId}
          width={props.width}
        />
      )}
    </SimpleBar>
  );
};

export default React.forwardRef(VirtualTable);
