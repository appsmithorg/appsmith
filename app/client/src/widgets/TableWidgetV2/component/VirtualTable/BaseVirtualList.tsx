import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useCallback, useMemo, useRef } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type {
  ListChildComponentProps,
  ListOnItemsRenderedProps,
  ReactElementType,
} from "react-window";
import { VariableSizeList, areEqual } from "react-window";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../Constants";
import { Row } from "../TableBodyCoreComponents/Row";
import { EmptyRows } from "../cellComponents/EmptyCell";

type ExtendedListChildComponentProps = ListChildComponentProps & {
  listRef: React.RefObject<VariableSizeList>;
  rowHeights: React.RefObject<{ [key: number]: number }>;
  rowNeedsMeasurement: React.RefObject<{ [key: number]: boolean }>;
  loadMore?: () => void;
  hasMoreData?: boolean;
};

// Create a memoized row component using areEqual from react-window
export const MemoizedRow = React.memo(
  (rowProps: ExtendedListChildComponentProps) => {
    const { data, index, listRef, rowHeights, rowNeedsMeasurement, style } =
      rowProps;

    if (index < data.length) {
      const row = data[index];

      return (
        <Row
          className="t--virtual-row"
          index={index}
          key={index}
          listRef={listRef}
          row={row}
          rowHeights={rowHeights}
          rowNeedsMeasurement={rowNeedsMeasurement}
          style={style}
        />
      );
    } else {
      return <EmptyRows rows={1} style={style} />;
    }
  },
  (prevProps, nextProps) => {
    // Check if any of the ref props have changed
    if (
      prevProps.listRef !== nextProps.listRef ||
      prevProps.rowHeights !== nextProps.rowHeights ||
      prevProps.rowNeedsMeasurement !== nextProps.rowNeedsMeasurement
    ) {
      return false;
    }

    // For all other props, use react-window's areEqual
    return areEqual(prevProps, nextProps);
  },
);

export interface BaseVirtualListProps {
  height: number;
  tableSizes: TableSizes;
  rows: ReactTableRowType<Record<string, unknown>>[];
  innerElementType?: ReactElementType;
  outerRef?: React.Ref<SimpleBar>;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  infiniteLoaderListRef?: React.Ref<VariableSizeList>;
  itemCount: number;
  pageSize: number;
  loadMore?: () => void;
  hasMoreData?: boolean;
}

const BaseVirtualList = React.memo(function BaseVirtualList({
  hasMoreData,
  height,
  infiniteLoaderListRef,
  innerElementType,
  itemCount,
  loadMore,
  onItemsRendered,
  outerRef,
  rows,
  tableSizes,
}: BaseVirtualListProps) {
  const listRef = useRef<VariableSizeList>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});
  const rowNeedsMeasurement = useRef<{ [key: number]: boolean }>({});

  const combinedRef = (list: VariableSizeList | null) => {
    // Handle infiniteLoaderListRef
    if (infiniteLoaderListRef) {
      if (typeof infiniteLoaderListRef === "function") {
        infiniteLoaderListRef(list);
      } else {
        (
          infiniteLoaderListRef as React.MutableRefObject<VariableSizeList | null>
        ).current = list;
      }
    }

    // Handle listRef - only if it's a mutable ref
    if (listRef && "current" in listRef) {
      (listRef as React.MutableRefObject<VariableSizeList | null>).current =
        list;
    }
  };

  const getItemSize = useCallback(
    (index: number) => {
      try {
        const rowHeight = rowHeights?.current?.[index] || tableSizes.ROW_HEIGHT;

        return Math.max(rowHeight, tableSizes.ROW_HEIGHT);
      } catch (error) {
        return tableSizes.ROW_HEIGHT;
      }
    },
    [rowHeights?.current, tableSizes.ROW_HEIGHT],
  );

  // Memoize the row renderer function
  const rowRenderer = useMemo(() => {
    return (props: ListChildComponentProps) => (
      <MemoizedRow
        {...props}
        hasMoreData={hasMoreData}
        listRef={listRef}
        loadMore={loadMore}
        rowHeights={rowHeights}
        rowNeedsMeasurement={rowNeedsMeasurement}
      />
    );
  }, [listRef, rowHeights, rowNeedsMeasurement, hasMoreData]);

  return (
    <VariableSizeList
      className="virtual-list simplebar-content"
      estimatedItemSize={tableSizes.ROW_HEIGHT}
      height={
        height -
        tableSizes.TABLE_HEADER_HEIGHT -
        2 * tableSizes.VERTICAL_PADDING
      }
      innerElementType={innerElementType}
      itemCount={itemCount}
      itemData={rows}
      itemSize={getItemSize}
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      ref={combinedRef}
      width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
    >
      {rowRenderer}
    </VariableSizeList>
  );
});

export default BaseVirtualList;
