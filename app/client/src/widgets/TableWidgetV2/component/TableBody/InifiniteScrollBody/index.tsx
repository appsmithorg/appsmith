import React, { type Ref } from "react";
import type { Row as ReactTableRowType } from "react-table";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../../Constants";
import { LoadingIndicator } from "../../LoadingIndicator";
import { FixedInfiniteVirtualList } from "../VirtualList";
interface InfiniteScrollBodyProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  tableSizes: TableSizes;
  innerElementType?: ReactElementType;
  isLoading: boolean;
  totalRecordsCount?: number;
  loadMoreFromEvaluations: () => void;
  pageSize: number;
  isItemLoaded: (index: number) => boolean;
}

const InfiniteScrollBody = React.forwardRef(
  (props: InfiniteScrollBodyProps, ref: Ref<SimpleBar>) => {
    return (
      <div className="simplebar-content-wrapper">
        <InfiniteLoader
          isItemLoaded={props.isItemLoaded}
          itemCount={props.totalRecordsCount ?? props.rows.length}
          loadMoreItems={props.loadMoreFromEvaluations}
          minimumBatchSize={props.pageSize}
        >
          {({ onItemsRendered, ref: infiniteLoaderRef }) => (
            <FixedInfiniteVirtualList
              height={props.height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              itemCount={props.totalRecordsCount ?? props.rows.length}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={props.pageSize}
              rows={props.rows}
              tableSizes={props.tableSizes}
            />
          )}
        </InfiniteLoader>
        {props.isLoading && <LoadingIndicator />}
      </div>
    );
  },
);

export default InfiniteScrollBody;
