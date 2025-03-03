import React, { type Ref } from "react";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import { FixedInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../../TableContext";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";

interface InfiniteScrollBodyProps {
  innerElementType: ReactElementType;
}

const InfiniteScrollBody = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    const {
      height,
      isLoading,
      nextPageClick,
      pageSize,
      subPage: rows,
      tableSizes,
    } = useAppsmithTable();
    const { isItemLoaded, itemCount, loadMoreItems } =
      useInfiniteVirtualization({
        rows,
        totalRecordsCount: rows.length,
        isLoading,
        loadMore: nextPageClick,
        pageSize,
      });

    return (
      <div className="simplebar-content-wrapper">
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount + 5}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref: infiniteLoaderRef }) => (
            <FixedInfiniteVirtualList
              height={height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={pageSize}
              rows={rows}
              tableSizes={tableSizes}
            />
          )}
        </InfiniteLoader>
      </div>
    );
  },
);

export default InfiniteScrollBody;
