import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StaticTable from "../index";
import { useAppsmithTable } from "../../TableContext";
import type SimpleBar from "simplebar-react";

// Mock SimpleBar
jest.mock("simplebar-react", () => {
  return {
    __esModule: true,
    default: React.forwardRef<
      HTMLDivElement,
      { children: React.ReactNode; style?: React.CSSProperties }
    >((props, ref) => (
      <div className="simplebar-content-wrapper" ref={ref} style={props.style}>
        {props.children}
      </div>
    )),
  };
});

// Mock the required dependencies
jest.mock("../../TableContext", () => ({
  useAppsmithTable: jest.fn(),
}));

jest.mock("../../header/TableColumnHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-table-header">Table Header</div>,
}));

jest.mock("../StaticTableBodyComponent", () => ({
  StaticTableBodyComponent: () => (
    <div data-testid="mock-table-body">Table Body</div>
  ),
}));

describe("StaticTable", () => {
  const mockScrollContainerStyles = {
    height: 400,
    width: 800,
  };

  beforeEach(() => {
    (useAppsmithTable as jest.Mock).mockReturnValue({
      scrollContainerStyles: mockScrollContainerStyles,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the table with header and body components", () => {
    const ref = React.createRef<SimpleBar>();

    render(<StaticTable ref={ref} />);

    expect(screen.getByTestId("mock-table-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-table-body")).toBeInTheDocument();
  });

  it("applies correct scroll container styles from context", () => {
    const ref = React.createRef<SimpleBar>();
    const { container } = render(<StaticTable ref={ref} />);

    const simpleBarElement = container.querySelector(
      ".simplebar-content-wrapper",
    );

    expect(simpleBarElement).toHaveStyle({
      height: `${mockScrollContainerStyles.height}px`,
      width: `${mockScrollContainerStyles.width}px`,
    });
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<SimpleBar>();

    render(<StaticTable ref={ref} />);

    expect(ref.current).toBeTruthy();
    // Instead of instanceof check, verify the ref points to the correct element
    expect(ref.current).toHaveClass("simplebar-content-wrapper");
  });

  it("throws error when used outside TableContext", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (useAppsmithTable as jest.Mock).mockImplementation(() => {
      throw new Error("useTable must be used within a TableProvider");
    });

    const ref = React.createRef<SimpleBar>();

    expect(() => render(<StaticTable ref={ref} />)).toThrow(
      "useTable must be used within a TableProvider",
    );

    consoleErrorSpy.mockRestore();
  });
});
