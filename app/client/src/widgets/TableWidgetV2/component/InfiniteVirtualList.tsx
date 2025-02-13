import React from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ListChildComponentProps } from "react-window";
import { FixedSizeList, areEqual } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type { TableSizes } from "./Constants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Row, EmptyRow } from "./TableBody/Row";
import type SimpleBar from "simplebar-react";
import type { ReactElementType } from "react-window";
import { LoadingIndicator } from "./LoadingIndicator";

interface InfiniteVirtualListProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  width?: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
  isLoading: boolean;
  totalRecordsCount?: number;
  isItemLoaded: (index: number) => boolean;
  itemCount: number;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  outerRef?: React.Ref<SimpleBar>;
  pageSize: number;
}

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

export const InfiniteVirtualList = React.forwardRef<
  SimpleBar,
  InfiniteVirtualListProps
>((props, ref) => {
  const {
    cachedRows,
    height,
    innerElementType,
    isItemLoaded,
    isLoading,
    itemCount,
    loadMoreItems,
    outerRef,
    tableSizes,
    width,
  } = props;

  return (
    <div className="simplebar-content-wrapper">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        minimumBatchSize={props.pageSize}
      >
        {({ onItemsRendered, ref: infiniteLoaderRef }) => (
          <FixedSizeList
            className="virtual-list simplebar-content"
            height={
              height -
              tableSizes.TABLE_HEADER_HEIGHT -
              2 * tableSizes.VERTICAL_PADDING
            }
            innerElementType={innerElementType}
            itemCount={itemCount}
            itemData={cachedRows}
            itemSize={tableSizes.ROW_HEIGHT}
            onItemsRendered={onItemsRendered}
            outerRef={outerRef}
            ref={infiniteLoaderRef}
            width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
          >
            {rowRenderer}
          </FixedSizeList>
        )}
      </InfiniteLoader>
      {isLoading && <LoadingIndicator />}
    </div>
  );
});
