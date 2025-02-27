import React, { useCallback } from "react";
import type { Row as ReactTableRowType } from "react-table";
import { Virtuoso, type Components, type VirtuosoHandle } from "react-virtuoso";
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
  (props: VirtuosoBodyProps, ref: React.Ref<VirtuosoHandle>) => {
    const {
      height,
      isLoading,
      loadMoreFromEvaluations,
      pageSize,
      rows,
      tableSizes,
    } = props;

    const { cachedRows } = useInfiniteVirtualization({
      rows,
      isLoading,
      pageSize,
    });

    // Adapt loadMoreItems to match Virtuoso's endReached signature
    const handleEndReached = useCallback(async () => {
      if (
        !isLoading &&
        cachedRows.length < (props.totalRecordsCount || cachedRows.length)
      ) {
        loadMoreFromEvaluations();
      }

      return Promise.resolve();
    }, [
      isLoading,
      loadMoreFromEvaluations,
      cachedRows.length,
      props.totalRecordsCount,
    ]);

    const ItemContent = useCallback(
      (index: number) => {
        if (index < cachedRows.length) {
          return (
            <Row
              className="t--virtual-row"
              index={index}
              key={index}
              row={cachedRows[index]}
            />
          );
        } else {
          return <EmptyRow />;
        }
      },
      [cachedRows],
    );

    const Footer = useCallback(() => {
      // Only show loading indicator if there are more items to load
      if (
        isLoading &&
        cachedRows.length < (props.totalRecordsCount || cachedRows.length)
      ) {
        return <LoadingIndicator />;
      }

      return null;
    }, [isLoading, cachedRows.length, props.totalRecordsCount]);

    // Calculate the effective height for the virtuoso component
    // Ensure height is not negative or too small
    const effectiveHeight = Math.max(
      height - tableSizes.TABLE_HEADER_HEIGHT - 2 * tableSizes.VERTICAL_PADDING,
      100, // Minimum height to ensure rendering
    );

    // Define components for Virtuoso
    const components: Components = {
      Footer,
    };

    // Calculate the total count for Virtuoso
    const totalCount = props.totalRecordsCount || cachedRows.length;

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
        <Virtuoso
          className="t--virtuoso-container"
          components={components}
          data={cachedRows}
          endReached={handleEndReached}
          fixedItemHeight={tableSizes.ROW_HEIGHT} // Add fixed item height for better performance
          itemContent={ItemContent}
          overscan={Math.max(pageSize, 10)} // Increase overscan to render more rows at once
          ref={(instance) => {
            (ref as React.MutableRefObject<VirtuosoHandle | null>).current =
              instance;
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
