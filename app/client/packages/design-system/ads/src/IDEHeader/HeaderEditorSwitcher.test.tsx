import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { IDEHeaderSwitcher } from "./IDEHeaderSwitcher";
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
    render(<IDEHeaderSwitcher {...defaultProps} />);

    // eslint-disable-next-line testing-library/no-node-access
    const testIdElement = document.getElementsByClassName(
      defaultProps.titleTestId,
    );

    expect(screen.getByText("Prefix /")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(testIdElement).toBeDefined();
  });

  it("renders active state correctly", () => {
    render(<IDEHeaderSwitcher {...defaultProps} active />);

    expect(screen.getByText("Prefix /")).toHaveStyle(
      "background-color: var(--ads-v2-color-bg-subtle)",
    );
  });

  it("calls onClick handler when clicked", () => {
    render(<IDEHeaderSwitcher {...defaultProps} />);

    fireEvent.click(screen.getByText("Title"));

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(<IDEHeaderSwitcher {...defaultProps} ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it("does not crash when onClick is not provided", () => {
    render(<IDEHeaderSwitcher {...defaultProps} onClick={undefined} />);

    fireEvent.click(screen.getByText("Title")); // Should not throw error
  });

  it("does not show separator and applies different inactive color to icon", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <IDEHeaderSwitcher
        {...defaultProps}
        data-testid="root-div"
        ref={ref}
        title={undefined}
      />,
    );

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const icon = container.querySelector(".remixicon-icon"); // Get chevron icon

    expect(screen.getByTestId("root-div")).toHaveTextContent("Prefix");
    expect(icon).toHaveAttribute(
      "fill",
      "var(--ads-v2-colors-content-label-inactive-fg)",
    );
  });

  it("forwards additional props correctly", () => {
    const testId = "test-id";
    const className = "custom-class";

    const { container } = render(
      <IDEHeaderSwitcher
        active
        className={className}
        data-testid={testId} // Additional prop
        prefix="Prefix"
        title="Title"
        titleTestId="titleTestId"
      />,
    );

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const firstDiv = container.querySelector("div"); // Get the first div element
    const classNames = firstDiv?.getAttribute("class")?.split(" ") || [];

    expect(firstDiv).toHaveAttribute("data-testid", testId); // Check if data-testid prop is applied
    expect(classNames).toContain(className); // Check if className prop is applied
    expect(classNames).toContain("flex"); // Check if internal classes still exists
    expect(classNames).toContain("align-center"); // Check if internal classes still exists
    expect(classNames).toContain("justify-center"); // Check if internal classes still exists
  });
});
