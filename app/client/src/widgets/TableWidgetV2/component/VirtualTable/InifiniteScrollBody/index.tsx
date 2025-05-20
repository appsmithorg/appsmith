import React, { useMemo, type Ref } from "react";
import { type ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import { LoadingIndicator } from "../../LoadingIndicator";
import { VariableInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../../TableContext";
import { useInfiniteScroll } from "./useInfiniteScroll";

interface InfiniteScrollBodyProps {
  innerElementType: ReactElementType;
}

const InfiniteScrollBodyComponent = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    const {
      cachedTableData,
      endOfData,
      height,
      isLoading,
      nextPageClick,
      pageSize,
      subPage: rows,
      tableSizes,
      updatePageNo,
    } = useAppsmithTable();

    const { onItemsRendered } = useInfiniteScroll({
      rows,
      pageSize,
      loadMore: nextPageClick,
      isLoading,
      endOfData,
      updatePageNo,
      cachedTableData,
    });

    const itemCount = useMemo(
      () => Math.max(rows.length, pageSize),
      [rows.length, pageSize],
    );

    return (
      <div className="simplebar-content-wrapper">
        <VariableInfiniteVirtualList
          hasMoreData={!endOfData}
          height={height}
          innerElementType={props.innerElementType}
          itemCount={itemCount}
          loadMore={nextPageClick}
          onItemsRendered={onItemsRendered}
          outerRef={ref}
          pageSize={pageSize}
          rows={rows}
          tableSizes={tableSizes}
        />
        {isLoading && <LoadingIndicator />}
      </div>
    );
  },
);

export default InfiniteScrollBodyComponent;
