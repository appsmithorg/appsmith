import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import type { ApplicationPayload } from "entities/Application";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

const mockStore = configureStore([]);

jest.mock("../../AppViewerButton", () => ({
  __esModule: true,
  default: ({
    className,
    onClick,
    text,
  }: {
    className?: string;
    onClick?: () => void;
    text?: string | false;
  }) => (
    <button className={className} onClick={onClick} type="button">
      {text || "button"}
    </button>
  ),
}));

jest.mock("pages/AppViewer/utils", () => ({
  getMenuItemTextColor: () => "#000",
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => ({ push: jest.fn() }),
}));

jest.mock("selectors/appThemingSelectors", () => ({
  getSelectedAppTheme: () => ({
    properties: {
      colors: { primaryColor: "#000" },
      borderRadius: { appBorderRadius: "0px" },
    },
  }),
}));

jest.mock("ee/selectors/selectedWorkspaceSelectors", () => ({
  getCurrentWorkspaceId: () => "workspace-1",
}));

jest.mock("selectors/usersSelectors", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@appsmith/ads", () => ({
  Icon: () => <span data-testid="t--mock-icon" />,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
}));

import { getCurrentUser } from "selectors/usersSelectors";
import BackToAppsButton from "./BackToAppsButton";

const getCurrentUserMock = getCurrentUser as jest.Mock;

const baseApplication = {
  id: "app-1",
  applicationDetail: {
    navigationSetting: {},
  },
} as ApplicationPayload;

const renderButton = (application?: ApplicationPayload) => {
  return render(
    <Provider store={mockStore({})}>
      <BackToAppsButton currentApplicationDetails={application} />
    </Provider>,
  );
};

describe("BackToAppsButton", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReturnValue({ username: "user@appsmith.com" });
  });

  it("should_render_when_showAllApps_is_unset", () => {
    renderButton(baseApplication);

    expect(
      document.querySelector(".t--app-viewer-back-to-apps-button"),
    ).toBeInTheDocument();
  });

  it("should_render_when_showAllApps_is_true", () => {
    renderButton({
      ...baseApplication,
      applicationDetail: {
        navigationSetting: { showAllApps: true },
      },
    } as ApplicationPayload);

    expect(
      document.querySelector(".t--app-viewer-back-to-apps-button"),
    ).toBeInTheDocument();
  });

  it("should_not_render_when_showAllApps_is_false", () => {
    renderButton({
      ...baseApplication,
      applicationDetail: {
        navigationSetting: { showAllApps: false },
      },
    } as ApplicationPayload);

    expect(
      document.querySelector(".t--app-viewer-back-to-apps-button"),
    ).not.toBeInTheDocument();
  });

  it("should_not_render_when_user_is_anonymous", () => {
    getCurrentUserMock.mockReturnValue({ username: ANONYMOUS_USERNAME });
    renderButton(baseApplication);

    expect(
      document.querySelector(".t--app-viewer-back-to-apps-button"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
