import React, { type Ref } from "react";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import { VariableInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../../TableContext";
import { LoadingIndicator } from "../../LoadingIndicator";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";

interface InfiniteScrollBodyProps {
  innerElementType: ReactElementType;
}

const InfiniteScrollBodyComponent = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    const {
      height,
      isLoading,
      nextPageClick,
      pageSize,
      subPage: rows,
      tableSizes,
      totalRecordsCount,
    } = useAppsmithTable();
    const { cachedRows, isItemLoaded, itemCount, loadMoreItems } =
      useInfiniteVirtualization({
        rows,
        totalRecordsCount,
        isLoading,
        loadMore: nextPageClick,
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
            <VariableInfiniteVirtualList
              height={height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              itemCount={itemCount}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={pageSize}
              rows={cachedRows}
              tableSizes={tableSizes}
            />
          )}
        </InfiniteLoader>
        {isLoading && <LoadingIndicator />}
      </div>
    );
  },
);

export default InfiniteScrollBodyComponent;
