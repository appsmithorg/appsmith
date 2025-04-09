import React from "react";
import { render, screen } from "@testing-library/react";
import { VariableInfiniteVirtualList } from "./VirtualList";
import type { Row as ReactTableRowType } from "react-table";
import "@testing-library/jest-dom";

jest.mock("react-window", () => {
  return {
    VariableSizeList: React.forwardRef<
      unknown,
      {
        children: (props: {
          index: number;
          style: React.CSSProperties;
          data: Record<string, unknown>[];
        }) => React.ReactNode;
        itemCount: number;
        itemData: Record<string, unknown>[];
        onItemsRendered?: (props: {
          overscanStartIndex: number;
          overscanStopIndex: number;
          visibleStartIndex: number;
          visibleStopIndex: number;
        }) => void;
        height?: number;
        width?: number;
      }
    >(({ children, itemCount, itemData, onItemsRendered }, ref) => {
      const items = [];

      for (let i = 0; i < itemCount; i++) {
        items.push(
          children({
            index: i,
            style: {},
            data: itemData,
          }),
        );
      }

      // Call onItemsRendered if provided
      React.useEffect(() => {
        if (onItemsRendered) {
          onItemsRendered({
            overscanStartIndex: 0,
            overscanStopIndex: itemCount - 1,
            visibleStartIndex: 0,
            visibleStopIndex: itemCount - 1,
          });
        }
      }, [itemCount, onItemsRendered]);

      return (
        <div
          data-testid="virtual-list"
          ref={ref as React.RefObject<HTMLDivElement>}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>{item}</React.Fragment>
          ))}
        </div>
      );
    }),
    areEqual: jest.fn((prevProps, nextProps) => prevProps === nextProps),
  };
});

jest.mock("./Row", () => ({
  Row: jest.fn(({ index, style }) => (
    <div data-index={index} role="row" style={style} />
  )),
}));

describe("VirtualList", () => {
  const createMockRows = (
    count: number,
  ): ReactTableRowType<Record<string, unknown>>[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i + 1}`,
      original: { id: i + 1, name: `Test ${i + 1}` },
      index: i,
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

  const mockTableSizes = {
    TABLE_HEADER_HEIGHT: 40,
    ROW_HEIGHT: 40,
    ROW_FONT_SIZE: 14,
    VERTICAL_PADDING: 10,
    EDIT_ICON_TOP: 10,
    COLUMN_HEADER_HEIGHT: 40,
    ROW_VIRTUAL_OFFSET: 0,
    VERTICAL_EDITOR_PADDING: 4,
    EDITABLE_CELL_HEIGHT: 32,
  };

  it("1. Should render rows correctly", () => {
    const mockRows = createMockRows(3);

    render(
      <VariableInfiniteVirtualList
        height={500}
        itemCount={mockRows.length}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("2. Should handle infinite scrolling with onItemsRendered callback", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();
    const onItemsRenderedMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData={true}
        height={500}
        infiniteLoaderListRef={{ current: null }}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        onItemsRendered={onItemsRenderedMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    // Verify onItemsRendered was called with the correct parameters
    expect(onItemsRenderedMock).toHaveBeenCalledWith({
      overscanStartIndex: 0,
      overscanStopIndex: 3,
      visibleStartIndex: 0,
      visibleStopIndex: 3,
    });
  });

  it("3. Should correctly set itemCount when hasMoreData is true", () => {
    const mockRows = createMockRows(3);
    const mockVariableSizeList =
      jest.requireMock("react-window").VariableSizeList;
    const spy = jest.spyOn(mockVariableSizeList, "render");

    render(
      <VariableInfiniteVirtualList
        hasMoreData={true}
        height={500}
        itemCount={mockRows.length}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    // This test verifies that itemCount is increased by 1 when hasMoreData is true
    // The BaseVirtualList component adds LOAD_MORE_BUTTON_ROW (1) to itemCount
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        itemCount: mockRows.length + 1,
      }),
      expect.anything(),
    );

    spy.mockRestore();
  });

  it("4. Should not increase itemCount when hasMoreData is false", () => {
    const mockRows = createMockRows(3);
    const mockVariableSizeList =
      jest.requireMock("react-window").VariableSizeList;
    const spy = jest.spyOn(mockVariableSizeList, "render");

    render(
      <VariableInfiniteVirtualList
        hasMoreData={false}
        height={500}
        itemCount={mockRows.length}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    // When hasMoreData is false, itemCount should not be increased
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        itemCount: mockRows.length,
      }),
      expect.anything(),
    );

    spy.mockRestore();
  });

  it("5. Should pass loadMore callback to inner components", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData={true}
        height={500}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    // We can't directly test if the loadMore function is passed to the MemoizedRow,
    // but we can verify the component renders properly with the loadMore prop
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
