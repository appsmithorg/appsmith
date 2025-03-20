import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FixedInfiniteVirtualList } from "./VirtualList";
import type { Row as ReactTableRowType } from "react-table";
import "@testing-library/jest-dom";

// Mock react-window's FixedSizeList because it uses DOM measuring which isn't available in test environment
jest.mock("react-window", () => {
  return {
    FixedSizeList: ({
      children,
      itemCount,
      itemData,
    }: {
      children: {
        (props: {
          index: number;
          style: React.CSSProperties;
          data: unknown;
        }): React.ReactNode;
      };
      itemCount: number;
      itemData: {
        [key: string]: unknown;
      };
    }) => {
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

      return (
        <div data-testid="virtual-list">
          {items.map((item, idx) => (
            <React.Fragment key={idx}>{item}</React.Fragment>
          ))}
        </div>
      );
    },
    areEqual: jest.fn((prevProps, nextProps) => prevProps === nextProps),
  };
});

// Replace the Row mocking part in your test
jest.mock("./Row", () => ({
  Row: jest.fn(({ index, style }) => (
    <div data-index={index} role="row" style={style} />
  )),
}));

describe("VirtualList", () => {
  // Helper to create mock rows
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

  // Mock props
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
      <FixedInfiniteVirtualList
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
      <FixedInfiniteVirtualList
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
      <FixedInfiniteVirtualList
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
      <FixedInfiniteVirtualList
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
      <FixedInfiniteVirtualList
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
