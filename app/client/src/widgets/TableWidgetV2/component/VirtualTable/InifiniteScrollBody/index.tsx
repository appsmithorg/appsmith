import React, { type Ref } from "react";
import { type ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import { LoadingIndicator } from "../../LoadingIndicator";
import { FixedInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../../TableContext";
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
    const { cachedRows, hasMoreData, itemCount } = useInfiniteVirtualization({
      rows,
      totalRecordsCount,
      loadMore: nextPageClick,
      pageSize,
    });

    return (
      <div className="simplebar-content-wrapper">
        <FixedInfiniteVirtualList
          hasMoreData={hasMoreData}
          height={height}
          innerElementType={props.innerElementType}
          itemCount={itemCount}
          loadMore={nextPageClick}
          outerRef={ref}
          pageSize={pageSize}
          rows={cachedRows}
          tableSizes={tableSizes}
        />
        {isLoading && <LoadingIndicator />}
      </div>
    );
  },
);

export default InfiniteScrollBodyComponent;
