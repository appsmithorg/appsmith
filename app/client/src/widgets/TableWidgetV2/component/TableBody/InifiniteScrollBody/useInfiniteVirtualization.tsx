import { useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";

interface InfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  isLoading: boolean;
  pageSize: number;
}

interface UseInfiniteVirtualizationReturn {
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
}

interface LoadedRowsCache {
  [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
}

export const useInfiniteVirtualization = ({
  pageSize,
  rows,
}: InfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});
  const lastLoadedPageRef = useRef<number>(0);

  // Cache rows when they change
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

  return {
    cachedRows,
  };
};
