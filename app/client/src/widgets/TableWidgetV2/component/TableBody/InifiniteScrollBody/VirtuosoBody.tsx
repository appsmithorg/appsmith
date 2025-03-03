import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
import {
  TableVirtuoso,
  type TableComponents,
  type TableVirtuosoHandle,
} from "react-virtuoso";
import type { TableSizes } from "../../Constants";
import { LoadingIndicator } from "../../LoadingIndicator";
import { EmptyRow, Row } from "../Row";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";

interface VirtuosoBodyProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  tableSizes: TableSizes;
  isLoading: boolean;
  totalRecordsCount?: number;
  itemCount: number;
  loadMoreFromEvaluations: () => void;
  pageSize: number;
}

const VirtuosoBody = React.forwardRef(
  (props: VirtuosoBodyProps, ref: React.Ref<TableVirtuosoHandle>) => {
    const {
      height,
      isLoading,
      loadMoreFromEvaluations,
      pageSize,
      rows,
      tableSizes,
    } = props;

    // Track if we're currently loading more data to prevent multiple requests
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { cachedRows } = useInfiniteVirtualization({
      rows,
      isLoading,
      pageSize,
    });

    // Reset loading state when isLoading prop changes
    useEffect(() => {
      if (!isLoading) {
        setIsLoadingMore(false);
      }
    }, [isLoading]);

    // Debounced version of loadMoreFromEvaluations to prevent rapid consecutive calls
    const handleEndReached = useCallback(async () => {
      if (
        !isLoading &&
        !isLoadingMore &&
        cachedRows.length < (props.totalRecordsCount || cachedRows.length)
      ) {
        setIsLoadingMore(true);
        loadMoreFromEvaluations();
      }

      return Promise.resolve();
    }, [
      isLoading,
      isLoadingMore,
      loadMoreFromEvaluations,
      cachedRows.length,
      props.totalRecordsCount,
    ]);

    // TR component for rendering table rows
    const rowContent = useCallback(
      (index: number) => {
        if (index < cachedRows.length) {
          return (
            <Row
              className="t--virtual-row"
              index={index}
              key={`row-${index}`} // Ensure stable keys for better React reconciliation
              row={cachedRows[index]}
            />
          );
        } else {
          return <EmptyRow />;
        }
      },
      [cachedRows],
    );

    const FooterComponent = useCallback(() => {
      // Only show loading indicator if there are more items to load
      if (
        (isLoading || isLoadingMore) &&
        cachedRows.length < (props.totalRecordsCount || cachedRows.length)
      ) {
        return <LoadingIndicator />;
      }

      return null;
    }, [isLoading, isLoadingMore, cachedRows.length, props.totalRecordsCount]);

    // Calculate the effective height for the virtuoso component
    // Ensure height is not negative or too small
    const effectiveHeight = Math.max(
      height - tableSizes.TABLE_HEADER_HEIGHT - 2 * tableSizes.VERTICAL_PADDING,
      100, // Minimum height to ensure rendering
    );

    // Define components for TableVirtuoso
    const components: TableComponents<
      ReactTableRowType<Record<string, unknown>>
    > = {
      // We don't need to define Table, Thead, etc. as mentioned in the requirements
      // Just focusing on the TR component
      TableFoot: FooterComponent,
    };

    // Calculate the total count for Virtuoso
    // Add a small buffer to prevent abrupt changes in scroll height
    const totalCount = useMemo(() => {
      const count = props.totalRecordsCount || cachedRows.length;

      // Add a small buffer if we're loading more data to maintain scroll position
      return isLoadingMore ? count + Math.min(pageSize, 5) : count;
    }, [cachedRows.length, isLoadingMore, pageSize, props.totalRecordsCount]);

    // Calculate the number of rows to keep in DOM based on viewport height
    // This helps reduce jittery effect by keeping more rows rendered
    const rowsToKeepInDOM =
      Math.ceil(effectiveHeight / tableSizes.ROW_HEIGHT) * 3;

    return (
      <div
        className="virtuoso-wrapper"
        style={{
          width: "100%",
          height: effectiveHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <TableVirtuoso
          className="t--virtuoso-container"
          components={components}
          computeItemKey={(index) => `virtuoso-item-${index}`}
          data={cachedRows}
          endReached={handleEndReached}
          fixedItemHeight={tableSizes.ROW_HEIGHT}
          increaseViewportBy={{
            top: rowsToKeepInDOM * tableSizes.ROW_HEIGHT,
            bottom: rowsToKeepInDOM * tableSizes.ROW_HEIGHT,
          }}
          initialTopMostItemIndex={0}
          itemContent={(index) => rowContent(index)}
          overscan={Math.max(pageSize, rowsToKeepInDOM)}
          ref={(instance) => {
            (
              ref as React.MutableRefObject<TableVirtuosoHandle | null>
            ).current = instance;
          }}
          style={{
            height: effectiveHeight,
            width: "100%",
          }}
          totalCount={totalCount}
        />
      </div>
    );
  },
);

export default VirtuosoBody;
