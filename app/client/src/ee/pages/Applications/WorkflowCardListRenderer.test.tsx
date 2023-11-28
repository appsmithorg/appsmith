import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";
import { lightTheme } from "selectors/themeSelectors";

import store from "store";
import WorkflowCardListRenderer from "./WorkflowCardListRenderer";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import {
  createMessage,
  EMPTY_WORKFLOW_LIST,
} from "@appsmith/constants/messages";

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

jest.mock("@appsmith/selectors/workflowSelectors");

jest.mock("@appsmith/pages/Applications", () => ({
  NoAppsFound: ({ children }: any) => <div>{children}</div>,
}));

describe("WorkflowCardListRenderer", () => {
  it("renders workflow list", () => {
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardListRenderer
            createWorkflow={() => {}}
            isMobile={false}
            workflows={DEFAULT_WORKFLOWS_LIST}
            workspaceId="1"
          />
        </Provider>
      </ThemeProvider>,
    );
    const cards = container.getElementsByClassName("t--workflow-card");

    expect(cards.length).toEqual(DEFAULT_WORKFLOWS_LIST.length);
  });

  it("renders no workflows found message", () => {
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <WorkflowCardListRenderer
            createWorkflow={() => {}}
            isMobile={false}
            workflows={[]}
            workspaceId="1"
          />
        </Provider>
      </ThemeProvider>,
    );
    const cards = container.getElementsByClassName("t--workflow-card");

    expect(cards.length).toEqual(0);
    expect(
      screen.getByText(createMessage(EMPTY_WORKFLOW_LIST)),
    ).toBeInTheDocument();
  });
});
