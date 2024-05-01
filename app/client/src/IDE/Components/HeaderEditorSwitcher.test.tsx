import React from "react";
import { render, fireEvent } from "@testing-library/react";
import HeaderEditorSwitcher from "./HeaderEditorSwitcher";
import "@testing-library/jest-dom";

describe("HeaderEditorSwitcher", () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    prefix: "Prefix",
    title: "Title",
    titleTestId: "titleTestId",
    active: false,
    onClick: mockOnClick,
  };

  it("renders with correct props", () => {
    const { getByText } = render(<HeaderEditorSwitcher {...defaultProps} />);

    const testIdElement = document.getElementsByClassName(
      defaultProps.titleTestId,
    );

    expect(getByText("Prefix /")).toBeInTheDocument();
    expect(getByText(defaultProps.title)).toBeInTheDocument();
    expect(testIdElement).toBeDefined();
  });

  it("renders active state correctly", () => {
    const { getByText } = render(
      <HeaderEditorSwitcher {...defaultProps} active />,
    );

    expect(getByText("Prefix /")).toHaveStyle(
      "background-color: var(--ads-v2-color-bg-subtle)",
    );
  });

  it("calls onClick handler when clicked", () => {
    const { getByText } = render(<HeaderEditorSwitcher {...defaultProps} />);
    fireEvent.click(getByText("Title"));

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef();
    render(<HeaderEditorSwitcher {...defaultProps} ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it("does not crash when onClick is not provided", () => {
    const { getByText } = render(
      <HeaderEditorSwitcher {...defaultProps} onClick={undefined} />,
    );
    fireEvent.click(getByText("Title")); // Should not throw error
  });
});
