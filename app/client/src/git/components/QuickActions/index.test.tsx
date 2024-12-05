import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import QuickActions from ".";
import { GitSettingsTab } from "git/enums";
import { GitSyncModalTab } from "entities/GitSync";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom/extend-expect";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

jest.mock("./ConnectButton", () => () => (
  <div data-testid="connect-button">ConnectButton</div>
));

jest.mock("./AutocommitStatusbar", () => () => (
  <div data-testid="autocommit-statusbar">AutocommitStatusbar</div>
));

describe("QuickActions Component", () => {
  const defaultProps = {
    isGitConnected: false,
    gitStatus: {
      behindCount: 0,
      isClean: true,
    },
    pullFailed: false,
    isProtectedMode: false,
    isDiscardInProgress: false,
    isPollingAutocommit: false,
    isPullInProgress: false,
    isFetchingGitStatus: false,
    changesToCommit: 0,
    gitMetadata: {},
    isAutocommitEnabled: false,
    isConnectPermitted: true,
    openGitSyncModal: jest.fn(),
    openGitSettingsModal: jest.fn(),
    discardChanges: jest.fn(),
    pull: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render ConnectButton when isGitConnected is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <QuickActions {...defaultProps} />
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
        <QuickActions {...props} />
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

  it("should render AutocommitStatusbar when isAutocommitEnabled and isPollingAutocommit are true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      gitMetadata: {
        autoCommitConfig: {
          enabled: true,
        },
      },
      isPollingAutocommit: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
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
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const commitButton = container.getElementsByClassName(
      "t--bottom-bar-commit",
    )[0];

    fireEvent.click(commitButton);
    expect(props.openGitSyncModal).toHaveBeenCalledWith({
      tab: GitSyncModalTab.DEPLOY,
    });
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
      isDiscardInProgress: false,
      isPullInProgress: false,
      isFetchingGitStatus: false,
      pullDisabled: false,
      gitStatus: {
        behindCount: 1,
        isClean: false,
      },
      isProtectedMode: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const pullButton =
      container.getElementsByClassName("t--bottom-bar-pull")[0];

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
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const mergeButton = container.getElementsByClassName(
      "t--bottom-bar-merge",
    )[0];

    fireEvent.click(mergeButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_MERGE_GIT_MODAL_TRIGGERED",
      {
        source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
      },
    );
    expect(props.openGitSyncModal).toHaveBeenCalledWith({
      tab: GitSyncModalTab.MERGE,
      isDeploying: true,
    });
  });

  it("should call onSettingsClick when settings button is clicked", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const settingsButton = container.getElementsByClassName(
      "t--bottom-git-settings",
    )[0];

    fireEvent.click(settingsButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith("GS_SETTING_CLICK", {
      source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
    });
    expect(props.openGitSettingsModal).toHaveBeenCalledWith({
      tab: GitSettingsTab.General,
    });
  });

  it("should disable commit button when isProtectedMode is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isProtectedMode: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const commitButton = container.getElementsByClassName(
      "t--bottom-bar-commit",
    )[0];

    expect(commitButton).toBeDisabled();
  });

  it("should show loading state on pull button when showPullLoadingState is true", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      isPullInProgress: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
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
      changesToCommit: 5,
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
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
      changesToCommit: 5,
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("t--bottom-bar-count")).not.toBeInTheDocument();
  });

  it("should disable pull button when pullDisabled is true", () => {
    const mockGetPullBtnStatus = jest.requireMock("./helpers").getPullBtnStatus;

    mockGetPullBtnStatus.mockReturnValue({
      disabled: true,
      message: "Pull Disabled",
    });

    const props = {
      ...defaultProps,
      isGitConnected: true,
    };

    const { container } = render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const pullButton =
      container.getElementsByClassName("t--bottom-bar-pull")[0];

    expect(pullButton).toBeDisabled();
  });

  it("should show behindCount on pull button", () => {
    const props = {
      ...defaultProps,
      isGitConnected: true,
      gitStatus: {
        behindCount: 3,
        isClean: true,
      },
    };

    render(
      <ThemeProvider theme={theme}>
        <QuickActions {...props} />
      </ThemeProvider>,
    );
    const countElement = screen.getByTestId("t--bottom-bar-count");

    expect(countElement).toHaveTextContent("3");
  });
});
