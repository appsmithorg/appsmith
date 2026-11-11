import React from "react";
import { render, screen } from "@testing-library/react";
import { Table } from "./Table";
import { CompactModeTypes } from "./Constants";
import type { TableProps } from "./types";

jest.mock("./StaticTable", () => ({
  __esModule: true,
  default: () => <div data-testid="t--static-table" />,
}));

jest.mock("./VirtualTable", () => ({
  __esModule: true,
  default: () => <div data-testid="t--virtual-table" />,
}));

jest.mock("./header", () => ({
  __esModule: true,
  default: () => null,
}));

const tableProps = {
  width: 800,
  height: 400,
  pageSize: 5,
  pageNo: 0,
  widgetId: "table-widget-1",
  widgetName: "Table1",
  columns: [],
  data: [],
  compactMode: CompactModeTypes.DEFAULT,
  selectedRowIndices: [],
  isLoading: false,
  isAddRowInProgress: false,
  isInfiniteScrollEnabled: false,
  isAutoHeightEnabled: false,
  serverSidePaginationEnabled: false,
  showConnectDataOverlay: false,
  toggleAllRowSelect: jest.fn(),
  handleResizeColumn: jest.fn(),
} as unknown as TableProps;

describe("Table body selection", () => {
  it("uses the virtualised body for server side pagination", () => {
    render(<Table {...tableProps} serverSidePaginationEnabled />);

    expect(screen.getByTestId("t--virtual-table")).toBeTruthy();
    expect(screen.queryByTestId("t--static-table")).toBeNull();
  });

  it("uses the static body for server side pagination with auto height", () => {
    render(
      <Table {...tableProps} isAutoHeightEnabled serverSidePaginationEnabled />,
    );

    expect(screen.getByTestId("t--static-table")).toBeTruthy();
    expect(screen.queryByTestId("t--virtual-table")).toBeNull();
  });

  it("uses the static body for infinite scroll with auto height", () => {
    render(
      <Table {...tableProps} isAutoHeightEnabled isInfiniteScrollEnabled />,
    );

    expect(screen.getByTestId("t--static-table")).toBeTruthy();
  });
});
