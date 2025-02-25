import { useCallback, useEffect, useRef } from "react";
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

// interface LoadedRowsCache {
//   [pageIndex: number]: ReactTableRowType<Record<string, unknown>>[];
// }

export const useInfiniteVirtualization = ({
  isLoading,
  loadMore,
  rows,
  totalRecordsCount,
}: InfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const cachedRows = useRef<ReactTableRowType<Record<string, unknown>>[]>([]);
  // console.log("🚀 ~ cachedRows:", cachedRows);
  // const pageSizeBuffer = 10;
  // const minRowsLength = pageSize + pageSizeBuffer;
  const isFirstLoad = useRef(true);

  const loadMoreItems = useCallback(
    // (startIndex: number, stopIndex: number) => {
    async () => {
      if (!isLoading) {
        loadMore();
      }

      return Promise.resolve();
    },
    [isLoading, loadMore],
  );

  const isItemLoaded = useCallback(
    (index: number) => index < cachedRows.current.length,
    [],
  );

  // console.log("🚀 ~ cachedRows:", cachedRows.current.length);
  // console.log("🚀 ~ rows:", rows.length);
  // console.log("🚀 ~ isLoading:", isLoading);
  // console.log("🚀 ~ isFirstLoad:", isFirstLoad.current);
  useEffect(() => {
    if (!isLoading && rows.length > 0) {
      if (isFirstLoad.current) {
        // On first load, trigger another load to get 2 pages worth of data
        cachedRows.current = [...rows];
        loadMore();
        isFirstLoad.current = false;
      } else {
        // For subsequent loads, just update the cached rows
        cachedRows.current = [...cachedRows.current, ...rows];
      }
    }
  }, [rows, isLoading, loadMore]);

  return {
    itemCount: totalRecordsCount || Infinity,
    loadMoreItems,
    isItemLoaded,
    cachedRows: cachedRows.current,
  };
};
