import { concat } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
export interface UseCachingVirtualizationProps {
  data: Array<Record<string, unknown>>;
  isLoading: boolean;
  isInfiniteScrollEnabled: boolean;
  nextPageClick: () => void;
  pageSize: number;
  totalRecordsCount?: number;
  isAddRowInProgress: boolean;
}

export interface UseCachingTableDataReturn {
  isLoadingData: boolean;
  // itemCount: number;
  cachedRows: Array<Record<string, unknown>>;
  loadMoreNextPage: (
    startIndex: number,
    stopIndex: number,
  ) => Promise<void> | void;
  isItemLoaded: (index: number) => boolean;
}

export const useCachingVirtualization = ({
  data,
  isAddRowInProgress,
  isInfiniteScrollEnabled,
  isLoading,
  nextPageClick,
  pageSize,
  totalRecordsCount,
}: UseCachingVirtualizationProps): UseCachingTableDataReturn => {
  const [cachedRows, setCachedRows] = useState<Array<Record<string, unknown>>>(
    [],
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const lastLoadedPageRef = useRef<number>(0);
  const hasMoreDataRef = useRef<boolean>(true);
  const isAddRowInProgressRef = useRef<boolean>(false);

  const maxPages = useMemo(() => {
    if (!totalRecordsCount) return Infinity;

    return Math.ceil(totalRecordsCount / pageSize);
  }, [totalRecordsCount, pageSize]);

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

  useEffect(() => {
    if (isInfiniteScrollEnabled) {
      if (isAddRowInProgressRef.current) {
        isAddRowInProgressRef.current = false;
        setCachedRows((e) => e.slice(1));

        // TODO: If new rows are added, we would have to update the cached rows
        return;
      } else {
        if (isAddRowInProgress) {
          isAddRowInProgressRef.current = true;
          setCachedRows((e) => concat([data[0]], e));
        } else if (data.length > 0) {
          const currentPageIndex = lastLoadedPageRef.current;

          // Only increment if we got a full page or some data
          if (data.length === pageSize) {
            lastLoadedPageRef.current = currentPageIndex + 1;
          } else if (data.length < pageSize && data.length > 0) {
            // If we got less than a full page, assume this is the last page
            hasMoreDataRef.current = false;
          }

          setCachedRows((e) => concat(e, data));
        } else if (data.length === 0 && lastLoadedPageRef.current > 0) {
          // If no rows are returned and we've loaded at least one page, assume end of data
          hasMoreDataRef.current = false;
        }
      }
    } else {
      if (data.length > 0) {
        setCachedRows(data);
      }
    }
  }, [data, isInfiniteScrollEnabled]);

  useEffect(() => {
    setIsLoadingData(isLoading);
  }, [isLoading]);

  const loadMoreNextPage = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isInfiniteScrollEnabled) {
        if (!isLoadingData && hasMoreDataRef.current && !isAddRowInProgress) {
          const targetPage = Math.floor(stopIndex / pageSize);

          if (
            targetPage >= lastLoadedPageRef.current &&
            targetPage < maxPages
          ) {
            nextPageClick();
          }
        }

        return Promise.resolve();
      } else {
        nextPageClick();
      }
    },
    [
      isLoadingData,
      nextPageClick,
      isInfiniteScrollEnabled,
      pageSize,
      maxPages,
      isAddRowInProgress,
    ],
  );

  return {
    cachedRows,
    isItemLoaded,
    isLoadingData,
    loadMoreNextPage,
  };
};
