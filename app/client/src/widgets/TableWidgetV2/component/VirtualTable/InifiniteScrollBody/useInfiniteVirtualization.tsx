import { useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
export interface UseInfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  totalRecordsCount?: number;
  loadMore: () => void;
  pageSize: number;
}

export interface UseInfiniteVirtualizationReturn {
  itemCount: number;
  hasMoreData: boolean;
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
}

interface LoadedRowsCache {
  [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
}

export const useInfiniteVirtualization = ({
  loadMore,
  pageSize,
  rows,
  totalRecordsCount,
}: UseInfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const [loadedPages, setLoadedPages] = useState<LoadedRowsCache>({});
  const lastLoadedPageRef = useRef<number>(0);
  const hasMoreDataRef = useRef<boolean>(true);

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

      // load another page in initial load if there is more data to load
      if (cachedRows.length < pageSize * 2) {
        loadMore();
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

  const itemCount = useMemo(() => {
    // If we know there's no more data, cap itemCount at cachedRows.length
    if (!hasMoreDataRef.current) {
      return cachedRows.length;
    }

    return cachedRows.length;
  }, [totalRecordsCount, cachedRows.length]);

  return {
    itemCount,
    cachedRows,
    hasMoreData: hasMoreDataRef.current,
  };
};
