import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectButton from "./ConnectButton";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { GitSyncModalTab } from "entities/GitSync";
import "@testing-library/jest-dom";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";

// Mock the AnalyticsUtil
jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

// Mock the components from '@appsmith/ads'
jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  Icon: ({ name }: Record<string, unknown>) => (
    <div data-testid="icon">{name}</div>
  ),
  Tooltip: ({ children, content, isDisabled }: Record<string, unknown>) => (
    <div>
      {children}
      {!isDisabled && <div data-testid="tooltip-content">{content}</div>}
    </div>
  ),
}));

describe("ConnectButton Component", () => {
  const openGitSyncModalMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly when isConnectPermitted is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <ConnectButton isConnectPermitted onClick={openGitSyncModalMock} />
      </ThemeProvider>,
    );

    // Check that the button is rendered and enabled
    const button = screen.getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();

    // Tooltip should be disabled
    const tooltipContent = screen.queryByTestId("tooltip-content");

    expect(tooltipContent).not.toBeInTheDocument();

    // Icon should be rendered
    const icon = screen.getByTestId("icon");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent("git-commit");
  });

  it("should handle click when isConnectPermitted is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <ConnectButton isConnectPermitted onClick={openGitSyncModalMock} />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Connect Git (Beta)" });

    fireEvent.click(button);

    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_CONNECT_GIT_CLICK",
      {
        source: "BOTTOM_BAR_GIT_CONNECT_BUTTON",
      },
    );

    expect(openGitSyncModalMock).toHaveBeenCalledWith({
      tab: GitSyncModalTab.GIT_CONNECTION,
    });
  });

  it("should render correctly when isConnectPermitted is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <ConnectButton
          isConnectPermitted={false}
          onClick={openGitSyncModalMock}
        />
      </ThemeProvider>,
    );

    // Check that the button is rendered and disabled
    const button = screen.getByRole("button", { name: "Connect Git (Beta)" });

    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Tooltip should be enabled and display correct content
    const tooltipContent = screen.getByTestId("tooltip-content");

    expect(tooltipContent).toBeInTheDocument();
    expect(tooltipContent).toHaveTextContent(
      "Please contact your workspace admin to connect your app to a git repo",
    );

    // Icon should be rendered
    const icon = screen.getByTestId("icon");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent("git-commit");
  });

  it("should not handle click when isConnectPermitted is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <ConnectButton
          isConnectPermitted={false}
          onClick={openGitSyncModalMock}
        />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Connect Git (Beta)" });

    fireEvent.click(button);

    expect(AnalyticsUtil.logEvent).not.toHaveBeenCalled();
    expect(openGitSyncModalMock).not.toHaveBeenCalled();
  });

  it("should display correct tooltip content when isConnectPermitted is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <ConnectButton isConnectPermitted onClick={openGitSyncModalMock} />
      </ThemeProvider>,
    );

    // Tooltip should be disabled, so content should not be visible
    const tooltipContent = screen.queryByTestId("tooltip-content");

    expect(tooltipContent).not.toBeInTheDocument();
  });
});
