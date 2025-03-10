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
  const pendingRequestRef = useRef<boolean>(false); // Track if a request is in progress
  const pendingPagesRef = useRef<Set<number>>(new Set()); // Use Set to avoid duplicates

  const maxPages = useMemo(() => {
    if (!totalRecordsCount) return Infinity;

    return Math.ceil(totalRecordsCount / pageSize);
  }, [totalRecordsCount, pageSize]);

  const processPendingPages = useCallback(() => {
    if (pendingRequestRef.current || pendingPagesRef.current.size === 0) {
      return;
    }

    // Get the next page to load (the smallest page number in the set)
    const nextPage = Math.min(...Array.from(pendingPagesRef.current));

    // Set the current page index to the next page to load
    lastLoadedPageRef.current = nextPage;

    // Mark that we're processing a request
    pendingRequestRef.current = true;

    // Remove this page from pending
    pendingPagesRef.current.delete(nextPage);

    loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (rows.length > 0) {
      const currentPageIndex = lastLoadedPageRef.current;

      setLoadedPages((prev) => ({
        ...prev,
        [currentPageIndex]: rows,
      }));

      // Only increment if we got a full page or some data
      if (rows.length === pageSize) {
        // We've successfully loaded this page
        pendingRequestRef.current = false;
      } else if (rows.length < pageSize && rows.length > 0) {
        // If we got less than a full page, assume this is the last page
        hasMoreDataRef.current = false;
        pendingRequestRef.current = false;
        // Clear any remaining pending pages since we've reached the end
        pendingPagesRef.current.clear();
      }

      // Process next pending page if available
      setTimeout(processPendingPages, 0);
    } else if (rows.length === 0 && lastLoadedPageRef.current > 0) {
      // If no rows are returned and we've loaded at least one page, assume end of data
      hasMoreDataRef.current = false;
      pendingRequestRef.current = false;
      pendingPagesRef.current.clear();
    }
  }, [rows, pageSize, processPendingPages]);

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
      if (!isLoading && hasMoreDataRef.current && !pendingRequestRef.current) {
        const startPage = Math.floor(startIndex / pageSize);
        const endPage = Math.floor(stopIndex / pageSize);
        // console.log("🚀 ~ startPage:", { startPage, endPage });

        // Check if we need to load any pages
        for (let page = startPage; page <= endPage; page++) {
          // Only add pages that are not already loaded and are within bounds
          if (
            page >= lastLoadedPageRef.current &&
            page < maxPages &&
            !loadedPages[page] &&
            !pendingPagesRef.current.has(page)
          ) {
            pendingPagesRef.current.add(page);
          }
        }

        // Start processing pending pages if we have any
        if (pendingPagesRef.current.size > 0 && !pendingRequestRef.current) {
          processPendingPages();
        }
      }

      return Promise.resolve();
    },
    [isLoading, loadMore, pageSize, maxPages, loadedPages, processPendingPages],
  );

  return {
    isItemLoaded,
    itemCount,
    loadMoreItems,
    cachedRows,
  };
};
