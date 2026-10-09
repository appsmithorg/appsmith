import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import BottomBar from "../index";

const mockStore = configureStore([]);

let mockDisableHelpIcon = false;

jest.mock("ee/configs", () => ({
  getAppsmithConfigs: () => ({
    disableHelpIcon: mockDisableHelpIcon,
  }),
}));

jest.mock("selectors/editorSelectors", () => ({
  getCurrentApplicationId: () => "app-id",
  previewModeSelector: () => false,
}));

jest.mock("layoutSystems/anvil/integrations/selectors", () => ({
  getIsAnvilEnabledInCurrentApplication: () => false,
}));

jest.mock("ee/selectors/aiAgentSelectors", () => ({
  getIsAiAgentApp: () => false,
}));

jest.mock("actions/pluginActionActions", () => ({
  softRefreshActions: () => ({ type: "SOFT_REFRESH" }),
}));

jest.mock("pages/Editor/HelpButton", () => ({
  __esModule: true,
  default: () => <div data-testid="t--help-button" />,
}));

jest.mock("components/editorComponents/Debugger", () => ({
  DebuggerTrigger: () => null,
}));

jest.mock("ee/components/SwitchEnvironment", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../ManualUpgrades", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("ee/components/BottomBar/PackageUpgradeStatus", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("pages/Editor/gitSync/QuickGitActions", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("git", () => ({
  GitQuickActions: () => null,
}));

jest.mock("pages/Editor/gitSync/hooks/modHooks", () => ({
  useGitModEnabled: () => false,
}));

jest.mock("ee/components/BottomBar/AIAgentSupportTrigger", () => ({
  AIAgentSupportTrigger: () => null,
}));

jest.mock(
  "ee/pages/WorkflowIDE/layouts/components/BottomBar/WorkflowRunHistory/RunHistoryTrigger",
  () => ({
    RunHistoryTrigger: () => null,
  }),
);

const renderBottomBar = () =>
  render(
    <Provider store={mockStore({})}>
      <ThemeProvider theme={lightTheme}>
        <BottomBar />
      </ThemeProvider>
    </Provider>,
  );

describe("BottomBar - help icon", () => {
  afterEach(() => {
    mockDisableHelpIcon = false;
  });

  it("renders the help button when disableHelpIcon is false", () => {
    mockDisableHelpIcon = false;
    renderBottomBar();

    expect(screen.getByTestId("t--help-button")).toBeInTheDocument();
  });

  it("does not render the help button when disableHelpIcon is true", () => {
    mockDisableHelpIcon = true;
    renderBottomBar();

    expect(screen.queryByTestId("t--help-button")).toBeNull();
  });
});
