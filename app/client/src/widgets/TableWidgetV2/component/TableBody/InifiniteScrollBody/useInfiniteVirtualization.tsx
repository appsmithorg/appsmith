import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";

export interface UseInfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  totalRecordsCount?: number;
  isLoading: boolean;
  loadMore: () => void;
  pageSize: number;
}

export interface UseInfiniteVirtualizationReturn {
  isItemLoaded: (index: number) => boolean;
  itemCount: number;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
}

interface LoadedRowsCache {
  [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
}

export const useInfiniteVirtualization = ({
  isLoading,
  loadMore,
  pageSize,
  rows,
  totalRecordsCount,
}: UseInfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});
  const lastLoadedPageRef = useRef<number>(0);
  const hasMoreDataRef = useRef<boolean>(true); // Track if more data is available

  const maxPages = useMemo(() => {
    if (!totalRecordsCount) return Infinity;

    return Math.ceil(totalRecordsCount / pageSize);
  }, [totalRecordsCount, pageSize]);

  useEffect(() => {
    if (rows.length > 0) {
      const currentPageIndex = lastLoadedPageRef.current;

      setLoadedPages((prev) => ({
        ...prev,
        [currentPageIndex]: rows,
      }));

      // Only increment if we got a full page or some data
      if (rows.length === pageSize) {
        lastLoadedPageRef.current = currentPageIndex + 1;
      } else if (rows.length < pageSize && rows.length > 0) {
        // If we got less than a full page, assume this is the last page
        hasMoreDataRef.current = false;
      }
    } else if (rows.length === 0 && lastLoadedPageRef.current > 0) {
      // If no rows are returned and we've loaded at least one page, assume end of data
      hasMoreDataRef.current = false;
    }
  }, [rows, pageSize]);

  const cachedRows = useMemo(() => {
    const allRows: ReactTableRowType<Record<string, unknown>>[] = [];

    Object.keys(loadedPages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((pageIndex) => {
        allRows.push(...loadedPages[pageIndex]);
      });

    return allRows;
  }, [loadedPages]);

  const isItemLoaded = useCallback(
    (index: number) => {
      const pageIndex = Math.floor(index / pageSize);

      return (
        pageIndex >= maxPages ||
        pageIndex < lastLoadedPageRef.current ||
        !hasMoreDataRef.current
      );
    },
    [pageSize, maxPages],
  );

  const itemCount = useMemo(() => {
    // If we know there's no more data, cap itemCount at cachedRows.length
    if (!hasMoreDataRef.current) {
      return cachedRows.length;
    }

    return totalRecordsCount || cachedRows.length;
  }, [totalRecordsCount, cachedRows.length]);

  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (!isLoading && hasMoreDataRef.current) {
        const targetPage = Math.floor(stopIndex / pageSize);

        if (targetPage >= lastLoadedPageRef.current && targetPage < maxPages) {
          loadMore();
        }
      }

      return Promise.resolve();
    },
    [isLoading, loadMore, pageSize, maxPages],
  );

  return {
    isItemLoaded,
    itemCount,
    loadMoreItems,
    cachedRows,
  };
};
