import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useCallback, useContext } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type {
  ListChildComponentProps,
  ListOnItemsRenderedProps,
  ReactElementType,
} from "react-window";
import { VariableSizeList, areEqual } from "react-window";
import type SimpleBar from "simplebar-react";
import { BodyContext } from ".";
import type { TableSizes } from "../Constants";
import { EmptyRow, Row } from "./Row";

const rowRenderer = React.memo((rowProps: ListChildComponentProps) => {
  const { data, index, style } = rowProps;

  if (index < data.length) {
    const row = data[index];

    return (
      <Row
        className="t--virtual-row"
        index={index}
        key={index}
        row={row}
        style={style}
      />
    );
  } else {
    return <EmptyRow style={style} />;
  }
}, areEqual);

interface BaseVirtualListProps {
  height: number;
  tableSizes: TableSizes;
  rows: ReactTableRowType<Record<string, unknown>>[];
  innerElementType?: ReactElementType;
  outerRef?: React.Ref<SimpleBar>;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  infiniteLoaderListRef?: React.Ref<VariableSizeList>;
  itemCount: number;
  pageSize: number;
}

const BaseVirtualList = React.memo(function BaseVirtualList({
  height,
  infiniteLoaderListRef,
  innerElementType,
  itemCount,
  onItemsRendered,
  outerRef,
  rows,
  tableSizes,
}: BaseVirtualListProps) {
  const { listRef, rowHeights } = useContext(BodyContext);

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
        // Add a minimum height threshold to prevent rows from being too small
        const rowHeight = rowHeights.current?.[index] || tableSizes.ROW_HEIGHT;

        return Math.max(rowHeight, tableSizes.ROW_HEIGHT);
      } catch (error) {
        return tableSizes.ROW_HEIGHT;
      }
    },
    [rowHeights.current, tableSizes.ROW_HEIGHT],
  );

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

/**
 * The difference between next two components is in the number of arguments they expect.
 */
export const VariableHeightInfiniteVirtualList = React.memo(
  function VariableHeightInfiniteVirtualList(props: BaseVirtualListProps) {
    return <BaseVirtualList {...props} />;
  },
);

type FixedVirtualListProps = Omit<
  BaseVirtualListProps,
  "onItemsRendered" | "infiniteLoaderListRef"
>;
export const FixedVirtualList = React.memo(function FixedVirtualList(
  props: FixedVirtualListProps,
) {
  return <BaseVirtualList {...props} />;
});
