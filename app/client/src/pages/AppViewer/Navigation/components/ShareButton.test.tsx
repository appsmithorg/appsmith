import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import type { ApplicationPayload } from "entities/Application";

const mockStore = configureStore([]);

jest.mock("../../AppViewerButton", () => ({
  __esModule: true,
  default: ({
    className,
    text,
    onClick,
  }: {
    className?: string;
    text?: string | false;
    onClick?: () => void;
  }) => (
    <button className={className} onClick={onClick} type="button">
      {text || "button"}
    </button>
  ),
}));

jest.mock("pages/AppViewer/utils", () => ({
  getApplicationNameTextColor: () => "#000",
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
  getCurrentAppWorkspace: () => ({ id: "workspace-1", name: "Workspace" }),
}));

jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => false,
}));

jest.mock("pages/workspace/AppInviteUsersForm", () => () => null);

jest.mock("components/editorComponents/form/FormDialogComponent", () => () =>
  null,
);

jest.mock("@appsmith/ads", () => ({
  Icon: () => <span data-testid="mock-icon" />,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ShareButton from "./ShareButton";

const baseApplication = {
  id: "app-1",
  applicationDetail: {
    navigationSetting: {},
  },
} as ApplicationPayload;

const renderButton = (application?: ApplicationPayload) => {
  return render(
    <Provider store={mockStore({})}>
      <ShareButton
        currentApplicationDetails={application}
        currentWorkspaceId="workspace-1"
      />
    </Provider>,
  );
};

describe("ShareButton", () => {
  it("should_render_when_showShareApp_is_unset", () => {
    renderButton(baseApplication);

    expect(
      document.querySelector(".t--app-viewer-share-button"),
    ).toBeInTheDocument();
  });

  it("should_render_when_showShareApp_is_true", () => {
    renderButton({
      ...baseApplication,
      applicationDetail: {
        navigationSetting: { showShareApp: true },
      },
    } as ApplicationPayload);

    expect(
      document.querySelector(".t--app-viewer-share-button"),
    ).toBeInTheDocument();
  });

  it("should_not_render_when_showShareApp_is_false", () => {
    renderButton({
      ...baseApplication,
      applicationDetail: {
        navigationSetting: { showShareApp: false },
      },
    } as ApplicationPayload);

    expect(
      document.querySelector(".t--app-viewer-share-button"),
    ).not.toBeInTheDocument();
  });
});
