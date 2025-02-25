import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";

interface InfiniteVirtualizationProps {
  rows: ReactTableRowType<Record<string, unknown>>[];
  totalRecordsCount?: number;
  isLoading: boolean;
  loadMore: () => void;
  pageSize: number;
}

interface UseInfiniteVirtualizationReturn {
  itemCount: number;
  loadMoreItems: (startIndex: number, stopIndex: number) => void;
  isItemLoaded: (index: number) => boolean;
  cachedRows: ReactTableRowType<Record<string, unknown>>[];
}

interface LoadedRowsCache {
  [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
}

interface ExtendedRow extends ReactTableRowType<Record<string, unknown>> {
  __originalIndex__?: number;
}

export const useInfiniteVirtualization = ({
  isLoading,
  loadMore,
  pageSize,
  rows,
}: InfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const cachedRows = useRef<LoadedRowsCache>({});
  const isFirstLoad = useRef(true);
  const lastLoadedPageRef = useRef<number>(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      const targetPage = Math.floor(stopIndex / pageSize);

      if (!isLoading && targetPage >= lastLoadedPageRef.current && hasMore) {
        loadMore();
      }

      return Promise.resolve();
    },
    [isLoading, loadMore, pageSize, hasMore],
  );

  const isItemLoaded = useCallback(
    (index: number) => {
      const pageIndex = Math.floor(index / pageSize);

      return pageIndex < lastLoadedPageRef.current;
    },
    [pageSize],
  );

  useEffect(() => {
    if (rows.length > 0) {
      cachedRows.current = {
        ...cachedRows.current,
        [lastLoadedPageRef.current]: rows,
      };

      if (rows.length < pageSize) {
        setHasMore(false);
      }

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        loadMore();
      }

      lastLoadedPageRef.current += 1;
    }
  }, [rows, loadMore, pageSize]);

  const allRows = useMemo(() => {
    const allRowsArray: unknown[] = [];
    let currentIndex = 0;

    Object.keys(cachedRows.current)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((pageIndex) => {
        // Map each row to ensure it has __originalIndex__
        const pageRows = cachedRows.current[pageIndex]
          .map((row: ExtendedRow) => {
            if (!row) return null;

            return {
              ...row,
              __originalIndex__: row.__originalIndex__ ?? currentIndex++,
            };
          })
          .filter(Boolean); // Remove any null entries

        allRowsArray.push(...pageRows);
      });

    return allRowsArray;
  }, [cachedRows.current]);
  // console.log("🚀 ~ allRows ~ allRows:", allRows.length);

  return {
    itemCount: Infinity,
    loadMoreItems,
    isItemLoaded,
    cachedRows: allRows as ReactTableRowType<Record<string, unknown>>[],
  };
};
