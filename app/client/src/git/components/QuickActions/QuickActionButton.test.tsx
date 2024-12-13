import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuickActionButton from "./QuickActionButton";
import "@testing-library/jest-dom";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";

jest.mock("pages/common/SpinnerLoader", () => {
  return function SpinnerLoader() {
    return <div data-testid="spinner-loader">Loading...</div>;
  };
});

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  Tooltip: ({ children, content }: Record<string, unknown>) => (
    <div data-testid="tooltip">
      <div data-testid="tooltip-content">{content}</div>
      {children}
    </div>
  ),
}));

describe("QuickActionButton", () => {
  const defaultProps = {
    icon: "plus",
    onClick: jest.fn(),
    tooltipText: "default action",
    className: "t--test-btn",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} />
      </ThemeProvider>,
    );
    const btn = container.getElementsByClassName("t--test-btn")[0];

    expect(btn).toBeInTheDocument();
  });

  it("should call onClick when button is clicked", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} />
      </ThemeProvider>,
    );
    const btn = container.querySelectorAll(".t--test-btn button")[0];

    fireEvent.click(btn);
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when button is disabled", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} disabled />
      </ThemeProvider>,
    );
    const btn = container.getElementsByClassName("t--test-btn")[0];

    fireEvent.click(btn);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it("should display the tooltip with capitalized text", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent(
      "Default action",
    );
  });

  it("should display the spinner when loading is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} loading />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("spinner-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("t--test-btn")).not.toBeInTheDocument();
  });

  it("should display the count badge when count is greater than 0", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} count={5} />
      </ThemeProvider>,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not display the count badge when count is 0", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActionButton {...defaultProps} count={0} />
      </ThemeProvider>,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
