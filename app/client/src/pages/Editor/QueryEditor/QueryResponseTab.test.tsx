import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import QueryResponseTab from "../../../PluginActionEditor/components/PluginActionResponse/components/QueryResponseTab";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { Action } from "entities/Action";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";

// Mock store
const mockStore = configureStore([]);

const defaultProps = {
  actionName: "Test Action",
  actionSource: {
    name: "test source",
    id: "test-source-id",
    type: ENTITY_TYPE.ACTION,
  },
  currentActionConfig: {
    id: "test-action-id",
    name: "Test Action",
    actionConfiguration: { pluginSpecifiedTemplates: [{ value: true }] },
    userPermissions: ["execute"],
  } as Action,
  isRunning: false,
  onRunClick: jest.fn(),
  runErrorMessage: "",
};

const storeData = getIDETestState({});

describe("QueryResponseTab", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore(storeData);
  });

  /** Test use prepared statement warning **/
  it("1. Prepared statement warning should not be showing", () => {
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryResponseTab {...defaultProps} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is not showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).toBeNull();
  });

  it("2. Check if prepared statement warning is not showing while running the query", () => {
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryResponseTab {...defaultProps} isRunning />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).toBeNull();
  });

  it("3. Check if prepared statement warning is not showing when run is successful", () => {
    store = mockStore({
      ...storeData,
      entities: {
        ...storeData.entities,
        actions: [
          {
            config: {
              id: "test-action-id",
              name: "Test Action",
            },
            isLoading: false,
            data: {
              body: [{ key: "value" }],
              isExecutionSuccess: true,
            },
          },
        ],
      },
    });

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryResponseTab {...defaultProps} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).toBeNull();
  });

  it("4. Check if prepared statement warning is showing when run is failed", () => {
    store = mockStore({
      ...storeData,
      entities: {
        ...storeData.entities,
        actions: [
          {
            config: {
              id: "test-action-id",
              name: "Test Action",
            },
            isLoading: false,
            data: {
              body: "ERROR: relation 'userssss' does not exist Position: 15",
              isExecutionSuccess: false,
            },
          },
        ],
      },
    });

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryResponseTab {...defaultProps} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).not.toBeNull();
  });

  it("5. Check if prepared statement warning is not showing when prepared statement is turned off", () => {
    store = mockStore({
      ...storeData,
      entities: {
        ...storeData.entities,
        actions: [
          {
            config: {
              id: "test-action-id",
              name: "Test Action",
            },
            isLoading: false,
            data: {
              body: "ERROR: relation 'userssss' does not exist Position: 15",
              isExecutionSuccess: false,
            },
          },
        ],
      },
    });

    const props = {
      ...defaultProps,
      currentActionConfig: {
        ...defaultProps.currentActionConfig,
        actionConfiguration: { pluginSpecifiedTemplates: [{ value: false }] },
      } as Action,
    };

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryResponseTab {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).toBeNull();
  });
});
