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
import type { CSSProperties } from "styled-components";

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
  scrollContainerStyles: CSSProperties;
  useVirtual: boolean;
  loadMore: () => void;
  isLoading: boolean;
};

const VirtualTable = (props: VirtualTableProps, ref: React.Ref<SimpleBar>) => {
  // Use a ref to store the previous scroll position
  const prevScrollTop = useRef(0);
  const isLoadingRef = useRef(false); // Lock to prevent multiple triggers
  const prevDataRef = useRef(props.subPage); // Ref to store previous data

  // Create a debounced scroll handler that will run after the user stops scrolling
  const handleScroll = useCallback(
    _.debounce(
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
          // Set the lock to prevent multiple triggers
          isLoadingRef.current = true;

          // Trigger loadMore
          Promise.resolve(props.loadMore()).finally(() => {
            // Reset the lock after loadMore completes
            isLoadingRef.current = false;
          });
        }
      },
      200, // Adjust debounce delay as needed
      { leading: true, trailing: true },
    ),
    [props.loadMore],
  );

  // Cleanup the debounced function on unmount
  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  // Effect to scroll to the top when data changes
  useEffect(() => {
    if (!_.isEqual(prevDataRef.current, props.subPage)) {
      // Data has changed, scroll to the top
      const simpleBarRef = ref as React.RefObject<SimpleBar>;
      const scrollableNode = simpleBarRef.current?.getScrollElement();

      if (scrollableNode) {
        scrollableNode.scrollTo({ top: 0, behavior: "auto" });
      }

      // Update the previous data ref
      prevDataRef.current = props.subPage;
    }
  }, [props.subPage, ref]);

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
          isLoading={props.isLoading}
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
