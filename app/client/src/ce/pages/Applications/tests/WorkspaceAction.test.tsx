import { WORKSPACE_ACTION_BUTTON, createMessage } from "ee/constants/messages";
import type { Workspace } from "ee/constants/workspaceConstants";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import "jest-styled-components";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import WorkspaceAction from "../WorkspaceAction";

const mockStore = configureStore([]);
const locators = {
  testId: {
    createNewApp: "t--workspace-action-create-app",
    createAppFromTemplates: "t--workspace-action-create-app-from-template",
    importApp: "t--workspace-import-app",
  },
};

const onCreateNewApplication = jest.fn();
const onStartFromTemplate = jest.fn();
const setSelectedWorkspaceIdForImportApplication = jest.fn();

const renderWorkspaceActionComponent = (
  workspace: Workspace,
  workspaceId: string,
) =>
  render(
    <Provider store={mockStore(baseStoreForSpec)}>
      <ThemeProvider theme={lightTheme}>
        <WorkspaceAction
          enableImportExport
          isMobile={false}
          onCreateNewApplication={onCreateNewApplication}
          onStartFromTemplate={onStartFromTemplate}
          setSelectedWorkspaceIdForImportApplication={
            setSelectedWorkspaceIdForImportApplication
          }
          workspace={workspace}
          workspaceId={workspaceId}
        />
      </ThemeProvider>
    </Provider>,
  );

describe("WorkspaceAction", () => {
  const workspace = {
    id: "663a0815de1fdf7aa1618918",
    userPermissions: [
      "publish:workspaceApplications",
      "delete:workspace",
      "manage:workspaceApplications",
      "delete:workspaceDatasources",
      "export:workspaceApplications",
      "read:workspaceDatasources",
      "read:workspaceApplications",
      "inviteUsers:workspace",
      "read:workspaces",
      "manage:workspaceDatasources",
      "create:datasources",
      "delete:workspaceApplications",
      "manage:workspaces",
      "create:applications",
    ],
  } as Workspace;

  it("1. should render the WorkspaceAction component", () => {
    const { getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    expect(
      getByText(createMessage(WORKSPACE_ACTION_BUTTON)),
    ).toBeInTheDocument();
  });

  it("2. should call onCreateNewApplication when 'Create New App' is selected", () => {
    const { getByTestId, getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    fireEvent.click(getByTestId(locators.testId.createNewApp));

    expect(onCreateNewApplication).toHaveBeenCalledWith(workspace.id);
  });

  it("3. should call onStartFromTemplate when 'Start from Template' is selected", () => {
    const { getByTestId, getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    fireEvent.click(getByTestId(locators.testId.createAppFromTemplates));

    expect(onStartFromTemplate).toHaveBeenCalledWith(workspace.id);
  });

  it("4. should call setSelectedWorkspaceIdForImportApplication when 'Import App' is selected", () => {
    const { getByTestId, getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    fireEvent.click(getByTestId(locators.testId.importApp));

    expect(setSelectedWorkspaceIdForImportApplication).toHaveBeenCalledWith(
      workspace.id,
    );
  });

  it("5. should not render anything if create app permission is unavailable", () => {
    //setup
    const existingPermissions = workspace.userPermissions;

    // execute test
    workspace.userPermissions = ["manage:workspaces"];
    const { queryByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    expect(queryByText(createMessage(WORKSPACE_ACTION_BUTTON))).toBeNull();

    // reset the changes
    workspace.userPermissions = existingPermissions;
  });
});

jest.mock("ee/utils/airgapHelpers", () => ({
  isAirgapped: jest.fn(),
}));

const mockIsAirGapped = (val: boolean) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { isAirgapped } = require("ee/utils/airgapHelpers");

  isAirgapped.mockImplementation(() => val);
};

describe("[Airgap] WorkspaceAction", () => {
  const workspace = {
    id: "663a0815de1fdf7aa1618918",
    userPermissions: [
      "publish:workspaceApplications",
      "delete:workspace",
      "manage:workspaceApplications",
      "delete:workspaceDatasources",
      "export:workspaceApplications",
      "read:workspaceDatasources",
      "read:workspaceApplications",
      "inviteUsers:workspace",
      "read:workspaces",
      "manage:workspaceDatasources",
      "create:datasources",
      "delete:workspaceApplications",
      "manage:workspaces",
      "create:applications",
    ],
  } as Workspace;

  beforeEach(() => mockIsAirGapped(true));

  it("1. [Airgap] should render the WorkspaceAction component", () => {
    const { getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    expect(
      getByText(createMessage(WORKSPACE_ACTION_BUTTON)),
    ).toBeInTheDocument();
  });

  it("2. [Airgap] should call onCreateNewApplication when 'Create New App' is selected", () => {
    const { getByTestId, getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    fireEvent.click(getByTestId(locators.testId.createNewApp));

    expect(onCreateNewApplication).toHaveBeenCalledWith(workspace.id);
  });

  it("3. [Airgap] should not have 'Start from Template'", () => {
    const { getByText, queryByTestId } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    expect(queryByTestId(locators.testId.createAppFromTemplates)).toBeNull();
  });

  it("4. [Airgap] should call setSelectedWorkspaceIdForImportApplication when 'Import App' is selected", () => {
    const { getByTestId, getByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    fireEvent.click(getByText(createMessage(WORKSPACE_ACTION_BUTTON)));
    fireEvent.click(getByTestId(locators.testId.importApp));

    expect(setSelectedWorkspaceIdForImportApplication).toHaveBeenCalledWith(
      workspace.id,
    );
  });

  it("5. [Airgap] should not render anything if create app permission is unavailable", () => {
    //setup
    const existingPermissions = workspace.userPermissions;

    // execute test
    workspace.userPermissions = ["manage:workspaces"];
    const { queryByText } = renderWorkspaceActionComponent(
      workspace,
      workspace.id,
    );

    expect(queryByText(createMessage(WORKSPACE_ACTION_BUTTON))).toBeNull();

    // reset the changes
    workspace.userPermissions = existingPermissions;
  });
});

const baseStoreForSpec = {
  ...unitTestBaseMockStore,
  ui: {
    ...unitTestBaseMockStore.ui,
    applications: {
      creatingApplication: {},
    },
    workspaces: {
      loadingStates: {
        isFetchAllRoles: false,
        isSavingWorkspaceInfo: false,
        isFetchingWorkspaces: false,
        isFetchingEntities: false,
        isDeletingWorkspace: false,
      },
      workspaceRoles: [],
      searchEntities: {},
    },
    selectedWorkspace: {
      packages: [],
      loadingStates: {
        isFetchingApplications: false,
        isFetchingAllUsers: false,
        isFetchingCurrentWorkspace: false,
      },
    },
  },
};
