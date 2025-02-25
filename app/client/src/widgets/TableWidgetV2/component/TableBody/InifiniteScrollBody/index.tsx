import React, { type Ref } from "react";
import type { Row as ReactTableRowType } from "react-table";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../../Constants";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";
import { FixedInfiniteVirtualList } from "../VirtualList";
import InfiniteLoadingIndicator from "../../InfiniteLoadingIndicator";

interface InfiniteScrollBodyProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
  isLoading: boolean;
  totalRecordsCount?: number;
  itemCount: number;
  loadMoreFromEvaluations: () => void;
  pageSize: number;
}

const InfiniteScrollBody = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    const { isLoading, loadMoreFromEvaluations, pageSize, rows } = props;
    const { cachedRows, isItemLoaded, itemCount, loadMoreItems } =
      useInfiniteVirtualization({
        rows,
        isLoading,
        loadMore: loadMoreFromEvaluations,
        pageSize,
      });

    return (
      <div className="simplebar-content-wrapper">
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          minimumBatchSize={pageSize}
        >
          {({ onItemsRendered, ref: infiniteLoaderRef }) => (
            <FixedInfiniteVirtualList
              height={props.height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={props.pageSize}
              rows={cachedRows}
              tableSizes={props.tableSizes}
            />
          )}
        </InfiniteLoader>
        {isLoading && <InfiniteLoadingIndicator />}
      </div>
    );
  },
);

export default InfiniteScrollBody;
