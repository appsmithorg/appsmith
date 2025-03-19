import type { ListOnItemsRenderedProps, ReactElementType } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import React, { type Ref, useMemo } from "react";
import type { ListChildComponentProps } from "react-window";
import type { Row as ReactTableRowType } from "react-table";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Row } from "./Row";
import type { TableSizes } from "../Constants";
import type SimpleBar from "simplebar-react";
import { EmptyRows } from "../cellComponents/EmptyCell";
import { Text } from "@appsmith/ads";

const MemoizedRow = React.memo(
  function RowComponent({
    data,
    hasMoreData,
    index,
    loadMore,
    style,
  }: ListChildComponentProps & {
    loadMore: () => void;
    hasMoreData: boolean;
  }) {
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
    } else if (index === data.length && hasMoreData) {
      return (
        <div
          onClick={loadMore}
          style={{
            ...style,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingLeft: "10px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          <Text>Load More</Text>
        </div>
      );
    } else {
      return <EmptyRows rows={1} style={style} />;
    }
  },
  (prevProps, nextProps) => {
    if (
      prevProps.loadMore !== nextProps.loadMore ||
      prevProps.hasMoreData !== nextProps.hasMoreData
    ) {
      return false;
    }

    return areEqual(prevProps, nextProps);
  },
);

interface BaseVirtualListProps {
  height: number;
  tableSizes: TableSizes;
  rows: ReactTableRowType<Record<string, unknown>>[];
  innerElementType?: ReactElementType;
  outerRef: Ref<SimpleBar>;
  loadMore: () => void;
  hasMoreData: boolean;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  infiniteLoaderListRef?: React.Ref<FixedSizeList>;
  itemCount: number;
  pageSize: number;
}

const LOAD_MORE_BUTON_ROW = 1;

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
  const rowsWithLoadMore = React.useMemo(() => {
    return Object.assign(rows, { loadMore, hasMoreData });
  }, [rows, loadMore, hasMoreData]);

  const rowRenderer = useMemo(() => {
    return (rowProps: ListChildComponentProps) => (
      <MemoizedRow
        {...rowProps}
        hasMoreData={hasMoreData}
        loadMore={loadMore}
      />
    );
  }, [loadMore, hasMoreData]);

  return (
    <FixedSizeList
      className="virtual-list simplebar-content"
      height={
        height -
        tableSizes.TABLE_HEADER_HEIGHT -
        2 * tableSizes.VERTICAL_PADDING
      }
      innerElementType={innerElementType}
      itemCount={hasMoreData ? itemCount + LOAD_MORE_BUTON_ROW : itemCount}
      itemData={rowsWithLoadMore}
      itemSize={tableSizes.ROW_HEIGHT}
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      ref={infiniteLoaderListRef}
      width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
    >
      {rowRenderer}
    </FixedSizeList>
  );
});

/**
 * The difference between next two components is in the number of arguments they expect.
 */
export const FixedInfiniteVirtualList = React.memo(
  function FixedInfiniteVirtualList(props: BaseVirtualListProps) {
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
