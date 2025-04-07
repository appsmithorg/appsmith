import React, { type Ref } from "react";
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
      endOfData,
      height,
      isLoading,
      nextPageClick,
      pageSize,
      subPage: rows,
      tableSizes,
    } = useAppsmithTable();

    useInfiniteScroll({
      rows,
      pageSize,
      loadMore: nextPageClick,
    });

    return (
      <div className="simplebar-content-wrapper">
        <VariableInfiniteVirtualList
          hasMoreData={!endOfData}
          height={height}
          innerElementType={props.innerElementType}
          itemCount={rows.length}
          loadMore={nextPageClick}
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
