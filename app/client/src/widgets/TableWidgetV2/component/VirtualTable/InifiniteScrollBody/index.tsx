import React, { useMemo, type Ref } from "react";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import { FixedInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { LoadingIndicator } from "../../LoadingIndicator";
import { useAppsmithTable } from "../../TableContext";

interface InfiniteScrollBodyProps {
  innerElementType: ReactElementType;
}

const InfiniteScrollBodyComponent = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    const {
      height,
      isItemLoaded,
      isLoading,
      nextPageClick,
      pageSize,
      subPage: rows,
      tableSizes,
      totalRecordsCount,
    } = useAppsmithTable();

    const itemCount = useMemo(() => {
      return totalRecordsCount ?? rows.length;
    }, [totalRecordsCount, rows]);

    return (
      <div className="simplebar-content-wrapper">
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={nextPageClick}
          minimumBatchSize={pageSize}
        >
          {({ onItemsRendered, ref: infiniteLoaderRef }) => (
            <FixedInfiniteVirtualList
              height={height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              itemCount={itemCount}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={pageSize}
              rows={rows}
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
