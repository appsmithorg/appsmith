import { useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
export interface UseInfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  totalRecordsCount?: number;
  loadMore: () => void;
  pageSize: number;
  isLoading?: boolean;
}

export interface UseInfiniteVirtualizationReturn {
  itemCount: number;
  hasMoreData: boolean;
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
  isItemLoaded: (index: number) => boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
}

interface LoadedRowsCache {
  [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
}

export const useInfiniteVirtualization = ({
  isLoading = false,
  loadMore,
  pageSize,
  rows,
  totalRecordsCount,
}: UseInfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});
  const lastLoadedPageRef = useRef<number>(0);
  const hasMoreDataRef = useRef<boolean>(true);
  const initialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (rows.length > 0) {
      const currentPageIndex = lastLoadedPageRef.current;

      setLoadedPages((prev) => ({
        ...prev,
        [currentPageIndex]: rows,
      }));

      lastLoadedPageRef.current = currentPageIndex + 1;

      if (rows.length < pageSize) {
        hasMoreDataRef.current = false;
      }

      // Only try to load another page on initial render
      if (
        initialLoadRef.current &&
        cachedRows.length < pageSize * 2 &&
        hasMoreDataRef.current
      ) {
        initialLoadRef.current = false;

        setTimeout(() => {
          loadMore();
        }, 0);
      }
    } else if (rows.length === 0 && lastLoadedPageRef.current > 0) {
      // If no rows are returned and we've loaded at least one page, assume end of data
      hasMoreDataRef.current = false;
    }
  }, [rows, pageSize, loadMore]);

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

  const itemCount = useMemo(() => {
    // If we know there's no more data, cap itemCount at cachedRows.length
    if (!hasMoreDataRef.current) {
      return cachedRows.length;
    }

    return cachedRows.length;
  }, [totalRecordsCount, cachedRows.length]);

  const isItemLoaded = (index: number): boolean => {
    // If we know there's no more data, all indices are considered loaded
    if (!hasMoreDataRef.current) {
      return true;
    }

    // Otherwise, check if the index is within our cached rows
    return index < cachedRows.length;
  };

  const loadMoreItems = async (): Promise<void> => {
    // Don't load more if already loading or if we know there's no more data
    if (isLoading || !hasMoreDataRef.current) {
      return;
    }

    // Calculate max pages based on totalRecordsCount if available
    const maxPages = totalRecordsCount
      ? Math.ceil(totalRecordsCount / pageSize)
      : Number.MAX_SAFE_INTEGER;

    // Don't load more if we're trying to load beyond max pages
    if (cachedRows.length >= maxPages * pageSize) {
      return;
    }

    loadMore();

    return Promise.resolve();
  };

  return {
    itemCount,
    cachedRows,
    hasMoreData: hasMoreDataRef.current,
    isItemLoaded,
    loadMoreItems,
  };
};
