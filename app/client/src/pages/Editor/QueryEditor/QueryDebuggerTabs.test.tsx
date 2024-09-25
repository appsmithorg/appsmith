import React from "react";
import { render, screen } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { lightTheme } from "selectors/themeSelectors";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import QueryDebuggerTabs from "./QueryDebuggerTabs";
import type { ActionResponse } from "api/ActionAPI";
import { ENTITY_TYPE } from "ce/entities/AppsmithConsole/utils";
import { EditorViewMode } from "ce/entities/IDE/constants";

const mockStore = configureStore([]);

const mockSuccessResponse: ActionResponse = {
  body: ["Record 1", "Record 2"],
  statusCode: "200",
  dataTypes: [],
  duration: "3000",
  size: "200",
  isExecutionSuccess: true,
  headers: {
    "Content-Type": ["application/json"],
    "Cache-Control": ["no-cache"],
  },
};

const mockFailedResponse: ActionResponse = {
  body: [{ response: "Failed" }],
  statusCode: "200",
  dataTypes: [],
  duration: "3000",
  size: "200",
  isExecutionSuccess: false,
  headers: {
    "Content-Type": ["application/json"],
    "Cache-Control": ["no-cache"],
  },
};

const storeState = {
  ...unitTestBaseMockStore,
  evaluations: {
    tree: {},
  },
  entities: {
    plugins: {
      list: [],
    },
    datasources: {
      structure: {},
    },
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    users: {
      featureFlag: {
        data: {},
        overriddenFlags: {},
      },
    },
    ide: {
      view: EditorViewMode.FullScreen,
    },
    debugger: {
      context: {
        errorCount: 0,
      },
    },
    queryPane: {
      debugger: {
        open: true,
        responseTabHeight: 200,
        selectedTab: "response",
      },
    },
  },
};

describe("ApiResponseView", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore(storeState);
  });

  it("the container should have class select-text to enable the selection of text for user", () => {
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryDebuggerTabs
              actionName="Query1"
              actionSource={{
                id: "ID1",
                name: "Query1",
                type: ENTITY_TYPE.ACTION,
              }}
              isRunning={false}
              onRunClick={() => {}}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(
      container
        .querySelector(".t--query-bottom-pane-container")
        ?.classList.contains("select-text"),
    ).toBe(true);
  });

  it("should show record count as result if the query response returns records", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryDebuggerTabs
              actionName="Query1"
              actionSource={{
                id: "ID1",
                name: "Query1",
                type: ENTITY_TYPE.ACTION,
              }}
              actionResponse={mockSuccessResponse}
              isRunning={false}
              onRunClick={() => {}}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const expectedResultText = "Result: 2 Records";
    const resultTextElement = screen.getByTestId("result-text");

    expect(resultTextElement).toBeInTheDocument();
    expect(resultTextElement?.textContent).toContain(expectedResultText);
  });

  it("should show error as result if the query response returns the error", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryDebuggerTabs
              actionName="Query1"
              actionSource={{
                id: "ID1",
                name: "Query1",
                type: ENTITY_TYPE.ACTION,
              }}
              actionResponse={mockFailedResponse}
              isRunning={false}
              onRunClick={() => {}}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const expectedResultText = "Result: Error";
    const resultTextElement = screen.getByTestId("result-text");

    expect(resultTextElement).toBeInTheDocument();
    expect(resultTextElement?.textContent).toContain(expectedResultText);
  });
});
