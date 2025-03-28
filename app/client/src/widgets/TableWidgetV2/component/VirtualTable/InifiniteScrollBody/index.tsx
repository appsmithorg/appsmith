import React, { useMemo, type Ref } from "react";
import { type ReactElementType } from "react-window";
import type SimpleBar from "simplebar-react";
import { LoadingIndicator } from "../../LoadingIndicator";
import { VariableInfiniteVirtualList } from "../../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../../TableContext";

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
      totalRecordsCount,
    } = useAppsmithTable();

    const itemCount = useMemo(() => {
      return totalRecordsCount && totalRecordsCount > 0
        ? totalRecordsCount
        : rows.length;
    }, [totalRecordsCount, rows]);

    return (
      <div className="simplebar-content-wrapper">
        <VariableInfiniteVirtualList
          hasMoreData={!endOfData}
          height={height}
          innerElementType={props.innerElementType}
          itemCount={itemCount}
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
