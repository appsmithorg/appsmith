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
  rows,
  totalRecordsCount,
  isLoading,
  loadMore,
  pageSize,
}: UseInfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  // Keep track of which pages are loaded
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});

  // Keep track of the last loaded page for appending new data
  const lastLoadedPageRef = useRef<number>(0);

  // Calculate max possible pages based on total records
  const maxPages = useMemo(() => {
    if (!totalRecordsCount) return Infinity;
    return Math.ceil(totalRecordsCount / pageSize);
  }, [totalRecordsCount, pageSize]);

  // Effect to handle new data
  useEffect(() => {
    if (rows.length > 0) {
      // Since we know we get pageSize number of rows each time (except possibly last page)
      // we can calculate the current page index
      const currentPageIndex = lastLoadedPageRef.current;

      // Store the current page of rows in cache
      setLoadedPages((prev) => ({
        ...prev,
        [currentPageIndex]: rows,
      }));

      // Increment the last loaded page counter for next load
      lastLoadedPageRef.current = currentPageIndex + 1;
    }
  }, [rows, pageSize]);

  // Memoize the combined rows from cache
  const cachedRows = useMemo(() => {
    const allRows: ReactTableRowType<Record<string, unknown>>[] = [];

    // Add all rows from cache in order
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
      // Consider items loaded if we've reached max pages or if the page is already loaded
      return pageIndex >= maxPages || pageIndex < lastLoadedPageRef.current;
    },
    [pageSize, maxPages],
  );

  const itemCount = useMemo(() => {
    return totalRecordsCount || cachedRows.length;
  }, [totalRecordsCount, cachedRows.length]);

  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (!isLoading) {
        const targetPage = Math.floor(stopIndex / pageSize);
        console.log("🚀 -> targetPage:", {
          targetPage,
          lastLoadedPageRef: lastLoadedPageRef.current,
          maxPages,
        });

        // Only load if:
        // 1. We haven't loaded this page yet
        // 2. We haven't reached the max number of pages
        // 3. We're not currently loading
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
