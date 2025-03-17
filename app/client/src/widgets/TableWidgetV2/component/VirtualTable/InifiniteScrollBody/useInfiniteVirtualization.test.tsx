import { renderHook } from "@testing-library/react-hooks";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";
import { act } from "@testing-library/react";
import type { Row as ReactTableRowType } from "react-table";

describe("useInfiniteVirtualization", () => {
  // Mock factory function to create test rows
  const createMockRows = (
    count: number,
    startIndex = 0,
  ): ReactTableRowType<Record<string, unknown>>[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${startIndex + i + 1}`,
      original: { id: startIndex + i + 1, name: `Test ${startIndex + i + 1}` },
      index: startIndex + i,
      cells: [],
      values: {},
      getRowProps: jest.fn(),
      allCells: [],
      subRows: [],
      isExpanded: false,
      canExpand: false,
      depth: 0,
      toggleRowExpanded: jest.fn(),
      state: {},
      toggleRowSelected: jest.fn(),
      getToggleRowExpandedProps: jest.fn(),
      isSelected: false,
      isSomeSelected: false,
      isGrouped: false,
      groupByID: "",
      groupByVal: "",
      leafRows: [],
      getToggleRowSelectedProps: jest.fn(),
      setState: jest.fn(),
    }));
  };

  const mockRows = createMockRows(2);

  const defaultProps = {
    rows: mockRows,
    isLoading: false,
    loadMore: jest.fn(),
    pageSize: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. should return correct itemCount when totalRecordsCount is provided", () => {
    const totalRecordsCount = 100;
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        totalRecordsCount,
      }),
    );

    expect(result.current.itemCount).toBe(mockRows.length);
  });

  it("2. should return rows length as itemCount when totalRecordsCount is not provided", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization(defaultProps),
    );

    expect(result.current.itemCount).toBe(defaultProps.rows.length);
  });

  it("3. should update cachedRows when rows are provided", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization(defaultProps),
    );

    expect(result.current.cachedRows).toEqual(mockRows);
  });

  it("4. should call loadMore when loadMoreItems is called and not loading", async () => {
    const loadMore = jest.fn();
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        loadMore,
        rows: [], // Empty rows to ensure hasMoreDataRef.current stays true
        pageSize: 5, // Make sure pageSize is defined
      }),
    );

    await act(async () => {
      await result.current.loadMoreItems(0, 10);
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("5. should not call loadMore when loadMoreItems is called and is loading", async () => {
    const loadMore = jest.fn();
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        isLoading: true,
        loadMore,
      }),
    );

    await act(async () => {
      await result.current.loadMoreItems(0, 10);
    });

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("6. should return correct isItemLoaded state for different indices", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        // Add this to ensure hasMoreDataRef.current remains true
        // which is needed for isItemLoaded to return false for indices beyond loaded range
        rows: mockRows,
        pageSize: 2, // Set pageSize to match the number of mock rows
      }),
    );

    // Index within loaded range
    expect(result.current.isItemLoaded(0)).toBe(true);
    expect(result.current.isItemLoaded(1)).toBe(true);

    // Index beyond loaded range
    expect(result.current.isItemLoaded(5)).toBe(false);
  });

  it("7. should return zero itemCount when there are no records", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        rows: [],
      }),
    );

    expect(result.current.itemCount).toBe(0);
  });

  it("8. should cache rows from multiple page loads", () => {
    const pageSize = 2;
    const { rerender, result } = renderHook(
      (props) => useInfiniteVirtualization(props),
      {
        initialProps: {
          ...defaultProps,
          rows: createMockRows(pageSize),
          pageSize,
        },
      },
    );

    // Initial page loaded
    expect(result.current.cachedRows.length).toBe(pageSize);

    // Load second page
    act(() => {
      rerender({
        ...defaultProps,
        rows: createMockRows(pageSize, pageSize),
        pageSize,
      });
    });

    // Should now have both pages cached
    expect(result.current.cachedRows.length).toBe(pageSize * 2);
    expect(result.current.cachedRows[0].id).toBe("1");
    expect(result.current.cachedRows[2].id).toBe("3");
  });

  it("9. should handle partial page loads and detect end of data", () => {
    const pageSize = 10;
    const partialPageSize = 3;

    // Initial full page
    const { rerender, result } = renderHook(
      (props) => useInfiniteVirtualization(props),
      {
        initialProps: {
          ...defaultProps,
          rows: createMockRows(pageSize),
          pageSize,
        },
      },
    );

    // Then partial page to signal end of data
    act(() => {
      rerender({
        ...defaultProps,
        rows: createMockRows(partialPageSize, pageSize),
        pageSize,
      });
    });

    // Should mark all items as loaded including those beyond the actual data
    expect(result.current.cachedRows.length).toBe(pageSize + partialPageSize);
    expect(result.current.isItemLoaded(pageSize + partialPageSize + 5)).toBe(
      true,
    );
    expect(result.current.itemCount).toBe(pageSize + partialPageSize);
  });

  it("10. should handle empty page load as end of data", () => {
    const pageSize = 5;

    // Initial page
    const { rerender, result } = renderHook(
      (props) => useInfiniteVirtualization(props),
      {
        initialProps: {
          ...defaultProps,
          rows: createMockRows(pageSize),
          pageSize,
        },
      },
    );

    // Then empty page to signal end of data
    act(() => {
      rerender({
        ...defaultProps,
        rows: [],
        pageSize,
      });
    });

    // Should identify all items as loaded
    expect(result.current.cachedRows.length).toBe(pageSize);
    expect(result.current.isItemLoaded(pageSize + 1)).toBe(true);
    expect(result.current.itemCount).toBe(pageSize);
  });

  it("11. should not call loadMore when target page exceeds maxPages", async () => {
    const loadMore = jest.fn();
    const pageSize = 10;
    const totalRecordsCount = 15; // Should result in 2 pages (maxPages)

    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        loadMore,
        pageSize,
        totalRecordsCount,
      }),
    );

    await act(async () => {
      // Trying to load items beyond maxPages (2 pages)
      await result.current.loadMoreItems(pageSize * 2, pageSize * 2 + 5);
    });

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("12. should maintain correct page reference during multiple rerenders", () => {
    const pageSize = 2;

    // First page
    const { rerender, result } = renderHook(
      (props) => useInfiniteVirtualization(props),
      {
        initialProps: {
          ...defaultProps,
          rows: createMockRows(pageSize),
          pageSize,
        },
      },
    );

    // Second page
    act(() => {
      rerender({
        ...defaultProps,
        rows: createMockRows(pageSize, pageSize),
        pageSize,
      });
    });

    // Third page
    act(() => {
      rerender({
        ...defaultProps,
        rows: createMockRows(pageSize, pageSize * 2),
        pageSize,
      });
    });

    // Should have all pages cached
    expect(result.current.cachedRows.length).toBe(pageSize * 3);

    // Items from all pages should be loaded
    expect(result.current.isItemLoaded(0)).toBe(true);
    expect(result.current.isItemLoaded(pageSize + 1)).toBe(true);
    expect(result.current.isItemLoaded(pageSize * 2 + 1)).toBe(true);

    // Items beyond loaded pages should not be loaded
    expect(result.current.isItemLoaded(pageSize * 3 + 1)).toBe(false);
  });
});
