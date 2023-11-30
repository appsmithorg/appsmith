import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import store from "store";
import { lightTheme } from "selectors/themeSelectors";
import WorkflowCardList from "./WorkflowCardList";
import * as workflowSelectors from "@appsmith/selectors/workflowSelectors";
import * as workspaceSelectors from "@appsmith/selectors/workspaceSelectors";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import type { Workspaces } from "@appsmith/constants/workspaceConstants";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";

jest.mock("@appsmith/selectors/workflowSelectors");
jest.mock("@appsmith/selectors/workspaceSelectors");

jest.mock("@appsmith/pages/Applications", () => ({
  NoAppsFound: ({ children }: any) => <div>{children}</div>,
}));

const setWorkflowsFeatureFlag = (value: boolean) => {
  const workflowSelectorsFactory = workflowSelectors as jest.Mocked<
    typeof workflowSelectors
  >;
  workflowSelectorsFactory.getShowWorkflowFeature.mockImplementation(
    () => value,
  );
};

const setIsCreatingWorkflowSelector = (value: boolean) => {
  const workflowSelectorsFactory = workflowSelectors as jest.Mocked<
    typeof workflowSelectors
  >;
  workflowSelectorsFactory.getIsCreatingWorkflow.mockImplementation(
    () => value,
  );
};

const setIsFetchingWorkflowsSelector = (value: boolean) => {
  const workflowSelectorsFactory = workflowSelectors as jest.Mocked<
    typeof workflowSelectors
  >;
  workflowSelectorsFactory.getIsFetchingWorkflows.mockImplementation(
    () => value,
  );
};

const setGetWorkspaces = (userWorkspaces: Workspaces[]) => {
  const workspaceSelectorsFactory = workspaceSelectors as jest.Mocked<
    typeof workspaceSelectors
  >;
  workspaceSelectorsFactory.getWorkspaces.mockImplementation(
    () => userWorkspaces,
  );
};

const defaultWorkflow: Workflow = {
  id: "1",
  name: "Workflow 1",
  icon: "1",
  color: "",
  workspaceId: "",
  modifiedBy: "",
  modifiedAt: "",
  userPermissions: [],
  new: false,
  slug: "",
};

const DEFAULT_WORKFLOWS_LIST = [
  { ...defaultWorkflow, id: "1", name: "Workflow 1" },
  { ...defaultWorkflow, id: "2", name: "Workflow 2" },
];

const DEFAULT_WORKSPACE_ID = "test-workspace";

const DEFAULT_USER_WORKSPACES: Workspaces[] = [
  {
    workspace: {
      id: DEFAULT_WORKSPACE_ID,
      name: "Test Workspace",
      userPermissions: [PERMISSION_TYPE.MANAGE_WORKSPACE_WORKFLOWS],
    },
    applications: [],
    users: [],
  },
];

describe("WorkflowCardList", () => {
  it("should not render anything if feature flag is disabled", async () => {
    setWorkflowsFeatureFlag(false);
    setIsCreatingWorkflowSelector(false);
    setIsFetchingWorkflowsSelector(false);
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardList
            isMobile={false}
            workflows={DEFAULT_WORKFLOWS_LIST}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );
    expect(await screen.queryByText("Workflows")).not.toBeInTheDocument();
  });

  it("should not render anything if isFetchingWorkflows is true", async () => {
    setWorkflowsFeatureFlag(true);
    setIsCreatingWorkflowSelector(false);
    setIsFetchingWorkflowsSelector(true);
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardList
            isMobile={false}
            workflows={DEFAULT_WORKFLOWS_LIST}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );
    expect(await screen.queryByText("Workflows")).not.toBeInTheDocument();
  });

  it("should not render anything if user does not have permission to manage workflows", async () => {
    setWorkflowsFeatureFlag(true);
    setIsCreatingWorkflowSelector(false);
    setIsFetchingWorkflowsSelector(false);
    setGetWorkspaces([
      {
        workspace: {
          id: DEFAULT_WORKSPACE_ID,
          name: "Test Workspace",
          userPermissions: [],
        },
        applications: [],
        users: [],
      },
    ]);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardList
            isMobile={false}
            workflows={DEFAULT_WORKFLOWS_LIST}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );
    expect(await screen.queryByText("Workflows")).not.toBeInTheDocument();
  });

  it("should render workflow list", () => {
    setWorkflowsFeatureFlag(true);
    setIsCreatingWorkflowSelector(false);
    setIsFetchingWorkflowsSelector(false);
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardList
            isMobile={false}
            workflows={DEFAULT_WORKFLOWS_LIST}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );
    const cards = container.getElementsByClassName("t--workflow-card");

    expect(cards.length).toEqual(DEFAULT_WORKFLOWS_LIST.length);
  });
});
