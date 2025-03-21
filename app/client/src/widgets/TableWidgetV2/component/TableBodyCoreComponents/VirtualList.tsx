import React, { type Ref } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ListOnItemsRenderedProps, ReactElementType } from "react-window";
import type { VariableSizeList } from "react-window";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../Constants";
import BaseVirtualList from "../VirtualTable/BaseVirtualList";

interface BaseVirtualListProps {
  height: number;
  tableSizes: TableSizes;
  rows: ReactTableRowType<Record<string, unknown>>[];
  innerElementType?: ReactElementType;
  outerRef: Ref<SimpleBar>;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  infiniteLoaderListRef?: React.Ref<VariableSizeList>;
  itemCount: number;
  pageSize: number;
}

/**
 * The difference between next two components is in the number of arguments they expect.
 */
export const VariableInfiniteVirtualList = React.memo(
  function VariableInfiniteVirtualList(props: BaseVirtualListProps) {
    return <BaseVirtualList {...props} />;
  },
);

type FixedVirtualListProps = Omit<
  BaseVirtualListProps,
  "onItemsRendered" | "infiniteLoaderListRef"
>;
export const FixedVirtualList = React.memo(function FixedVirtualList(
  props: FixedVirtualListProps,
) {
  return <BaseVirtualList {...props} />;
});
