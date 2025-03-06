import type { ListOnItemsRenderedProps, ReactElementType } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import React from "react";
import type { ListChildComponentProps } from "react-window";
import type { Row as ReactTableRowType } from "react-table";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EmptyRow, Row } from "./Row";
import type { TableSizes } from "../Constants";
import type SimpleBar from "simplebar-react";

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
  infiniteLoaderListRef?: React.Ref<FixedSizeList>;
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
  return (
    <FixedSizeList
      className="virtual-list simplebar-content"
      height={
        height -
        tableSizes.TABLE_HEADER_HEIGHT -
        2 * tableSizes.VERTICAL_PADDING
      }
      innerElementType={innerElementType}
      itemCount={itemCount}
      itemData={rows}
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
