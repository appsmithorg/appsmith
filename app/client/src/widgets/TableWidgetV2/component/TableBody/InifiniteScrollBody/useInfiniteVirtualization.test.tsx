import { renderHook } from "@testing-library/react-hooks";
import { useInfiniteVirtualization } from "./useInfiniteVirtualization";
import { act } from "@testing-library/react";
import type { Row as ReactTableRowType } from "react-table";

describe("useInfiniteVirtualization", () => {
  const mockRows: ReactTableRowType<Record<string, unknown>>[] = [
    {
      id: "1",
      original: { id: 1, name: "Test 1" },
      index: 0,
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
    },
    {
      id: "2",
      original: { id: 2, name: "Test 2" },
      index: 1,
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
    },
  ];

  const defaultProps = {
    rows: mockRows,
    isLoading: false,
    loadMore: jest.fn(),
    pageSize: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return correct itemCount when totalRecordsCount is provided", () => {
    const totalRecordsCount = 100;
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        totalRecordsCount,
      }),
    );

    expect(result.current.itemCount).toBe(totalRecordsCount);
  });

  it("should return rows length as itemCount when totalRecordsCount is not provided", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization(defaultProps),
    );

    expect(result.current.itemCount).toBe(defaultProps.rows.length);
  });

  it("should call loadMore when loadMoreItems is called and not loading", async () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization(defaultProps),
    );

    await act(async () => {
      await result.current.loadMoreItems(0, 10);
    });

    expect(defaultProps.loadMore).toHaveBeenCalledTimes(1);
  });

  it("should not call loadMore when loadMoreItems is called and is loading", async () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        isLoading: true,
      }),
    );

    await act(async () => {
      await result.current.loadMoreItems(0, 10);
    });

    expect(defaultProps.loadMore).not.toHaveBeenCalled();
  });

  it("should return correct isItemLoaded state for different scenarios", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization(defaultProps),
    );

    // Index within rows length and not loading
    expect(result.current.isItemLoaded(1)).toBe(true);

    // Index beyond rows length and not loading
    expect(result.current.isItemLoaded(5)).toBe(false);
  });

  it("should return false for isItemLoaded when loading", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        isLoading: true,
      }),
    );

    // Even for index within rows length, should return false when loading
    expect(result.current.isItemLoaded(1)).toBe(false);
  });

  it("should return zero itemCount when there are no records", () => {
    const { result } = renderHook(() =>
      useInfiniteVirtualization({
        ...defaultProps,
        rows: [],
      }),
    );

    expect(result.current.itemCount).toBe(0);
  });
});
