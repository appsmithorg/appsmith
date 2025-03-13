import React from "react";
import BaseVirtualList, { type BaseVirtualListProps } from "./BaseVirtualList";

/**
 * The difference between next two components is in the number of arguments they expect.
 */
export const VariableHeightInfiniteVirtualList = React.memo(
  function VariableHeightInfiniteVirtualList(props: BaseVirtualListProps) {
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
