import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("2. Should render Load More button when hasMoreData is true", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData
        height={500}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    const loadMoreButton = screen.getByRole("button", {
      name: "Load more records",
    });

    expect(loadMoreButton).toBeInTheDocument();
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });

  it("3. Should not render Load More button when hasMoreData is false", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData={false}
        height={500}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Load more records" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Load More")).not.toBeInTheDocument();
  });

  it("4. Should call loadMore when Load More button is clicked", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData
        height={500}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    const loadMoreButton = screen.getByRole("button", {
      name: "Load more records",
    });

    fireEvent.click(loadMoreButton);

    expect(loadMoreMock).toHaveBeenCalledTimes(1);
  });

  it("5. Should treat row data and load more data properly when both are provided", () => {
    const mockRows = createMockRows(3);
    const loadMoreMock = jest.fn();

    render(
      <VariableInfiniteVirtualList
        hasMoreData
        height={500}
        itemCount={mockRows.length}
        loadMore={loadMoreMock}
        outerRef={{ current: null }}
        pageSize={10}
        rows={mockRows}
        tableSizes={mockTableSizes}
      />,
    );

    // Should have regular rows
    expect(screen.getAllByRole("row")).toHaveLength(3);

    // And the Load More button
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });
});
