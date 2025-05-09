import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Response } from "./Response";
import { type Action } from "entities/Action";
import { PluginType } from "entities/Plugin";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { ActionResponse } from "api/ActionAPI";

const mockStore = configureStore([]);

const defaultProps = {
  action: {
    id: "test-action-id",
    name: "Test Action",
    actionConfiguration: { pluginSpecifiedTemplates: [{ value: true }] },
    userPermissions: ["execute"],
  } as Action,
  isRunning: false,
  onRunClick: jest.fn(),
  theme: EditorTheme.LIGHT,
  isRunDisabled: false,
  responseTabHeight: 200,
};

// mock the postrunactionmap
jest.mock("ee/PluginActionEditor/components/PostActionRun", () => ({
  PostRunActionComponentMap: {
    test_modal: () => <div data-testid="t--post-run-action-test-modal-form" />,
  },
}));

const storeData = getIDETestState({});

describe("Response", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore(storeData);
    jest.clearAllMocks();
  });

  /** Test use prepared statement warning **/
  it("1. Prepared statement warning should not be showing", () => {
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...defaultProps} />
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
            <Response {...defaultProps} isRunning />
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
            <Response {...defaultProps} />
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

    const props = {
      ...defaultProps,
      action: {
        ...defaultProps.action,
        pluginType: PluginType.DB,
      } as Action,
      actionResponse: {
        isExecutionSuccess: false,
        readableError: "ERROR: relation 'userssss' does not exist Position: 15",
      } as ActionResponse,
    };

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...props} />
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
      action: {
        ...defaultProps.action,
        pluginType: PluginType.DB,
        actionConfiguration: { pluginSpecifiedTemplates: [{ value: false }] },
      } as Action,
      actionResponse: {
        isExecutionSuccess: false,
        readableError: "ERROR: relation 'userssss' does not exist Position: 15",
      } as ActionResponse,
    };

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if the prepared statement warning is showing
    expect(
      container.querySelector("[data-testid='t--prepared-statement-warning']"),
    ).toBeNull();
  });

  it("6. Should show post run action container when post run action exists", () => {
    const postRunAction = {
      type: "FORM",
      name: "test_modal",
    };
    const actionResponse = {
      isExecutionSuccess: true,
      body: [{ key: "value" }],
      postRunAction,
      dataTypes: [{ dataType: "JSON" }],
      responseDisplayFormat: "JSON",
    } as unknown as ActionResponse;

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
            data: actionResponse,
          },
        ],
      },
    });

    const props = {
      ...defaultProps,
      actionResponse,
      currentContentType: "JSON",
    };

    const { getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if post run action container is showing
    expect(getByTestId("t--post-run-action-container")).not.toBeNull();
    expect(getByTestId("t--post-run-action-test-modal-form")).not.toBeNull();
  });

  it("7. Should not show post run action container when post run action doesn't exist", () => {
    const actionResponse = {
      isExecutionSuccess: true,
      body: [{ key: "value" }],
      dataTypes: [{ dataType: "JSON" }],
      responseDisplayFormat: "JSON",
    } as unknown as ActionResponse;

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
            data: actionResponse,
          },
        ],
      },
    });

    const props = {
      ...defaultProps,
      actionResponse,
    };

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if post run action container is not showing
    expect(
      container.querySelector("[data-testid='t--post-run-action-container']"),
    ).toBeNull();
  });

  it("8. Should not show post run action container when correct mapping is not found", () => {
    const postRunAction = {
      type: "FORM",
      name: "invalid_modal",
    };
    const actionResponse = {
      isExecutionSuccess: true,
      body: [{ key: "value" }],
      postRunAction,
      dataTypes: [{ dataType: "JSON" }],
      responseDisplayFormat: "JSON",
    } as unknown as ActionResponse;

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
            data: actionResponse,
          },
        ],
      },
    });

    const props = {
      ...defaultProps,
      actionResponse,
    };

    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Response {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Check if post run action container is not showing
    expect(
      container.querySelector("[data-testid='t--post-run-action-container']"),
    ).toBeNull();
  });
});
