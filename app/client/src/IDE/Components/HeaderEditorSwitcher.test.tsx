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

  it("does not show separator and applies different inactive color to icon", () => {
    const ref = React.createRef();
    const { container, getByTestId } = render(
      <HeaderEditorSwitcher
        {...defaultProps}
        data-testid="root-div"
        ref={ref}
        title={undefined}
      />,
    );

    const icon = container.querySelector(".remixicon-icon"); // Get chevron icon

    expect(getByTestId("root-div")).toHaveTextContent("Prefix");
    expect(icon).toHaveAttribute(
      "fill",
      "var(--ads-v2-colors-content-label-inactive-fg)",
    );
  });

  it("forwards additional props correctly", () => {
    const testId = "test-id";
    const className = "custom-class";

    const { container } = render(
      <HeaderEditorSwitcher
        active
        className={className}
        data-testid={testId} // Additional prop
        prefix="Prefix"
        title="Title"
        titleTestId="titleTestId"
      />,
    );

    const firstDiv = container.querySelector("div"); // Get the first div element
    const classNames = firstDiv?.getAttribute("class")?.split(" ") || [];

    expect(firstDiv).toHaveAttribute("data-testid", testId); // Check if data-testid prop is applied
    expect(classNames).toContain(className); // Check if className prop is applied
    expect(classNames).toContain("flex"); // Check if internal classes still exists
    expect(classNames).toContain("align-center"); // Check if internal classes still exists
    expect(classNames).toContain("justify-center"); // Check if internal classes still exists
  });
});
