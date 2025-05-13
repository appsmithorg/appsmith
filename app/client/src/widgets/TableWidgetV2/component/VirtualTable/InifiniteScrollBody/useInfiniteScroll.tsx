import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import type { Row } from "react-table";
import type { ListOnItemsRenderedProps } from "react-window";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

export interface UseInfiniteScrollProps {
  loadMore: () => void;
  rows: Row<Record<string, unknown>>[];
  pageSize: number;
  isLoading: boolean;
  endOfData: boolean;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  cachedTableData: Array<Record<string, unknown>>;
}

export interface UseInfiniteScrollReturn {
  onItemsRendered: (props: ListOnItemsRenderedProps) => void;
}

export const useInfiniteScroll = ({
  cachedTableData,
  endOfData,
  isLoading,
  loadMore,
  pageSize,
  rows,
  updatePageNo,
}: UseInfiniteScrollProps): UseInfiniteScrollReturn => {
  const lastLoadedPageRef = useRef(1);
  const haveWeJustTriggeredLoadMoreRef = useRef(false);
  const hasLoadedSecondPageRef = useRef(false);
  const lastRenderedRowAtWhichWeLoadedData = useRef(0);
  const lastPageInTableDataset = Math.ceil(rows.length / pageSize);

  /**
   * We implement debouncing to avoid triggering unnecessary load more events, incorporating an additional timeout of 100 milliseconds to further prevent this.
   * There is also a ref that indicates whether a load more request has just been triggered, serving as a safety net to prevent multiple simultaneous requests.
   */
  const debouncedLoadMore = useCallback(
    debounce((pageToLoad: number) => {
      /**
       * We need this `hasNextPageData` variable to verify that in scenarios where a query fails or the user goes offline momentarily,
       * if we trigger a next page load, the meta property may update, but the table has not received any data.
       * In such cases, we need to send another request to load the data if it has not been received yet.
       */
      const hasNextPageData =
        pageToLoad in cachedTableData &&
        Array.isArray(cachedTableData[pageToLoad]) &&
        cachedTableData[pageToLoad].length > 0;
      const shouldLoad = !isLoading && !endOfData && !hasNextPageData;
      const preRequisitesForLoadingMore =
        shouldLoad && !haveWeJustTriggeredLoadMoreRef.current;

      if (preRequisitesForLoadingMore) {
        haveWeJustTriggeredLoadMoreRef.current = true;
        updatePageNo(pageToLoad, EventType.ON_NEXT_PAGE);

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
      const { visibleStopIndex: lastRenderedRowInTheCurrentView } = props;
      const currentVisiblePage = Math.ceil(
        lastRenderedRowInTheCurrentView / pageSize,
      );
      const isInLastPage = currentVisiblePage === lastPageInTableDataset;

      if (
        isInLastPage &&
        !isLoading &&
        !endOfData &&
        lastRenderedRowInTheCurrentView >=
          lastRenderedRowAtWhichWeLoadedData.current
      ) {
        if (lastRenderedRowAtWhichWeLoadedData.current !== rows.length) {
          lastRenderedRowAtWhichWeLoadedData.current =
            lastRenderedRowInTheCurrentView;
        }

        debouncedLoadMore(currentVisiblePage + 1);
      }
    },
    [lastPageInTableDataset, isLoading, endOfData, pageSize, debouncedLoadMore],
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
