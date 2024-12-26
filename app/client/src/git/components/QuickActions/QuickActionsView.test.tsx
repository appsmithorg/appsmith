import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import QuickActionsView from "./QuickActionsView";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom/extend-expect";
import { GitOpsTab, GitSettingsTab } from "git/constants/enums";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

jest.mock("./ConnectButton", () => () => (
  <div data-testid="connect-button">ConnectButton</div>
));

jest.mock("./../Statusbar", () => () => (
  <div data-testid="autocommit-statusbar">Statusbar</div>
));

describe("QuickActionsView Component", () => {
  const defaultProps = {
    currentBranch: "main",
    discard: jest.fn(),
    isAutocommitEnabled: false,
    isAutocommitPolling: false,
    isBranchPopupOpen: false,
    isConnectPermitted: true,
    isDiscardLoading: false,
    isFetchStatusLoading: false,
    isGitConnected: false,
    isProtectedMode: false,
    isPullFailing: false,
    isPullLoading: false,
    isStatusClean: true,
    isTriggerAutocommitLoading: false,
    pull: jest.fn(),
    statusBehindCount: 0,
    statusChangeCount: 0,
    toggleConnectModal: jest.fn(),
    toggleOpsModal: jest.fn(),
    toggleSettingsModal: jest.fn(),
    toggleBranchPopup: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render ConnectButton when isGitConnected is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("connect-button")).toBeInTheDocument();
  });

  it("should render QuickActionButtons when isGitConnected is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );

    expect(
      container.getElementsByClassName("t--bottom-bar-commit").length,
    ).toBe(1);
    expect(container.getElementsByClassName("t--bottom-bar-pull").length).toBe(
      1,
    );
    expect(container.getElementsByClassName("t--bottom-bar-merge").length).toBe(
      1,
    );
    expect(
      container.getElementsByClassName("t--bottom-git-settings").length,
    ).toBe(1);
  });

  it("should render Statusbar when isAutocommitEnabled and isPollingAutocommit are true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isAutocommitEnabled: true,
      isAutocommitPolling: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("autocommit-statusbar")).toBeInTheDocument();
    expect(
      container.getElementsByClassName("t--bottom-bar-commit").length,
    ).toBe(0);
  });

  it("should call onCommitClick when commit button is clicked", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const commitButton = container.querySelectorAll(
      ".t--bottom-bar-commit button",
    )[0];

    fireEvent.click(commitButton);
    expect(props.toggleOpsModal).toHaveBeenCalledWith(true, GitOpsTab.Deploy);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_DEPLOY_GIT_MODAL_TRIGGERED",
      {
        source: "BOTTOM_BAR_GIT_COMMIT_BUTTON",
      },
    );
  });

  it("should call onPullClick when pull button is clicked", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isDiscardLoading: false,
      isPullLoading: false,
      isFetchStatusLoading: false,
      isPullDisabled: false,
      statusBehindCount: 1,
      statusIsClean: false,
      isProtectedMode: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const pullButton = container.querySelectorAll(
      ".t--bottom-bar-pull button",
    )[0];

    fireEvent.click(pullButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith("GS_PULL_GIT_CLICK", {
      source: "BOTTOM_BAR_GIT_PULL_BUTTON",
    });
  });

  it("should call onMerge when merge button is clicked", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const mergeButton = container.querySelectorAll(
      ".t--bottom-bar-merge button",
    )[0];

    fireEvent.click(mergeButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_MERGE_GIT_MODAL_TRIGGERED",
      {
        source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
      },
    );
    expect(props.toggleOpsModal).toHaveBeenCalledWith(true, GitOpsTab.Merge);
  });

  it("should call onSettingsClick when settings button is clicked", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const settingsButton = container.querySelectorAll(
      ".t--bottom-git-settings button",
    )[0];

    fireEvent.click(settingsButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith("GS_SETTING_CLICK", {
      source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
    });
    expect(props.toggleSettingsModal).toHaveBeenCalledWith(
      true,
      GitSettingsTab.General,
    );
  });

  it("should disable commit button when isProtectedMode is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isProtectedMode: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const commitButton = container.querySelectorAll(
      ".t--bottom-bar-commit button",
    )[0];

    expect(commitButton).toBeDisabled();
  });

  it("should show loading state on pull button when showPullLoadingState is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isPullLoading: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );

    const pullButton =
      container.getElementsByClassName("t--bottom-bar-pull")[0];
    const pullLoading = pullButton.getElementsByClassName(
      "t--loader-quick-git-action",
    )[0];

    expect(pullLoading).toBeInTheDocument();
  });

  it("should display changesToCommit count on commit button", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      statusChangeCount: 5,
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const countElement = screen.getByTestId("t--bottom-bar-count");

    expect(countElement).toHaveTextContent("5");
  });

  it("should not display count on commit button when isProtectedMode is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isProtectedMode: true,
      statusChangeCount: 5,
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("t--bottom-bar-count")).not.toBeInTheDocument();
  });

  it("should disable pull button when pullDisabled is true", () => {
    const mockGetPullBtnStatus = jest.requireMock(
      "./helpers/getPullButtonStatus",
    ).default;

    mockGetPullBtnStatus.mockReturnValue({
      isDisabled: true,
      message: "Pull Disabled",
    });

    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const pullButton = container.querySelectorAll(
      ".t--bottom-bar-pull button",
    )[0];

    expect(pullButton).toBeDisabled();
  });

  it("should show behindCount on pull button", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      statusBehindCount: 3,
      statusIsClean: true,
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActionsView {...props} />
      </ThemeProvider>,
    );
    const countElement = screen.getByTestId("t--bottom-bar-count");

    expect(countElement).toHaveTextContent("3");
  });
});
