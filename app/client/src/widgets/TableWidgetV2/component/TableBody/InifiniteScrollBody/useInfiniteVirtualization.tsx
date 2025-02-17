import { useCallback } from "react";
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
}

export const useInfiniteVirtualization = ({
  isLoading,
  loadMore,
  rows,
  totalRecordsCount,
}: InfiniteVirtualizationProps): UseInfiniteVirtualizationReturn => {
  const loadMoreItems = useCallback(async () => {
    if (!isLoading) {
      loadMore();
    }

    return Promise.resolve();
  }, [isLoading, loadMore]);

  return {
    itemCount: totalRecordsCount ?? rows.length,
    loadMoreItems,
    isItemLoaded: (index) => !isLoading && index < rows.length,
  };
};
