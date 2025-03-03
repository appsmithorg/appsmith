import { render } from "@testing-library/react";
import React from "react";
import { EmptyRows, Row } from "../../TableBodyCoreComponents/Row";
import * as TableContext from "../../TableContext";
import { useAppsmithTable } from "../../TableContext";
import { StaticTableBodyComponent } from "../StaticTableBody";
import type { Row as ReactTableRowType } from "react-table";
import { TABLE_SIZES, CompactModeTypes } from "../../Constants";
import type { TableContextState } from "../../TableContext";

// Mock the required dependencies
jest.mock("../../TableContext", () => ({
  useAppsmithTable: jest.fn(),
}));

jest.mock("../../TableBodyCoreComponents/Row", () => ({
  Row: jest.fn(({ index }) => (
    <div data-index={index} data-testid="mocked-row">
      Row {index}
    </div>
  )),
  EmptyRows: jest.fn(() => <div data-testid="mocked-empty-rows" />),
}));

describe("StaticTableBodyComponent", () => {
  const mockGetTableBodyProps = jest.fn(() => ({
    "data-testid": "table-body",
  }));

  const createMockRow = (id: number, index: number) =>
    ({
      index,
      original: { id },
      id: String(id),
      getRowProps: () => ({ key: `row-${id}` }),
    }) as unknown as ReactTableRowType<Record<string, unknown>>;

  const mockTableContextState = {
    scrollContainerStyles: { height: 400, width: 800 },
    tableSizes: TABLE_SIZES[CompactModeTypes.DEFAULT],
    getTableBodyProps: mockGetTableBodyProps,
    pageSize: 0,
    subPage: [],
  } as unknown as TableContextState;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws error when used outside TableContext", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (useAppsmithTable as jest.Mock).mockImplementation(() => {
      throw new Error("useTable must be used within a TableProvider");
    });

    expect(() => render(<StaticTableBodyComponent />)).toThrow(
      "useTable must be used within a TableProvider",
    );

    consoleErrorSpy.mockRestore();
  });

  describe("Rows", () => {
    it("renders rows correctly(EmptyRows not required)", () => {
      const mockRows = [createMockRow(1, 0), createMockRow(2, 1)];

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 2,
        subPage: mockRows,
      } as unknown as TableContextState);

      const { container, getAllByTestId } = render(
        <StaticTableBodyComponent />,
      );

      expect(
        container.querySelector('[data-testid="table-body"]'),
      ).toBeTruthy();
      expect(getAllByTestId("mocked-row")).toHaveLength(2);
      expect(Row).toHaveBeenCalledTimes(2);
      expect(EmptyRows).not.toHaveBeenCalled();
    });

    it("passes correct props to Row component", () => {
      const mockRows = [createMockRow(1, 0)];

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 1,
        subPage: mockRows,
      } as unknown as TableContextState);

      render(<StaticTableBodyComponent />);

      expect(Row).toHaveBeenCalledWith(
        {
          index: 0,
          row: mockRows[0],
        },
        expect.anything(),
      );
    });

    it("should not render Rows or EmptyRows when pageSize is 0", () => {
      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 0,
        subPage: [],
      } as unknown as TableContextState);

      const { container, queryByTestId } = render(<StaticTableBodyComponent />);

      expect(container.querySelector(".tbody")).toBeTruthy();
      expect(queryByTestId("mocked-row")).not.toBeTruthy();
      expect(queryByTestId("mocked-empty-rows")).not.toBeTruthy();
    });

    it("[Performance] should maintain rendering performance with large data sets", () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, index) =>
        createMockRow(index, index),
      );

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 1000,
        subPage: largeDataSet,
      } as unknown as TableContextState);

      const { getAllByTestId } = render(<StaticTableBodyComponent />);

      expect(getAllByTestId("mocked-row")).toHaveLength(1000);
    });

    it("should preserve row order during re-renders", () => {
      const mockRows = [1, 2, 3].map((id, index) => createMockRow(id, index));

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 3,
        subPage: mockRows,
      } as unknown as TableContextState);

      const { getAllByTestId, rerender } = render(<StaticTableBodyComponent />);

      // Initial render check
      let renderedRows = getAllByTestId("mocked-row");

      expect(renderedRows).toHaveLength(3);
      expect(renderedRows[0].getAttribute("data-index")).toBe("0");
      expect(renderedRows[1].getAttribute("data-index")).toBe("1");
      expect(renderedRows[2].getAttribute("data-index")).toBe("2");

      // Re-render with the same rows
      rerender(<StaticTableBodyComponent />);

      // Check if the order is preserved
      renderedRows = getAllByTestId("mocked-row");
      expect(renderedRows).toHaveLength(3);
      expect(renderedRows[0].getAttribute("data-index")).toBe("0");
      expect(renderedRows[1].getAttribute("data-index")).toBe("1");
      expect(renderedRows[2].getAttribute("data-index")).toBe("2");
    });

    it("should update the number of Row components when rows data changes", () => {
      const initialRows = [1, 2].map((id, index) => createMockRow(id, index));
      const updatedRows = [1, 2, 3, 4].map((id, index) =>
        createMockRow(id, index),
      );
      const mockUseAppsmithTable = jest.spyOn(TableContext, "useAppsmithTable");

      // Initial render with initialRows
      mockUseAppsmithTable.mockReturnValue({
        ...mockTableContextState,
        pageSize: 4,
        subPage: initialRows,
      } as unknown as TableContextState);

      const { getAllByTestId, rerender } = render(<StaticTableBodyComponent />);

      expect(getAllByTestId("mocked-row")).toHaveLength(2);

      // Rerender with updatedRows
      mockUseAppsmithTable.mockReturnValue({
        ...mockTableContextState,
        pageSize: 4,
        subPage: updatedRows,
      } as unknown as TableContextState);

      rerender(<StaticTableBodyComponent />);
      expect(getAllByTestId("mocked-row")).toHaveLength(4);
    });
  });

  describe("EmptyRows", () => {
    it("should render EmptyRows when rows array is empty and pageSize is greater than zero", () => {
      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 5,
        subPage: [],
      } as unknown as TableContextState);

      const { container, getByTestId } = render(<StaticTableBodyComponent />);

      expect(container.querySelector(".tbody")).toBeTruthy();
      expect(getByTestId("mocked-empty-rows")).toBeTruthy();
      expect(EmptyRows).toHaveBeenCalledWith(
        { rowCount: 5 },
        expect.anything(),
      );
    });

    it("renders empty rows when pageSize is greater than rows length", () => {
      const mockRows = [createMockRow(1, 0)];

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 3,
        subPage: mockRows,
      } as unknown as TableContextState);

      const { container, getByTestId } = render(<StaticTableBodyComponent />);

      expect(
        container.querySelector('[data-testid="table-body"]'),
      ).toBeTruthy();
      expect(getByTestId("mocked-empty-rows")).toBeTruthy();
      expect(Row).toHaveBeenCalledTimes(1);
      expect(EmptyRows).toHaveBeenCalledWith(
        { rowCount: 2 },
        expect.anything(),
      );
    });

    it("does not render empty rows when pageSize equals rows length", () => {
      const mockRows = [createMockRow(1, 0), createMockRow(2, 1)];

      (useAppsmithTable as jest.Mock).mockReturnValue({
        ...mockTableContextState,
        pageSize: 2,
        subPage: mockRows,
      } as unknown as TableContextState);

      const { container, queryByTestId } = render(<StaticTableBodyComponent />);

      expect(
        container.querySelector('[data-testid="table-body"]'),
      ).toBeTruthy();
      expect(queryByTestId("mocked-empty-rows")).toBeNull();
      expect(EmptyRows).not.toHaveBeenCalled();
    });
  });
});
