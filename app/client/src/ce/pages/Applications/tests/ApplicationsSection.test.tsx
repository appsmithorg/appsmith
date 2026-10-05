import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import store from "store";
import { lightTheme } from "selectors/themeSelectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import { PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import type { ApplicationPayload } from "entities/Application";
import type { Workspace } from "ee/constants/workspaceConstants";
import { ApplicationsSection } from "../index";

// Force the AI-agent FLOW flag (license_ai_agent_enabled) ON. This is the exact
// state that produced APP-15954: with the flag on, the ANVIL application list
// was titled "AI Agents". The INSTANCE flag is left real — it gates the sibling
// classic-application list, which this file does not exercise.
jest.mock("ee/selectors/aiAgentSelectors", () => ({
  __esModule: true,
  ...jest.requireActual("ee/selectors/aiAgentSelectors"),
  getIsAiAgentFlowEnabled: jest.fn(() => true),
}));

// Keep the retired Anvil layout flag OFF so the AI-agent flag is the *only*
// thing rendering the ANVIL list. That is the reported configuration, and it
// means the assertions below cannot be satisfied by an unrelated code path.
jest.mock("layoutSystems/anvil/integrations/selectors", () => ({
  __esModule: true,
  ...jest.requireActual("layoutSystems/anvil/integrations/selectors"),
  getIsAnvilLayoutEnabled: jest.fn(() => false),
}));

// Everything below is page chrome that has nothing to do with the title
// decision under test. ApplicationCardList and CardList are deliberately NOT
// mocked: the heading has to be produced by the real render chain, otherwise
// this asserts the stub instead of the product.
jest.mock("ee/pages/Applications/WorkspaceAction", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("ee/pages/Applications/WorkspaceMenu", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("ee/pages/Applications/PackageCardList", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("ee/pages/Applications/WorkflowCardList", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("pages/common/ImportModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("pages/common/SharedUserList", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("pages/Editor/gitSync/ReconnectDatasourceModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "../CreateNewAppFromTemplateModal/CreateNewAppFromTemplatesWrapper",
  () => ({
    __esModule: true,
    default: () => null,
  }),
);
// ce/pages/Applications/ApplicationCardList imports NoAppsFound back out of
// ee/pages/Applications, which re-exports this very module — a require cycle
// that jest cannot resolve. Stubbing the barrel breaks it, exactly as
// ee/pages/Applications/PackageCardList.test.tsx does.
jest.mock("ee/pages/Applications", () => ({
  __esModule: true,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NoAppsFound: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("pages/Applications/ApplicationCard", () => ({
  __esModule: true,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ application }: any) => <div>{application.name}</div>,
}));

const WORKSPACE_ID = "test-workspace";

const workspace = {
  id: WORKSPACE_ID,
  name: "Test Workspace",
  userPermissions: [
    PERMISSION_TYPE.MANAGE_WORKSPACE,
    PERMISSION_TYPE.CREATE_APPLICATION,
  ],
} as unknown as Workspace;

const anvilApplication = {
  id: "anvil-app-1",
  name: "Anvil App 1",
  workspaceId: WORKSPACE_ID,
  applicationDetail: {
    appPositioning: { type: LayoutSystemTypes.ANVIL },
  },
} as unknown as ApplicationPayload;

const classicApplication = {
  id: "classic-app-1",
  name: "Classic App 1",
  workspaceId: WORKSPACE_ID,
  applicationDetail: {
    appPositioning: { type: LayoutSystemTypes.FIXED },
  },
} as unknown as ApplicationPayload;

const NO_PACKAGES: never[] = [];
const NO_WORKFLOWS: never[] = [];
const WORKSPACES = [workspace];

const renderApplicationsSection = (applications: ApplicationPayload[]) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <Provider store={store}>
        <ApplicationsSection
          activeWorkspaceId={WORKSPACE_ID}
          applications={applications}
          packages={NO_PACKAGES}
          workflows={NO_WORKFLOWS}
          workspaces={WORKSPACES}
        />
      </Provider>
    </ThemeProvider>,
  );

describe("ApplicationsSection - ANVIL application list heading (APP-15954)", () => {
  it("titles the ANVIL application list 'Responsive applications', not 'AI Agents', when the AI-agent flow flag is on", () => {
    renderApplicationsSection([anvilApplication, classicApplication]);

    // The ANVIL application is listed...
    expect(screen.getByText("Anvil App 1")).toBeInTheDocument();
    // ...under the responsive heading...
    expect(screen.getByText("Responsive applications")).toBeInTheDocument();
    // ...and never under the AI Agents heading, which is what users reported.
    expect(screen.queryByText("AI Agents")).not.toBeInTheDocument();
  });

  it("uses the responsive empty-state copy when the workspace has no ANVIL applications", () => {
    renderApplicationsSection([classicApplication]);

    expect(
      screen.getByText(
        "There are no responsive applications in this workspace.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("There are no AI Agents in this workspace."),
    ).not.toBeInTheDocument();
  });
});
