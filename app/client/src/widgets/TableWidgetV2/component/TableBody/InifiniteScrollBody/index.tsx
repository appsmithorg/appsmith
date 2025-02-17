import React, { type Ref } from "react";
import type { Row as ReactTableRowType } from "react-table";
import { type ReactElementType } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../../Constants";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";
import { FixedInfiniteVirtualList } from "../VirtualList";

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
    const { isItemLoaded, itemCount, loadMoreItems } =
      useInfiniteVirtualization({
        rows,
        totalRecordsCount: rows.length,
        isLoading,
        loadMore: loadMoreFromEvaluations,
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
              height={props.height}
              infiniteLoaderListRef={infiniteLoaderRef}
              innerElementType={props.innerElementType}
              onItemsRendered={onItemsRendered}
              outerRef={ref}
              pageSize={props.pageSize}
              rows={props.rows}
              tableSizes={props.tableSizes}
            />
          )}
        </InfiniteLoader>
      </div>
    );
  },
);

export default InfiniteScrollBody;
