import type { Row } from "react-table";
import { useEffect } from "react";

export interface UseInfiniteScrollProps {
  loadMore: () => void;
  rows: Row<Record<string, unknown>>[];
  pageSize: number;
}

export const useInfiniteScroll = ({
  loadMore,
  pageSize,
  rows,
}: UseInfiniteScrollProps) => {
  useEffect(() => {
    // If cachedRows is just a single page, call loadMore to fetch the next page
    if (rows.length > 0 && rows.length <= pageSize) {
      loadMore();
    }
  }, [rows.length, pageSize, loadMore]);

  return;
};
