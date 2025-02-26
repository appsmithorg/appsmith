import React from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ReactElementType } from "react-window";
import type { TableSizes } from "../../Constants";
import VirtuosoBody from "./VirtuosoBody";

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
  (props: InfiniteScrollBodyProps, ref: React.Ref<unknown>) => {
    return (
      <VirtuosoBody
        height={props.height}
        innerElementType={props.innerElementType}
        isLoading={props.isLoading}
        itemCount={props.itemCount}
        loadMoreFromEvaluations={props.loadMoreFromEvaluations}
        pageSize={props.pageSize}
        ref={ref}
        rows={props.rows}
        tableSizes={props.tableSizes}
        totalRecordsCount={props.totalRecordsCount}
      />
    );
  },
);

export default InfiniteScrollBody;
