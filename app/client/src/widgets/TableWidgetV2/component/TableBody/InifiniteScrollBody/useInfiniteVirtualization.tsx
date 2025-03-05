import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
export interface UseInfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  isLoading: boolean;
  loadMore: () => void;
  pageSize: number;
}

export interface UseInfiniteVirtualizationReturn {
  loadMoreItems: () => Promise<void>;
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
}: UseInfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});
  const lastLoadedPageRef = useRef<number>(0);
  const hasMoreDataRef = useRef<boolean>(true); // Track if more data is available

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

  const loadMoreItems = useCallback(async () => {
    if (!isLoading && hasMoreDataRef.current) {
      loadMore();
    }

    return Promise.resolve();
  }, [isLoading, loadMore]);

  return {
    loadMoreItems,
    cachedRows,
  };
};
