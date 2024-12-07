import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BasicCell, type PropType } from "../BasicCell";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { CompactModeTypes } from "widgets/TableWidget/component/Constants";

describe("BasicCell Component", () => {
  const defaultProps: PropType = {
    value: "Test Value",
    onEdit: jest.fn(),
    isCellEditable: false,
    hasUnsavedChanges: false,
    columnType: ColumnTypes.TEXT,
    url: "",
    compactMode: CompactModeTypes.DEFAULT,
    isHidden: false,
    isCellVisible: true,
    accentColor: "",
    tableWidth: 100,
    disabledEditIcon: false,
    disabledEditIconMessage: "",
  };

  it("renders the value", () => {
    render(<BasicCell {...defaultProps} />);
    expect(screen.getByText("Test Value")).toBeInTheDocument();
  });

  it("renders a link when columnType is URL", () => {
    render(
      <BasicCell
        {...defaultProps}
        columnType={ColumnTypes.URL}
        url="http://example.com"
      />,
    );
    const link = screen.getByText("Test Value");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "http://example.com");
  });

  it("calls onEdit when double-clicked", () => {
    render(<BasicCell {...defaultProps} isCellEditable />);
    fireEvent.doubleClick(screen.getByText("Test Value"));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it("forwards ref to the div element", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(<BasicCell {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
