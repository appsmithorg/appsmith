import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import type { Row } from "react-table";
import type { ListOnItemsRenderedProps } from "react-window";

export interface UseInfiniteScrollProps {
  loadMore: () => void;
  rows: Row<Record<string, unknown>>[];
  pageSize: number;
  isLoading: boolean;
  endOfData: boolean;
}

export interface UseInfiniteScrollReturn {
  onItemsRendered: (props: ListOnItemsRenderedProps) => void;
}

/**
  *  Infinite Scroll Hook
  *
  * This hook can be somewhat complex to understand, and grasping its functionality hinges on the four ref variables, along with the two methods: `onItemsRendered` and `debouncedLoadMore`.

  * Let’s start with `debouncedLoadMore`.


 
 */
export const useInfiniteScroll = ({
  endOfData,
  isLoading,
  loadMore,
  pageSize,
  rows,
}: UseInfiniteScrollProps): UseInfiniteScrollReturn => {
  const lastLoadedPageRef = useRef(1);
  const haveWeJustTriggeredLoadMoreRef = useRef(false);
  const hasLoadedSecondPageRef = useRef(false);
  const lastRenderedRowInCurrentViewPortRef = useRef(0);
  const currentPage = Math.ceil(rows.length / pageSize);

  /**
   * We implement debouncing to avoid triggering unnecessary load more events, incorporating an additional timeout of 100 milliseconds to further prevent this.
   * There is also a ref that indicates whether a load more request has just been triggered, serving as a safety net to prevent multiple simultaneous requests.
   */
  const debouncedLoadMore = useCallback(
    debounce(() => {
      if (!isLoading && !endOfData && !haveWeJustTriggeredLoadMoreRef.current) {
        haveWeJustTriggeredLoadMoreRef.current = true;
        loadMore();
        setTimeout(() => {
          haveWeJustTriggeredLoadMoreRef.current = false;
        }, 100);
      }
    }, 150),
    [isLoading, endOfData, loadMore],
  );

  /**
   * This is the point where the loading functionality is activated.
   * Essentially, upon rendering items, the system identifies the last rendered position and calculates which page is currently visible.
   * this method identifies the last row in the visible React window that has been rendered.
   * Based on the row index, we can determine which page we are currently on.
   * If this page happens to be the last one, we will trigger a load more request.
 
   * For instance, if you have loaded 50 rows and are viewing a subset of 20 to 30 rows, it will determine the page number to be 2.
   *            Since this is not the last page, it will refrain from triggering another load request.
   *            However, if you scroll from item 40 to 41, the system detects that item 41 is now in view and
   *              recalculates the page to reflect the last loaded page number.
   *            This will trigger a load more request.
   *
   * This approach is efficient, as it prevents unnecessary load requests when the rendered view range changes, especially if the user is scrolling in the opposite direction.
   */
  const onItemsRendered = useCallback(
    (props: ListOnItemsRenderedProps) => {
      const { visibleStopIndex } = props;

      const currentVisiblePage = Math.ceil(visibleStopIndex / pageSize);
      const isInLastPage = currentVisiblePage === currentPage;

      if (
        isInLastPage &&
        !isLoading &&
        !endOfData &&
        visibleStopIndex > lastRenderedRowInCurrentViewPortRef.current
      ) {
        lastRenderedRowInCurrentViewPortRef.current = visibleStopIndex;
        debouncedLoadMore();
      }
    },
    [currentPage, isLoading, endOfData, pageSize, debouncedLoadMore],
  );

  /**
   * when the user scrolls infinitely, loading only one set of data would not facilitate proper scrolling on the page.
   * To enable smooth scrolling, we need to load at least two sets of data.
   * Thus, the effect checks whether the second page has been loaded; if not, it triggers a load more request immediately after the first set of data has been retrieved.
   */
  useEffect(() => {
    if (rows.length > 0) {
      const newPage = Math.ceil(rows.length / pageSize);

      if (rows.length <= pageSize && !hasLoadedSecondPageRef.current) {
        hasLoadedSecondPageRef.current = true;
        loadMore();
      }

      if (newPage > lastLoadedPageRef.current) {
        lastLoadedPageRef.current = newPage;
      }
    }
  }, [rows.length, pageSize, loadMore]);

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedLoadMore.cancel();
    };
  }, [debouncedLoadMore]);

  return {
    onItemsRendered,
  };
};
