import { concat } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditableCell } from "../constants";

export interface UseCachingVirtualizationProps {
  editableCell: EditableCell;
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
  cachedRows: Array<Record<string, unknown>>;
  loadMoreNextPage: (
    startIndex?: number,
    stopIndex?: number,
  ) => Promise<void> | void;
  isItemLoaded: (index: number) => boolean;
}

export const useCachingVirtualization = ({
  data,
  editableCell,
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
  const isAddRowInProgressRef = useRef<{
    isAddRowInProgress: boolean;
    addedNewRow: boolean;
  }>({ isAddRowInProgress: false, addedNewRow: false });

  const editableCellRef = useRef<{
    isEditing: boolean;
    editingCell?: EditableCell;
  }>({ isEditing: false, editingCell: undefined });

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
      setCachedRows([]);
    }
  }, [isInfiniteScrollEnabled]);

  useEffect(() => {
    isAddRowInProgressRef.current.isAddRowInProgress = isAddRowInProgress;
  }, [isAddRowInProgress]);

  useEffect(() => {
    if (editableCell.index !== -1) {
      editableCellRef.current.editingCell = editableCell;
      editableCellRef.current.isEditing = true;
      setCachedRows((e) => {
        const newRows = [...e];

        newRows[editableCell.index][editableCell.column] =
          editableCell.inputValue;

        return newRows;
      });
    } else {
      editableCellRef.current.editingCell = undefined;
    }
  }, [editableCell]);

  useEffect(() => {
    if (isInfiniteScrollEnabled) {
      if (isAddRowInProgressRef.current.isAddRowInProgress) {
        if (isAddRowInProgressRef.current.addedNewRow) {
          setCachedRows((e) => concat([data[0]], e.slice(1)));
        } else {
          setCachedRows((e) => concat([data[0]], e));
          isAddRowInProgressRef.current.addedNewRow = true;
        }

        // TODO: If new rows are added, we would have to update the cached rows
        return;
      } else if (data.length > 0) {
        if (isAddRowInProgressRef.current.addedNewRow) {
          isAddRowInProgressRef.current.addedNewRow = false;
          setCachedRows((e) => e.slice(1));
        } else if (editableCellRef.current.isEditing) {
          editableCellRef.current.isEditing = false;
        } else {
          const currentPageIndex = lastLoadedPageRef.current;

          // Only increment if we got a full page or some data
          if (data.length === pageSize) {
            lastLoadedPageRef.current = currentPageIndex + 1;
          } else if (data.length < pageSize && data.length > 0) {
            // If we got less than a full page, assume this is the last page
            hasMoreDataRef.current = false;
          }

          setCachedRows((e) => concat(e, data));
        }
      } else if (data.length === 0 && lastLoadedPageRef.current > 0) {
        if (isAddRowInProgressRef.current.addedNewRow) {
          isAddRowInProgressRef.current.addedNewRow = false;
          setCachedRows((e) => concat(e.slice(1), data));
        } else {
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
    async (startIndex?: number, stopIndex?: number) => {
      if (isInfiniteScrollEnabled) {
        if (!isLoadingData && hasMoreDataRef.current && !isAddRowInProgress) {
          const targetPage = Math.floor(stopIndex! / pageSize);

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
