import { WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useCallback, useRef } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type {
  ListChildComponentProps,
  ListOnItemsRenderedProps,
  ReactElementType,
} from "react-window";
import { VariableSizeList } from "react-window";
import type SimpleBar from "simplebar-react";
import type { TableSizes } from "../Constants";
import { Row } from "../TableBodyCoreComponents/Row";
import { EmptyRows } from "../cellComponents/EmptyCell";

type ExtendedListChildComponentProps = ListChildComponentProps & {
  listRef: React.RefObject<VariableSizeList>;
  rowHeights: React.RefObject<{ [key: number]: number }>;
  rowNeedsMeasurement: React.RefObject<{ [key: number]: boolean }>;
};

const rowRenderer = (rowProps: ExtendedListChildComponentProps) => {
  const { data, index, listRef, rowHeights, rowNeedsMeasurement, style } =
    rowProps;

  if (index < data.length) {
    const row = data[index];

    return (
      <Row
        className="t--virtual-row"
        index={index}
        key={index}
        listRef={listRef}
        row={row}
        rowHeights={rowHeights}
        rowNeedsMeasurement={rowNeedsMeasurement}
        style={style}
      />
    );
  } else {
    return <EmptyRows rows={1} style={style} />;
  }
};

export interface BaseVirtualListProps {
  height: number;
  tableSizes: TableSizes;
  rows: ReactTableRowType<Record<string, unknown>>[];
  innerElementType?: ReactElementType;
  outerRef?: React.Ref<SimpleBar>;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  infiniteLoaderListRef?: React.Ref<VariableSizeList>;
  itemCount: number;
  pageSize: number;
}

const BaseVirtualList = React.memo(function BaseVirtualList({
  height,
  infiniteLoaderListRef,
  innerElementType,
  itemCount,
  onItemsRendered,
  outerRef,
  rows,
  tableSizes,
}: BaseVirtualListProps) {
  const listRef = useRef<VariableSizeList>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});
  const rowNeedsMeasurement = useRef<{ [key: number]: boolean }>({});
  const combinedRef = (list: VariableSizeList | null) => {
    // Handle infiniteLoaderListRef
    if (infiniteLoaderListRef) {
      if (typeof infiniteLoaderListRef === "function") {
        infiniteLoaderListRef(list);
      } else {
        (
          infiniteLoaderListRef as React.MutableRefObject<VariableSizeList | null>
        ).current = list;
      }
    }

    // Handle listRef - only if it's a mutable ref
    if (listRef && "current" in listRef) {
      (listRef as React.MutableRefObject<VariableSizeList | null>).current =
        list;
    }
  };

  const getItemSize = useCallback(
    (index: number) => {
      try {
        const rowHeight = rowHeights?.current?.[index] || tableSizes.ROW_HEIGHT;

        return Math.max(rowHeight, tableSizes.ROW_HEIGHT);
      } catch (error) {
        return tableSizes.ROW_HEIGHT;
      }
    },
    [rowHeights?.current, tableSizes.ROW_HEIGHT],
  );

  return (
    <VariableSizeList
      className="virtual-list simplebar-content"
      estimatedItemSize={tableSizes.ROW_HEIGHT}
      height={
        height -
        tableSizes.TABLE_HEADER_HEIGHT -
        2 * tableSizes.VERTICAL_PADDING
      }
      innerElementType={innerElementType}
      itemCount={itemCount}
      itemData={rows}
      itemSize={getItemSize}
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      ref={combinedRef}
      width={`calc(100% + ${2 * WIDGET_PADDING}px)`}
    >
      {(props) =>
        rowRenderer({
          ...props,
          listRef,
          rowHeights,
          rowNeedsMeasurement,
        })
      }
    </VariableSizeList>
  );
});

export default BaseVirtualList;
